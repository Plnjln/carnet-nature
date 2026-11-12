<script lang="ts">
  // Coquille de l'application : en-tête, écran courant, barre de navigation, saisie et fiche en plein écran.
  import { onMount } from 'svelte';
  import { requestPersistence } from './db/db';
  import { queueEnrichment, runEnrichQueue } from './enrich/enrich';
  import CaptureSheet from './features/capture/CaptureSheet.svelte';
  import { lastBackupAt } from './features/data/backup';
  import DataScreen from './features/data/DataScreen.svelte';
  import GalleryScreen from './features/gallery/GalleryScreen.svelte';
  import ObsDetail from './features/gallery/ObsDetail.svelte';
  import KeyRunner from './features/keys/KeyRunner.svelte';
  import KeysScreen from './features/keys/KeysScreen.svelte';
  import type { IdKey } from './keys/types';
  import type { SpeciesSummary } from './features/species/species';
  import SpeciesDetail from './features/species/SpeciesDetail.svelte';
  import SpeciesScreen from './features/species/SpeciesScreen.svelte';
  import { filters } from './stores/filters.svelte';
  import { obsStore } from './stores/obs.svelte';
  import BottomNav from './ui/BottomNav.svelte';
  import Placeholder from './ui/Placeholder.svelte';
  import type { Screen } from './ui/screens';
  import type { Observation } from './domain/types';

  type Theme = 'auto' | 'clair' | 'sombre';
  const THEMES: Theme[] = ['auto', 'clair', 'sombre'];
  const ICONES_THEME: Record<Theme, string> = { auto: '🌗', clair: '☀️', sombre: '🌙' };

  let screen = $state<Screen>('galerie');
  let saisieOuverte = $state(false);
  let ficheId = $state<string | null>(null);
  // Augmente à chaque changement de l'observation affichée, pour recharger la fiche.
  let ficheVersion = $state(0);
  let aModifier = $state.raw<Observation | null>(null);
  let positionSaisie = $state.raw<{ lat: number; lon: number } | undefined>(undefined);
  let espece = $state.raw<SpeciesSummary | null>(null);
  let cleOuverte = $state.raw<IdKey | null>(null);
  let cheminAnnuaire = $state.raw<string[]>([]);

  /** Depuis la fiche espèce : n'afficher que ce taxon, sur la carte ou dans la galerie. */
  function montrerEspece(ecran: Screen) {
    if (!espece) return;
    filters.seulementTaxon(espece.key, espece.vern || espece.sci);
    espece = null;
    screen = ecran;
    window.scrollTo({ top: 0 });
  }
  let theme = $state<Theme>('auto');
  let annonce = $state('');
  let minuterie: ReturnType<typeof setTimeout> | undefined;

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

  /** Message bref en bas d'écran. */
  function annoncer(texte: string, dureeMs = 3500) {
    annonce = texte;
    clearTimeout(minuterie);
    minuterie = setTimeout(() => (annonce = ''), dureeMs);
  }

  /** Rappel au démarrage : tout est en local, une sauvegarde toutes les deux semaines au moins. */
  async function rappelerSauvegarde() {
    if (obsStore.rows.length === 0) return;
    const DEUX_SEMAINES = 14 * 24 * 3600 * 1000;
    const derniere = await lastBackupAt();
    if (!derniere) annoncer('Aucune sauvegarde pour l\'instant : bouton 💾 en haut → Sauvegarder tout.', 8000);
    else if (Date.now() - derniere.getTime() > DEUX_SEMAINES) annoncer('Dernière sauvegarde il y a plus de deux semaines : bouton 💾 en haut → Sauvegarder tout.', 8000);
  }

  /** Complète en arrière-plan le lieu, l'altitude et la météo des observations en attente. */
  function enrichir() {
    void runEnrichQueue((o) => {
      obsStore.upsert(o);
      // La fiche ouverte est rechargée pour montrer les champs complétés.
      if (ficheId === o.id && !aModifier) ficheVersion++;
    });
  }

  /** Appui long sur la carte : nouvelle observation à cet endroit. */
  function creerIci(lat: number, lon: number) {
    positionSaisie = { lat, lon };
    saisieOuverte = true;
  }

  function fermerSaisie() {
    saisieOuverte = false;
    positionSaisie = undefined;
  }

  function observationEnregistree(o: Observation) {
    obsStore.upsert(o);
    // Saisie lancée depuis la carte : on y reste ; sinon retour à la galerie.
    if (!positionSaisie) {
      screen = 'galerie';
      window.scrollTo({ top: 0 });
    }
    fermerSaisie();
    annoncer(o.lat === undefined ? 'Observation enregistrée, sans position GPS' : 'Observation enregistrée');
    void queueEnrichment(o).then(enrichir);
  }

  function observationModifiee(o: Observation) {
    obsStore.upsert(o);
    aModifier = null;
    ficheVersion++;
    annoncer('Observation modifiée');
    void queueEnrichment(o).then(enrichir);
  }

  function observationSupprimee(id: string) {
    obsStore.remove(id);
    ficheId = null;
    annoncer('Observation supprimée');
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
    // Chargement des observations et demande de stockage persistant, sans bloquer l'affichage.
    void obsStore.load().then(rappelerSauvegarde);
    void requestPersistence();
    // Reprise des enrichissements restés en attente (saisies faites hors ligne).
    enrichir();
    window.addEventListener('online', enrichir);
    return () => window.removeEventListener('online', enrichir);
  });
