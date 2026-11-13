// Sorties de terrain et traces GPS.

import { db } from './db';
import type { FieldSession, Track } from '../domain/types';

export interface NewSession {
  name: string;
  placeName?: string;
  participants?: string[];
  lat?: number;
  lon?: number;
}

export async function createSession(n: NewSession): Promise<FieldSession> {
  const maintenant = new Date().toISOString();
  const session: FieldSession = {
    id: crypto.randomUUID(),
    createdAt: maintenant,
    updatedAt: maintenant,
    deleted: 0,
    name: n.name.trim() || undefined,
    startAt: maintenant,
    placeName: n.placeName?.trim() || undefined,
    participants: n.participants?.length ? n.participants : undefined,
    lat: n.lat,
    lon: n.lon,
  };
  await db.sessions.add(session);
  return session;
}

/** Clôt une sortie (heure de fin = maintenant). */
export async function endSession(id: string): Promise<FieldSession | undefined> {
  const maintenant = new Date().toISOString();
  await db.sessions.update(id, { endAt: maintenant, updatedAt: maintenant });
  return db.sessions.get(id);
}

/** Sorties, de la plus récente à la plus ancienne. */
export async function listSessions(): Promise<FieldSession[]> {
  const toutes = await db.sessions.toArray();
  return toutes.filter((s) => !s.deleted).sort((a, b) => b.startAt.localeCompare(a.startAt));
}

/** Enregistre la trace complète d'une sortie (points [longitude, latitude, horodatage en ms]). */
export async function saveTrack(sessionId: string, points: [number, number, number][]): Promise<void> {
  await db.tracks.put({ sessionId, points, updatedAt: new Date().toISOString() });
}

export function getTrack(sessionId: string): Promise<Track | undefined> {
  return db.tracks.get(sessionId);
}

export function allTracks(): Promise<Track[]> {
  return db.tracks.toArray();
}
