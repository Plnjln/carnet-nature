// Lecture de la date de prise de vue et de la position GPS enregistrées dans une photo (EXIF).
// Sert à créer une observation après coup, à partir des photos d'un reflex ou du téléphone.

export interface PhotoInfo {
  takenAt?: Date;
  lat?: number;
  lon?: number;
}

export async function readPhotoInfo(fichier: Blob): Promise<PhotoInfo> {
  try {
    // La bibliothèque n'est chargée qu'au premier usage, pour ne pas alourdir le démarrage.
    const exifr = (await import('exifr')).default;
    const [tags, gps] = await Promise.all([
      exifr.parse(fichier, ['DateTimeOriginal', 'CreateDate']).catch(() => undefined),
      exifr.gps(fichier).catch(() => undefined),
    ]);
    const date: unknown = tags?.DateTimeOriginal ?? tags?.CreateDate;
    const info: PhotoInfo = {};
    if (date instanceof Date && !Number.isNaN(date.getTime())) info.takenAt = date;
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude) && (gps.latitude !== 0 || gps.longitude !== 0)) {
      info.lat = gps.latitude;
      info.lon = gps.longitude;
    }
    return info;
  } catch {
    // Photo sans EXIF ou format non reconnu : ce n'est pas une erreur.
    return {};
  }
}
