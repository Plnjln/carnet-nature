// Création et suppression d'observations, mémoire des derniers taxons utilisés.

import { db } from './db';
import type { GroupId } from '../domain/groups';
import type { Certainty, Observation, Photo, PhotoBlob, ResolvedTaxon } from '../domain/types';
import type { Fix } from '../geo/position';
import { prepareImage } from '../media/images';
import type { SearchHit } from '../taxonomy/search-core';

/** Ce qu'on retient d'un taxon choisi, pour le reproposer en un tap. */
export interface RecentTaxon {
  cdNom: number;
  sci: string;
  vern: string;
  rank: string;
  phylum: string;
  classe: string;
  order: string;
  family: string;
  group: GroupId;
}

const CLE_RECENTS = 'recentTaxa';
const NB_RECENTS = 12;

export function toRecent(h: SearchHit | RecentTaxon): RecentTaxon {
  return {
    cdNom: h.cdNom,
    sci: h.sci,
    vern: h.vern,
    rank: h.rank,
    phylum: h.phylum,
    classe: h.classe,
    order: h.order,
    family: h.family,
    group: h.group,
  };
}

export async function getRecentTaxa(): Promise<RecentTaxon[]> {
  const ligne = await db.settings.get(CLE_RECENTS);
  return Array.isArray(ligne?.value) ? (ligne.value as RecentTaxon[]) : [];
}

async function memoriser(t: RecentTaxon): Promise<void> {
  const liste = (await getRecentTaxa()).filter((r) => r.cdNom !== t.cdNom);
  liste.unshift(t);
  await db.settings.put({ key: CLE_RECENTS, value: liste.slice(0, NB_RECENTS) });
}

function versTaxon(t: RecentTaxon): ResolvedTaxon {
  const espece = t.rank === 'species' || t.rank === 'subspecies';
  const mots = t.sci.split(' ');
  return {
    source: 'taxref',
    sourceId: String(t.cdNom),
    rank: t.rank,
    scientificName: t.sci,
    vernacularName: t.vern || undefined,
    kingdom: 'Animalia',
    phylum: t.phylum || undefined,
    classe: t.classe || undefined,
    order: t.order || undefined,
    family: t.family || undefined,
    genus: espece || t.rank === 'genus' ? mots[0] : undefined,
    species: espece ? mots.slice(0, 2).join(' ') : undefined,
    subspecies: t.rank === 'subspecies' ? t.sci : undefined,
  };
}

export interface NewObservation {
  /** Texte tapé (ou nom du taxon choisi). */
  taxonInput: string;
  /** Taxon choisi dans les propositions ; absent si saisie libre. */
  taxon?: RecentTaxon;
  startAt: Date;
  fix?: Fix;
  count?: number;
  certainty: Certainty;
  notes?: string;
  photos: Blob[];
}

export async function createObservation(n: NewObservation): Promise<Observation> {
  const maintenant = new Date().toISOString();
  const id = crypto.randomUUID();

  // Les photos sont compressées avant d'ouvrir la transaction (opération lente, hors base).
  const photos: Photo[] = [];
  const miniatures: PhotoBlob[] = [];
  const affichages: PhotoBlob[] = [];
  for (const fichier of n.photos) {
    const p = await prepareImage(fichier);
    const photoId = crypto.randomUUID();
    photos.push({
      id: photoId,
      obsId: id,
      order: photos.length,
      width: p.width,
      height: p.height,
      hasOriginal: 0,
      createdAt: maintenant,
      updatedAt: maintenant,
      deleted: 0,
    });
    miniatures.push({ photoId, blob: p.thumb });
    affichages.push({ photoId, blob: p.display });
  }

  // Copie simple du taxon : les objets venant de l'interface ne sont pas enregistrables tels quels.
  const t = n.taxon ? toRecent(n.taxon) : undefined;
  const obs: Observation = {
    id,
    createdAt: maintenant,
    updatedAt: maintenant,
    deleted: 0,
    startAt: n.startAt.toISOString(),
    lat: n.fix?.lat,
    lon: n.fix?.lon,
    accuracyM: n.fix?.accuracyM,
    altitudeM: n.fix?.altitudeM,
    locationSource: n.fix ? 'gps' : undefined,
    taxonInput: n.taxonInput.trim(),
    taxon: t ? versTaxon(t) : undefined,
    // Saisie libre : le nom sera rapproché d'un référentiel plus tard.
    resolution: t ? 'resolu' : 'en-attente',
    certainty: n.certainty,
    taxonKey: t ? `taxref:${t.cdNom}` : undefined,
    group: t ? t.group : 'autres',
    taxonOrder: t?.order || undefined,
    taxonFamily: t?.family || undefined,
    count: n.count && n.count > 0 ? { kind: 'exact', value: n.count } : undefined,
    contacts: n.photos.length ? ['vu', 'photographie'] : ['vu'],
    notes: n.notes?.trim() || undefined,
    tags: [],
    mainPhotoId: photos[0]?.id,
    photoCount: photos.length,
  };

  await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays], async () => {
    await db.observations.add(obs);
    if (photos.length) {
      await db.photos.bulkAdd(photos);
      await db.photoThumbs.bulkAdd(miniatures);
      await db.photoDisplays.bulkAdd(affichages);
    }
  });
  if (t) await memoriser(t);
  return obs;
}

/** Suppression « douce » : l'observation est marquée supprimée, pas détruite (utile pour la fusion entre appareils). */
export async function deleteObservation(id: string): Promise<void> {
  await db.observations.update(id, { deleted: 1, updatedAt: new Date().toISOString() });
}
