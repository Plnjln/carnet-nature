// Liste allégée de toutes les observations, gardée en mémoire et partagée entre les écrans
// (galerie aujourd'hui, carte demain). Les écrans filtrent cette liste sans relire la base.

import { loadProjection, toLite } from '../db/projection';
import type { ObsLite, Observation } from '../domain/types';

// $state.raw : le tableau est remplacé d'un bloc à chaque changement (rapide avec 10 000 lignes).
let rows = $state.raw<ObsLite[]>([]);
let loaded = $state(false);
let loadMs = $state(0);

export const obsStore = {
  /** Observations actives, de la plus récente à la plus ancienne. */
  get rows() {
    return rows;
  },
  get loaded() {
    return loaded;
  },
  get loadMs() {
    return loadMs;
  },

  /** (Re)charge tout depuis la base. */
  async load() {
    const r = await loadProjection();
    rows = r.rows;
    loadMs = r.ms;
    loaded = true;
  },

  /** Ajoute ou remplace une observation, en gardant le tri par date. */
  upsert(o: Observation) {
    const lite = toLite(o);
    const suivant = rows.filter((r) => r.id !== o.id);
    let i = suivant.findIndex((r) => r.t <= lite.t);
    if (i < 0) i = suivant.length;
    suivant.splice(i, 0, lite);
    rows = suivant;
  },

  remove(id: string) {
    rows = rows.filter((r) => r.id !== id);
  },
};
