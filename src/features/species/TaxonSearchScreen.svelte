<script lang="ts">
  // Écran de test de la recherche floue de taxons (index TAXREF embarqué, hors ligne).
  import { onMount } from 'svelte';
  import { GROUPS } from '../../domain/groups';
  import { initTaxonIndex, searchTaxa, type IndexInfo } from '../../taxonomy/client';
  import type { SearchHit } from '../../taxonomy/search-core';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import RefPhoto from '../../ui/RefPhoto.svelte';

  /** Ouvrir la fiche d'un résultat (description, photo de référence, statuts, espèces voisines). */
  let { onOpenSpecies }: { onOpenSpecies: (h: SearchHit) => void } = $props();

  const RANGS: Record<string, string> = {
    species: 'espèce',
    subspecies: 'sous-espèce',
    genus: 'genre',
    family: 'famille',
    subfamily: 'sous-famille',
    superfamily: 'super-famille',
    tribe: 'tribu',
    order: 'ordre',
    suborder: 'sous-ordre',
    infraorder: 'infra-ordre',
    class: 'classe',
    subclass: 'sous-classe',
  };

  /** Lignée complète du taxon : règne, embranchement, classe, ordre, famille, genre. */
  function lignee(h: SearchHit): string[] {
    const niveaux = ['Animalia', h.phylum, h.classe, h.order, h.family];
    // Pour une espèce ou une sous-espèce, le genre est le premier mot du nom scientifique.
    if (h.rank === 'species' || h.rank === 'subspecies') niveaux.push(h.sci.split(' ')[0]);
    // On retire les niveaux vides et le taxon lui-même (une famille n'affiche pas son propre nom).
    return niveaux.filter((n) => n && n !== h.sci);
  }

  let info = $state<IndexInfo | null>(null);
  let erreur = $state('');
  let query = $state('');
  let hits = $state<SearchHit[]>([]);
  let duree = $state<number | null>(null);
  let dernier = 0;

  onMount(async () => {
    try {
      info = await initTaxonIndex();
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
  });

  async function chercher() {
    const moi = ++dernier;
    if (!info || query.trim().length < 2) {
      hits = [];
      duree = null;
      return;
    }
    try {
      const r = await searchTaxa(query, 15);
      // On ignore les réponses arrivées après une frappe plus récente.
      if (moi === dernier) {
        hits = r.hits;
        duree = r.ms;
      }
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<section class="page">
  <h1>Recherche de taxon</h1>

  {#if erreur}
    <p class="alerte">Index indisponible : {erreur}</p>
  {:else if !info}
    <p class="doux">Chargement de l'index TAXREF…</p>
  {:else}
    <p class="doux">
      {info.taxa.toLocaleString('fr-FR')} taxons, {info.names.toLocaleString('fr-FR')} noms · index chargé en {info.ms} ms
    </p>
  {/if}

  <input
    class="champ"
    type="search"
    placeholder="Nom français ou scientifique, même approximatif"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    bind:value={query}
    oninput={chercher}
    disabled={!info}
  />

  {#if duree !== null}
    <p class="doux">{hits.length} résultat{hits.length > 1 ? 's' : ''} en {duree} ms</p>
  {/if}

  <ul class="liste">
    {#each hits as h (h.cdNom)}
      <li>
        <button class="carte" style="--couleur: {GROUPS[h.group].color}" onclick={() => onOpenSpecies(h)}>
          <!-- Photo de référence (chargée quand la ligne est visible), sinon icône du groupe. -->
          <span class="vignette"><RefPhoto sci={h.sci}><GroupIcon group={h.group} size="1.6rem" /></RefPhoto></span>
          <span class="texte">
            <strong>{h.vern || h.sci}</strong>
            <em>{h.sci}</em>
            <small class="rang">
              {RANGS[h.rank] ?? h.rank}{#if h.matchedKind === 'synonyme'} · synonyme : {h.matched}{/if}
            </small>
            <small class="lignee">{lignee(h).join(' › ')}</small>
          </span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .champ {
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    font-size: 1.15rem;
    border: 2px solid var(--bord);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
  }
  .champ:focus {
    outline: 3px solid var(--accent);
    border-color: var(--accent);
  }
  .liste {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: grid;
    gap: 8px;
  }
  .carte {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    border-radius: 14px;
    background: var(--surface);
    border-left: 4px solid var(--couleur);
    box-shadow: var(--ombre);
    color: var(--texte);
    text-align: left;
  }
  .carte:active {
    transform: scale(0.99);
  }
  .vignette {
    flex: none;
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    overflow: hidden;
    background: color-mix(in srgb, var(--couleur) 15%, var(--surface));
    color: var(--couleur);
  }
  .texte {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .texte strong {
    font-family: var(--titre);
    font-weight: 600;
    font-size: 1.05rem;
  }
  .chevron {
    flex: none;
    color: var(--texte-doux);
    font-size: 1.5rem;
    line-height: 1;
  }
  .texte small {
    color: var(--texte-doux);
  }
  .rang {
    font-weight: 600;
  }
  .lignee {
    overflow-wrap: anywhere;
  }
</style>