</script>

<header class="entete">
  <span class="titre">Carnet Nature</span>
  <span class="boutons">
    <button class="theme" class:actif={screen === 'donnees'} onclick={() => (screen = 'donnees')} aria-label="Données, sauvegarde et réglages">💾</button>
    <button class="theme" onclick={changerTheme} aria-label="Thème : {theme}. Changer de thème">
      {ICONES_THEME[theme]}
    </button>
  </span>
</header>

<main>
  {#if screen === 'galerie'}
    <GalleryScreen onOpen={(id) => (ficheId = id)} />
  {:else if screen === 'carte'}
    <!-- La carte est chargée à la demande, pour ne pas ralentir le démarrage. -->
    {#await import('./features/map/MapScreen.svelte')}
      <p class="page doux">Chargement de la carte…</p>
    {:then module}
      {@const MapScreen = module.default}
      <MapScreen onOpen={(id) => (ficheId = id)} onCreateAt={creerIci} />
    {:catch}
      <Placeholder icon="🗺️" title="Carte indisponible" text="La carte n'a pas pu être chargée. Vérifie la connexion puis réessaie." />
    {/await}
  {:else if screen === 'especes'}
    <SpeciesScreen onOpenSpecies={(e) => (espece = e)} />
  {:else if screen === 'cles'}
    <KeysScreen chemin={cheminAnnuaire} onNavigate={(c) => (cheminAnnuaire = c)} onOpenKey={(c) => (cleOuverte = c)} />
  {:else}
    <DataScreen />
  {/if}
</main>

<BottomNav current={screen} onNavigate={(s) => (screen = s)} onAdd={() => (saisieOuverte = true)} />

{#if saisieOuverte}
  <CaptureSheet position={positionSaisie} onClose={fermerSaisie} onSaved={observationEnregistree} />
{/if}

{#if cleOuverte}
  {#key cleOuverte.id}
    <KeyRunner
      cle={cleOuverte}
      onClose={() => (cleOuverte = null)}
      onOpenKey={(c) => (cleOuverte = c)}
      onOpenDirectory={(chemin) => {
        cheminAnnuaire = chemin;
        cleOuverte = null;
        screen = 'cles';
      }}
    />
  {/key}
{/if}

{#if espece}
  <SpeciesDetail
    {espece}
    onClose={() => (espece = null)}
    onOpenObs={(id) => (ficheId = id)}
    onShowMap={() => montrerEspece('carte')}
    onShowGallery={() => montrerEspece('galerie')}
  />
{/if}

{#if ficheId}
  {#key `${ficheId}:${ficheVersion}`}
    <ObsDetail id={ficheId} onClose={() => (ficheId = null)} onDeleted={observationSupprimee} onEdit={(o) => (aModifier = o)} />
  {/key}
{/if}

{#if aModifier}
  <CaptureSheet obs={aModifier} onClose={() => (aModifier = null)} onSaved={observationModifiee} />
{/if}

{#if annonce}
  <div class="annonce" role="status">{annonce}</div>
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
  .boutons {
    display: flex;
    gap: 2px;
  }
  .theme.actif {
    background: rgba(255, 255, 255, 0.25);
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
  .annonce {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(112px + env(safe-area-inset-bottom));
    z-index: 40;
    margin: 0 auto;
    max-width: 480px;
    padding: 14px 18px;
    border-radius: 14px;
    background: var(--texte);
    color: var(--fond);
    font-weight: 700;
    text-align: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }
</style>
