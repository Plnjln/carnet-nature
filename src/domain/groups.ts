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
  icon: string;
}

export const GROUPS: Record<GroupId, GroupInfo> = {
  oiseaux: { label: 'Oiseaux', color: '#2f7fd1', icon: '🐦' },
  mammiferes: { label: 'Mammifères', color: '#9a5b2f', icon: '🦊' },
  reptiles: { label: 'Reptiles', color: '#5c7a1f', icon: '🦎' },
  amphibiens: { label: 'Amphibiens', color: '#1f9a7a', icon: '🐸' },
  poissons: { label: 'Poissons', color: '#1c6f8f', icon: '🐟' },
  papillons: { label: 'Papillons', color: '#c2478b', icon: '🦋' },
  odonates: { label: 'Libellules', color: '#2aa3c2', icon: '🪰' },
  orthopteres: { label: 'Orthoptères', color: '#7a9a1f', icon: '🦗' },
  coleopteres: { label: 'Coléoptères', color: '#b0452c', icon: '🪲' },
  hymenopteres: { label: 'Hyménoptères', color: '#d19a1c', icon: '🐝' },
  dipteres: { label: 'Diptères', color: '#6a6f8f', icon: '🪰' },
  hemipteres: { label: 'Hémiptères', color: '#4f8f4a', icon: '🐞' },
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
