<script lang="ts">
  // Galerie : grille virtualisée (seules les cartes visibles à l'écran sont créées),
  // ce qui la garde fluide avec 10 000 observations.
  import { GROUPS, type GroupId } from '../../domain/groups';
  import { estARevoir, filters } from '../../stores/filters.svelte';
  import { obsStore } from '../../stores/obs.svelte';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import Icon from '../../ui/Icon.svelte';
  import GalleryCard from './GalleryCard.svelte';

  let { onOpen }: { onOpen: (id: string) => void } = $props();

  const HAUTEUR_LIGNE = 232; // carte de 220 px + 12 px d'espacement

  // Groupes réellement présents, pour les puces de filtre.
  const groupesPresents = $derived.by(() => {
    const vus = new Set<GroupId>();
    for (const o of obsStore.rows) vus.add(o.group);
    return (Object.keys(GROUPS) as GroupId[]).filter((g) => vus.has(g));
  });

  // Les filtres sont partagés avec la carte.
  const filtrees = $derived(filters.rows);
  const nbARevoir = $derived(obsStore.rows.reduce((n, o) => n + (estARevoir(o) ? 1 : 0), 0));

  // Virtualisation : on calcule quelles lignes sont dans la fenêtre.
  let zone: HTMLDivElement | undefined = $state();
  let largeur = $state(360);
  let scrollY = $state(0);
  let hauteurVue = $state(800);
  let haut = $state(0);

  $effect(() => {
    // Position de la grille dans la page (change si les filtres au-dessus changent de hauteur).
    void groupesPresents.length;
    void largeur;
    if (zone) haut = zone.getBoundingClientRect().top + window.scrollY;
  });

  const colonnes = $derived(Math.max(2, Math.floor(largeur / 170)));
  const nbLignes = $derived(Math.ceil(filtrees.length / colonnes));
  const premiere = $derived(Math.min(Math.max(0, nbLignes - 1), Math.max(0, Math.floor((scrollY - haut) / HAUTEUR_LIGNE) - 2)));
  const derniere = $derived(Math.min(nbLignes, Math.ceil((scrollY - haut + hauteurVue) / HAUTEUR_LIGNE) + 2));
  const visibles = $derived(filtrees.slice(premiere * colonnes, derniere * colonnes));
</script>

<svelte:window bind:scrollY bind:innerHeight={hauteurVue} />

<section class="page large">
  <div class="titre-page">
    <h1>Mes observations</h1>
    {#if obsStore.loaded && obsStore.rows.length}
      <span class="compte">
        {filtrees.length.toLocaleString('fr-FR')}{#if filtrees.length !== obsStore.rows.length}<span class="sur"> / {obsStore.rows.length.toLocaleString('fr-FR')}</span>{/if}
      </span>
    {/if}
  </div>

  <label class="recherche">
    <Icon name="chercher" size={20} />
    <input type="search" placeholder="Espèce, famille, lieu…" autocomplete="off" aria-label="Rechercher" bind:value={filters.recherche} />
  </label>

  {#if groupesPresents.length > 1}
    <div class="puces">
      <button class="puce" class:active={filters.groupe === ''} onclick={() => (filters.groupe = '')}>Tout</button>
      {#each groupesPresents as g (g)}
        <button class="puce" class:active={filters.groupe === g} onclick={() => (filters.groupe = filters.groupe === g ? '' : g)}>
          <GroupIcon group={g} size="1.2rem" />
          {GROUPS[g].label}
        </button>
      {/each}
    </div>
  {/if}

  {#if nbARevoir > 0 || filters.aRevoir}
    <button class="puce revoir" class:active={filters.aRevoir} onclick={() => (filters.aRevoir = !filters.aRevoir)}>
      À revoir <span class="nombre">{nbARevoir.toLocaleString('fr-FR')}</span>
    </button>
    {#if filters.aRevoir}
      <p class="doux">Observations « à confirmer » ou dont le nom a été saisi librement. Ouvre une fiche puis « Modifier » pour la reprendre.</p>
    {/if}
  {/if}

  {#if filters.sessionId}
    <p class="filtre-taxon">
      Sortie : <strong>{filters.sessionLabel}</strong>
      <button class="lien" onclick={() => filters.retirerSession()}>tout afficher</button>
    </p>
  {/if}

  {#if filters.taxonKey}
    <p class="filtre-taxon">
      Uniquement : <strong>{filters.taxonLabel}</strong>
      <button class="lien" onclick={() => filters.retirerTaxon()}>tout afficher</button>
    </p>
  {/if}

  {#if !obsStore.loaded}
    <p class="doux">Chargement…</p>
  {:else if obsStore.rows.length === 0}
    <div class="vide">
      <div class="icone"><Icon name="feuille" size={44} stroke={1.5} /></div>
      <p class="vide-titre">Le carnet est encore vierge</p>
      <p class="doux">Appuie sur « + » pour noter ta première observation.</p>
    </div>
  {:else if filtrees.length === 0}
    <p class="doux">Aucune observation ne correspond à ces filtres.</p>
  {/if}

  <div class="zone" bind:this={zone} bind:clientWidth={largeur} style="height: {nbLignes * HAUTEUR_LIGNE}px">
    <div class="grille" style="transform: translateY({premiere * HAUTEUR_LIGNE}px); grid-template-columns: repeat({colonnes}, minmax(0, 1fr))">
      {#each visibles as o (o.id)}
        <GalleryCard obs={o} {onOpen} />
      {/each}
    </div>
  </div>
</section>

<style>
  .large {
    max-width: 1200px;
  }
  .titre-page {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .titre-page h1 {
    margin: 0;
  }
  .compte {
    font-family: var(--titre);
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .sur {
    color: var(--texte-doux);
    font-size: 0.95rem;
  }
  .recherche {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 16px;
    border: 1px solid var(--bord);
    border-radius: 16px;
    background: var(--surface);
    color: var(--texte-doux);
    box-shadow: var(--ombre);
  }
  .recherche:focus-within {
    outline: 3px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-color: var(--accent);
  }
  .recherche input {
    flex: 1;
    min-width: 0;
    height: 50px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--texte);
    font-size: 1.05rem;
  }
  .puces {
    display: flex;
    gap: 8px;
    margin: 12px -16px 4px;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .puce {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 42px;
    padding: 0 14px;
    border: 1px solid var(--bord);
    border-radius: 21px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
    font-size: 0.92rem;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .puce.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
  }
  .doux {
    margin: 12px 0;
  }
  .revoir {
    margin: 4px 0 8px;
    border-color: color-mix(in srgb, var(--alerte) 50%, transparent);
    color: var(--alerte);
  }
  .revoir.active {
    border-color: var(--alerte);
    background: var(--alerte);
    color: var(--surface);
  }
  .nombre {
    opacity: 0.8;
    font-variant-numeric: tabular-nums;
  }
  .filtre-taxon {
    margin: 10px 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--accent-doux);
  }
  .lien {
    margin-left: 8px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-weight: 700;
    text-decoration: underline;
  }
  .zone {
    position: relative;
  }
  .grille {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    display: grid;
    gap: 12px;
  }
  .vide {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 56px 16px;
  }
  .icone {
    display: grid;
    place-items: center;
    width: 88px;
    height: 88px;
    margin-bottom: 16px;
    border-radius: 28px;
    background: var(--accent-doux);
    color: var(--accent);
  }
  .vide-titre {
    font-family: var(--titre);
    font-size: 1.3rem;
    font-weight: 600;
  }
</style>
