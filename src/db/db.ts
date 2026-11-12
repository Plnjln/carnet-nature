// Base locale (IndexedDB via Dexie). Tout reste sur l'appareil.
// Seuls les champs listés ci-dessous sont indexés ; les autres sont stockés tels quels.

import Dexie, { type Table } from 'dexie';
import type {
  AudioClip,
  EnrichTask,
  FieldSession,
  Observation,
  Photo,
  PhotoBlob,
  Setting,
  TaxonCacheEntry,
  Track,
} from '../domain/types';

/** Information de référence mise en cache (clé « photo:<nom> » ou « texte:<nom> ») ; `data` vaut null si rien n'a été trouvé. */
export interface RefInfo {
  key: string;
  fetchedAt: number;
  data: unknown;
}

export class CarnetDB extends Dexie {
  observations!: Table<Observation, string>;
  photos!: Table<Photo, string>;
  photoThumbs!: Table<PhotoBlob, string>;
  photoDisplays!: Table<PhotoBlob, string>;
  photoOriginals!: Table<PhotoBlob, string>;
  audio!: Table<AudioClip, string>;
  sessions!: Table<FieldSession, string>;
  tracks!: Table<Track, string>;
  taxonCache!: Table<TaxonCacheEntry, string>;
  enrichQueue!: Table<EnrichTask, string>;
  settings!: Table<Setting, string>;
  refInfo!: Table<RefInfo, string>;

  constructor() {
    super('carnet-nature');
    // Version 1 du schéma. Pour le faire évoluer : ajouter this.version(2).stores({...}).upgrade(...)
    this.version(1).stores({
      // « *champ » = index sur chaque élément d'un tableau ; « [a+b] » = index composé.
      observations:
        'id, startAt, updatedAt, deleted, group, taxonOrder, taxonFamily, taxonKey, sessionId, certainty, resolution, *tags, *contacts, [group+startAt]',
      photos: 'id, obsId, takenAt, updatedAt, deleted',
      photoThumbs: 'photoId',
      photoDisplays: 'photoId',
      photoOriginals: 'photoId',
      audio: 'id, obsId, updatedAt',
      sessions: 'id, startAt, updatedAt, deleted',
      tracks: 'sessionId',
      taxonCache: 'key, source, fetchedAt',
      enrichQueue: 'id, kind, obsId, nextTryAt',
      settings: 'key',
    });
    // Version 2 : cache des photos et textes de référence (iNaturalist, Wikipédia).
    this.version(2).stores({
      refInfo: 'key',
    });
  }
}

export const db = new CarnetDB();

/** Demande au navigateur de ne pas effacer les données quand la place manque. */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
