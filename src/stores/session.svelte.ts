// Sortie en cours : pendant une sortie, les observations s'y rattachent, la position est suivie
// en continu (pour le pointage) et, si demandé, la trace GPS est enregistrée.
//
// Limite à connaître : une app web ne suit la position que lorsqu'elle est ouverte à l'écran.
// Téléphone verrouillé ou app en arrière-plan, la trace s'interrompt, puis reprend à la réouverture.

import { db } from '../db/db';
import { createSession, endSession, getTrack, saveTrack, type NewSession } from '../db/sessions';
import type { FieldSession } from '../domain/types';
import { distanceM } from '../geo/geometry';
import { watchPosition, type Fix } from '../geo/position';

const CLE = 'activeSession';
const PRECISION_MAX_M = 50; // on ignore les relevés trop imprécis
const PAS_M = 10; // un point de trace tous les 10 m au moins
const ENREGISTRER_TOUS_LES = 15; // points

let active = $state.raw<FieldSession | null>(null);
let fix = $state.raw<Fix | null>(null);
let tracer = $state(false);
let nbPoints = $state(0);

let points: [number, number, number][] = [];
let nonEnregistres = 0;
let arreterGps = () => {};
let verrou: { release: () => Promise<void> } | null = null;

/** Empêche l'écran de s'éteindre pendant l'enregistrement de la trace (si le navigateur le permet). */
async function garderEcranAllume() {
  try {
    const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (wakeLock && !verrou) verrou = await wakeLock.request('screen');
  } catch {
    // Refusé (batterie faible, onglet masqué…) : la trace continue tant que l'écran reste allumé.
  }
}

async function relacherEcran() {
  try {
    await verrou?.release();
  } catch {
    // Déjà relâché.
  }
  verrou = null;
}

// Le système relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && active && tracer) {
      verrou = null;
      void garderEcranAllume();
    }
  });
}

async function enregistrerTrace() {
  if (!active || !tracer || nonEnregistres === 0) return;
  nonEnregistres = 0;
  await saveTrack(active.id, points);
}

function suivre() {
  arreterGps();
  arreterGps = watchPosition(
    (f) => {
      fix = f;
      if (!tracer || f.accuracyM > PRECISION_MAX_M) return;
      const dernier = points[points.length - 1];
      if (dernier && distanceM([dernier[0], dernier[1]], [f.lon, f.lat]) < PAS_M) return;
      points.push([f.lon, f.lat, f.at]);
      nbPoints = points.length;
      nonEnregistres++;
      if (nonEnregistres >= ENREGISTRER_TOUS_LES) void enregistrerTrace();
    },
    () => {
      // Position indisponible : on garde le dernier relevé connu.
    },
  );
  if (tracer) void garderEcranAllume();
}

export const sessionStore = {
  /** Sortie en cours, ou null. */
  get active() {
    return active;
  },
  /** Dernière position connue pendant la sortie. */
  get fix() {
    return fix;
  },
  /** Vrai si la trace GPS est enregistrée. */
  get tracer() {
    return tracer;
  },
  get nbPoints() {
    return nbPoints;
  },

  /** Au démarrage de l'app : reprend la sortie qui était en cours. */
  async restore() {
    try {
      const memo = (await db.settings.get(CLE))?.value as { id: string; tracer: boolean } | undefined;
      if (!memo?.id) return;
      const session = await db.sessions.get(memo.id);
      if (!session || session.endAt || session.deleted) {
        await db.settings.delete(CLE);
        return;
      }
      active = session;
      tracer = memo.tracer;
      points = (await getTrack(session.id))?.points ?? [];
      nbPoints = points.length;
      suivre();
    } catch {
      // Base indisponible : pas de reprise.
    }
  },

  async start(n: NewSession, avecTrace: boolean): Promise<FieldSession> {
    if (active) await this.stop();
    const session = await createSession(n);
    await db.settings.put({ key: CLE, value: { id: session.id, tracer: avecTrace } });
    active = session;
    tracer = avecTrace;
    points = [];
    nbPoints = 0;
    nonEnregistres = 0;
    suivre();
    return session;
  },

  /** Termine la sortie en cours et renvoie sa version finale. */
  async stop(): Promise<FieldSession | undefined> {
    if (!active) return undefined;
    const id = active.id;
    arreterGps();
    arreterGps = () => {};
    await enregistrerTrace();
    await relacherEcran();
    const terminee = await endSession(id);
    await db.settings.delete(CLE);
    active = null;
    tracer = false;
    points = [];
    nbPoints = 0;
    return terminee;
  },
};
