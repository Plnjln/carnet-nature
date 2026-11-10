import { describe, expect, it } from 'vitest';
import { fold, normalize, tokenize } from '../src/taxonomy/normalize';
import { parseIndex, prefixDistance, TaxonSearcher, type IndexData } from '../src/taxonomy/search-core';

// Petit index de test, au même format que l'index TAXREF réel.
const classif = [
  ['Chordata', 'Aves', 'Passeriformes', 'Paridae'], // 0
  ['Chordata', 'Aves', 'Piciformes', 'Picidae'], // 1
  ['Arthropoda', 'Insecta', 'Diptera', 'Syrphidae'], // 2
  ['Arthropoda', 'Insecta', 'Orthoptera', ''], // 3
  ['Arthropoda', 'Insecta', 'Orthoptera', 'Tettigoniidae'], // 4
];

const data: IndexData = {
  classif,
  taxa: [
    { cdNom: 534742, sci: 'Cyanistes caeruleus', vern: 'Mésange bleue', rank: 'species', classif: 0 }, // 0
    { cdNom: 3764, sci: 'Parus major', vern: 'Mésange charbonnière', rank: 'species', classif: 0 }, // 1
    { cdNom: 534751, sci: 'Periparus ater', vern: 'Mésange noire', rank: 'species', classif: 0 }, // 2
    { cdNom: 534750, sci: 'Cyanistes teneriffae', vern: 'Mésange nord-africaine', rank: 'species', classif: 0 }, // 3
    { cdNom: 3611, sci: 'Dendrocopos major', vern: 'Pic épeiche', rank: 'species', classif: 1 }, // 4
    { cdNom: 3630, sci: 'Dryobates minor', vern: 'Pic épeichette', rank: 'species', classif: 1 }, // 5
    { cdNom: 3603, sci: 'Picus viridis', vern: 'Pic vert, Pivert', rank: 'species', classif: 1 }, // 6
    { cdNom: 23974, sci: 'Episyrphus balteatus', vern: 'Syrphe ceinturé', rank: 'species', classif: 2 }, // 7
    { cdNom: 24040, sci: 'Syrphus ribesii', vern: 'Syrphe du groseillier', rank: 'species', classif: 2 }, // 8
    { cdNom: 187492, sci: 'Syrphidae', vern: '', rank: 'family', classif: 2 }, // 9
    { cdNom: 185213, sci: 'Orthoptera', vern: 'Orthoptères', rank: 'order', classif: 3 }, // 10
    { cdNom: 65774, sci: 'Tettigonia viridissima', vern: 'Grande Sauterelle verte', rank: 'species', classif: 4 }, // 11
  ],
  synonyms: [
    { name: 'Parus caeruleus', taxon: 0 },
    { name: 'Picoides major', taxon: 4 },
  ],
};

const s = new TaxonSearcher(data);
const premier = (q: string) => s.search(q)[0];

describe('normalisation', () => {
  it('retire accents, majuscules et ponctuation', () => {
    expect(normalize('Mésange bleue')).toBe('mesange bleue');
    expect(normalize("Pic  épeiche (L')")).toBe('pic epeiche l');
  });

  it('gomme les fautes courantes', () => {
    expect(fold('syrphe')).toBe(fold('sirfe'));
    expect(fold('orthoptera')).toBe(fold('ortoptera'));
    expect(fold('caeruleuss')).toBe(fold('caeruleus'));
  });

  it('ignore les mots vides et les abréviations de saisie', () => {
    expect(tokenize('Syrphe du groseillier')).toEqual([fold('syrphe'), fold('groseillier')]);
    expect(tokenize('Orthoptera indét.')).toEqual([fold('orthoptera')]);
    expect(tokenize('Syrphidae sp.')).toEqual([fold('syrphidae')]);
  });
});

describe('distance sur un début de mot', () => {
  it('vaut 0 pour un préfixe exact', () => {
    expect(prefixDistance('bleu', 'bleue', 1)).toBe(0);
  });
  it('compte une inversion de lettres pour 1', () => {
    expect(prefixDistance('mesagne', 'mesange', 2)).toBe(1);
  });
  it('abandonne quand le mot est trop différent', () => {
    expect(prefixDistance('mesange', 'moineau', 2)).toBeGreaterThan(2);
  });
});

describe('recherche floue', () => {
  it('« mesange bleu » trouve la Mésange bleue', () => {
    expect(premier('mesange bleu').cdNom).toBe(534742);
  });

  it('« Cyanistes caeruleuss » trouve Cyanistes caeruleus', () => {
    expect(premier('Cyanistes caeruleuss').cdNom).toBe(534742);
  });

  it('« sirphe » trouve des syrphes', () => {
    const hits = s.search('sirphe');
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits[0].family).toBe('Syrphidae');
    expect(hits[0].group).toBe('dipteres');
  });

  it('« Syrphidae » trouve la famille', () => {
    const hit = premier('Syrphidae');
    expect(hit.sci).toBe('Syrphidae');
    expect(hit.rank).toBe('family');
  });

  it('« orthoptera » et « Orthoptera indét. » trouvent l\'ordre', () => {
    expect(premier('orthoptera').sci).toBe('Orthoptera');
    expect(premier('Orthoptera indét.').sci).toBe('Orthoptera');
  });

  it('« pic epeiche » trouve le Pic épeiche avant le Pic épeichette', () => {
    const hits = s.search('pic epeiche');
    expect(hits[0].cdNom).toBe(3611);
    expect(hits.map((h) => h.cdNom)).toContain(3630);
  });

  it('tolère une inversion de lettres', () => {
    expect(premier('mesagne bleue').cdNom).toBe(534742);
  });

  it('trouve un taxon par un synonyme', () => {
    const hit = premier('parus caeruleus');
    expect(hit.cdNom).toBe(534742);
    expect(hit.matchedKind).toBe('synonyme');
    expect(hit.matched).toBe('Parus caeruleus');
  });

  it('trouve un second nom vernaculaire', () => {
    expect(premier('pivert').cdNom).toBe(3603);
  });

  it('ne renvoie rien pour une saisie vide ou trop courte', () => {
    expect(s.search('')).toEqual([]);
    expect(s.search('p')).toEqual([]);
    expect(s.search('zzzzzz')).toEqual([]);
  });
});

describe('lecture des fichiers TSV', () => {
  it('reconstruit un index utilisable', () => {
    const lu = parseIndex(
      'Chordata\tAves\tPasseriformes\tParidae',
      '534742\tCyanistes caeruleus\tMésange bleue\tspecies\t0\n3764\tParus major\tMésange charbonnière\tspecies\t0',
      'Parus caeruleus\t0',
    );
    expect(lu.taxa).toHaveLength(2);
    expect(lu.synonyms).toEqual([{ name: 'Parus caeruleus', taxon: 0 }]);
    const hit = new TaxonSearcher(lu).search('mesange charbo')[0];
    expect(hit.cdNom).toBe(3764);
    expect(hit.order).toBe('Passeriformes');
  });
});
