// Création, modification et suppression d'observations ; mémoire des derniers taxons utilisés.

import { db } from './db';
import type { GroupId } from '../domain/groups';
import type { AtlasCode, Certainty, ContactType, Observation, Photo, PhotoBlob, ResolvedTaxon, Sex, Stage } from '../domain/types';
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

/** Retrouve le taxon TAXREF d'une observation enregistrée (pour préremplir la modification). */
export function recentFromObservation(o: Observation): RecentTaxon | null {
  const t = o.taxon;
  if (!t || t.source !== 'taxref') return null;
  return {
    cdNom: Number(t.sourceId),
    sci: t.scientificName,
    vern: t.vernacularName ?? '',
    rank: t.rank,
    phylum: t.phylum ?? '',
    classe: t.classe ?? '',
    order: t.order ?? '',
    family: t.family ?? '',
    group: o.group,
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

/** Champs optionnels de la saisie. */
export interface ObsDetails {
  sex?: Sex;
  stage?: Stage;
  contacts: ContactType[];
  behaviours: string[];
  behaviourNote: string;
  atlasCode?: AtlasCode;
  habitats: string[];
  substrate: string;
  tags: string[];
  placeName: string;
  commune: string;
}

export function emptyDetails(): ObsDetails {
  return { contacts: ['vu'], behaviours: [], behaviourNote: '', habitats: [], substrate: '', tags: [], placeName: '', commune: '' };
}

export function detailsFromObservation(o: Observation): ObsDetails {
  return {
    sex: o.sex,
    stage: o.stage,
    contacts: [...o.contacts],
    behaviours: [...(o.behaviours ?? [])],
    behaviourNote: o.behaviourNote ?? '',
    atlasCode: o.atlasCode,
    habitats: [...(o.habitats ?? [])],
    substrate: o.substrate ?? '',
    tags: [...o.tags],
    placeName: o.placeName ?? '',
    commune: o.commune ?? '',
  };
}

export interface ObsPosition {
  lat: number;
  lon: number;
  accuracyM?: number;
  altitudeM?: number;
  source: 'gps' | 'carte' | 'manuel' | 'exif';
}

export interface ObsInput {
  /** Texte tapé (ou nom du taxon choisi). */
  taxonInput: string;
  /** Taxon choisi dans les propositions ; absent si saisie libre. */
  taxon?: RecentTaxon;
  startAt: Date;
  position?: ObsPosition;
  count?: number | null;
  certainty: Certainty;
  notes?: string;
  details: ObsDetails;
  /** Photos à ajouter. */
  newPhotos: Blob[];
}

interface PhotosPretes {
  photos: Photo[];
  miniatures: PhotoBlob[];
  affichages: PhotoBlob[];
}

/** Compresse les photos (opération lente, faite avant d'ouvrir la transaction). */
async function preparerPhotos(fichiers: Blob[], obsId: string, premierOrdre: number, maintenant: string): Promise<PhotosPretes> {
  const pretes: PhotosPretes = { photos: [], miniatures: [], affichages: [] };
  for (const fichier of fichiers) {
    const p = await prepareImage(fichier);
    const photoId = crypto.randomUUID();
    pretes.photos.push({
      id: photoId,
      obsId,
      order: premierOrdre + pretes.photos.length,
      width: p.width,
      height: p.height,
      hasOriginal: 0,
      createdAt: maintenant,
      updatedAt: maintenant,
      deleted: 0,
    });
    pretes.miniatures.push({ photoId, blob: p.thumb });
    pretes.affichages.push({ photoId, blob: p.display });
  }
  return pretes;
}

/** Champs d'une observation qui viennent directement du formulaire. */
function champsSaisis(n: ObsInput) {
  // Copies simples : les objets venant de l'interface ne sont pas enregistrables tels quels.
  const t = n.taxon ? toRecent(n.taxon) : undefined;
  const d = n.details;
  const contacts = [...d.contacts];
  if (n.newPhotos.length && !contacts.includes('photographie')) contacts.push('photographie');
  if (contacts.length === 0) contacts.push('vu');
  const texte = (s: string | undefined) => s?.trim() || undefined;
  return {
    taxonRecent: t,
    champs: {
      startAt: n.startAt.toISOString(),
      taxonInput: n.taxonInput.trim(),
      taxon: t ? versTaxon(t) : undefined,
      // Saisie libre : le nom sera rapproché d'un référentiel plus tard.
      resolution: t ? ('resolu' as const) : ('en-attente' as const),
      certainty: n.certainty,
      taxonKey: t ? `taxref:${t.cdNom}` : undefined,
      group: t ? t.group : ('autres' as GroupId),
      taxonOrder: t?.order || undefined,
      taxonFamily: t?.family || undefined,
      count: n.count && n.count > 0 ? { kind: 'exact' as const, value: Math.round(n.count) } : undefined,
      sex: d.sex,
      stage: d.stage,
      contacts,
      behaviours: d.behaviours.length ? [...d.behaviours] : undefined,
      behaviourNote: texte(d.behaviourNote),
      atlasCode: t?.group === 'oiseaux' ? d.atlasCode : undefined,
      habitats: d.habitats.length ? [...d.habitats] : undefined,
      substrate: texte(d.substrate),
      notes: texte(n.notes),
      tags: d.tags.map((e) => e.trim()).filter(Boolean),
      placeName: texte(d.placeName),
      commune: texte(d.commune),
    },
  };
}

export async function createObservation(n: ObsInput): Promise<Observation> {
  const maintenant = new Date().toISOString();
  const id = crypto.randomUUID();
  const p = await preparerPhotos(n.newPhotos, id, 0, maintenant);
  const { taxonRecent, champs } = champsSaisis(n);

  const obs: Observation = {
    id,
    createdAt: maintenant,
    updatedAt: maintenant,
    deleted: 0,
    ...champs,
    lat: n.position?.lat,
    lon: n.position?.lon,
    accuracyM: n.position?.accuracyM,
    altitudeM: n.position?.altitudeM,
    locationSource: n.position?.source,
    mainPhotoId: p.photos[0]?.id,
    photoCount: p.photos.length,
  };

  await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays], async () => {
    await db.observations.add(obs);
    if (p.photos.length) {
      await db.photos.bulkAdd(p.photos);
      await db.photoThumbs.bulkAdd(p.miniatures);
      await db.photoDisplays.bulkAdd(p.affichages);
    }
  });
  if (taxonRecent) await memoriser(taxonRecent);
  return obs;
}

