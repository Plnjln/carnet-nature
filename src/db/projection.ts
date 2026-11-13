// Projection en mémoire : une version allégée de chaque observation, chargée une fois,
// sur laquelle la galerie et la carte filtrent et trient sans relire la base.

import { db } from './db';
import type { ObsLite, Observation } from '../domain/types';

export function toLite(o: Observation): ObsLite {
  return {
    id: o.id,
    t: Date.parse(o.startAt),
    lat: o.lat,
    lon: o.lon,
    acc: o.accuracyM,
    group: o.group,
    sci: o.taxon?.scientificName ?? o.taxonInput,
    vern: o.taxon?.vernacularName ?? '',
    family: o.taxonFamily ?? '',
    order: o.taxonOrder ?? '',
    taxonKey: o.taxonKey ?? '',
    certainty: o.certainty,
    count: o.count?.value ?? 1,
    photoId: o.mainPhotoId ?? '',
    place: o.placeName || o.commune || '',
    session: o.sessionId ?? '',
  };
}

/** Charge toutes les observations actives, triées de la plus récente à la plus ancienne. */
export async function loadProjection(): Promise<{ rows: ObsLite[]; ms: number }> {
  const debut = performance.now();
  const rows: ObsLite[] = [];
  await db.observations.each((o) => {
    if (!o.deleted) rows.push(toLite(o));
  });
  rows.sort((a, b) => b.t - a.t);
  return { rows, ms: Math.round(performance.now() - debut) };
}
