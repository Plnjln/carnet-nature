// Écrans principaux de l'application.

export type Screen = 'galerie' | 'carte' | 'especes' | 'cles' | 'donnees';

/** Écrans de la barre du bas (l'écran « Données » s'ouvre depuis l'en-tête). */
export const SCREENS: { id: Screen; label: string; icon: string }[] = [
  { id: 'galerie', label: 'Galerie', icon: '🖼️' },
  { id: 'carte', label: 'Carte', icon: '🗺️' },
  { id: 'especes', label: 'Espèces', icon: '🔎' },
  { id: 'cles', label: 'Clés', icon: '🔑' },
];
