// Parcours de l'annuaire de clés en ligne (les liens eux-mêmes sont dans annuaire-data.ts).

import { normalize } from '../taxonomy/normalize';
import { ANNUAIRE } from './annuaire-data';
import type { KeyLink } from './types';

const commencePar = (chemin: string[], prefixe: string[]) => prefixe.every((nom, i) => chemin[i] === nom);

/** Sous-rubriques d'une branche, avec le nombre de ressources qu'elles contiennent (elles-mêmes et leurs descendantes). */
export function sousRubriques(chemin: string[]): { nom: string; n: number }[] {
  const compte = new Map<string, number>();
  for (const lien of ANNUAIRE) {
    if (lien.path.length > chemin.length && commencePar(lien.path, chemin)) {
      const nom = lien.path[chemin.length];
      compte.set(nom, (compte.get(nom) ?? 0) + 1);
    }
  }
  return Array.from(compte.entries())
    .map(([nom, n]) => ({ nom, n }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Ressources rangées exactement à ce niveau. */
export function liensIci(chemin: string[]): KeyLink[] {
  return ANNUAIRE.filter((l) => l.path.length === chemin.length && commencePar(l.path, chemin));
}

/** Nombre de ressources dans une branche entière. */
export function nombreDans(chemin: string[]): number {
  return ANNUAIRE.reduce((n, l) => n + (commencePar(l.path, chemin) ? 1 : 0), 0);
}

/** Recherche dans les titres, les descriptions, les auteurs et les rubriques. */
export function chercherLiens(requete: string): KeyLink[] {
  const mots = normalize(requete).split(' ').filter(Boolean);
  if (mots.length === 0) return [];
  return ANNUAIRE.filter((l) => {
    const texte = normalize(`${l.path.join(' ')} ${l.title} ${l.scope} ${l.author}`);
    return mots.every((m) => texte.includes(m));
  });
}

export const TOTAL_LIENS = ANNUAIRE.length;
