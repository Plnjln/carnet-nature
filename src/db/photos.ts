// Retouche des photos d'une observation : choisir la principale, en retirer une, recadrer.

import { db } from './db';
import type { Observation } from '../domain/types';
import { prepareImage } from '../media/images';

/** Marges à rogner, en fraction de la largeur ou de la hauteur (0 = rien, 0.25 = un quart). */
export interface CropRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

async function observation(obsId: string): Promise<Observation> {
  const o = await db.observations.get(obsId);
  if (!o) throw new Error('Observation introuvable');
  return o;
}

/** Fait de cette photo celle qui représente l'observation dans la galerie. */
export async function setMainPhoto(obsId: string, photoId: string): Promise<Observation> {
  await db.observations.update(obsId, { mainPhotoId: photoId, updatedAt: new Date().toISOString() });
  return observation(obsId);
}

/** Retire une photo de l'observation (ses images sont effacées de l'appareil). */
export async function removePhoto(obsId: string, photoId: string): Promise<Observation> {
  const maintenant = new Date().toISOString();
  await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays, db.photoOriginals], async () => {
    // La fiche de la photo est gardée, marquée supprimée : la suppression suivra lors d'une fusion entre appareils.
    await db.photos.update(photoId, { deleted: 1, updatedAt: maintenant });
    await db.photoThumbs.delete(photoId);
    await db.photoDisplays.delete(photoId);
    await db.photoOriginals.delete(photoId);
    const restantes = (await db.photos.where('obsId').equals(obsId).sortBy('order')).filter((p) => !p.deleted);
    const o = await db.observations.get(obsId);
    if (!o) return;
    const principale = o.mainPhotoId && restantes.some((p) => p.id === o.mainPhotoId) ? o.mainPhotoId : restantes[0]?.id;
    await db.observations.update(obsId, { photoCount: restantes.length, mainPhotoId: principale, updatedAt: maintenant });
  });
  return observation(obsId);
}

/** Recadre une photo : la version d'affichage et la miniature sont remplacées. */
export async function cropPhoto(obsId: string, photoId: string, r: CropRect): Promise<Observation> {
  const ligne = await db.photoDisplays.get(photoId);
  if (!ligne) throw new Error('Image introuvable');
  const image = await createImageBitmap(ligne.blob);
  let rognee: Blob;
  try {
    const sx = Math.round(r.left * image.width);
    const sy = Math.round(r.top * image.height);
    const sw = Math.max(1, Math.round((1 - r.left - r.right) * image.width));
    const sh = Math.max(1, Math.round((1 - r.top - r.bottom) * image.height));
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    rognee = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Recadrage impossible'))), 'image/jpeg', 0.92),
    );
  } finally {
    image.close();
  }
  const p = await prepareImage(rognee);
  const maintenant = new Date().toISOString();
  await db.transaction('rw', [db.observations, db.photos, db.photoThumbs, db.photoDisplays], async () => {
    await db.photoDisplays.put({ photoId, blob: p.display });
    await db.photoThumbs.put({ photoId, blob: p.thumb });
    await db.photos.update(photoId, { width: p.width, height: p.height, updatedAt: maintenant });
    await db.observations.update(obsId, { updatedAt: maintenant });
  });
  return observation(obsId);
}
