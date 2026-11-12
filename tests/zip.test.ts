import { describe, expect, it } from 'vitest';
import { strFromU8, strToU8 } from 'fflate';
import { lireEntree, lireEntrees, ZipWriter } from '../src/features/data/zip';

describe('zip : écriture puis relecture', () => {
  it('retrouve les fichiers compressés et non compressés à l\'identique', async () => {
    const json = JSON.stringify({ format: 'test', accents: 'Mésange épeichette', liste: Array.from({ length: 500 }, (_, i) => i) });
    const image = new Uint8Array(70_000);
    for (let i = 0; i < image.length; i++) image[i] = (i * 31 + (i >> 3)) & 255;
    // Une séquence qui ressemble à un en-tête zip, au milieu des données : ne doit pas tromper la lecture.
    image.set([0x50, 0x4b, 0x03, 0x04, 0x50, 0x4b, 0x07, 0x08, 0x50, 0x4b, 0x05, 0x06], 1234);

    const zip = new ZipWriter();
    zip.ajouter('carnet-nature.json', strToU8(json), true);
    zip.ajouter('photos/miniature/abc-123.webp', image, false);
    zip.ajouter('photos/affichage/abc-123.jpg', image.subarray(0, 10), false);
    const blob = await zip.terminer();

    expect(blob.size).toBe(zip.taille);
    const entrees = await lireEntrees(blob);
    expect(entrees.map((e) => e.nom)).toEqual(['carnet-nature.json', 'photos/miniature/abc-123.webp', 'photos/affichage/abc-123.jpg']);
    expect(entrees[0].methode).toBe(8);
    expect(entrees[1].methode).toBe(0);

    expect(strFromU8(await lireEntree(blob, entrees[0]))).toBe(json);
    expect(Array.from(await lireEntree(blob, entrees[1]))).toEqual(Array.from(image));
    expect(Array.from(await lireEntree(blob, entrees[2]))).toEqual(Array.from(image.subarray(0, 10)));
  });

  it('refuse un fichier qui n\'est pas un zip', async () => {
    await expect(lireEntrees(new Blob(['pas un zip']))).rejects.toThrow();
  });
});
