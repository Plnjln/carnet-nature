// Exports des observations : CSV (tableur), GeoJSON (SIG) et Darwin Core (GBIF, INPN, Faune-France…).

import { db } from '../../db/db';
import type { Observation } from '../../domain/types';

/** Observations actives, de la plus ancienne à la plus récente. */
export async function loadActiveObservations(): Promise<Observation[]> {
  const toutes = await db.observations.where('deleted').equals(0).toArray();
  return toutes.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

type Cellule = string | number | undefined | null;

function csv(lignes: Cellule[][], separateur: string): string {
  const cellule = (v: Cellule) => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    return s.includes(separateur) || s.includes('"') || s.includes('\n') || s.includes('\r') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return lignes.map((l) => l.map(cellule).join(separateur)).join('\r\n');
}

const CERTITUDE: Record<string, string> = { certain: 'certain', probable: 'probable', 'a-confirmer': 'à confirmer' };

/** CSV pour tableur français : séparateur point-virgule, encodage UTF-8 avec marque d'ordre (lisible par Excel). */
export function toCsv(obs: Observation[]): Blob {
  const entete = [
    'id', 'date_debut', 'date_fin', 'nom_saisi', 'nom_scientifique', 'nom_vernaculaire', 'rang', 'referentiel', 'id_referentiel',
    'regne', 'embranchement', 'classe', 'ordre', 'famille', 'genre', 'certitude', 'effectif', 'type_effectif', 'effectif_max',
    'sexe', 'stade', 'contacts', 'comportements', 'code_atlas', 'habitats', 'support', 'latitude', 'longitude', 'precision_m',
    'altitude_m', 'lieu_dit', 'commune', 'code_insee', 'departement', 'temperature_c', 'vent_kmh', 'nuages_pct', 'pluie_mm',
    'remarques', 'etiquettes', 'nb_photos', 'cree_le', 'modifie_le',
  ];
  const lignes: Cellule[][] = [entete];
  for (const o of obs) {
    const t = o.taxon;
    lignes.push([
      o.id, o.startAt, o.endAt, o.taxonInput, t?.scientificName, t?.vernacularName, t?.rank, t?.source, t?.sourceId,
      t?.kingdom, t?.phylum, t?.classe, t?.order, t?.family, t?.genus, CERTITUDE[o.certainty], o.count?.value, o.count?.kind, o.count?.max,
      o.sex, o.stage, o.contacts.join(', '), o.behaviours?.join(', '), o.atlasCode, o.habitats?.join(', '), o.substrate, o.lat, o.lon, o.accuracyM,
      o.altitudeM, o.placeName, o.commune, o.communeInsee, o.departement, o.weather?.temperatureC, o.weather?.windKmh, o.weather?.cloudCoverPct, o.weather?.precipitationMm,
      o.notes, o.tags.join(', '), o.photoCount, o.createdAt, o.updatedAt,
    ]);
  }
  return new Blob(['﻿', csv(lignes, ';')], { type: 'text/csv;charset=utf-8' });
}

/** GeoJSON : un point par observation localisée (les observations sans position sont omises). */
export function toGeoJson(obs: Observation[]): Blob {
  const features = obs
    .filter((o) => o.lat !== undefined && o.lon !== undefined)
    .map((o) => ({
      type: 'Feature',
      id: o.id,
      geometry: { type: 'Point', coordinates: o.altitudeM !== undefined ? [o.lon, o.lat, o.altitudeM] : [o.lon, o.lat] },
      properties: {
        date: o.startAt,
        nom_scientifique: o.taxon?.scientificName ?? o.taxonInput,
        nom_vernaculaire: o.taxon?.vernacularName ?? null,
        id_referentiel: o.taxon ? `${o.taxon.source}:${o.taxon.sourceId}` : null,
        groupe: o.group,
        ordre: o.taxon?.order ?? null,
        famille: o.taxon?.family ?? null,
        certitude: CERTITUDE[o.certainty],
        effectif: o.count?.value ?? null,
        precision_m: o.accuracyM ?? null,
        lieu_dit: o.placeName ?? null,
        commune: o.commune ?? null,
        remarques: o.notes ?? null,
      },
    }));
  return new Blob([JSON.stringify({ type: 'FeatureCollection', features })], { type: 'application/geo+json' });
}

const SEXE_DWC: Record<string, string> = { male: 'male', femelle: 'female', indetermine: 'undetermined', couple: 'male | female' };
const STADE_DWC: Record<string, string> = {
  oeuf: 'egg', larve: 'larva', chenille: 'larva', nymphe: 'pupa', tetard: 'tadpole', juvenile: 'juvenile',
  immature: 'immature', subadulte: 'subadult', adulte: 'adult', exuvie: 'exuviae',
};

/** Darwin Core « Occurrence », en CSV (virgule, UTF-8) : le format d'échange attendu par GBIF. */
export function toDarwinCore(obs: Observation[]): Blob {
  const entete = [
    'occurrenceID', 'basisOfRecord', 'eventDate', 'scientificName', 'taxonID', 'vernacularName', 'taxonRank',
    'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'identificationVerificationStatus', 'individualCount',
    'sex', 'lifeStage', 'decimalLatitude', 'decimalLongitude', 'geodeticDatum', 'coordinateUncertaintyInMeters',
    'minimumElevationInMeters', 'maximumElevationInMeters', 'locality', 'municipality', 'county', 'occurrenceRemarks',
  ];
  const lignes: Cellule[][] = [entete];
  for (const o of obs) {
    const t = o.taxon;
    const localise = o.lat !== undefined && o.lon !== undefined;
    lignes.push([
      o.id,
      'HumanObservation',
      o.endAt ? `${o.startAt}/${o.endAt}` : o.startAt,
      t?.scientificName ?? o.taxonInput,
      t ? `${t.source}:${t.sourceId}` : '',
      t?.vernacularName,
      t?.rank,
      t?.kingdom, t?.phylum, t?.classe, t?.order, t?.family, t?.genus,
      CERTITUDE[o.certainty],
      o.count?.value,
      o.sex ? SEXE_DWC[o.sex] : '',
      o.stage ? STADE_DWC[o.stage] : '',
      localise ? o.lat : '',
      localise ? o.lon : '',
      localise ? 'WGS84' : '',
      localise ? o.accuracyM : '',
      o.altitudeM, o.altitudeM,
      o.placeName, o.commune, o.departement,
      o.notes,
    ]);
  }
  return new Blob([csv(lignes, ',')], { type: 'text/csv;charset=utf-8' });
}

/** Propose un fichier au téléchargement. */
export function download(blob: Blob, nom: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  // L'adresse est libérée plus tard, le temps que le téléchargement démarre.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** « 2026-11-12 » : date du jour pour les noms de fichiers. */
export function dateFichier(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
