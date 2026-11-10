// Normalisation des noms pour la recherche floue.
// Le même traitement est appliqué aux noms de l'index et au texte tapé.

// Mots ignorés : articles et prépositions des noms français, abréviations de saisie (« sp. », « indét. »).
const MOTS_VIDES = new Set([
  'de', 'des', 'du', 'la', 'le', 'les', 'd', 'l', 'a', 'au', 'aux', 'et', 'en',
  'sp', 'spp', 'indet', 'indetermine', 'cf',
]);

/** Minuscules, sans accents ni ponctuation : « Mésange bleue » -> « mesange bleue ». */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Gomme les fautes d'orthographe les plus courantes :
 * ph -> f, h muet, y -> i, lettres doublées. « syrphe » et « sirfe » donnent tous deux « sirfe ».
 */
export function fold(mot: string): string {
  return mot
    .replace(/ph/g, 'f')
    .replace(/h/g, '')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1');
}

/** Découpe un nom en mots normalisés, sans doublons ni mots vides. */
export function tokenize(s: string): string[] {
  const mots: string[] = [];
  for (const brut of normalize(s).split(' ')) {
    if (!brut || MOTS_VIDES.has(brut)) continue;
    const mot = fold(brut).slice(0, 40);
    if (mot && !mots.includes(mot)) mots.push(mot);
  }
  return mots;
}
