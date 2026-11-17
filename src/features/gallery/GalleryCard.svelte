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

<button class="carte" class:sans-photo={!obs.photoId} style="--couleur: {groupe.color}" onclick={() => onOpen(obs.id)}>
  <div class="image">
    {#if url}
      <img src={url} alt="" loading="lazy" decoding="async" />
    {:else if !obs.photoId}
      <span class="grande-icone"><GroupIcon group={obs.group} size="3.2rem" /></span>
    {/if}
    <span class="pastille" title={groupe.label}><GroupIcon group={obs.group} size="1rem" /></span>
    {#if obs.count > 1}<span class="effectif">×{obs.count}</span>{/if}
  </div>
  <div class="texte">
    <strong>{obs.vern || obs.sci}</strong>
    {#if obs.vern}<em>{obs.sci}</em>{/if}
    <small><span class="point"></span>{date}{obs.place ? ` · ${obs.place}` : ''}</small>
  </div>
</button>

<style>
  .carte {
    display: flex;
    flex-direction: column;
    height: 220px;
    padding: 0;
    border: 0;
    border-radius: 18px;
    overflow: hidden;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    box-shadow: var(--ombre);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .carte:active {
    transform: scale(0.98);
  }
  @media (hover: hover) {
    .carte:hover {
      transform: translateY(-2px);
      box-shadow: var(--ombre-forte);
    }
  }
  .image {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
  }
  /* Sans photo : un aplat teinté de la couleur du groupe, et sa silhouette au trait. */
  .sans-photo .image {
    background:
      radial-gradient(circle at 70% 25%, color-mix(in srgb, var(--couleur) 22%, transparent), transparent 60%),
      color-mix(in srgb, var(--couleur) 13%, var(--surface));
  }
  .image img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .grande-icone {
    color: color-mix(in srgb, var(--couleur) 85%, var(--texte));
    opacity: 0.9;
  }
  .pastille {
    position: absolute;
    left: 8px;
    top: 8px;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: var(--couleur);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  }
  .effectif {
    position: absolute;
    right: 8px;
    top: 8px;
    padding: 3px 9px;
    border-radius: 10px;
    background: rgb(15 20 16 / 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #fff;
    font-weight: 700;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
  }
  .texte {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 9px 12px 11px;
    min-width: 0;
  }
  .texte strong,
  .texte em,
  .texte small {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .texte strong {
    font-family: var(--titre);
    font-size: 1.04rem;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .texte em {
    font-size: 0.86rem;
    color: var(--texte-doux);
  }
  .texte small {
    margin-top: 3px;
    font-size: 0.78rem;
    color: var(--texte-doux);
  }
  .point {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--couleur);
    vertical-align: 1px;
  }
</style>
