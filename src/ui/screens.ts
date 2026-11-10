// Écrans principaux de l'application (barre de navigation du bas).

export type Screen = 'galerie' | 'carte' | 'especes' | 'donnees';

export const SCREENS: { id: Screen; label: string; icon: string }[] = [
  { id: 'galerie', label: 'Galerie', icon: '🖼️' },
  { id: 'carte', label: 'Carte', icon: '🗺️' },
  { id: 'especes', label: 'Espèces', icon: '🔎' },
  { id: 'donnees', label: 'Données', icon: '💾' },
];
