// Côté interface : dialogue avec le Web Worker de recherche de taxons.

import type { SearchHit } from './search-core';

export interface IndexInfo {
  source: string;
  citation: string;
  licence: string;
  genereLe: string;
  taxa: number;
  names: number;
  words: number;
  /** Temps de chargement de l'index, en ms. */
  ms: number;
}

let worker: Worker | null = null;
let seq = 0;
const enAttente = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>) => {
      const attente = enAttente.get(ev.data.id);
      if (!attente) return;
      enAttente.delete(ev.data.id);
      if (ev.data.ok) attente.resolve(ev.data.result);
      else attente.reject(new Error(ev.data.error ?? 'Erreur inconnue'));
    };
  }
  return worker;
}

function appeler<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = ++seq;
    enAttente.set(id, { resolve: resolve as (v: unknown) => void, reject });
    getWorker().postMessage({ id, ...message });
  });
}

/** Charge l'index (une seule fois) et renvoie ses caractéristiques. */
export function initTaxonIndex(): Promise<IndexInfo> {
  const baseUrl = new URL(import.meta.env.BASE_URL + 'taxref/', location.origin).href;
  return appeler<IndexInfo>({ type: 'init', baseUrl });
}

export function searchTaxa(query: string, limit = 12): Promise<{ hits: SearchHit[]; ms: number }> {
  return appeler({ type: 'search', query, limit });
}

export function sampleTaxa(n: number): Promise<SearchHit[]> {
  return appeler({ type: 'sample', n });
}
