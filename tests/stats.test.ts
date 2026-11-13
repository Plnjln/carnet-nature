import { describe, expect, it } from 'vitest';
import type { ObsLite } from '../src/domain/types';
import { newPerYear, perMonth, summarize } from '../src/features/species/species';
import { accumulation, taxaPerMonth, yearly } from '../src/features/species/stats';
import { circle, pointInPolygon, type LonLat } from '../src/geo/geometry';

/** Observation de test : date ISO, clé de taxon (vide = nom saisi librement). */
function obs(id: string, date: string, taxonKey: string, count = 1, photoId = ''): ObsLite {
  return { id, t: Date.parse(date), group: 'oiseaux', sci: taxonKey || 'inconnu', vern: '', family: '', order: '', taxonKey, certainty: 'certain', count, photoId, place: '' };
}

const rows: ObsLite[] = [
  obs('1', '2024-05-10T08:00:00Z', 'taxref:1', 2),
  obs('2', '2024-05-12T08:00:00Z', 'taxref:2'),
  obs('3', '2025-05-03T08:00:00Z', 'taxref:1', 3, 'photo-a'),
  obs('4', '2025-07-20T08:00:00Z', 'taxref:3'),
  obs('5', '2025-07-21T08:00:00Z', ''),
];

describe('regroupement par taxon', () => {
  const { especes, nonRapprochees } = summarize(rows);
  const parCle = new Map(especes.map((e) => [e.key, e]));

  it('compte un résumé par taxon identifié', () => {
    expect(especes).toHaveLength(3);
    expect(nonRapprochees).toBe(1);
  });

  it('cumule observations, effectifs, dates et photo', () => {
    const e = parCle.get('taxref:1');
    expect(e?.n).toBe(2);
    expect(e?.individus).toBe(5);
    expect(e?.premiere).toBe(Date.parse('2024-05-10T08:00:00Z'));
    expect(e?.derniere).toBe(Date.parse('2025-05-03T08:00:00Z'));
    expect(e?.photoId).toBe('photo-a');
  });

  it('compte les nouveaux taxons par année', () => {
    expect(newPerYear(especes)).toEqual([
      { annee: 2025, n: 1 },
      { annee: 2024, n: 2 },
    ]);
  });

  it('dresse le bilan annuel', () => {
    expect(yearly(rows, especes)).toEqual([
      { annee: 2025, observations: 3, taxons: 2, nouveaux: 1 },
      { annee: 2024, observations: 2, taxons: 2, nouveaux: 2 },
    ]);
  });

  it('répartit par mois', () => {
    const o = perMonth(rows);
    expect(o[4]).toBe(3); // mai
    expect(o[6]).toBe(2); // juillet
    expect(o.reduce((a, b) => a + b, 0)).toBe(5);
    const t = taxaPerMonth(rows);
    expect(t[4]).toBe(2); // deux taxons différents en mai
    expect(t[6]).toBe(1); // le nom libre de juillet ne compte pas
  });

  it('construit une courbe d’accumulation croissante', () => {
    const c = accumulation(especes);
    expect(c.map((p) => p.n)).toEqual([1, 2, 3]);
    expect(c[0].t).toBeLessThanOrEqual(c[1].t);
    expect(c[1].t).toBeLessThanOrEqual(c[2].t);
  });
});

describe('géométrie', () => {
  const carre: LonLat[] = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ];

  it('reconnaît un point dans un polygone', () => {
    expect(pointInPolygon(1, 1, carre)).toBe(true);
    expect(pointInPolygon(3, 1, carre)).toBe(false);
    expect(pointInPolygon(1, -0.5, carre)).toBe(false);
  });

  it('gère un polygone en creux', () => {
    // Un « L » : le coin supérieur droit est en dehors.
    const enL: LonLat[] = [
      [0, 0],
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 2],
      [0, 2],
    ];
    expect(pointInPolygon(0.5, 1.5, enL)).toBe(true);
    expect(pointInPolygon(1.5, 1.5, enL)).toBe(false);
  });

  it('trace un cercle fermé du bon rayon', () => {
    const c = circle(4.84, 45.76, 100);
    expect(c[0]).toEqual(c[c.length - 1]);
    // 100 m vers le nord font environ 0,0009 degré de latitude.
    const maxLat = Math.max(...c.map((p) => p[1]));
    expect(maxLat - 45.76).toBeCloseTo(100 / 111_320, 6);
    expect(pointInPolygon(4.84, 45.76, c)).toBe(true);
  });
});
