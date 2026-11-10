<script lang="ts">
  // Galerie : grille virtualisée (seules les cartes visibles à l'écran sont créées),
  // ce qui la garde fluide avec 10 000 observations.
  import { GROUPS, type GroupId } from '../../domain/groups';
  import { obsStore } from '../../stores/obs.svelte';
  import { normalize } from '../../taxonomy/normalize';
  import GalleryCard from './GalleryCard.svelte';

  let { onOpen }: { onOpen: (id: string) => void } = $props();

  const HAUTEUR_LIGNE = 232; // carte de 220 px + 12 px d'espacement

  let recherche = $state('');
  let groupe = $state<GroupId | ''>('');

  // Groupes réellement présents, pour les puces de filtre.
  const groupesPresents = $derived.by(() => {
    const vus = new Set<GroupId>();
    for (const o of obsStore.rows) vus.add(o.group);
    return (Object.keys(GROUPS) as GroupId[]).filter((g) => vus.has(g));
  });

  const filtrees = $derived.by(() => {
    const mots = normalize(recherche).split(' ').filter(Boolean);
    if (!groupe && mots.length === 0) return obsStore.rows;
    return obsStore.rows.filter((o) => {
      if (groupe && o.group !== groupe) return false;
      if (mots.length === 0) return true;
      const texte = normalize(`${o.vern} ${o.sci} ${o.family} ${o.order} ${o.place}`);
      return mots.every((m) => texte.includes(m));
    });
  });

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
  <input class="champ" type="search" placeholder="Rechercher (espèce, famille, lieu)" autocomplete="off" bind:value={recherche} />

  {#if groupesPresents.length > 1}
    <div class="puces">
      <button class="puce" class:active={groupe === ''} onclick={() => (groupe = '')}>Tout</button>
      {#each groupesPresents as g (g)}
        <button class="puce" class:active={groupe === g} onclick={() => (groupe = groupe === g ? '' : g)}>
          <span aria-hidden="true">{GROUPS[g].icon}</span>
          {GROUPS[g].label}
        </button>
      {/each}
    </div>
  {/if}

  {#if !obsStore.loaded}
    <p class="doux">Chargement…</p>
  {:else if obsStore.rows.length === 0}
    <div class="vide">
      <div class="icone" aria-hidden="true">🌿</div>
      <p><strong>Aucune observation pour l'instant.</strong></p>
      <p class="doux">Appuie sur le bouton « + » pour saisir la première.</p>
    </div>
  {:else}
    <p class="doux">
      {filtrees.length.toLocaleString('fr-FR')} observation{filtrees.length > 1 ? 's' : ''}
      {#if filtrees.length !== obsStore.rows.length}sur {obsStore.rows.length.toLocaleString('fr-FR')}{/if}
    </p>
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
  .champ {
    width: 100%;
    min-height: 52px;
    padding: 0 16px;
    font-size: 1.05rem;
    border: 2px solid var(--bord);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
  }
  .champ:focus {
    outline: 3px solid var(--accent);
    border-color: var(--accent);
  }
  .puces {
    display: flex;
    gap: 8px;
    margin: 10px -16px;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .puce {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--bord);
    border-radius: 22px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
  }
  .puce.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
  }
  .doux {
    margin: 10px 0;
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
    text-align: center;
    padding: 48px 16px;
  }
  .icone {
    font-size: 4rem;
  }
</style>
