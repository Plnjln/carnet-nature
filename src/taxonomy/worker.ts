// Web Worker : charge l'index TAXREF et répond aux recherches sans bloquer l'interface.

import { parseIndex, TaxonSearcher } from './search-core';

interface Requete {
  id: number;
  type: 'init' | 'search' | 'sample';
  baseUrl?: string;
  query?: string;
  limit?: number;
  n?: number;
}

interface Meta {
  source: string;
  citation: string;
  licence: string;
  genereLe: string;
  version: string;
  fichiers: { classif: string; taxa: string; syn: string };
}

const ctx = self as unknown as {
  onmessage: ((ev: MessageEvent<Requete>) => void) | null;
  postMessage: (message: unknown) => void;
};

let searcher: TaxonSearcher | null = null;
let chargement: Promise<unknown> | null = null;

async function texte(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  return r.text();
}

async function charger(baseUrl: string) {
  const debut = performance.now();
  const r = await fetch(baseUrl + 'meta.json');
  if (!r.ok) throw new Error(`Index TAXREF absent (HTTP ${r.status})`);
  const meta = (await r.json()) as Meta;
  const [classif, taxa, syn] = await Promise.all([
    texte(baseUrl + meta.fichiers.classif),
    texte(baseUrl + meta.fichiers.taxa),
    texte(baseUrl + meta.fichiers.syn),
  ]);
  searcher = new TaxonSearcher(parseIndex(classif, taxa, syn));
  return {
    source: meta.source,
    citation: meta.citation,
    licence: meta.licence,
    genereLe: meta.genereLe,
    ...searcher.size,
    ms: Math.round(performance.now() - debut),
  };
}

ctx.onmessage = async (ev) => {
  const m = ev.data;
  try {
    let result: unknown;
    if (m.type === 'init') {
      // Un seul chargement, même si plusieurs écrans le demandent.
      chargement ??= charger(m.baseUrl ?? '');
      try {
        result = await chargement;
      } catch (e) {
        chargement = null; // permet de réessayer plus tard (ex. retour du réseau)
        throw e;
      }
    } else if (!searcher) {
      throw new Error('Index non chargé');
    } else if (m.type === 'search') {
      const debut = performance.now();
      const hits = searcher.search(m.query ?? '', m.limit ?? 12);
      result = { hits, ms: Math.round((performance.now() - debut) * 10) / 10 };
    } else {
      result = searcher.sample(m.n ?? 100);
    }
    ctx.postMessage({ id: m.id, ok: true, result });
  } catch (e) {
    ctx.postMessage({ id: m.id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
