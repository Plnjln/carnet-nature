<script lang="ts">
  // Carte d'une observation dans la grille : miniature (ou fond coloré selon le groupe), noms, date, lieu.
  import { db } from '../../db/db';
  import { GROUPS } from '../../domain/groups';
  import type { ObsLite } from '../../domain/types';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let { obs, onOpen }: { obs: ObsLite; onOpen: (id: string) => void } = $props();

  const groupe = $derived(GROUPS[obs.group] ?? GROUPS.autres);
  const date = $derived(new Date(obs.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }));

  // La miniature n'est lue dans la base que lorsque la carte est affichée.
  let url = $state('');
  $effect(() => {
    const id = obs.photoId;
    url = '';
    if (!id) return;
    let annule = false;
    let cree = '';
    db.photoThumbs.get(id).then((ligne) => {
      if (annule || !ligne) return;
      cree = URL.createObjectURL(ligne.blob);
      url = cree;
    });
    return () => {
      annule = true;
      if (cree) URL.revokeObjectURL(cree);
    };
  });
</script>

<button class="carte" style="--couleur: {groupe.color}" onclick={() => onOpen(obs.id)}>
  <div class="image">
    {#if url}
      <img src={url} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="grande-icone"><GroupIcon group={obs.group} size="3.4rem" /></span>
    {/if}
    <span class="pastille" title={groupe.label}><GroupIcon group={obs.group} size="1.1rem" /></span>
    {#if obs.count > 1}<span class="effectif">×{obs.count}</span>{/if}
  </div>
  <div class="texte">
    <strong>{obs.vern || obs.sci}</strong>
    {#if obs.vern}<em>{obs.sci}</em>{/if}
    <small>{date}{obs.place ? ` · ${obs.place}` : ''}</small>
  </div>
</button>

<style>
  .carte {
    display: flex;
    flex-direction: column;
    height: 220px;
    padding: 0;
    border: 0;
    border-radius: 16px;
    overflow: hidden;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  }
  .image {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--couleur), color-mix(in srgb, var(--couleur) 45%, #000));
  }
  .image img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .grande-icone {
    color: #fff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }
  .pastille {
    position: absolute;
    left: 6px;
    top: 6px;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--couleur);
  }
  .effectif {
    position: absolute;
    right: 6px;
    top: 6px;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
  }
  .texte {
    display: flex;
    flex-direction: column;
    padding: 8px 10px 10px;
    min-width: 0;
  }
  .texte strong,
  .texte em,
  .texte small {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .texte em {
    font-size: 0.88rem;
  }
  .texte small {
    color: var(--texte-doux);
  }
</style>
