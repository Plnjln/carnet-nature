// Statistiques tirées des observations : bilan par année, répartition par mois, courbe d'accumulation.

import type { ObsLite } from '../../domain/types';
import type { SpeciesSummary } from './species';

export interface YearSummary {
  annee: number;
  /** Nombre d'observations de l'année. */
  observations: number;
  /** Nombre de taxons différents vus dans l'année. */
  taxons: number;
  /** Taxons vus pour la première fois cette année-là. */
  nouveaux: number;
}

/** Bilan par année, de la plus récente à la plus ancienne. */
export function yearly(rows: ObsLite[], especes: SpeciesSummary[]): YearSummary[] {
  const parAnnee = new Map<number, { observations: number; taxons: Set<string>; nouveaux: number }>();
  const annee = (a: number) => {
    let ligne = parAnnee.get(a);
    if (!ligne) {
      ligne = { observations: 0, taxons: new Set(), nouveaux: 0 };
      parAnnee.set(a, ligne);
    }
    return ligne;
  };
  for (const o of rows) {
    const ligne = annee(new Date(o.t).getFullYear());
    ligne.observations++;
    if (o.taxonKey) ligne.taxons.add(o.taxonKey);
  }
  for (const e of especes) annee(new Date(e.premiere).getFullYear()).nouveaux++;
  return Array.from(parAnnee.entries())
    .map(([a, l]) => ({ annee: a, observations: l.observations, taxons: l.taxons.size, nouveaux: l.nouveaux }))
    .sort((a, b) => b.annee - a.annee);
}

/** Nombre de taxons différents observés chaque mois, toutes années confondues (indice 0 = janvier). */
export function taxaPerMonth(rows: ObsLite[]): number[] {
  const parMois = Array.from({ length: 12 }, () => new Set<string>());
  for (const o of rows) if (o.taxonKey) parMois[new Date(o.t).getMonth()].add(o.taxonKey);
  return parMois.map((s) => s.size);
}

/** Courbe d'accumulation : nombre cumulé de taxons au fil des premières observations. */
export function accumulation(especes: SpeciesSummary[]): { t: number; n: number }[] {
  const dates = especes.map((e) => e.premiere).sort((a, b) => a - b);
  return dates.map((t, i) => ({ t, n: i + 1 }));
}
