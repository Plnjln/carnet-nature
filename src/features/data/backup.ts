// Sauvegarde complète (données + photos) dans des fichiers .zip, et restauration avec fusion.
//
// Une sauvegarde est découpée en volumes d'environ 700 Mo : avec des milliers de photos, un seul
// fichier dépasserait ce qu'un navigateur (et le format zip simple) sait manipuler.
// Le premier volume contient « carnet-nature.json » (toutes les données) ; les photos sont
// réparties dans les volumes sous photos/<type>/<identifiant>.<extension>.
//
// La restauration FUSIONNE : un enregistrement n'est remplacé que si celui du fichier est plus
// récent. On peut donc restaurer sur l'ordinateur une sauvegarde du téléphone sans rien perdre.

import { strFromU8, strToU8 } from 'fflate';
import type { Table } from 'dexie';
import { db } from '../../db/db';
import type { FieldSession, Observation, Photo, PhotoBlob, Setting, Track } from '../../domain/types';
import { lireEntree, lireEntrees, ZipWriter } from './zip';

const FORMAT = 'carnet-nature-sauvegarde';
const VERSION = 1;
const TAILLE_VOLUME = 700e6;
const CLE_DERNIERE = 'lastBackupAt';

interface Contenu {
  format: string;
  version: number;
  exportedAt: string;
  observations: Observation[];
  photos: Photo[];
  sessions: FieldSession[];
  tracks: Track[];
  settings: Setting[];
}

export interface BackupResult {
  volumes: Blob[];
  observations: number;
  photos: number;
}

export async function createBackup(onProgress: (fait: number, total: number) => void = () => {}): Promise<BackupResult> {
  const exportedAt = new Date().toISOString();
  const [observations, photos, sessions, tracks, settings] = await Promise.all([
    db.observations.toArray(),
    db.photos.toArray(),
    db.sessions.toArray(),
    db.tracks.toArray(),
    db.settings.toArray(),
  ]);
  const contenu: Contenu = { format: FORMAT, version: VERSION, exportedAt, observations, photos, sessions, tracks, settings };

  const volumes: Blob[] = [];
  let volume = new ZipWriter();
  volume.ajouter('carnet-nature.json', strToU8(JSON.stringify(contenu)), true);

  const tables: [string, Table<PhotoBlob, string>][] = [
    ['miniature', db.photoThumbs],
    ['affichage', db.photoDisplays],
    ['original', db.photoOriginals],
  ];
  const cles = await Promise.all(tables.map(([, table]) => table.toCollection().primaryKeys()));
  const total = cles.reduce((n, k) => n + k.length, 0);
  let fait = 0;

  for (let t = 0; t < tables.length; t++) {
    const [type, table] = tables[t];
    const LOT = 40;
    for (let i = 0; i < cles[t].length; i += LOT) {
      const lignes = await table.bulkGet(cles[t].slice(i, i + LOT));
      for (const ligne of lignes) {
        if (!ligne) continue;
        const data = new Uint8Array(await ligne.blob.arrayBuffer());
        if (volume.taille + data.length > TAILLE_VOLUME) {
          volumes.push(await volume.terminer());
          volume = new ZipWriter();
          volume.ajouter('volume.json', strToU8(JSON.stringify({ format: FORMAT, version: VERSION, exportedAt, volume: volumes.length + 1 })), true);
        }
        const extension = ligne.blob.type === 'image/webp' ? 'webp' : ligne.blob.type === 'image/png' ? 'png' : 'jpg';
        volume.ajouter(`photos/${type}/${ligne.photoId}.${extension}`, data, false);
      }
      fait += lignes.length;
      onProgress(fait, total);
    }
  }
  volumes.push(await volume.terminer());

  await db.settings.put({ key: CLE_DERNIERE, value: exportedAt });
  return { volumes, observations: observations.filter((o) => !o.deleted).length, photos: photos.filter((p) => !p.deleted).length };
}

/** Date de la dernière sauvegarde, ou null. */
export async function lastBackupAt(): Promise<Date | null> {
  const ligne = await db.settings.get(CLE_DERNIERE);
  return typeof ligne?.value === 'string' ? new Date(ligne.value) : null;
}

