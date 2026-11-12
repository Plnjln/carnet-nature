// Regroupement des observations par taxon, pour la life list et la fiche espèce.

import type { GroupId } from '../../domain/groups';
import type { ObsLite } from '../../domain/types';

export interface SpeciesSummary {
  /** Clé « source:identifiant » du taxon. */
  key: string;
  sci: string;
  vern: string;
  group: GroupId;
  family: string;
  order: string;
  /** Nombre d'observations. */
  n: number;
  /** Somme des effectifs. */
  individus: number;
  /** Première et dernière observation (ms). */
  premiere: number;
  derniere: number;
  /** Une photo du taxon, s'il y en a. */
  photoId: string;
}

/** Un résumé par taxon identifié. Les noms saisis librement (sans référentiel) sont comptés à part. */
export function summarize(rows: ObsLite[]): { especes: SpeciesSummary[]; nonRapprochees: number } {
  const parCle = new Map<string, SpeciesSummary>();
  let nonRapprochees = 0;
  for (const o of rows) {
    if (!o.taxonKey) {
      nonRapprochees++;
      continue;
    }
    let e = parCle.get(o.taxonKey);
    if (!e) {
      e = { key: o.taxonKey, sci: o.sci, vern: o.vern, group: o.group, family: o.family, order: o.order, n: 0, individus: 0, premiere: o.t, derniere: o.t, photoId: '' };
      parCle.set(o.taxonKey, e);
    }
    e.n++;
    e.individus += o.count;
    if (o.t < e.premiere) e.premiere = o.t;
    if (o.t > e.derniere) e.derniere = o.t;
    if (!e.photoId && o.photoId) e.photoId = o.photoId;
  }
  return { especes: Array.from(parCle.values()), nonRapprochees };
}

/** Nombre de nouveaux taxons par année (année de la première observation), de la plus récente à la plus ancienne. */
export function newPerYear(especes: SpeciesSummary[]): { annee: number; n: number }[] {
  const compte = new Map<number, number>();
  for (const e of especes) {
    const annee = new Date(e.premiere).getFullYear();
    compte.set(annee, (compte.get(annee) ?? 0) + 1);
  }
  return Array.from(compte.entries())
    .map(([annee, n]) => ({ annee, n }))
    .sort((a, b) => b.annee - a.annee);
}

/** Nombre d'observations par mois (indice 0 = janvier). */
export function perMonth(rows: ObsLite[]): number[] {
  const mois = new Array<number>(12).fill(0);
  for (const o of rows) mois[new Date(o.t).getMonth()]++;
  return mois;
}
