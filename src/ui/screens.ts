// Écrans principaux de l'application.

import type { IconName } from './Icon.svelte';

export type Screen = 'galerie' | 'carte' | 'especes' | 'cles' | 'donnees';

/** Écrans de la barre du bas (l'écran « Données » s'ouvre depuis l'en-tête). */
export const SCREENS: { id: Screen; label: string; icon: IconName }[] = [
  { id: 'galerie', label: 'Galerie', icon: 'galerie' },
  { id: 'carte', label: 'Carte', icon: 'carte' },
  { id: 'especes', label: 'Espèces', icon: 'especes' },
  { id: 'cles', label: 'Clés', icon: 'cles' },
];