export interface RestoreResult {
  /** Observations ajoutées ou mises à jour. */
  observations: number;
  /** Observations du fichier déjà à jour sur cet appareil. */
  inchangees: number;
  /** Images ajoutées. */
  images: number;
}

/** Écrit, parmi `lignes`, celles qui sont absentes de la base ou plus récentes que la version locale. */
async function fusionner<T extends { updatedAt: string }>(table: Table<T, string>, lignes: T[], cle: (l: T) => string): Promise<number> {
  if (!lignes.length) return 0;
  const existantes = await table.bulkGet(lignes.map(cle));
  const aEcrire = lignes.filter((l, i) => {
    const locale = existantes[i];
    return !locale || locale.updatedAt < l.updatedAt;
  });
  if (aEcrire.length) await table.bulkPut(aEcrire);
  return aEcrire.length;
}

const TYPES_IMAGE: Record<string, string> = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' };

export async function restoreBackup(fichiers: Blob[], onProgress: (fait: number, total: number) => void = () => {}): Promise<RestoreResult> {
  const resultat: RestoreResult = { observations: 0, inchangees: 0, images: 0 };
  const volumes = await Promise.all(fichiers.map(async (fichier) => ({ fichier, entrees: await lireEntrees(fichier) })));
  const total = volumes.reduce((n, v) => n + v.entrees.length, 0);
  let fait = 0;

  const estUneSauvegarde = volumes.every((v) => v.entrees.some((e) => e.nom === 'carnet-nature.json' || e.nom === 'volume.json'));
  if (!estUneSauvegarde) throw new Error("Ce fichier n'est pas une sauvegarde de Carnet Nature.");

  // 1. Les données (premier volume).
  for (const v of volumes) {
    const e = v.entrees.find((x) => x.nom === 'carnet-nature.json');
    if (!e) continue;
    const contenu = JSON.parse(strFromU8(await lireEntree(v.fichier, e))) as Contenu;
    if (contenu.format !== FORMAT) throw new Error("Ce fichier n'est pas une sauvegarde de Carnet Nature.");
    if (contenu.version > VERSION) throw new Error("Cette sauvegarde vient d'une version plus récente de l'app : mets l'app à jour.");
    const id = (l: { id: string }) => l.id;
    const observations = contenu.observations ?? [];
    const ecrites = await fusionner(db.observations, observations, id);
    resultat.observations += ecrites;
    resultat.inchangees += observations.length - ecrites;
    await fusionner(db.photos, contenu.photos ?? [], id);
    await fusionner(db.sessions, contenu.sessions ?? [], id);
    await fusionner(db.tracks, contenu.tracks ?? [], (l) => l.sessionId);
    // Réglages : on n'écrase pas ceux de cet appareil.
    for (const s of contenu.settings ?? []) {
      if (s.key === CLE_DERNIERE) continue;
      if (!(await db.settings.get(s.key))) await db.settings.put(s);
    }
  }

  // 2. Les images, volume par volume, par petits lots.
  const tables: Record<string, Table<PhotoBlob, string>> = {
    miniature: db.photoThumbs,
    affichage: db.photoDisplays,
    original: db.photoOriginals,
  };
  for (const v of volumes) {
    const images = v.entrees.filter((e) => e.nom.startsWith('photos/'));
    fait += v.entrees.length - images.length;
    const LOT = 25;
    for (let i = 0; i < images.length; i += LOT) {
      const lot = images.slice(i, i + LOT);
      for (const e of lot) {
        const [, type, nomFichier = ''] = e.nom.split('/');
        const table = tables[type];
        const point = nomFichier.lastIndexOf('.');
        if (!table || point <= 0) continue;
        const photoId = nomFichier.slice(0, point);
        if (await table.get(photoId)) continue; // déjà présente
        const data = await lireEntree(v.fichier, e);
        await table.put({ photoId, blob: new Blob([data as BlobPart], { type: TYPES_IMAGE[nomFichier.slice(point + 1)] ?? 'image/jpeg' }) });
        resultat.images++;
      }
      fait += lot.length;
      onProgress(fait, total);
    }
  }
  return resultat;
}
