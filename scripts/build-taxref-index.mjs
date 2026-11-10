// Convertit l'archive Darwin Core de TAXREF (publiée par PatriNat sur l'IPT de GBIF France)
// en un index compact de la faune, chargé par l'app pour l'autocomplétion hors ligne.
//
// Usage : node scripts/build-taxref-index.mjs <dossier de l'archive décompressée> <dossier de sortie>
// Source : https://ipt.gbif.fr/archive.do?r=taxref (licence CC BY 4.0)
//
// Fichiers produits :
//   meta.json            version, date, compteurs et noms des fichiers ci-dessous
//   classif-<v>.tsv      une ligne par combinaison embranchement / classe / ordre / famille
//   taxa-<v>.tsv         cd_nom, nom scientifique, noms vernaculaires FR, rang, n° de ligne de classif
//   syn-<v>.tsv          nom synonyme, n° de ligne du taxon valide dans taxa
//
// L'archive ne contient pas de statut de présence par territoire : l'index couvre donc
// toute la faune de TAXREF (métropole et outre-mer).

import { createReadStream, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const [srcDir, outDir] = process.argv.slice(2);
if (!srcDir || !outDir) {
  console.error('Usage : node scripts/build-taxref-index.mjs <archive décompressée> <sortie>');
  process.exit(1);
}
const taxonFile = join(srcDir, 'taxon.txt');
if (!existsSync(taxonFile)) {
  console.error(`Fichier introuvable : ${taxonFile}`);
  process.exit(1);
}

// Rangs conservés : de la classe à la sous-espèce.
const RANGS = new Set([
  'class', 'subclass', 'order', 'suborder', 'infraorder', 'superfamily',
  'family', 'subfamily', 'tribe', 'genus', 'species', 'subspecies',
]);

/** « Salamandre noire (La), Salamandre alpestre » -> « Salamandre noire, Salamandre alpestre » */
function nettoyerVernaculaire(brut) {
  if (!brut) return '';
  const vus = new Set();
  const noms = [];
  for (const morceau of brut.split(',')) {
    const nom = morceau.replace(/\s*\((?:le|la|les|l')\)\s*/gi, ' ').replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    const cle = nom.toLowerCase();
    if (nom && !vus.has(cle)) {
      vus.add(cle);
      noms.push(nom);
    }
  }
  return noms.join(', ');
}

const valides = []; // { cdNom, sci, vern, rang, classif }
const indexParCdNom = new Map(); // cd_nom -> position dans `valides`
const synonymesBruts = []; // { nom, cdNomValide }
const classifs = []; // 'embranchement\tclasse\tordre\tfamille'
const indexClassif = new Map();

const lecteur = createInterface({ input: createReadStream(taxonFile, { encoding: 'utf8' }), crlfDelay: Infinity });
let col = null;
let lignes = 0;

for await (const ligne of lecteur) {
  const f = ligne.split('\t');
  if (!col) {
    // Première ligne : en-tête. On repère les colonnes par leur nom, pas par leur position.
    col = Object.fromEntries(f.map((nom, i) => [nom.trim(), i]));
    for (const requis of ['taxonID', 'acceptedNameUsageID', 'scientificName', 'kingdom', 'taxonRank']) {
      if (!(requis in col)) {
        console.error(`Colonne « ${requis} » absente de taxon.txt. Colonnes trouvées : ${Object.keys(col).join(', ')}`);
        process.exit(1);
      }
    }
    continue;
  }
  lignes++;
  if (f[col.kingdom] !== 'Animalia') continue;
  const rang = f[col.taxonRank];
  if (!RANGS.has(rang)) continue;
  const cdNom = f[col.taxonID];
  const cdNomValide = f[col.acceptedNameUsageID] || cdNom;
  const sci = (f[col.scientificName] || '').trim();
  if (!sci || !/^\d+$/.test(cdNom)) continue;

  if (cdNom === cdNomValide) {
    const cle = [f[col.phylum] || '', f[col.class] || '', f[col.order] || '', f[col.family] || ''].join('\t');
    let classif = indexClassif.get(cle);
    if (classif === undefined) {
      classif = classifs.length;
      classifs.push(cle);
      indexClassif.set(cle, classif);
    }
    indexParCdNom.set(cdNom, valides.length);
    valides.push({ cdNom, sci, vern: nettoyerVernaculaire(f[col.vernacularName]), rang, classif });
  } else {
    synonymesBruts.push({ nom: sci, cdNomValide });
  }
}

// Synonymes : rattachés au taxon valide, sans doublons ni noms identiques au nom valide.
const synonymes = [];
const vusSyn = new Set();
for (const s of synonymesBruts) {
  const cible = indexParCdNom.get(s.cdNomValide);
  if (cible === undefined) continue;
  if (s.nom.toLowerCase() === valides[cible].sci.toLowerCase()) continue;
  const cle = `${s.nom.toLowerCase()}\t${cible}`;
  if (vusSyn.has(cle)) continue;
  vusSyn.add(cle);
  synonymes.push(`${s.nom}\t${cible}`);
}

if (valides.length < 1000) {
  console.error(`Seulement ${valides.length} taxons valides trouvés : la source a probablement changé de format.`);
  process.exit(1);
}

const texteTaxa = valides.map((t) => `${t.cdNom}\t${t.sci}\t${t.vern}\t${t.rang}\t${t.classif}`).join('\n');
const texteSyn = synonymes.join('\n');
const texteClassif = classifs.join('\n');
const version = createHash('sha1').update(texteTaxa).update(texteSyn).digest('hex').slice(0, 10);

mkdirSync(outDir, { recursive: true });
const fichiers = {
  classif: `classif-${version}.tsv`,
  taxa: `taxa-${version}.tsv`,
  syn: `syn-${version}.tsv`,
};
writeFileSync(join(outDir, fichiers.classif), texteClassif);
writeFileSync(join(outDir, fichiers.taxa), texteTaxa);
writeFileSync(join(outDir, fichiers.syn), texteSyn);
// meta.json est écrit en dernier : sa présence signale un index complet.
writeFileSync(
  join(outDir, 'meta.json'),
  JSON.stringify(
    {
      source: 'TAXREF v18.0 (archive Darwin Core, IPT GBIF France)',
      url: 'https://ipt.gbif.fr/archive.do?r=taxref',
      licence: 'CC BY 4.0',
      citation: 'Gargominy O (2025). TAXREF. UAR PatriNat (OFB-MNHN-CNRS-IRD), Paris. https://doi.org/10.15468/vqueam',
      perimetre: 'Faune (Animalia), métropole et outre-mer, de la classe à la sous-espèce',
      genereLe: new Date().toISOString(),
      version,
      fichiers,
      compteurs: { taxons: valides.length, synonymes: synonymes.length, classifications: classifs.length },
    },
    null,
    2,
  ),
);

const mo = (t) => (Buffer.byteLength(t) / 1e6).toFixed(1);
console.log(`taxon.txt : ${lignes} lignes lues`);
console.log(`Index écrit dans ${outDir} : ${valides.length} taxons (${mo(texteTaxa)} Mo), ${synonymes.length} synonymes (${mo(texteSyn)} Mo), ${classifs.length} classifications`);
