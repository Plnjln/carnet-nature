// Enrichissement automatique en arrière-plan : commune, lieu-dit, altitude et météo.
//
// Rien ici ne bloque la saisie : chaque observation enregistrée dépose des tâches dans une file
// d'attente, traitées quand il y a du réseau (tout de suite, au retour de la connexion, ou au
// prochain démarrage). Seuls les champs encore vides sont remplis : une valeur saisie à la main
// n'est jamais écrasée.
//
// Services utilisés (tous gratuits, sans clé) :
//   commune, département : geo.api.gouv.fr (découpage administratif officiel)
//   altitude             : Géoplateforme IGN
//   lieu-dit             : Nominatim / OpenStreetMap — une requête par seconde au maximum
//   météo                : Open-Meteo (prévisions pour les dates récentes, archives au-delà)

import { db } from '../db/db';
import type { EnrichTask, Observation, Weather } from '../domain/types';

type Kind = EnrichTask['kind'];
type Patch = Partial<Observation>;

const DELAI_REQUETE_MS = 12_000;
const MAX_TENTATIVES = 8;

async function json<T>(url: string): Promise<T> {
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), DELAI_REQUETE_MS);
  try {
    const r = await fetch(url, { signal: controle.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(minuterie);
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Les quatre recherches ----------

async function chercherCommune(o: Observation): Promise<Patch> {
  if (o.commune && o.departement) return {};
  type Reponse = { nom: string; code: string; departement?: { code: string; nom: string } }[];
  const r = await json<Reponse>(`https://geo.api.gouv.fr/communes?lat=${o.lat}&lon=${o.lon}&fields=nom,code,departement`);
  const c = r[0];
  if (!c) return {}; // en mer ou hors de France
  return {
    commune: o.commune ?? c.nom,
    communeInsee: c.code,
    departement: c.departement ? `${c.departement.nom} (${c.departement.code})` : undefined,
  };
}

async function chercherAltitude(o: Observation): Promise<Patch> {
  if (o.altitudeM !== undefined) return {};
  const r = await json<{ elevations?: number[] }>(
    `https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?lon=${o.lon}&lat=${o.lat}&resource=ign_rge_alti_wld&zonly=true`,
  );
  const z = r.elevations?.[0];
  // -99999 = pas de donnée à cet endroit.
  return typeof z === 'number' && z > -1000 ? { altitudeM: Math.round(z) } : {};
}

let dernierAppelNominatim = 0;

async function chercherLieuDit(o: Observation): Promise<Patch> {
  if (o.placeName) return {};
  // Respect de la limite d'usage : au plus une requête par seconde.
  const attente = dernierAppelNominatim + 1200 - Date.now();
  if (attente > 0) await pause(attente);
  dernierAppelNominatim = Date.now();
  type Reponse = { address?: Record<string, string> };
  const r = await json<Reponse>(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${o.lat}&lon=${o.lon}&zoom=16&accept-language=fr`,
  );
  const a = r.address ?? {};
  // Du plus précis au plus général ; on s'arrête avant la commune (fournie par ailleurs).
  const nom = a.locality ?? a.isolated_dwelling ?? a.hamlet ?? a.farm ?? a.neighbourhood ?? a.quarter ?? a.suburb ?? a.road;
  return nom ? { placeName: nom } : {};
}

async function chercherMeteo(o: Observation): Promise<Patch> {
  if (o.weather) return {};
  const date = new Date(o.startAt);
  const jour = date.toISOString().slice(0, 10);
  const ageJours = (Date.now() - date.getTime()) / 86_400_000;
  if (ageJours < -1) return {}; // date dans le futur
  // Au-delà de deux mois, les mesures sont dans les archives.
  const base = ageJours > 60 ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
  type Reponse = {
    hourly?: {
      time: string[];
      temperature_2m: (number | null)[];
      wind_speed_10m: (number | null)[];
      wind_direction_10m: (number | null)[];
      cloud_cover: (number | null)[];
      precipitation: (number | null)[];
      weather_code: (number | null)[];
    };
  };
  const r = await json<Reponse>(
    `${base}?latitude=${o.lat}&longitude=${o.lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,weather_code&start_date=${jour}&end_date=${jour}&timezone=UTC`,
  );
  const h = r.hourly;
  const i = date.getUTCHours();
  if (!h || typeof h.temperature_2m?.[i] !== 'number') return {}; // pas encore de mesure pour cette heure
  const valeur = (v: number | null | undefined) => (typeof v === 'number' ? v : undefined);
  const weather: Weather = {
    temperatureC: valeur(h.temperature_2m[i]),
    windKmh: valeur(h.wind_speed_10m?.[i]),
    windDirectionDeg: valeur(h.wind_direction_10m?.[i]),
    cloudCoverPct: valeur(h.cloud_cover?.[i]),
    precipitationMm: valeur(h.precipitation?.[i]),
    weatherCode: valeur(h.weather_code?.[i]),
    source: 'open-meteo',
  };
  return { weather };
}

const RECHERCHES: Record<Kind, ((o: Observation) => Promise<Patch>) | undefined> = {
  commune: chercherCommune,
  altitude: chercherAltitude,
  'lieu-dit': chercherLieuDit,
  meteo: chercherMeteo,
  taxon: undefined, // rapprochement des noms saisis librement : à venir
};

// ---------- La file d'attente ----------

/** Dépose les tâches utiles pour une observation (sans rien lancer). */
export async function queueEnrichment(o: Observation): Promise<void> {
  if (o.lat === undefined || o.lon === undefined || o.deleted) return;
  const kinds: Kind[] = [];
  if (!o.commune || !o.departement) kinds.push('commune');
  if (o.altitudeM === undefined) kinds.push('altitude');
  if (!o.placeName) kinds.push('lieu-dit');
  if (!o.weather) kinds.push('meteo');
  if (!kinds.length) return;
  await db.enrichQueue.bulkPut(kinds.map((kind) => ({ id: `${o.id}:${kind}`, kind, obsId: o.id, attempts: 0, nextTryAt: 0 })));
}

let enCours = false;

/**
 * Traite les tâches en attente. `onUpdated` est appelé pour chaque observation complétée,
 * afin de rafraîchir l'affichage. Sans réseau, ne fait rien.
 */
export async function runEnrichQueue(onUpdated: (o: Observation) => void): Promise<void> {
  if (enCours || !navigator.onLine) return;
  enCours = true;
  try {
    // On repasse tant qu'il reste des tâches à traiter (certaines peuvent arriver pendant le traitement).
    for (let passe = 0; passe < 50; passe++) {
      const taches = await db.enrichQueue.where('nextTryAt').belowOrEqual(Date.now()).toArray();
      if (taches.length === 0 || !navigator.onLine) break;
      await traiter(taches, onUpdated);
    }
  } finally {
    enCours = false;
  }
}

async function traiter(taches: EnrichTask[], onUpdated: (o: Observation) => void): Promise<void> {
  {
    for (const tache of taches) {
      if (!navigator.onLine) break;
      const recherche = RECHERCHES[tache.kind];
      const o = await db.observations.get(tache.obsId);
      if (!recherche || !o || o.deleted || o.lat === undefined || o.lon === undefined) {
        await db.enrichQueue.delete(tache.id);
        continue;
      }
      try {
        const patch = await recherche(o);
        if (Object.keys(patch).length) {
          await db.observations.update(o.id, { ...patch, updatedAt: new Date().toISOString() });
          const aJour = await db.observations.get(o.id);
          if (aJour) onUpdated(aJour);
        }
        await db.enrichQueue.delete(tache.id);
      } catch (e) {
        const attempts = tache.attempts + 1;
        if (attempts >= MAX_TENTATIVES) {
          await db.enrichQueue.delete(tache.id);
        } else {
          // Nouvel essai de plus en plus espacé : 1 min, 2 min, 4 min… jusqu'à 1 h.
          const delai = Math.min(3_600_000, 60_000 * 2 ** (attempts - 1));
          await db.enrichQueue.update(tache.id, { attempts, nextTryAt: Date.now() + delai, lastError: e instanceof Error ? e.message : String(e) });
        }
      }
    }
  }
}
