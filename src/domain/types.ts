// Modèle de données de l'application.
// Tout enregistrement synchronisable porte un identifiant UUID, des dates de création et de
// modification, et un indicateur de suppression (on ne détruit pas : on marque, pour pouvoir
// fusionner plus tard les données du téléphone et de l'ordinateur).

import type { GroupId } from './groups';

/** Dates au format ISO 8601 (ex. « 2026-05-14T07:32:00.000Z »). */
export type IsoDate = string;

export interface Syncable {
  id: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  /** 0 = actif, 1 = supprimé (les booléens ne sont pas indexables dans IndexedDB). */
  deleted: 0 | 1;
}

export type Certainty = 'certain' | 'probable' | 'a-confirmer';

/** Où en est la résolution du nom saisi vers un taxon du référentiel. */
export type ResolutionStatus = 'resolu' | 'en-attente' | 'ambigu' | 'introuvable' | 'manuel';

export type TaxonSource = 'taxref' | 'gbif' | 'inaturalist' | 'manuel';

export interface ResolvedTaxon {
  source: TaxonSource;
  /** Identifiant dans le référentiel (cd_nom pour TAXREF). */
  sourceId: string;
  rank: string;
  scientificName: string;
  vernacularName?: string;
  kingdom?: string;
  phylum?: string;
  classe?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  subspecies?: string;
}

export type Sex = 'male' | 'femelle' | 'indetermine' | 'couple';

export type Stage =
  | 'oeuf'
  | 'larve'
  | 'chenille'
  | 'nymphe'
  | 'tetard'
  | 'juvenile'
  | 'immature'
  | 'subadulte'
  | 'adulte'
  | 'exuvie';

export type ContactType =
  | 'vu'
  | 'entendu-chant'
  | 'entendu-cri'
  | 'photographie'
  | 'capture-relache'
  | 'trace'
  | 'empreinte'
  | 'feces'
  | 'pelote'
  | 'nid'
  | 'mue'
  | 'cadavre'
  | 'piege-photo'
  | 'detecteur-ultrason';

/** Effectif : exact, minimum (« >50 ») ou fourchette. */
export interface Count {
  kind: 'exact' | 'minimum' | 'fourchette';
  value: number;
  /** Borne haute, pour une fourchette. */
  max?: number;
  /** Détail optionnel par sexe et par stade. */
  detail?: { sex?: Sex; stage?: Stage; n: number }[];
}

export interface Weather {
  temperatureC?: number;
  windKmh?: number;
  windDirectionDeg?: number;
  cloudCoverPct?: number;
  precipitationMm?: number;
  /** Code météo OMM renvoyé par Open-Meteo. */
  weatherCode?: number;
  source: 'open-meteo' | 'manuel';
}

export type AtlasCode = 'possible' | 'probable' | 'certain';

export interface Observation extends Syncable {
  // Quand
  startAt: IsoDate;
  endAt?: IsoDate;

  // Où
  lat?: number;
  lon?: number;
  /** Précision du point en mètres (rayon). */
  accuracyM?: number;
  altitudeM?: number;
  locationSource?: 'gps' | 'carte' | 'manuel' | 'exif';
  placeName?: string;
  commune?: string;
  communeInsee?: string;
  departement?: string;

  // Quoi
  /** Texte tapé par l'utilisateur, conservé tel quel. */
  taxonInput: string;
  taxon?: ResolvedTaxon;
  resolution: ResolutionStatus;
  certainty: Certainty;
  // Copies « à plat » de champs du taxon, pour les index de filtrage.
  /** Clé « source:identifiant », ex. « taxref:534742 ». */
  taxonKey?: string;
  group: GroupId;
  taxonOrder?: string;
  taxonFamily?: string;

  // Détails optionnels
  count?: Count;
  sex?: Sex;
  stage?: Stage;
  contacts: ContactType[];
  behaviours?: string[];
  behaviourNote?: string;
  atlasCode?: AtlasCode;
  habitats?: string[];
  /** Support ou plante hôte / butinée. */
  substrate?: string;
  weather?: Weather;
  notes?: string;
  tags: string[];

  // Rattachements
  sessionId?: string;
  /** Photo affichée dans la galerie. */
  mainPhotoId?: string;
  photoCount: number;
}

export interface Photo extends Syncable {
  obsId: string;
  /** Position dans l'observation. */
  order: number;
  width: number;
  height: number;
  takenAt?: IsoDate;
  /** Coordonnées lues dans l'EXIF, si présentes. */
  exifLat?: number;
  exifLon?: number;
  hasOriginal: 0 | 1;
}

/** Les images sont stockées à part : la grille ne lit que les miniatures. */
export interface PhotoBlob {
  photoId: string;
  blob: Blob;
}

export interface AudioClip extends Syncable {
  obsId: string;
  durationS: number;
  blob: Blob;
}

/** Sortie de terrain : les observations s'y rattachent avec un lieu prérempli. */
export interface FieldSession extends Syncable {
  name?: string;
  startAt: IsoDate;
  endAt?: IsoDate;
  placeName?: string;
  commune?: string;
  departement?: string;
  lat?: number;
  lon?: number;
  participants?: string[];
  weather?: Weather;
  notes?: string;
}

/** Trace GPS d'une sortie : points [lon, lat, horodatage en ms]. */
export interface Track {
  sessionId: string;
  points: [number, number, number][];
  updatedAt: IsoDate;
}

/** Résultat d'une recherche en ligne, gardé pour ne pas rappeler le service. */
export interface TaxonCacheEntry {
  /** « source:requête normalisée » ou « source:identifiant ». */
  key: string;
  source: TaxonSource;
  fetchedAt: IsoDate;
  taxon: ResolvedTaxon | null;
}

/** Tâche d'enrichissement en attente (rejouée au retour du réseau). */
export interface EnrichTask {
  id: string;
  kind: 'taxon' | 'commune' | 'lieu-dit' | 'altitude' | 'meteo';
  obsId: string;
  attempts: number;
  /** Prochaine tentative (ms depuis l'époque Unix). */
  nextTryAt: number;
  lastError?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

/** Version allégée d'une observation, gardée en mémoire pour filtrer et trier instantanément. */
export interface ObsLite {
  id: string;
  /** Date de début en ms. */
  t: number;
  lat?: number;
  lon?: number;
  group: GroupId;
  sci: string;
  vern: string;
  family: string;
  order: string;
  taxonKey: string;
  certainty: Certainty;
  count: number;
  photoId: string;
  place: string;
}
