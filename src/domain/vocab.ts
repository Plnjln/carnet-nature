// Listes de choix de la saisie : sexe, stade, type de contact, comportement, milieu.
// Les listes s'adaptent au groupe taxonomique (pas de « chenille » pour un oiseau).

import type { GroupId } from './groups';
import type { AtlasCode, ContactType, Sex, Stage } from './types';

export interface Choix<T extends string = string> {
  id: T;
  label: string;
}

/** Choix proposé seulement pour certains groupes (absence de `groupes` = tous). */
interface ChoixParGroupe<T extends string = string> extends Choix<T> {
  groupes?: GroupId[];
}

const VERTEBRES: GroupId[] = ['oiseaux', 'mammiferes', 'reptiles', 'amphibiens', 'poissons'];
const INSECTES: GroupId[] = ['papillons', 'odonates', 'orthopteres', 'coleopteres', 'hymenopteres', 'dipteres', 'hemipteres', 'insectes'];
// Insectes à métamorphose complète (avec un stade nymphal immobile).
const HOLOMETABOLES: GroupId[] = ['papillons', 'coleopteres', 'hymenopteres', 'dipteres', 'insectes'];
// Groupes dont on ne connaît pas la biologie : on propose tout.
const INCONNUS: GroupId[] = ['autres', 'invertebres'];

/** Garde les choix valables pour un groupe. */
function pour<T extends string>(liste: ChoixParGroupe<T>[], groupe: GroupId): Choix<T>[] {
  return liste.filter((c) => !c.groupes || c.groupes.includes(groupe) || INCONNUS.includes(groupe));
}

export const SEXES: Choix<Sex>[] = [
  { id: 'male', label: '♂ Mâle' },
  { id: 'femelle', label: '♀ Femelle' },
  { id: 'couple', label: 'Couple' },
  { id: 'indetermine', label: 'Indéterminé' },
];

const STADES: ChoixParGroupe<Stage>[] = [
  { id: 'adulte', label: 'Adulte' },
  { id: 'subadulte', label: 'Subadulte', groupes: ['oiseaux', 'mammiferes', 'reptiles', 'amphibiens', 'arachnides'] },
  { id: 'immature', label: 'Immature', groupes: ['oiseaux', 'odonates', 'mammiferes'] },
  { id: 'juvenile', label: 'Juvénile', groupes: [...VERTEBRES, 'arachnides', 'orthopteres', 'hemipteres', 'crustaces', 'mollusques'] },
  { id: 'tetard', label: 'Têtard', groupes: ['amphibiens'] },
  { id: 'chenille', label: 'Chenille', groupes: ['papillons'] },
  { id: 'larve', label: 'Larve', groupes: [...INSECTES.filter((g) => g !== 'papillons'), 'amphibiens', 'poissons', 'crustaces', 'mollusques'] },
  { id: 'nymphe', label: 'Nymphe / chrysalide', groupes: HOLOMETABOLES },
  { id: 'exuvie', label: 'Exuvie', groupes: ['odonates', 'orthopteres', 'hemipteres', 'insectes', 'arachnides', 'crustaces'] },
  { id: 'oeuf', label: 'Œuf / ponte', groupes: [...INSECTES, 'oiseaux', 'reptiles', 'amphibiens', 'poissons', 'arachnides', 'mollusques', 'crustaces'] },
];

export const stagesFor = (groupe: GroupId): Choix<Stage>[] => pour(STADES, groupe);

const CONTACTS: ChoixParGroupe<ContactType>[] = [
  { id: 'vu', label: 'Vu' },
  { id: 'entendu-chant', label: 'Entendu (chant)', groupes: ['oiseaux', 'amphibiens', 'orthopteres', 'hemipteres', 'mammiferes'] },
  { id: 'entendu-cri', label: 'Entendu (cri)', groupes: ['oiseaux', 'amphibiens', 'mammiferes'] },
  { id: 'photographie', label: 'Photographié' },
  { id: 'capture-relache', label: 'Capturé-relâché' },
  { id: 'trace', label: 'Trace' },
  { id: 'empreinte', label: 'Empreinte', groupes: ['mammiferes', 'oiseaux', 'reptiles', 'amphibiens'] },
  { id: 'feces', label: 'Fèces', groupes: ['mammiferes', 'oiseaux', 'reptiles'] },
  { id: 'pelote', label: 'Pelote', groupes: ['oiseaux'] },
  { id: 'nid', label: 'Nid', groupes: ['oiseaux', 'mammiferes', 'hymenopteres', 'arachnides', 'poissons'] },
  { id: 'mue', label: 'Mue', groupes: ['reptiles', 'oiseaux', 'arachnides', 'crustaces', 'insectes'] },
  { id: 'cadavre', label: 'Cadavre' },
  { id: 'piege-photo', label: 'Piège photo', groupes: ['mammiferes', 'oiseaux', 'reptiles'] },
  { id: 'detecteur-ultrason', label: 'Détecteur ultrason', groupes: ['mammiferes', 'orthopteres'] },
];

export const contactsFor = (groupe: GroupId): Choix<ContactType>[] => pour(CONTACTS, groupe);

