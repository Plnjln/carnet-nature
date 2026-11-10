<script lang="ts">
  // Coquille de l'application : en-tête, écran courant, barre de navigation, feuille de saisie.
  import { onMount } from 'svelte';
  import { requestPersistence } from './db/db';
  import DataScreen from './features/data/DataScreen.svelte';
  import TaxonSearchScreen from './features/species/TaxonSearchScreen.svelte';
  import BottomNav from './ui/BottomNav.svelte';
  import Placeholder from './ui/Placeholder.svelte';
  import type { Screen } from './ui/screens';

  type Theme = 'auto' | 'clair' | 'sombre';
  const THEMES: Theme[] = ['auto', 'clair', 'sombre'];
  const ICONES_THEME: Record<Theme, string> = { auto: '🌗', clair: '☀️', sombre: '🌙' };

  let screen = $state<Screen>('galerie');
  let saisieOuverte = $state(false);
  let theme = $state<Theme>('auto');

  function appliquerTheme(t: Theme) {
    if (t === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }

  function changerTheme() {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    appliquerTheme(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Stockage indisponible : le thème ne sera pas mémorisé.
    }
  }

  onMount(() => {
    try {
      const memorise = localStorage.getItem('theme') as Theme | null;
      if (memorise && THEMES.includes(memorise)) {
        theme = memorise;
        appliquerTheme(theme);
      }
    } catch {
      // Stockage indisponible.
    }
    // Demande au navigateur de conserver les données (sans bloquer l'affichage).
    void requestPersistence();
  });
</script>

<header class="entete">
  <span class="titre">Carnet Nature</span>
  <button class="theme" onclick={changerTheme} aria-label="Thème : {theme}. Changer de thème">
    {ICONES_THEME[theme]}
  </button>
</header>

<main>
  {#if screen === 'galerie'}
    <Placeholder icon="🖼️" title="Galerie" text="Tes observations apparaîtront ici. La saisie arrive à l'étape suivante." />
  {:else if screen === 'carte'}
    <Placeholder icon="🗺️" title="Carte" text="La carte de toutes tes observations arrivera dans une prochaine étape." />
  {:else if screen === 'especes'}
    <TaxonSearchScreen />
  {:else}
    <DataScreen />
  {/if}
</main>

<BottomNav current={screen} onNavigate={(s) => (screen = s)} onAdd={() => (saisieOuverte = true)} />

{#if saisieOuverte}
  <div class="voile" role="presentation" onclick={() => (saisieOuverte = false)}></div>
  <div class="feuille" role="dialog" aria-modal="true" aria-label="Nouvelle observation">
    <h1>Nouvelle observation</h1>
    <p class="doux">La saisie rapide (taxon, GPS, heure) arrive à l'étape suivante.</p>
    <button class="bouton" onclick={() => (saisieOuverte = false)}>Fermer</button>
  </div>
{/if}

<style>
  .entete {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 8px 16px;
    padding-top: calc(8px + env(safe-area-inset-top));
    background: var(--accent);
    color: var(--sur-accent);
  }
  .titre {
    font-size: 1.2rem;
    font-weight: 800;
  }
  .theme {
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    font-size: 1.4rem;
  }
  main {
    /* Laisse la place de la barre du bas. */
    padding-bottom: calc(110px + env(safe-area-inset-bottom));
  }
  .voile {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.5);
  }
  .feuille {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 21;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    background: var(--surface);
  }
</style>
