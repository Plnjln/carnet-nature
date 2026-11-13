// Statuts de protection et de menace d'un taxon (France métropolitaine).
// Le fichier est produit à la compilation par scripts/build-statuts.mjs et chargé une seule fois.

export type StatutType = 'PN' | 'LRN' | 'DH' | 'DO' | 'PNA' | 'REGLII';

export interface Statut {
  type: StatutType;
  /** Code du statut (ex. « VU », « NO3 », « CDH4 »). */
  code: string;
  /** Intitulé officiel. */
  libelle: string;
}

/** Statut prêt à afficher. */
export interface StatutAffiche {
  /** Texte court de l'étiquette. */
  texte: string;
  /** Intitulé officiel complet. */
  detail: string;
  /** protege, menace (liste rouge : CR, EN, VU), attention (quasi menacé), envahissante, neutre */
  ton: 'protege' | 'menace' | 'attention' | 'envahissante' | 'neutre';
}

interface Fichier {
  source: string;
  genereLe: string;
  types: StatutType[];
  libelles: string[];
  lignes: [number, number, string, number][];
}

let chargement: Promise<{ parTaxon: Map<number, Statut[]>; genereLe: string; source: string } | null> | null = null;

function charger() {
  chargement ??= (async () => {
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}statuts.json`);
      if (!r.ok) return null;
      const f = (await r.json()) as Fichier;
      const parTaxon = new Map<number, Statut[]>();
      for (const [cdNom, t, code, l] of f.lignes) {
        const statut: Statut = { type: f.types[t], code, libelle: f.libelles[l] ?? '' };
        const liste = parTaxon.get(cdNom);
        if (liste) liste.push(statut);
        else parTaxon.set(cdNom, [statut]);
      }
      return { parTaxon, genereLe: f.genereLe, source: f.source };
    } catch {
      return null;
    }
  })();
  // Un échec (hors ligne au premier lancement) ne doit pas bloquer les essais suivants.
  void chargement.then((v) => {
    if (v === null) chargement = null;
  });
  return chargement;
}

/** Statuts d'un taxon TAXREF ; liste vide si aucun, ou si le fichier n'est pas disponible. */
export async function getStatuts(cdNom: number): Promise<Statut[]> {
  const donnees = await charger();
  return donnees?.parTaxon.get(cdNom) ?? [];
}

/** Date de mise à jour des statuts, ou null s'ils ne sont pas disponibles. */
export async function statutsInfo(): Promise<{ genereLe: string; source: string } | null> {
  const donnees = await charger();
  return donnees ? { genereLe: donnees.genereLe, source: donnees.source } : null;
}

const LISTE_ROUGE: Record<string, { nom: string; rang: number; ton: StatutAffiche['ton'] }> = {
  EX: { nom: 'éteinte', rang: 0, ton: 'menace' },
  EW: { nom: 'éteinte à l’état sauvage', rang: 1, ton: 'menace' },
  RE: { nom: 'disparue de métropole', rang: 2, ton: 'menace' },
  CR: { nom: 'en danger critique', rang: 3, ton: 'menace' },
  'CR*': { nom: 'en danger critique, peut-être disparue', rang: 3, ton: 'menace' },
  EN: { nom: 'en danger', rang: 4, ton: 'menace' },
  VU: { nom: 'vulnérable', rang: 5, ton: 'menace' },
  NT: { nom: 'quasi menacée', rang: 6, ton: 'attention' },
  LC: { nom: 'préoccupation mineure', rang: 7, ton: 'neutre' },
  DD: { nom: 'données insuffisantes', rang: 8, ton: 'neutre' },
  NA: { nom: 'non applicable', rang: 9, ton: 'neutre' },
  NE: { nom: 'non évaluée', rang: 10, ton: 'neutre' },
};

const ANNEXES: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };

/** « CDH4 » -> « IV » ; chaîne vide si le code ne finit pas par un numéro d'annexe. */
function annexe(code: string): string {
  const m = /(\d)$/.exec(code);
  return m ? (ANNEXES[m[1]] ?? m[1]) : '';
}

/**
 * Met en forme les statuts d'un taxon : une étiquette par statut utile, la plus importante d'abord.
 * Pour la liste rouge, plusieurs évaluations peuvent exister (nicheur, hivernant, de passage) :
 * on garde la catégorie la plus préoccupante.
 */
export function formatStatuts(statuts: Statut[]): StatutAffiche[] {
  const sortie: StatutAffiche[] = [];

  const envahissante = statuts.find((s) => s.type === 'REGLII');
  if (envahissante) sortie.push({ texte: 'Exotique envahissante', detail: envahissante.libelle, ton: 'envahissante' });

  const protections = statuts.filter((s) => s.type === 'PN');
  if (protections.length) sortie.push({ texte: 'Protégée en France', detail: protections.map((s) => s.libelle).join(' ; '), ton: 'protege' });

  const rouges = statuts.filter((s) => s.type === 'LRN' && LISTE_ROUGE[s.code]).sort((a, b) => LISTE_ROUGE[a.code].rang - LISTE_ROUGE[b.code].rang);
  if (rouges.length) {
    const pire = LISTE_ROUGE[rouges[0].code];
    const autres = Array.from(new Set(rouges.slice(1).map((s) => s.code))).filter((c) => c !== rouges[0].code);
    sortie.push({
      texte: `Liste rouge France : ${rouges[0].code}`,
      detail: `Liste rouge nationale : ${pire.nom}${autres.length ? ` (autres évaluations : ${autres.join(', ')})` : ''}`,
      ton: pire.ton,
    });
  }

  const habitats = Array.from(new Set(statuts.filter((s) => s.type === 'DH').map((s) => annexe(s.code)).filter(Boolean))).sort();
  if (habitats.length) sortie.push({ texte: `Directive Habitats : annexe${habitats.length > 1 ? 's' : ''} ${habitats.join(', ')}`, detail: 'Directive européenne « Habitats-Faune-Flore »', ton: 'protege' });

  const oiseaux = Array.from(new Set(statuts.filter((s) => s.type === 'DO').map((s) => annexe(s.code)).filter(Boolean))).sort();
  if (oiseaux.length) sortie.push({ texte: `Directive Oiseaux : annexe${oiseaux.length > 1 ? 's' : ''} ${oiseaux.join(', ')}`, detail: 'Directive européenne « Oiseaux »', ton: 'protege' });

  if (statuts.some((s) => s.type === 'PNA')) sortie.push({ texte: 'Plan national d’actions', detail: 'Espèce faisant l’objet d’un plan national d’actions en cours', ton: 'attention' });

  return sortie;
}

/** Numéro TAXREF contenu dans une clé « taxref:534742 », ou null. */
export function cdNomDe(taxonKey: string | undefined): number | null {
  const m = /^taxref:(\d+)$/.exec(taxonKey ?? '');
  return m ? Number(m[1]) : null;
}