const COMPORTEMENTS: ChoixParGroupe[] = [
  { id: 'alimentation', label: 'Alimentation' },
  { id: 'butinage', label: 'Butinage', groupes: [...INSECTES, 'oiseaux'] },
  { id: 'repos', label: 'Repos' },
  { id: 'pose', label: 'Posé', groupes: [...INSECTES, 'oiseaux'] },
  { id: 'vol', label: 'En vol', groupes: [...INSECTES, 'oiseaux', 'mammiferes'] },
  { id: 'insolation', label: 'Insolation', groupes: ['reptiles', 'amphibiens', 'papillons', 'odonates', 'orthopteres'] },
  { id: 'chant', label: 'Chant', groupes: ['oiseaux', 'amphibiens', 'orthopteres', 'hemipteres'] },
  { id: 'parade', label: 'Parade', groupes: [...VERTEBRES, ...INSECTES, 'arachnides'] },
  { id: 'territorial', label: 'Défense de territoire', groupes: ['oiseaux', 'mammiferes', 'reptiles', 'odonates', 'papillons', 'poissons'] },
  { id: 'accouplement', label: 'Accouplement' },
  { id: 'ponte', label: 'Ponte', groupes: [...INSECTES, 'reptiles', 'amphibiens', 'poissons', 'arachnides', 'mollusques', 'crustaces'] },
  { id: 'transport-materiaux', label: 'Transport de matériaux', groupes: ['oiseaux', 'hymenopteres', 'mammiferes'] },
  { id: 'nourrissage', label: 'Nourrissage des jeunes', groupes: ['oiseaux', 'mammiferes', 'hymenopteres'] },
  { id: 'migration', label: 'Migration active', groupes: ['oiseaux', 'papillons', 'odonates', 'dipteres', 'mammiferes', 'poissons', 'amphibiens'] },
  { id: 'chasse', label: 'Chasse', groupes: ['oiseaux', 'mammiferes', 'reptiles', 'odonates', 'arachnides', 'hymenopteres', 'poissons'] },
  { id: 'fuite', label: 'Fuite / alarme', groupes: VERTEBRES },
];

export const behavioursFor = (groupe: GroupId): Choix[] => pour(COMPORTEMENTS, groupe);

/** Tous les comportements, pour retrouver un libellé à partir d'un identifiant. */
export const ALL_BEHAVIOURS: Choix[] = COMPORTEMENTS;
export const ALL_STAGES: Choix<Stage>[] = STADES;
export const ALL_CONTACTS: Choix<ContactType>[] = CONTACTS;

/** Code atlas de nidification (oiseaux). */
export const ATLAS: Choix<AtlasCode>[] = [
  { id: 'possible', label: 'Nicheur possible' },
  { id: 'probable', label: 'Nicheur probable' },
  { id: 'certain', label: 'Nicheur certain' },
];

/** Milieux, regroupés par grande famille. */
export const HABITATS: { label: string; choix: Choix[] }[] = [
  {
    label: 'Forêt',
    choix: [
      { id: 'foret-feuillue', label: 'Forêt feuillue' },
      { id: 'foret-resineuse', label: 'Forêt résineuse' },
      { id: 'foret-mixte', label: 'Forêt mixte' },
      { id: 'lisiere', label: 'Lisière' },
      { id: 'clairiere', label: 'Clairière, coupe' },
      { id: 'ripisylve', label: 'Ripisylve' },
    ],
  },
  {
    label: 'Milieux ouverts',
    choix: [
      { id: 'prairie-fauche', label: 'Prairie de fauche' },
      { id: 'pature', label: 'Pâture' },
      { id: 'pelouse-seche', label: 'Pelouse sèche' },
      { id: 'lande', label: 'Lande, fourré' },
      { id: 'friche', label: 'Friche' },
      { id: 'culture', label: 'Culture' },
      { id: 'verger-vigne', label: 'Verger, vigne' },
    ],
  },
  {
    label: 'Zones humides',
    choix: [
      { id: 'mare', label: 'Mare' },
      { id: 'etang', label: 'Étang, lac' },
      { id: 'roseliere', label: 'Roselière' },
      { id: 'marais', label: 'Marais, prairie humide' },
      { id: 'tourbiere', label: 'Tourbière' },
      { id: 'cours-eau', label: "Cours d'eau" },
      { id: 'fosse', label: 'Fossé' },
    ],
  },
  {
    label: 'Linéaires',
    choix: [
      { id: 'haie', label: 'Haie' },
      { id: 'chemin', label: 'Bord de chemin' },
      { id: 'talus', label: 'Talus' },
    ],
  },
  {
    label: 'Rocheux',
    choix: [
      { id: 'falaise', label: 'Falaise' },
      { id: 'eboulis', label: 'Éboulis' },
      { id: 'carriere', label: 'Carrière' },
      { id: 'grotte', label: 'Grotte, cavité' },
    ],
  },
  {
    label: 'Littoral',
    choix: [
      { id: 'dune', label: 'Dune' },
      { id: 'estran', label: 'Estran, plage' },
      { id: 'pre-sale', label: 'Pré salé, lagune' },
      { id: 'mer', label: 'Mer' },
    ],
  },
  {
    label: 'Bâti',
    choix: [
      { id: 'jardin', label: 'Jardin' },
      { id: 'parc-urbain', label: 'Parc urbain' },
      { id: 'batiment', label: 'Bâtiment' },
      { id: 'mur', label: 'Mur, muret' },
    ],
  },
];

const LIBELLES = new Map<string, string>();
for (const liste of [SEXES, STADES, CONTACTS, COMPORTEMENTS, ATLAS, ...HABITATS.map((h) => h.choix)]) {
  for (const c of liste) LIBELLES.set(c.id, c.label);
}

/** Libellé d'un identifiant de liste (ou l'identifiant lui-même s'il est inconnu). */
export const labelOf = (id: string): string => LIBELLES.get(id) ?? id;
