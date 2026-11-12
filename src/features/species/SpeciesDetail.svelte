<script lang="ts">
  // Fiche espèce : mes observations d'un taxon, sa phénologie par mois, ses photos,
  // une description de référence (Wikipédia) et les espèces proches du même genre.
  import { onMount } from 'svelte';
  import { GROUPS } from '../../domain/groups';
  import { getRefText, type RefPhoto as RefPhotoInfo, type RefText } from '../../reference/reference';
  import { obsStore } from '../../stores/obs.svelte';
  import { congenersOf } from '../../taxonomy/client';
  import type { SearchHit } from '../../taxonomy/search-core';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import RefPhoto from '../../ui/RefPhoto.svelte';
  import Thumb from '../../ui/Thumb.svelte';
  import { perMonth, type SpeciesSummary } from './species';

  let {
    espece,
    onClose,
    onOpenObs,
    onShowMap,
    onShowGallery,
  }: {
    espece: SpeciesSummary;
    onClose: () => void;
    onOpenObs: (id: string) => void;
    onShowMap: () => void;
    onShowGallery: () => void;
  } = $props();

  const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const NB_PHOTOS = 24;
  const PAS = 50;

  const groupe = $derived(GROUPS[espece.group] ?? GROUPS.autres);
  // Observations du taxon, de la plus récente à la plus ancienne (ordre de la liste commune).
  const observations = $derived(obsStore.rows.filter((o) => o.taxonKey === espece.key));
  const mois = $derived(perMonth(observations));
  const maxMois = $derived(Math.max(1, ...mois));
  const avecPhoto = $derived(observations.filter((o) => o.photoId));
  const individus = $derived(observations.reduce((n, o) => n + o.count, 0));
  const premiere = $derived(observations.length ? observations[observations.length - 1].t : espece.premiere);
  const derniere = $derived(observations.length ? observations[0].t : espece.derniere);
  const localisees = $derived(observations.filter((o) => o.lat !== undefined).length);

  let limite = $state(PAS);
  let texte = $state.raw<RefText | null>(null);
  let texteCherche = $state(false);
  let credit = $state('');
  let proches = $state.raw<SearchHit[]>([]);

  // Espèces du même genre déjà observées (pour les distinguer dans la liste des espèces proches).
  const dejaVues = $derived(new Set(obsStore.rows.map((o) => o.taxonKey)));

  onMount(() => {
    getRefText(espece.sci).then((t) => {
      texte = t;
      texteCherche = true;
    });
    congenersOf(espece.sci)
      .then((liste) => (proches = liste))
      .catch(() => (proches = []));
  });

  const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<div class="fiche" role="dialog" aria-modal="true" aria-label="Fiche espèce">
  <header class="tete" style="--couleur: {groupe.color}">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <GroupIcon group={espece.group} size="1.5rem" />
    <span>{groupe.label}</span>
  </header>

  <div class="corps">
    <div class="infos">
      <div class="entete" style="--couleur: {groupe.color}">
        <div class="portrait">
          {#if espece.photoId}
            <Thumb photoId={espece.photoId} />
          {:else}
            <RefPhoto sci={espece.sci} grande onFound={(p: RefPhotoInfo) => (credit = p.attribution)}>
              <GroupIcon group={espece.group} size="3rem" />
            </RefPhoto>
          {/if}
        </div>
        <div>
          <h1>{espece.vern || espece.sci}</h1>
          {#if espece.vern}<p><em>{espece.sci}</em></p>{/if}
          <p class="doux">{[espece.order, espece.family].filter(Boolean).join(' › ')}</p>
        </div>
      </div>
      {#if credit}<p class="credit">Photo de référence : {credit}, via iNaturalist.</p>{/if}

      <ul class="faits">
        <li><span>Observations</span><strong>{observations.length.toLocaleString('fr-FR')}</strong></li>
        <li><span>Individus comptés</span><strong>{individus.toLocaleString('fr-FR')}</strong></li>
        <li><span>Première observation</span><strong>{date(premiere)}</strong></li>
        <li><span>Dernière observation</span><strong>{date(derniere)}</strong></li>
      </ul>

      <div class="actions">
        <button class="bouton" onclick={onShowMap} disabled={localisees === 0}>
          Voir sur la carte{localisees ? ` (${localisees.toLocaleString('fr-FR')})` : ''}
        </button>
        <button class="bouton secondaire" onclick={onShowGallery}>Voir dans la galerie</button>
      </div>

      <h2>Phénologie</h2>
      <p class="doux">Nombre de mes observations par mois, toutes années confondues.</p>
      <div class="phenologie" role="img" aria-label={mois.map((n, i) => `${MOIS_LONGS[i]} : ${n}`).join(', ')}>
        {#each mois as n, i (i)}
          <div class="mois" title="{MOIS_LONGS[i]} : {n}">
            <span class="valeur">{n || ''}</span>
            <span class="barre" style="height: {n ? Math.max(6, (n / maxMois) * 100) : 0}%"></span>
            <span class="lettre">{MOIS[i]}</span>
          </div>
        {/each}
      </div>

      <h2>Description</h2>
      {#if texte}
        {#if texte.summary}<p>{texte.summary}</p>{/if}
        {#each texte.description as paragraphe, i (i)}
          <p>{paragraphe}</p>
        {/each}
        <p class="credit">
          Source : Wikipédia, article « {texte.title} » (CC BY-SA).
          <a href={texte.url} target="_blank" rel="noopener noreferrer">Lire l'article complet</a>
        </p>
      {:else if texteCherche}
        <p class="doux">Pas d'article Wikipédia en français trouvé pour ce taxon (ou pas de réseau).</p>
      {:else}
        <p class="doux">Recherche…</p>
      {/if}

      {#if proches.length}
        <h2>Espèces du même genre</h2>
        <p class="doux">Les espèces avec lesquelles la confusion est la plus probable. Celles que tu as déjà observées sont marquées d'une coche.</p>
        <ul class="proches">
          {#each proches as p (p.cdNom)}
            <li>
              <span class="vignette" style="--couleur: {groupe.color}">
                <RefPhoto sci={p.sci}><GroupIcon group={p.group} size="1.3rem" /></RefPhoto>
              </span>
              <span class="noms">
                <strong>{p.vern || p.sci}</strong>
                {#if p.vern}<em>{p.sci}</em>{/if}
              </span>
              {#if dejaVues.has(`taxref:${p.cdNom}`)}<span class="vue" title="Déjà observée">✓</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}

      {#if avecPhoto.length}
        <h2>Mes photos</h2>
        <div class="photos">
          {#each avecPhoto.slice(0, NB_PHOTOS) as o (o.id)}
            <button class="photo" onclick={() => onOpenObs(o.id)} aria-label="Observation du {date(o.t)}">
              <Thumb photoId={o.photoId} />
            </button>
          {/each}
        </div>
        {#if avecPhoto.length > NB_PHOTOS}
          <p class="doux">{(avecPhoto.length - NB_PHOTOS).toLocaleString('fr-FR')} autres observations avec photo : voir dans la galerie.</p>
        {/if}
      {/if}

      <h2>Mes observations</h2>
      <ul class="liste">
        {#each observations.slice(0, limite) as o (o.id)}
          <li>
            <button class="ligne" onclick={() => onOpenObs(o.id)}>
              <span>{date(o.t)}</span>
              <span class="lieu">{o.place || (o.lat === undefined ? 'sans position' : '')}</span>
              <span class="effectif">{o.count > 1 ? `×${o.count}` : ''}</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if observations.length > limite}
        <button class="bouton secondaire" onclick={() => (limite += PAS)}>Afficher plus</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .fiche {
    position: fixed;
    inset: 0;
    z-index: 25;
    display: flex;
    flex-direction: column;
    background: var(--fond);
  }
  .tete {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    padding-top: calc(8px + env(safe-area-inset-top));
    background: var(--couleur);
    color: #fff;
    font-weight: 700;
  }
  .retour {
    width: 48px;
    height: 48px;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.6rem;
  }
  .corps {
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  .infos {
    max-width: 760px;
    margin: 0 auto;
    padding: 16px;
  }
  .entete {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .entete h1 {
    margin-bottom: 2px;
  }
  .portrait {
    flex: none;
    width: 112px;
    height: 112px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    overflow: hidden;
    background: color-mix(in srgb, var(--couleur) 18%, var(--surface));
    color: var(--couleur);
  }
  .credit {
    margin-top: 6px;
    font-size: 0.82rem;
    color: var(--texte-doux);
  }
  .credit a {
    color: var(--accent);
    font-weight: 700;
  }
  .faits {
    list-style: none;
    margin: 12px 0;
    padding: 0;
    border-radius: 14px;
    background: var(--surface);
  }
  .faits li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bord);
  }
  .faits li:last-child {
    border-bottom: 0;
  }
  .actions {
    display: grid;
    gap: 10px;
  }
  .phenologie {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4px;
    height: 170px;
    padding: 12px;
    border-radius: 14px;
    background: var(--surface);
  }
  .mois {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    min-width: 0;
  }
  .valeur {
    font-size: 0.72rem;
    color: var(--texte-doux);
  }
  .barre {
    width: 100%;
    max-width: 28px;
    border-radius: 4px 4px 0 0;
    background: var(--accent);
  }
  .lettre {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--texte-doux);
  }
  .proches {
    list-style: none;
    margin: 0;
    padding: 0;
    border-radius: 14px;
    background: var(--surface);
  }
  .proches li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
  }
  .proches li + li {
    border-top: 1px solid var(--bord);
  }
  .vignette {
    flex: none;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    overflow: hidden;
    background: color-mix(in srgb, var(--couleur) 18%, var(--surface));
    color: var(--couleur);
  }
  .noms {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .vue {
    color: var(--accent);
    font-weight: 800;
    font-size: 1.2rem;
  }
  .photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 6px;
  }
  .photo {
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 10px;
    overflow: hidden;
    background: var(--bord);
  }
  .liste {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    border-radius: 14px;
    background: var(--surface);
  }
  .liste li + li {
    border-top: 1px solid var(--bord);
  }
  .ligne {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    width: 100%;
    min-height: 52px;
    padding: 0 16px;
    border: 0;
    background: transparent;
    color: var(--texte);
    text-align: left;
  }
  .lieu {
    color: var(--texte-doux);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .effectif {
    font-weight: 700;
  }
</style>
