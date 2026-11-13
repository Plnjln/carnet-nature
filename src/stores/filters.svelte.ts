// Filtres partagés entre la galerie et la carte : un filtre posé d'un côté s'applique de l'autre.

import type { GroupId } from '../domain/groups';
import type { ObsLite } from '../domain/types';
import { normalize } from '../taxonomy/normalize';
import { obsStore } from './obs.svelte';

let recherche = $state('');
let groupe = $state<GroupId | ''>('');
// Filtre sur un taxon précis (posé depuis la fiche espèce) : clé « source:identifiant » et nom affiché.
let taxonKey = $state('');
let taxonLabel = $state('');

// Ne garder que les observations à reprendre : « à confirmer », ou nom saisi librement.
let aRevoir = $state(false);

/** Vrai si l'observation mérite d'être reprise au calme. */
export const estARevoir = (o: ObsLite): boolean => o.certainty === 'a-confirmer' || !o.taxonKey;

const filtrees = $derived.by<ObsLite[]>(() => {
  const mots = normalize(recherche).split(' ').filter(Boolean);
  if (!groupe && !taxonKey && !aRevoir && mots.length === 0) return obsStore.rows;
  return obsStore.rows.filter((o) => {
    if (aRevoir && !estARevoir(o)) return false;
    if (taxonKey && o.taxonKey !== taxonKey) return false;
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
  /** Taxon retenu (clé), ou chaîne vide. */
  get taxonKey() {
    return taxonKey;
  },
  /** Nom du taxon retenu, pour l'affichage. */
  get taxonLabel() {
    return taxonLabel;
  },
  /** Ne garder que les observations à revoir. */
  get aRevoir() {
    return aRevoir;
  },
  set aRevoir(v: boolean) {
    aRevoir = v;
  },
  /** Ne garde que les observations d'un taxon (les autres filtres sont remis à zéro). */
  seulementTaxon(key: string, label: string) {
    recherche = '';
    groupe = '';
    aRevoir = false;
    taxonKey = key;
    taxonLabel = label;
  },
  retirerTaxon() {
    taxonKey = '';
    taxonLabel = '';
  },
  /** Vrai si au moins un filtre est actif. */
  get actifs() {
    return groupe !== '' || taxonKey !== '' || aRevoir || recherche.trim() !== '';
  },
  /** Observations qui passent les filtres. */
  get rows() {
    return filtrees;
  },
  effacer() {
    recherche = '';
    groupe = '';
    aRevoir = false;
    taxonKey = '';
    taxonLabel = '';
  },
};
