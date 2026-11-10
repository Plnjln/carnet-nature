<script lang="ts">
  // Fiche détaillée d'une observation, en plein écran.
  import { onDestroy, onMount } from 'svelte';
  import { db } from '../../db/db';
  import { deleteObservation } from '../../db/observations';
  import { GROUPS } from '../../domain/groups';
  import type { Observation, Photo } from '../../domain/types';

  let { id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted: (id: string) => void } = $props();

  const CERTITUDES = { certain: 'Certain', probable: 'Probable', 'a-confirmer': 'À confirmer' } as const;

  let obs = $state.raw<Observation | null>(null);
  let photos = $state.raw<Photo[]>([]);
  let indexPhoto = $state(0);
  let url = $state('');
  let introuvable = $state(false);

  const groupe = $derived(obs ? (GROUPS[obs.group] ?? GROUPS.autres) : GROUPS.autres);
  const lignee = $derived(
    obs?.taxon
      ? [obs.taxon.kingdom, obs.taxon.phylum, obs.taxon.classe, obs.taxon.order, obs.taxon.family, obs.taxon.genus].filter(
          (n) => n && n !== obs?.taxon?.scientificName,
        )
      : [],
  );

  onMount(async () => {
    const trouve = await db.observations.get(id);
    if (!trouve) {
      introuvable = true;
      return;
    }
    obs = trouve;
    photos = (await db.photos.where('obsId').equals(id).sortBy('order')).filter((p) => !p.deleted);
  });

  // Charge la photo courante (version d'affichage, sinon miniature).
  $effect(() => {
    const photo = photos[indexPhoto];
    if (!photo) {
      url = '';
      return;
    }
    let annule = false;
    let cree = '';
    (async () => {
      const ligne = (await db.photoDisplays.get(photo.id)) ?? (await db.photoThumbs.get(photo.id));
      if (annule || !ligne) return;
      cree = URL.createObjectURL(ligne.blob);
      url = cree;
    })();
    return () => {
      annule = true;
      if (cree) URL.revokeObjectURL(cree);
    };
  });

  onDestroy(() => {
    url = '';
  });

  function dateLongue(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function supprimer() {
    if (!obs || !confirm('Supprimer cette observation ?')) return;
    await deleteObservation(obs.id);
    onDeleted(obs.id);
  }
</script>

<div class="fiche" role="dialog" aria-modal="true" aria-label="Fiche de l'observation">
  <header class="tete" style="--couleur: {groupe.color}">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <span>{groupe.icon} {groupe.label}</span>
  </header>

  <div class="corps">
    {#if introuvable}
      <p class="alerte">Observation introuvable.</p>
    {:else if obs}
      {#if photos.length}
        <div class="photo">
          {#if url}<img src={url} alt="" />{/if}
          {#if photos.length > 1}
            <button class="fleche gauche" onclick={() => (indexPhoto = (indexPhoto - 1 + photos.length) % photos.length)} aria-label="Photo précédente">‹</button>
            <button class="fleche droite" onclick={() => (indexPhoto = (indexPhoto + 1) % photos.length)} aria-label="Photo suivante">›</button>
            <span class="compte">{indexPhoto + 1} / {photos.length}</span>
          {/if}
        </div>
      {/if}

      <div class="infos">
        <h1>{obs.taxon?.vernacularName || obs.taxon?.scientificName || obs.taxonInput}</h1>
        {#if obs.taxon}
          <p><em>{obs.taxon.scientificName}</em></p>
          <p class="doux">{lignee.join(' › ')}</p>
        {:else}
        <p class="doux">Nom saisi librement, pas encore rapproché d'un référentiel.</p>
        {/if}

        <dl>
          <dt>Date</dt>
          <dd>{dateLongue(obs.startAt)}</dd>

          <dt>Lieu</dt>
          <dd>
            {#if obs.placeName || obs.commune}{[obs.placeName, obs.commune].filter(Boolean).join(', ')}<br />{/if}
            {#if obs.lat !== undefined && obs.lon !== undefined}
              {obs.lat.toFixed(5)}, {obs.lon.toFixed(5)}
              {#if obs.accuracyM !== undefined} · ± {obs.accuracyM} m{/if}
              {#if obs.altitudeM !== undefined} · {obs.altitudeM} m d'altitude{/if}
            {:else}
              Position non enregistrée
            {/if}
          </dd>

          <dt>Effectif</dt>
          <dd>{obs.count?.value ?? 1}</dd>

          <dt>Certitude</dt>
          <dd>{CERTITUDES[obs.certainty]}</dd>

          {#if obs.notes}
            <dt>Remarques</dt>
            <dd>{obs.notes}</dd>
          {/if}
        </dl>

        <button class="bouton danger" onclick={supprimer}>Supprimer l'observation</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .fiche {
    position: fixed;
    inset: 0;
    z-index: 30;
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
  .photo {
    position: relative;
    height: min(62vh, 520px);
    background: #000;
  }
  .photo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .fleche {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 52px;
    height: 72px;
    border: 0;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 2rem;
  }
  .gauche {
    left: 0;
    border-radius: 0 12px 12px 0;
  }
  .droite {
    right: 0;
    border-radius: 12px 0 0 12px;
  }
  .compte {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 2px 10px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 0.85rem;
  }
  .infos {
    max-width: 760px;
    margin: 0 auto;
    padding: 16px;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px 16px;
    margin: 16px 0 24px;
    padding: 16px;
    border-radius: 14px;
    background: var(--surface);
  }
  dt {
    color: var(--texte-doux);
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
</style>
