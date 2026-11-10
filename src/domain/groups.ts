// Groupes d'affichage : une couleur et une icône par grand groupe taxonomique.
// Ils servent aux cartes de la galerie, aux marqueurs de la carte et aux listes adaptées
// (stades, comportements) qui viendront avec la saisie complète.

export type GroupId =
  | 'oiseaux'
  | 'mammiferes'
  | 'reptiles'
  | 'amphibiens'
  | 'poissons'
  | 'papillons'
  | 'odonates'
  | 'orthopteres'
  | 'coleopteres'
  | 'hymenopteres'
  | 'dipteres'
  | 'hemipteres'
  | 'insectes'
  | 'arachnides'
  | 'crustaces'
  | 'mollusques'
  | 'invertebres'
  | 'plantes'
  | 'champignons'
  | 'autres';

export interface GroupInfo {
  label: string;
  color: string;
  /** Émoji du groupe. */
  icon: string;
  /** Silhouette dessinée (contenu SVG, repère 24 × 24), quand aucun émoji ne convient. */
  svg?: string;
}

// Il n'existe pas d'émoji libellule ni punaise : silhouettes dessinées à la main.
const SVG_ODONATE =
  '<circle cx="12" cy="3.8" r="1.6"/><rect x="11" y="5.2" width="2" height="5.2" rx="1"/><rect x="11.45" y="10" width="1.1" height="12" rx="0.55"/>' +
  '<ellipse cx="6.4" cy="6.8" rx="5.4" ry="1.5" transform="rotate(-12 6.4 6.8)"/><ellipse cx="17.6" cy="6.8" rx="5.4" ry="1.5" transform="rotate(12 17.6 6.8)"/>' +
  '<ellipse cx="6.8" cy="10.2" rx="5" ry="1.4" transform="rotate(12 6.8 10.2)"/><ellipse cx="17.2" cy="10.2" rx="5" ry="1.4" transform="rotate(-12 17.2 10.2)"/>';

const SVG_PUNAISE =
  '<path fill-rule="evenodd" d="M12 3.5 16.8 6.2 17.8 12Q17 18.6 12 20.8 7 18.6 6.2 12L7.2 6.2ZM12 9.2 14.6 12 12 16.6 9.4 12Z"/>' +
  '<path fill="none" d="M10.6 3.8 8.4 1.4M13.4 3.8 15.6 1.4M6.6 8.6 3.2 6.8M17.4 8.6 20.8 6.8M6.2 12.8 2.6 13.8M17.8 12.8 21.4 13.8M7.6 17 4.6 20M16.4 17 19.4 20"/>';

export const GROUPS: Record<GroupId, GroupInfo> = {
  oiseaux: { label: 'Oiseaux', color: '#2f7fd1', icon: '🐦' },
  mammiferes: { label: 'Mammifères', color: '#9a5b2f', icon: '🦊' },
  reptiles: { label: 'Reptiles', color: '#5c7a1f', icon: '🦎' },
  amphibiens: { label: 'Amphibiens', color: '#1f9a7a', icon: '🐸' },
  poissons: { label: 'Poissons', color: '#1c6f8f', icon: '🐟' },
  papillons: { label: 'Lépidoptères', color: '#c2478b', icon: '🦋' },
  odonates: { label: 'Odonates', color: '#2aa3c2', icon: '', svg: SVG_ODONATE },
  orthopteres: { label: 'Orthoptères', color: '#7a9a1f', icon: '🦗' },
  coleopteres: { label: 'Coléoptères', color: '#b0452c', icon: '🪲' },
  hymenopteres: { label: 'Hyménoptères', color: '#d19a1c', icon: '🐝' },
  dipteres: { label: 'Diptères', color: '#6a6f8f', icon: '🪰' },
  hemipteres: { label: 'Hémiptères', color: '#4f8f4a', icon: '', svg: SVG_PUNAISE },
  insectes: { label: 'Autres insectes', color: '#8f7a2a', icon: '🐜' },
  arachnides: { label: 'Arachnides', color: '#6b4a8f', icon: '🕷️' },
  crustaces: { label: 'Crustacés', color: '#c2622a', icon: '🦀' },
  mollusques: { label: 'Mollusques', color: '#8f6a5a', icon: '🐌' },
  invertebres: { label: 'Autres invertébrés', color: '#7a7a7a', icon: '🪱' },
  plantes: { label: 'Plantes', color: '#2f8f3a', icon: '🌿' },
  champignons: { label: 'Champignons', color: '#a0522d', icon: '🍄' },
  autres: { label: 'Autres', color: '#666666', icon: '❔' },
};

const INSECTES: Record<string, GroupId> = {
  Lepidoptera: 'papillons',
  Odonata: 'odonates',
  Orthoptera: 'orthopteres',
  Coleoptera: 'coleopteres',
  Hymenoptera: 'hymenopteres',
  Diptera: 'dipteres',
  Hemiptera: 'hemipteres',
};

const CLASSES: Record<string, GroupId> = {
  Aves: 'oiseaux',
  Mammalia: 'mammiferes',
  Reptilia: 'reptiles',
  Amphibia: 'amphibiens',
  Actinopterygii: 'poissons',
  Elasmobranchii: 'poissons',
  Chondrichthyes: 'poissons',
  Holocephali: 'poissons',
  Petromyzonti: 'poissons',
  Cephalaspidomorphi: 'poissons',
  Myxini: 'poissons',
  Dipneusti: 'poissons',
  Arachnida: 'arachnides',
  Malacostraca: 'crustaces',
  Copepoda: 'crustaces',
  Ostracoda: 'crustaces',
  Branchiopoda: 'crustaces',
  Gastropoda: 'mollusques',
  Bivalvia: 'mollusques',
  Cephalopoda: 'mollusques',
  Polyplacophora: 'mollusques',
  Scaphopoda: 'mollusques',
};

// Certains référentiels ne donnent pas de classe aux reptiles : on se rabat sur l'ordre.
const ORDRES_REPTILES = new Set(['Squamata', 'Testudines', 'Chelonii', 'Crocodylia', 'Crocodilia']);

/** Groupe d'affichage d'un taxon à partir de son règne, de sa classe et de son ordre. */
export function groupOf(kingdom: string, classe: string, order: string): GroupId {
  if (kingdom === 'Plantae') return 'plantes';
  if (kingdom === 'Fungi') return 'champignons';
  if (kingdom && kingdom !== 'Animalia') return 'autres';
  if (classe === 'Insecta') return INSECTES[order] ?? 'insectes';
  const parClasse = CLASSES[classe];
  if (parClasse) return parClasse;
  if (ORDRES_REPTILES.has(order)) return 'reptiles';
  return 'invertebres';
}
