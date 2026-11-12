// Informations de référence sur un taxon, récupérées en ligne puis gardées sur l'appareil :
//   - une photo représentative (iNaturalist), avec son auteur et sa licence ;
//   - un texte de description (Wikipédia en français), quand un article existe.
//
// Ce ne sont pas des données de l'utilisateur : elles sont toujours présentées comme des
// références, avec leur source. Sans réseau, on renvoie ce qui est déjà en cache, sinon rien.

import { db } from '../db/db';

export interface RefPhoto {
  /** Petite image carrée (75 px). */
  thumb: string;
  /** Image moyenne (500 px). */
  medium: string;
  /** Mention d'auteur et de licence, à afficher. */
  attribution: string;
}

export interface RefText {
  /** Titre de l'article. */
  title: string;
  /** Première phrase de l'article. */
  summary: string;
  /** Paragraphes de la section « Description » (ou équivalente), s'il y en a une. */
  description: string[];
  /** Adresse de l'article complet. */
  url: string;
}

const VALIDITE_MS = 60 * 24 * 3600 * 1000; // on redemande au bout de deux mois
const memoire = new Map<string, unknown>();

// Les appels partent un par un, espacés d'une seconde : politesse envers les services (limites d'usage).
let file: Promise<unknown> = Promise.resolve();
function enFile<T>(tache: () => Promise<T>): Promise<T> {
  const resultat = file.then(tache);
  file = resultat.catch(() => undefined).then(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  return resultat;
}

async function json<T>(url: string): Promise<T> {
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), 12_000);
  try {
    const r = await fetch(url, { signal: controle.signal });
    if (r.status === 404) return null as T;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(minuterie);
  }
}

/** Cache mémoire, puis base, puis réseau. Un échec réseau n'est pas mis en cache (on réessaiera). */
async function avecCache<T>(cle: string, chercher: () => Promise<T | null>): Promise<T | null> {
  if (memoire.has(cle)) return memoire.get(cle) as T | null;
  const enBase = await db.refInfo.get(cle);
  if (enBase && Date.now() - enBase.fetchedAt < VALIDITE_MS) {
    memoire.set(cle, enBase.data);
    return enBase.data as T | null;
  }
  if (!navigator.onLine) return (enBase?.data as T | null) ?? null;
  try {
    const data = await enFile(chercher);
    memoire.set(cle, data);
    await db.refInfo.put({ key: cle, fetchedAt: Date.now(), data });
    return data;
  } catch {
    return (enBase?.data as T | null) ?? null;
  }
}

/** Photo de référence d'un taxon, d'après son nom scientifique. */
export function getRefPhoto(sci: string): Promise<RefPhoto | null> {
  return avecCache<RefPhoto>(`photo:${sci}`, async () => {
    type Reponse = { results?: { name: string; default_photo?: { square_url?: string; medium_url?: string; attribution?: string } }[] };
    const r = await json<Reponse | null>(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(sci)}&per_page=5`);
    // On exige le même nom : pas de photo d'un taxon voisin.
    const taxon = r?.results?.find((t) => t.name.toLowerCase() === sci.toLowerCase() && t.default_photo?.square_url);
    const p = taxon?.default_photo;
    if (!p?.square_url) return null;
    return { thumb: p.square_url, medium: p.medium_url ?? p.square_url, attribution: p.attribution ?? 'iNaturalist' };
  });
}

const SECTIONS_DESCRIPTION = /^(description|morphologie|identification|caractéristiques|caracteristiques|aspect|reconnaissance|détermination)/i;

/** Texte brut des paragraphes d'un fragment HTML de Wikipédia (sans notes, tableaux ni légendes). */
function paragraphes(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('sup, table, figure, style, .mw-editsection, .bandeau-container, .infobox, .thumb, .gallery').forEach((e) => e.remove());
  const sortie: string[] = [];
  doc.querySelectorAll('p, li').forEach((e) => {
    const texte = (e.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (texte.length > 20) sortie.push(texte);
  });
  return sortie.slice(0, 12);
}

/** Description d'un taxon d'après Wikipédia en français, ou null s'il n'y a pas d'article. */
export function getRefText(sci: string): Promise<RefText | null> {
  return avecCache<RefText>(`texte:${sci}`, async () => {
    type Resume = { type?: string; title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    const titreDemande = encodeURIComponent(sci.replace(/ /g, '_'));
    const resume = await json<Resume | null>(`https://fr.wikipedia.org/api/rest_v1/page/summary/${titreDemande}?redirect=true`);
    if (!resume?.title || resume.type === 'disambiguation') return null;
    const texte: RefText = {
      title: resume.title,
      summary: resume.extract ?? '',
      description: [],
      url: resume.content_urls?.desktop?.page ?? `https://fr.wikipedia.org/wiki/${encodeURIComponent(resume.title)}`,
    };
    try {
      const page = encodeURIComponent(resume.title);
      type Sections = { parse?: { sections?: { index: string; line: string; toclevel: number }[] } };
      const s = await json<Sections | null>(`https://fr.wikipedia.org/w/api.php?action=parse&page=${page}&prop=sections&format=json&origin=*`);
      const section = s?.parse?.sections?.find((x) => x.toclevel === 1 && SECTIONS_DESCRIPTION.test(x.line.replace(/<[^>]+>/g, '')));
      if (section) {
        type Texte = { parse?: { text?: { '*'?: string } } };
        const t = await json<Texte | null>(`https://fr.wikipedia.org/w/api.php?action=parse&page=${page}&section=${section.index}&prop=text&format=json&origin=*`);
        const html = t?.parse?.text?.['*'];
        if (html) texte.description = paragraphes(html);
      }
    } catch {
      // Résumé seul : c'est déjà utile.
    }
    return texte;
  });
}
