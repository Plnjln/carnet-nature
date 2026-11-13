import { describe, expect, it } from 'vitest';
import { distanceM, lengthM } from '../src/geo/geometry';
import { cdNomDe, formatStatuts, type Statut } from '../src/reference/statuts';

const s = (type: Statut['type'], code: string, libelle = ''): Statut => ({ type, code, libelle });

describe('mise en forme des statuts', () => {
  it('ne renvoie rien pour un taxon sans statut', () => {
    expect(formatStatuts([])).toEqual([]);
  });

  it('place la protection avant la liste rouge et les directives', () => {
    const r = formatStatuts([s('DH', 'CDH4'), s('LRN', 'LC'), s('PN', 'NO3', 'Liste des oiseaux protégés : Article 3'), s('DH', 'CDH2')]);
    expect(r.map((x) => x.texte)).toEqual(['Protégée en France', 'Liste rouge France : LC', 'Directive Habitats : annexes II, IV']);
    expect(r[0].ton).toBe('protege');
    expect(r[0].detail).toContain('Article 3');
    expect(r[1].ton).toBe('neutre');
  });

  it('retient la catégorie de liste rouge la plus préoccupante', () => {
    const r = formatStatuts([s('LRN', 'LC'), s('LRN', 'VU'), s('LRN', 'NA')]);
    expect(r).toHaveLength(1);
    expect(r[0].texte).toBe('Liste rouge France : VU');
    expect(r[0].ton).toBe('menace');
    expect(r[0].detail).toContain('LC');
  });

  it('signale une espèce quasi menacée, une envahissante et un plan national', () => {
    expect(formatStatuts([s('LRN', 'NT')])[0].ton).toBe('attention');
    const r = formatStatuts([s('PNA', 'true'), s('REGLII', 'FRnoEEEA2', 'Liste des espèces animales exotiques envahissantes')]);
    expect(r.map((x) => x.ton)).toEqual(['envahissante', 'attention']);
  });

  it('lit l’annexe de la directive Oiseaux', () => {
    expect(formatStatuts([s('DO', 'CDO1')])[0].texte).toBe('Directive Oiseaux : annexe I');
  });

  it('extrait le numéro TAXREF d’une clé de taxon', () => {
    expect(cdNomDe('taxref:534742')).toBe(534742);
    expect(cdNomDe('gbif:2487879')).toBeNull();
    expect(cdNomDe('')).toBeNull();
    expect(cdNomDe(undefined)).toBeNull();
  });
});

describe('distances d’une trace', () => {
  it('mesure environ 111 m pour un millième de degré de latitude', () => {
    expect(distanceM([4.84, 45.76], [4.84, 45.761])).toBeCloseTo(111.32, 1);
  });

  it('tient compte de la latitude pour la longitude', () => {
    // À 60° de latitude, un degré de longitude vaut moitié moins qu'à l'équateur.
    expect(distanceM([0, 60], [0.001, 60])).toBeCloseTo(55.66, 1);
  });

  it('additionne les segments', () => {
    expect(lengthM([[0, 0], [0, 0.001], [0, 0.002]])).toBeCloseTo(222.64, 1);
    expect(lengthM([[0, 0]])).toBe(0);
  });
});
