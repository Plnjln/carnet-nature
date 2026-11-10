// Préparation des photos côté appareil : une version d'affichage (~1600 px) et une miniature (~400 px).
// L'original n'est pas conservé (option à venir).

export interface PreparedImage {
  display: Blob;
  thumb: Blob;
  /** Dimensions de la version d'affichage. */
  width: number;
  height: number;
}

const TAILLE_AFFICHAGE = 1600;
const TAILLE_MINIATURE = 400;

type Source = ImageBitmap | HTMLImageElement;

async function decoder(fichier: Blob): Promise<Source> {
  try {
    // Respecte l'orientation enregistrée par l'appareil photo.
    return await createImageBitmap(fichier, { imageOrientation: 'from-image' });
  } catch {
    // Repli pour les formats que createImageBitmap refuse.
    const url = URL.createObjectURL(fichier);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function reduire(source: Source, max: number): HTMLCanvasElement {
  const largeur = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const hauteur = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const echelle = Math.min(1, max / Math.max(largeur, hauteur));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(largeur * echelle));
  canvas.height = Math.max(1, Math.round(hauteur * echelle));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function enBlob(canvas: HTMLCanvasElement, qualite: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // WebP si le navigateur sait l'écrire, sinon JPEG.
    canvas.toBlob(
      (webp) => {
        if (webp && webp.type === 'image/webp') return resolve(webp);
        canvas.toBlob((jpeg) => (jpeg ? resolve(jpeg) : reject(new Error('Compression impossible'))), 'image/jpeg', qualite);
      },
      'image/webp',
      qualite,
    );
  });
}

export async function prepareImage(fichier: Blob): Promise<PreparedImage> {
  const source = await decoder(fichier);
  try {
    const affichage = reduire(source, TAILLE_AFFICHAGE);
    const miniature = reduire(source, TAILLE_MINIATURE);
    const [display, thumb] = await Promise.all([enBlob(affichage, 0.82), enBlob(miniature, 0.7)]);
    return { display, thumb, width: affichage.width, height: affichage.height };
  } finally {
    if ('close' in source) source.close();
  }
}
