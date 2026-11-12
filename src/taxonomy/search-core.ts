// Recherche floue de taxons, sans dépendance au navigateur (testable seule).
//
// Principe : chaque nom (scientifique, vernaculaire, synonyme) est découpé en mots normalisés.
// On tient un dictionnaire trié des mots, avec pour chacun la liste des noms qui le contiennent.
// Une requête est découpée de la même façon ; chaque mot tapé est rapproché des mots du
// dictionnaire (début de mot, ou distance d'édition tolérant 1 à 2 fautes), puis on garde
// les noms qui contiennent tous les mots tapés.

import { groupOf, type GroupId } from '../domain/groups';
import { normalize, tokenize } from './normalize';

export interface TaxonEntry {
  cdNom: number;
  sci: string;
  /** Noms vernaculaires français, séparés par « , » (peut être vide). */
  vern: string;
  rank: string;
  /** Position dans IndexData.classif. */
  classif: number;
}

export interface IndexData {
  /** [embranchement, classe, ordre, famille] */
  classif: string[][];
  taxa: TaxonEntry[];
  /** Synonymes : nom et position du taxon valide dans `taxa`. */
  synonyms: { name: string; taxon: number }[];
}

export type MatchKind = 'scientifique' | 'vernaculaire' | 'synonyme';

export interface SearchHit {
  cdNom: number;
  sci: string;
  /** Premier nom vernaculaire, ou chaîne vide. */
  vern: string;
  rank: string;
  phylum: string;
  classe: string;
  order: string;
  family: string;
  group: GroupId;
  /** Nom qui a correspondu à la requête. */
  matched: string;
  matchedKind: MatchKind;
  /** Plus petit = meilleur. */
  score: number;
}

/** Lit les trois fichiers TSV produits par scripts/build-taxref-index.mjs. */
export function parseIndex(classifTsv: string, taxaTsv: string, synTsv: string): IndexData {
  const classif = classifTsv.split('\n').map((l) => {
    const f = l.split('\t');
    return [f[0] ?? '', f[1] ?? '', f[2] ?? '', f[3] ?? ''];
  });
  const taxa: TaxonEntry[] = [];
  for (const l of taxaTsv.split('\n')) {
    if (!l) continue;
    const f = l.split('\t');
    taxa.push({ cdNom: Number(f[0]), sci: f[1] ?? '', vern: f[2] ?? '', rank: f[3] ?? '', classif: Number(f[4]) || 0 });
  }
  const synonyms: { name: string; taxon: number }[] = [];
  for (const l of synTsv.split('\n')) {
    if (!l) continue;
    const i = l.lastIndexOf('\t');
    if (i < 0) continue;
    const taxon = Number(l.slice(i + 1));
    if (taxon >= 0 && taxon < taxa.length) synonyms.push({ name: l.slice(0, i), taxon });
  }
  return { classif, taxa, synonyms };
}

const KINDS: MatchKind[] = ['scientifique', 'vernaculaire', 'synonyme'];

// Légère préférence pour l'espèce à score égal.
const RANK_PENALTY: Record<string, number> = {
  species: 0,
  genus: 0.1,
  family: 0.1,
  order: 0.1,
  subspecies: 0.25,
};

// Tampons réutilisés par le calcul de distance (évite des millions d'allocations).
let ligneA = new Uint8Array(96);
let ligneB = new Uint8Array(96);
let ligneC = new Uint8Array(96);

/**
 * Distance d'édition entre `saisi` et le meilleur DÉBUT de `mot` (insertion, suppression,
 * substitution, inversion de deux lettres voisines). Renvoie max + 1 dès que c'est trop loin.
 */
export function prefixDistance(saisi: string, mot: string, max: number): number {
  const m = saisi.length;
  const n = Math.min(mot.length, m + max);
  let avant = ligneA; // ligne i-2
  let prec = ligneB; // ligne i-1
  let cour = ligneC; // ligne i
  for (let j = 0; j <= n; j++) prec[j] = j;
  for (let i = 1; i <= m; i++) {
    const ca = saisi.charCodeAt(i - 1);
    cour[0] = i;
    let minLigne = i;
    for (let j = 1; j <= n; j++) {
      const cb = mot.charCodeAt(j - 1);
      let v = prec[j - 1] + (ca === cb ? 0 : 1);
      if (prec[j] + 1 < v) v = prec[j] + 1;
      if (cour[j - 1] + 1 < v) v = cour[j - 1] + 1;
      if (i > 1 && j > 1 && ca === mot.charCodeAt(j - 2) && saisi.charCodeAt(i - 2) === cb && avant[j - 2] + 1 < v) {
        v = avant[j - 2] + 1;
      }
      cour[j] = v;
      if (v < minLigne) minLigne = v;
    }
    if (minLigne > max) return max + 1;
    const libre = avant;
    avant = prec;
    prec = cour;
    cour = libre;
  }
  let meilleur = prec[0];
  for (let j = 1; j <= n; j++) if (prec[j] < meilleur) meilleur = prec[j];
  return meilleur;
}

