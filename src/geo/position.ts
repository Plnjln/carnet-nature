// Position GPS du téléphone.

export interface Fix {
  lat: number;
  lon: number;
  /** Rayon d'incertitude en mètres. */
  accuracyM: number;
  altitudeM?: number;
  /** Horodatage du relevé (ms). */
  at: number;
}

/**
 * Suit la position en continu : `onFix` est appelé à chaque relevé (la précision s'améliore
 * en général après quelques secondes). Renvoie la fonction qui arrête le suivi.
 */
export function watchPosition(onFix: (fix: Fix) => void, onError: (message: string) => void): () => void {
  if (!('geolocation' in navigator)) {
    onError('GPS indisponible sur cet appareil');
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) =>
      onFix({
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        accuracyM: Math.round(p.coords.accuracy),
        altitudeM: p.coords.altitude === null ? undefined : Math.round(p.coords.altitude),
        at: p.timestamp,
      }),
    (e) =>
      onError(
        e.code === e.PERMISSION_DENIED
          ? 'Accès à la position refusé'
          : e.code === e.TIMEOUT
            ? 'Position trop longue à obtenir'
            : 'Position indisponible',
      ),
    { enableHighAccuracy: true, maximumAge: 15_000, timeout: 30_000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}
