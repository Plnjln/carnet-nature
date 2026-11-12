<script lang="ts">
  // Photo de référence d'un taxon (iNaturalist), pour illustrer une espèce que l'on n'a pas photographiée.
  // La recherche ne part que lorsque l'élément est visible à l'écran. Tant qu'aucune photo n'est
  // trouvée, c'est le contenu fourni par le parent (l'icône du groupe) qui est affiché.
  import type { Snippet } from 'svelte';
  import { getRefPhoto, type RefPhoto } from '../reference/reference';

  let {
    sci,
    grande = false,
    onFound,
    children,
  }: {
    sci: string;
    /** Image moyenne (500 px) au lieu de la petite. */
    grande?: boolean;
    /** Appelé quand une photo est trouvée (pour afficher son auteur ailleurs). */
    onFound?: (photo: RefPhoto) => void;
    children?: Snippet;
  } = $props();

  let cadre: HTMLSpanElement | undefined = $state();
  let photo = $state.raw<RefPhoto | null>(null);

  $effect(() => {
    const nom = sci;
    const el = cadre;
    photo = null;
    if (!el || !nom) return;
    let annule = false;
    const observateur = new IntersectionObserver((entrees) => {
      if (!entrees.some((e) => e.isIntersecting)) return;
      observateur.disconnect();
      getRefPhoto(nom).then((p) => {
        if (annule || !p) return;
        photo = p;
        onFound?.(p);
      });
    });
    observateur.observe(el);
    return () => {
      annule = true;
      observateur.disconnect();
    };
  });
</script>

<span class="cadre" bind:this={cadre}>
  {#if photo}
    <img src={grande ? photo.medium : photo.thumb} alt="" loading="lazy" decoding="async" title={photo.attribution} />
    <span class="marque">réf.</span>
  {:else}
    {@render children?.()}
  {/if}
</span>

<style>
  .cadre {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .marque {
    position: absolute;
    right: 2px;
    bottom: 2px;
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 1.4;
  }
</style>
