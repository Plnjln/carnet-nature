// Jeu de données factice pour tester les performances : 10 000 observations, 20 000 miniatures.
// Toutes les observations factices portent l'étiquette « factice », ce qui permet de les supprimer.

import { db } from '../../db/db';
import { GROUPS, type GroupId } from '../../domain/groups';
import type { ContactType, Observation, Photo, PhotoBlob } from '../../domain/types';
import { sampleTaxa } from '../../taxonomy/client';

export const FAKE_TAG = 'factice';

interface FakeTaxon {
  cdNom: number;
  sci: string;
  vern: string;
  rank: string;
  classe: string;
  order: string;
  family: string;
  group: GroupId;
}

// Utilisés si l'index TAXREF n'est pas disponible.
const TAXONS_DE_SECOURS: FakeTaxon[] = [
  { cdNom: 534742, sci: 'Cyanistes caeruleus', vern: 'Mésange bleue', rank: 'species', classe: 'Aves', order: 'Passeriformes', family: 'Paridae', group: 'oiseaux' },
  { cdNom: 3611, sci: 'Dendrocopos major', vern: 'Pic épeiche', rank: 'species', classe: 'Aves', order: 'Piciformes', family: 'Picidae', group: 'oiseaux' },
  { cdNom: 4001, sci: 'Erithacus rubecula', vern: 'Rougegorge familier', rank: 'species', classe: 'Aves', order: 'Passeriformes', family: 'Muscicapidae', group: 'oiseaux' },
  { cdNom: 60585, sci: 'Vulpes vulpes', vern: 'Renard roux', rank: 'species', classe: 'Mammalia', order: 'Carnivora', family: 'Canidae', group: 'mammiferes' },
  { cdNom: 53741, sci: 'Vanessa atalanta', vern: 'Vulcain', rank: 'species', classe: 'Insecta', order: 'Lepidoptera', family: 'Nymphalidae', group: 'papillons' },
  { cdNom: 65440, sci: 'Anax imperator', vern: 'Anax empereur', rank: 'species', classe: 'Insecta', order: 'Odonata', family: 'Aeshnidae', group: 'odonates' },
  { cdNom: 23974, sci: 'Episyrphus balteatus', vern: 'Syrphe ceinturé', rank: 'species', classe: 'Insecta', order: 'Diptera', family: 'Syrphidae', group: 'dipteres' },
  { cdNom: 259, sci: 'Bufo bufo', vern: 'Crapaud commun', rank: 'species', classe: 'Amphibia', order: 'Anura', family: 'Bufonidae', group: 'amphibiens' },
  { cdNom: 77756, sci: 'Podarcis muralis', vern: 'Lézard des murailles', rank: 'species', classe: '', order: 'Squamata', family: 'Lacertidae', group: 'reptiles' },
  { cdNom: 65774, sci: 'Tettigonia viridissima', vern: 'Grande sauterelle verte', rank: 'species', classe: 'Insecta', order: 'Orthoptera', family: 'Tettigoniidae', group: 'orthopteres' },
];

const LIEUX = ['Bois de la Garenne', 'Étang neuf', 'Prairie du bas', 'La Combe', 'Les Grandes Vignes', 'Marais communal', 'Haie du chemin creux', 'Jardin', 'Roselière', 'Carrière'];
const CONTACTS: ContactType[] = ['vu', 'vu', 'vu', 'photographie', 'entendu-chant', 'entendu-cri', 'trace'];

const alea = (max: number) => Math.floor(Math.random() * max);
const pick = <T>(liste: T[]): T => liste[alea(liste.length)];

/** Fabrique quelques miniatures colorées (une teinte par groupe), réutilisées pour toutes les photos. */
async function fabriquerMiniatures(): Promise<Map<GroupId, Blob[]>> {
  const parGroupe = new Map<GroupId, Blob[]>();
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  for (const id of Object.keys(GROUPS) as GroupId[]) {
    const blobs: Blob[] = [];
    for (let v = 0; v < 3; v++) {
      const degrade = ctx.createLinearGradient(0, 0, 240, 180);
      degrade.addColorStop(0, GROUPS[id].color);
      degrade.addColorStop(1, ['#0e1a14', '#3a3a2a', '#1a2a3a'][v]);
      ctx.fillStyle = degrade;
      ctx.fillRect(0, 0, 240, 180);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(alea(240), alea(180), 10 + alea(40), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(GROUPS[id].icon, 120, 95);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.6));
      if (blob) blobs.push(blob);
    }
    parGroupe.set(id, blobs);
  }
  return parGroupe;
}

export interface FakeResult {
  observations: number;
  photos: number;
  ms: number;
  /** true si les taxons viennent de l'index TAXREF, false s'ils viennent de la liste de secours. */
  depuisIndex: boolean;
}