export async function updateObservation(id: string, n: ObsInput): Promise<Observation> {
  const avant = await db.observations.get(id);
  if (!avant) throw new Error('Observation introuvable');
  const maintenant = new Date().toISOString();
  const p = await preparerPhotos(n.newPhotos, id, avant.photoCount, maintenant);
  const { taxonRecent, champs } = champsSaisis(n);

  const deplacee = n.position?.lat !== avant.lat || n.position?.lon !== avant.lon;
  const obs: Observation = {
    ...avant,
    ...champs,
    updatedAt: maintenant,
    lat: n.position?.lat,
    lon: n.position?.lon,
    accuracyM: n.position?.accuracyM,
    altitudeM: n.position?.altitudeM,
    locationSource: n.position?.source,
    mainPhotoId: avant.mainPhotoId ?? p.photos[0]?.id,
    photoCount: avant.photoCount + p.photos.length,
  };
  if (deplacee) {
    // Le point a bougé : ce qui avait été déduit de l'ancienne position est à recalculer,
    // sauf si le lieu vient d'être corrigé à la main.
    obs.communeInsee = undefined;
    obs.departement = undefined;
    obs.weather = undefined;
    if (obs.commune === avant.commune) obs.commune = undefined;
    if (obs.placeName === avant.placeName) obs.placeName = undefined;
  } else if (obs.startAt.slice(0, 13) !== avant.startAt.slice(0, 13)) {
    // L'heure a changé : la météo n'est plus la bonne.
    obs.weather = undefined;
  }

  await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays], async () => {
    await db.observations.put(obs);
    if (p.photos.length) {
      await db.photos.bulkAdd(p.photos);
      await db.photoThumbs.bulkAdd(p.miniatures);
      await db.photoDisplays.bulkAdd(p.affichages);
    }
  });
  if (taxonRecent) await memoriser(taxonRecent);
  return obs;
}

/** Suppression « douce » : l'observation est marquée supprimée, pas détruite (utile pour la fusion entre appareils). */
export async function deleteObservation(id: string): Promise<void> {
  await db.observations.update(id, { deleted: 1, updatedAt: new Date().toISOString() });
}
