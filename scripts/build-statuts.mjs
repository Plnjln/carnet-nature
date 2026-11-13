// Télécharge les statuts de protection et de menace depuis l'API TAXREF (MNHN / PatriNat) et les
// écrit dans un fichier compact que l'app charge à la demande.
//
// Usage : node scripts/build-statuts.mjs <dossier de sortie>      (lancé avant chaque compilation)
//
// Statuts retenus, pour la France métropolitaine :
//   PN      protection nationale
//   LRN     liste rouge nationale (UICN France)
//   DH, DO  directives européennes Habitats et Oiseaux
//   PNA     plan national d'actions en cours
//   REGLII  espèces exotiques envahissantes (interdiction d'introduction)
//
// L'API n'est pas utilisable depuis un navigateur (pas d'en-tête CORS), d'où ce passage par un
// fichier. Ce script ne fait JAMAIS échouer la compilation : si l'API est indisponible, l'app est
// publiée sans statuts, et ils reviendront à la publication suivante.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] ?? 'public/taxref';
const API = 'https://taxref.mnhn.fr/api/status/search/lines';
const TAILLE_PAGE = 2000;
const METROPOLE = 'TERFXFR';

// [type, filtre de territoire, garde-fou sur le nombre de pages]
const TYPES = [
  ['PN', METROPOLE, 5],
  ['LRN', METROPOLE, 12],
  ['DH', METROPOLE, 3],
  ['DO', METROPOLE, 3],
  ['PNA', '', 3],
  ['REGLII', METROPOLE, 3],
];

async function page(type, territoire, numero) {
  const url = `${API}?statusTypeId=${type}${territoire ? `&locationId=${territoire}` : ''}&page=${numero}&size=${TAILLE_PAGE}`;
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), 60_000);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/hal+json', 'User-Agent': 'carnet-nature-build' }, signal: controle.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return { lignes: j._embedded?.status ?? [], pages: j.page?.totalPages ?? 1 };
  } finally {
    clearTimeout(minuterie);
  }
}

async function tout(type, territoire, maxPages) {
  const lignes = [];
  for (let n = 1; n <= maxPages; n++) {
    const p = await page(type, territoire, n);
    lignes.push(...p.lignes);
    if (n >= p.pages || p.lignes.length === 0) break;
  }
  return lignes;
}

const libelles = []; // textes de statut, sans doublons
const indexLibelle = new Map();
const lignes = []; // [cd_nom du taxon valide, n° du type, code, n° du libellé]
const vues = new Set();
const compteurs = {};
const types = TYPES.map(([t]) => t);

for (const [type, territoire, maxPages] of TYPES) {
  try {
    const recues = await tout(type, territoire, maxPages);
    let gardees = 0;
    for (const s of recues) {
      const cdNom = s.taxon?.referenceId ?? s.taxon?.id;
      const code = String(s.statusCode ?? '');
      const nom = String(s.statusName ?? '').replace(/<[^>]+>/g, '').trim();
      if (!cdNom || !code) continue;
      // Parmi les « interdictions d'introduction », seules les exotiques envahissantes nous intéressent.
      if (type === 'REGLII' && !/exotiques? envahissantes?/i.test(nom)) continue;
      const cle = `${cdNom}|${type}|${code}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      let l = indexLibelle.get(nom);
      if (l === undefined) {
        l = libelles.length;
        libelles.push(nom);
        indexLibelle.set(nom, l);
      }
      lignes.push([cdNom, types.indexOf(type), code, l]);
      gardees++;
    }
    compteurs[type] = gardees;
    console.log(`Statuts ${type} : ${gardees} lignes`);
  } catch (e) {
    compteurs[type] = 0;
    console.warn(`Statuts ${type} indisponibles : ${e instanceof Error ? e.message : e}`);
  }
}

if (lignes.length === 0) {
  console.warn("Aucun statut récupéré : l'app sera publiée sans statuts de protection.");
} else {
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, 'statuts.json'),
      JSON.stringify({
        source: 'Base de connaissance « Statuts » de l’INPN, via l’API TAXREF (MNHN / PatriNat)',
        perimetre: 'France métropolitaine',
        genereLe: new Date().toISOString(),
        compteurs,
        types,
        libelles,
        lignes,
      }),
    );
    console.log(`Statuts écrits dans ${outDir}/statuts.json : ${lignes.length} lignes, ${libelles.length} libellés`);
  } catch (e) {
    console.warn(`Écriture des statuts impossible : ${e instanceof Error ? e.message : e}`);
  }
}
