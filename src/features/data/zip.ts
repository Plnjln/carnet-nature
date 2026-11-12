// Écriture et lecture de fichiers zip, sans rien charger d'un bloc en mémoire.
// (Module sans accès à la base, pour pouvoir être testé seul.)

import { inflateSync, strFromU8, Zip, ZipDeflate, ZipPassThrough } from 'fflate';

/** Un fichier zip en cours d'écriture. */
export class ZipWriter {
  /** Octets écrits jusqu'ici. */
  taille = 0;
  private blobs: Blob[] = [];
  private morceaux: Uint8Array[] = [];
  private enAttente = 0;
  private zip: Zip;
  private fin: Promise<void>;

  constructor() {
    let resoudre!: () => void;
    let rejeter!: (e: Error) => void;
    this.fin = new Promise<void>((res, rej) => {
      resoudre = res;
      rejeter = rej;
    });
    this.zip = new Zip((err, data, final) => {
      if (err) {
        rejeter(err);
        return;
      }
      this.morceaux.push(data);
      this.enAttente += data.length;
      this.taille += data.length;
      // Regroupe régulièrement en Blob : le navigateur peut alors décharger la mémoire sur disque.
      if (this.enAttente > 32e6) this.vider();
      if (final) resoudre();
    });
  }

  private vider() {
    this.blobs.push(new Blob(this.morceaux as BlobPart[]));
    this.morceaux = [];
    this.enAttente = 0;
  }

  /** Ajoute un fichier ; `compresser` est inutile pour des images déjà compressées. */
  ajouter(nom: string, data: Uint8Array, compresser: boolean) {
    const f = compresser ? new ZipDeflate(nom, { level: 6 }) : new ZipPassThrough(nom);
    this.zip.add(f);
    f.push(data, true);
  }

  async terminer(): Promise<Blob> {
    this.zip.end();
    await this.fin;
    this.vider();
    return new Blob(this.blobs, { type: 'application/zip' });
  }
}

export interface ZipEntry {
  nom: string;
  /** 0 = stocké tel quel, 8 = compressé. */
  methode: number;
  tailleCompressee: number;
  /** Position de l'en-tête local dans le fichier. */
  position: number;
}

/** Lit la table des matières située à la fin du fichier zip. */
export async function lireEntrees(fichier: Blob): Promise<ZipEntry[]> {
  const tailleQueue = Math.min(fichier.size, 65_557);
  const queue = new Uint8Array(await fichier.slice(fichier.size - tailleQueue).arrayBuffer());
  let i = queue.length - 22;
  while (i >= 0 && !(queue[i] === 0x50 && queue[i + 1] === 0x4b && queue[i + 2] === 5 && queue[i + 3] === 6)) i--;
  if (i < 0) throw new Error("Ce fichier n'est pas une archive zip lisible.");
  const fin = new DataView(queue.buffer, queue.byteOffset + i, 22);
  const nombre = fin.getUint16(10, true);
  const taille = fin.getUint32(12, true);
  const debut = fin.getUint32(16, true);

  const table = new Uint8Array(await fichier.slice(debut, debut + taille).arrayBuffer());
  const vue = new DataView(table.buffer, table.byteOffset, table.byteLength);
  const entrees: ZipEntry[] = [];
  let p = 0;
  for (let k = 0; k < nombre && p + 46 <= table.length; k++) {
    if (vue.getUint32(p, true) !== 0x02014b50) break;
    const longueurNom = vue.getUint16(p + 28, true);
    const longueurExtra = vue.getUint16(p + 30, true);
    const longueurCommentaire = vue.getUint16(p + 32, true);
    entrees.push({
      nom: strFromU8(table.subarray(p + 46, p + 46 + longueurNom)),
      methode: vue.getUint16(p + 10, true),
      tailleCompressee: vue.getUint32(p + 20, true),
      position: vue.getUint32(p + 42, true),
    });
    p += 46 + longueurNom + longueurExtra + longueurCommentaire;
  }
  return entrees;
}

/** Lit (et décompresse si besoin) le contenu d'une entrée. */
export async function lireEntree(fichier: Blob, e: ZipEntry): Promise<Uint8Array> {
  const enTete = new DataView(await fichier.slice(e.position, e.position + 30).arrayBuffer());
  const debut = e.position + 30 + enTete.getUint16(26, true) + enTete.getUint16(28, true);
  const data = new Uint8Array(await fichier.slice(debut, debut + e.tailleCompressee).arrayBuffer());
  return e.methode === 0 ? data : inflateSync(data);
}