/** Premier indice de `tri` dont la valeur est >= cle. */
function borneInf(tri: string[], cle: string): number {
  let lo = 0;
  let hi = tri.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tri[mid] < cle) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export class TaxonSearcher {
  private readonly data: IndexData;
  // Par nom : taxon visé, type de nom, texte, nombre de mots.
  private readonly nameTaxon: Int32Array;
  private readonly nameKind: Uint8Array;
  private readonly nameText: string[];
  private readonly nameWords: Uint8Array;
  // Dictionnaire trié des mots, et pour chacun ses noms (tableau compact).
  private readonly words: string[];
  private readonly wordIds: Int32Array;
  private readonly postStart: Int32Array;
  private readonly postings: Int32Array;

  constructor(data: IndexData) {
    this.data = data;
    const texts: string[] = [];
    const taxonOf: number[] = [];
    const kinds: number[] = [];
    data.taxa.forEach((t, i) => {
      texts.push(t.sci);
      taxonOf.push(i);
      kinds.push(0);
      if (t.vern) {
        for (const v of t.vern.split(', ')) {
          if (!v) continue;
          texts.push(v);
          taxonOf.push(i);
          kinds.push(1);
        }
      }
    });
    for (const s of data.synonyms) {
      texts.push(s.name);
      taxonOf.push(s.taxon);
      kinds.push(2);
    }

    const n = texts.length;
    this.nameText = texts;
    this.nameTaxon = Int32Array.from(taxonOf);
    this.nameKind = Uint8Array.from(kinds);
    this.nameWords = new Uint8Array(n);

    // Passe 1 : découpage en mots et comptage.
    const idDuMot = new Map<string, number>();
    const compte: number[] = [];
    const motsParNom: string[][] = new Array(n);
    for (let i = 0; i < n; i++) {
      const mots = tokenize(texts[i]);
      motsParNom[i] = mots;
      this.nameWords[i] = Math.min(255, mots.length);
      for (const mot of mots) {
        let id = idDuMot.get(mot);
        if (id === undefined) {
          id = compte.length;
          idDuMot.set(mot, id);
          compte.push(0);
        }
        compte[id]++;
      }
    }

    // Passe 2 : remplissage des listes de noms par mot.
    const nbMots = compte.length;
    this.postStart = new Int32Array(nbMots + 1);
    for (let k = 0; k < nbMots; k++) this.postStart[k + 1] = this.postStart[k] + compte[k];
    this.postings = new Int32Array(this.postStart[nbMots]);
    const curseur = this.postStart.slice(0, nbMots);
    for (let i = 0; i < n; i++) {
      for (const mot of motsParNom[i]) {
        const id = idDuMot.get(mot) as number;
        this.postings[curseur[id]++] = i;
      }
    }

    this.words = Array.from(idDuMot.keys()).sort();
    this.wordIds = new Int32Array(nbMots);
    for (let k = 0; k < nbMots; k++) this.wordIds[k] = idDuMot.get(this.words[k]) as number;
  }

  get size(): { taxa: number; names: number; words: number } {
    return { taxa: this.data.taxa.length, names: this.nameText.length, words: this.words.length };
  }

  /** Pour un mot tapé : noms qui le contiennent (à peu près), avec le coût de la correspondance. */
  private matchToken(saisi: string): Map<number, number> {
    const trouves = new Map<number, number>();
    // Tolérance : aucune faute pour un mot très court, 1 jusqu'à 6 lettres, 2 au-delà.
    const max = saisi.length <= 3 ? 0 : saisi.length <= 6 ? 1 : 2;
    let lo: number;
    let hi: number;
    if (max === 0) {
      // Seulement les mots qui commencent par le texte tapé.
      lo = borneInf(this.words, saisi);
      hi = borneInf(this.words, saisi + '￿');
    } else {
      // Tous les mots qui commencent par la même lettre.
      lo = borneInf(this.words, saisi[0]);
      hi = borneInf(this.words, String.fromCharCode(saisi.charCodeAt(0) + 1));
    }
    for (let k = lo; k < hi; k++) {
      const mot = this.words[k];
      let cout: number;
      if (mot.startsWith(saisi)) {
        cout = mot.length === saisi.length ? 0 : 0.25 + Math.min(0.25, (mot.length - saisi.length) * 0.03);
      } else if (max === 0 || mot.length < saisi.length - max) {
        continue;
      } else {
        const d = prefixDistance(saisi, mot, max);
        if (d > max) continue;
        cout = d + (mot.length > saisi.length + 1 ? 0.25 : 0);
      }
      const id = this.wordIds[k];
      for (let p = this.postStart[id]; p < this.postStart[id + 1]; p++) {
        const nom = this.postings[p];
        const deja = trouves.get(nom);
        if (deja === undefined || cout < deja) trouves.set(nom, cout);
      }
    }
    return trouves;
  }

  search(query: string, limit = 12): SearchHit[] {
    const mots = tokenize(query);
    if (mots.length === 0 || mots.every((m) => m.length < 2)) return [];

    const parMot = mots.map((m) => this.matchToken(m)).sort((a, b) => a.size - b.size);
    const [premier, ...autres] = parMot;

    // Meilleur nom par taxon.
    const parTaxon = new Map<number, { nom: number; score: number }>();
    for (const [nom, cout0] of premier) {
      let cout = cout0;
      let complet = true;
      for (const m of autres) {
        const c = m.get(nom);
        if (c === undefined) {
          complet = false;
          break;
        }
        cout += c;
      }
      if (!complet) continue;
      const iTaxon = this.nameTaxon[nom];
      const taxon = this.data.taxa[iTaxon];
      let score = cout;
      // Les noms plus longs que la requête passent après.
      score += Math.min(3, Math.max(0, this.nameWords[nom] - mots.length)) * 0.15;
      if (this.nameKind[nom] === 2) score += 0.2;
      score += RANK_PENALTY[taxon.rank] ?? 0.15;
      if (taxon.vern) score -= 0.1;
      const deja = parTaxon.get(iTaxon);
      if (!deja || score < deja.score) parTaxon.set(iTaxon, { nom, score });
    }

    const tri = Array.from(parTaxon.entries())
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, Math.max(limit * 4, 40));

    // Bonus si le nom commence exactement par ce qui a été tapé.
    const tape = normalize(query);
    for (const [, r] of tri) {
      if (normalize(this.nameText[r.nom]).startsWith(tape)) r.score -= 0.2;
    }
    tri.sort(
      (a, b) =>
        a[1].score - b[1].score ||
        this.nameText[a[1].nom].length - this.nameText[b[1].nom].length ||
        this.nameText[a[1].nom].localeCompare(this.nameText[b[1].nom]),
    );

    return tri.slice(0, limit).map(([iTaxon, r]) => this.toHit(iTaxon, r.nom, r.score));
  }

  private toHit(iTaxon: number, nom: number, score: number): SearchHit {
    const t = this.data.taxa[iTaxon];
    const c = this.data.classif[t.classif] ?? ['', '', '', ''];
    return {
      cdNom: t.cdNom,
      sci: t.sci,
      vern: t.vern ? t.vern.split(', ')[0] : '',
      rank: t.rank,
      phylum: c[0],
      classe: c[1],
      order: c[2],
      family: c[3],
      group: groupOf('Animalia', c[1], c[2]),
      matched: this.nameText[nom],
      matchedKind: KINDS[this.nameKind[nom]],
      score,
    };
  }

  /** Autres espèces du même genre (pour comparer des espèces proches), par ordre alphabétique. */
  congeners(sci: string, limit = 60): SearchHit[] {
    const genre = sci.split(' ')[0];
    if (!genre) return [];
    const prefixe = `${genre} `;
    const out: SearchHit[] = [];
    for (let i = 0; i < this.data.taxa.length; i++) {
      const t = this.data.taxa[i];
      if (t.rank === 'species' && t.sci !== sci && t.sci.startsWith(prefixe)) out.push(this.toHit(i, 0, 0));
    }
    out.sort((a, b) => a.sci.localeCompare(b.sci));
    return out.slice(0, limit);
  }

  /** Tire `n` espèces au hasard (pour les données factices). */
  sample(n: number): SearchHit[] {
    const out: SearchHit[] = [];
    const total = this.data.taxa.length;
    if (total === 0) return out;
    let essais = 0;
    while (out.length < n && essais < n * 60) {
      essais++;
      const i = Math.floor(Math.random() * total);
      const t = this.data.taxa[i];
      if (t.rank !== 'species') continue;
      // On favorise les espèces qui ont un nom français (les plus courantes).
      if (!t.vern && Math.random() < 0.85) continue;
      out.push(this.toHit(i, 0, 0));
    }
    return out;
  }
}