export async function generateFakeData(
  nbObs = 10_000,
  onProgress: (fait: number, total: number) => void = () => {},
): Promise<FakeResult> {
  const debut = performance.now();

  let taxons: FakeTaxon[] = TAXONS_DE_SECOURS;
  let depuisIndex = false;
  try {
    const tirage = await sampleTaxa(600);
    if (tirage.length >= 50) {
      taxons = tirage;
      depuisIndex = true;
    }
  } catch {
    // Index indisponible : on garde la liste de secours.
  }

  const miniatures = await fabriquerMiniatures();
  const maintenant = Date.now();
  const DIX_ANS = 10 * 365 * 24 * 3600 * 1000;
  const LOT = 500;
  let nbPhotos = 0;

  for (let debutLot = 0; debutLot < nbObs; debutLot += LOT) {
    const obs: Observation[] = [];
    const photos: Photo[] = [];
    const thumbs: PhotoBlob[] = [];

    for (let i = debutLot; i < Math.min(nbObs, debutLot + LOT); i++) {
      // Quelques espèces reviennent souvent, comme dans un vrai carnet.
      const t = taxons[Math.random() < 0.6 ? alea(Math.min(40, taxons.length)) : alea(taxons.length)];
      const date = new Date(maintenant - Math.random() * DIX_ANS).toISOString();
      const id = crypto.randomUUID();
      // 0 à 4 photos par observation, 2 en moyenne (soit 20 000 photos pour 10 000 observations).
      const n = i % 5;
      let mainPhotoId: string | undefined;
      for (let p = 0; p < n; p++) {
        const photoId = crypto.randomUUID();
        if (p === 0) mainPhotoId = photoId;
        photos.push({ id: photoId, obsId: id, order: p, width: 240, height: 180, takenAt: date, hasOriginal: 0, createdAt: date, updatedAt: date, deleted: 0 });
        const choix = miniatures.get(t.group) ?? [];
        if (choix.length) thumbs.push({ photoId, blob: pick(choix) });
      }
      nbPhotos += n;
      obs.push({
        id,
        createdAt: date,
        updatedAt: date,
        deleted: 0,
        startAt: date,
        // France métropolitaine, en gros.
        lat: 42.5 + Math.random() * 8.3,
        lon: -4.5 + Math.random() * 12.5,
        accuracyM: 3 + alea(40),
        altitudeM: alea(1500),
        locationSource: 'gps',
        placeName: pick(LIEUX),
        taxonInput: t.vern || t.sci,
        taxon: {
          source: 'taxref',
          sourceId: String(t.cdNom),
          rank: t.rank,
          scientificName: t.sci,
          vernacularName: t.vern || undefined,
          kingdom: 'Animalia',
          classe: t.classe,
          order: t.order,
          family: t.family,
        },
        resolution: 'resolu',
        certainty: Math.random() < 0.85 ? 'certain' : Math.random() < 0.6 ? 'probable' : 'a-confirmer',
        taxonKey: `taxref:${t.cdNom}`,
        group: t.group,
        taxonOrder: t.order,
        taxonFamily: t.family,
        count: { kind: 'exact', value: Math.random() < 0.7 ? 1 : 2 + alea(30) },
        contacts: [pick(CONTACTS)],
        tags: [FAKE_TAG],
        mainPhotoId,
        photoCount: n,
      });
    }

    await db.transaction('rw', db.observations, db.photos, db.photoThumbs, async () => {
      await db.observations.bulkAdd(obs);
      await db.photos.bulkAdd(photos);
      await db.photoThumbs.bulkAdd(thumbs);
    });
    onProgress(Math.min(nbObs, debutLot + LOT), nbObs);
  }

  return { observations: nbObs, photos: nbPhotos, ms: Math.round(performance.now() - debut), depuisIndex };
}

/** Supprime toutes les observations factices et leurs photos. Renvoie le nombre d'observations supprimées. */
export async function deleteFakeData(): Promise<number> {
  const obsIds = await db.observations.where('tags').equals(FAKE_TAG).primaryKeys();
  const LOT = 2000;
  for (let i = 0; i < obsIds.length; i += LOT) {
    const lot = obsIds.slice(i, i + LOT);
    const photoIds = await db.photos.where('obsId').anyOf(lot).primaryKeys();
    await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays, db.photoOriginals], async () => {
      await db.photoThumbs.bulkDelete(photoIds);
      await db.photoDisplays.bulkDelete(photoIds);
      await db.photoOriginals.bulkDelete(photoIds);
      await db.photos.bulkDelete(photoIds);
      await db.observations.bulkDelete(lot);
    });
  }
  return obsIds.length;
}
