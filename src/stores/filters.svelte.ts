// Filtres partagés entre la galerie et la carte : un filtre posé d'un côté s'applique de l'autre.

import type { GroupId } from '../domain/groups';
import type { ObsLite } from '../domain/types';
import { normalize } from '../taxonomy/normalize';
import { obsStore } from './obs.svelte';

let recherche = $state('');
let groupe = $state<GroupId | ''>('');

const filtrees = $derived.by<ObsLite[]>(() => {
  const mots = normalize(recherche).split(' ').filter(Boolean);
  if (!groupe && mots.length === 0) return obsStore.rows;
  return obsStore.rows.filter((o) => {
    if (groupe && o.group !== groupe) return false;
    if (mots.length === 0) return true;
    const texte = normalize(`${o.vern} ${o.sci} ${o.family} ${o.order} ${o.place}`);
    return mots.every((m) => texte.includes(m));
  });
});

export const filters = {
  /** Recherche plein texte (espèce, famille, ordre, lieu). */
  get recherche() {
    return recherche;
  },
  set recherche(v: string) {
    recherche = v;
  },
  /** Groupe taxonomique retenu, ou chaîne vide pour tous. */
  get groupe() {
    return groupe;
  },
  set groupe(v: GroupId | '') {
    groupe = v;
  },
  /** Vrai si au moins un filtre est actif. */
  get actifs() {
    return groupe !== '' || recherche.trim() !== '';
  },
  /** Observations qui passent les filtres. */
  get rows() {
    return filtrees;
  },
  effacer() {
    recherche = '';
    groupe = '';
  },
};
