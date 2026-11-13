<script lang="ts">
  // Fiche détaillée d'une observation, en plein écran.
  import { onDestroy, onMount } from 'svelte';
  import { db } from '../../db/db';
  import { deleteObservation } from '../../db/observations';
  import { cropPhoto, removePhoto, setMainPhoto, type CropRect } from '../../db/photos';
  import PhotoCrop from './PhotoCrop.svelte';
  import { GROUPS } from '../../domain/groups';
  import type { Observation, Photo } from '../../domain/types';
  import { labelOf } from '../../domain/vocab';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let {
    id,
    onClose,
    onDeleted,
    onEdit,
    onChanged,
  }: {
    id: string;
    onClose: () => void;
    onDeleted: (id: string) => void;
    onEdit: (o: Observation) => void;
    /** Une photo a été retouchée : l'observation mise à jour est transmise. */
    onChanged: (o: Observation) => void;
  } = $props();

  /** « 12 °C · vent 7 km/h · nuages 65 % · pluie 0,2 mm » */
  function meteo(o: Observation): string {
    const w = o.weather;
    if (!w) return '';
    const nombre = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return [
      w.temperatureC !== undefined ? `${nombre(w.temperatureC)} °C` : '',
      w.windKmh !== undefined ? `vent ${nombre(w.windKmh)} km/h` : '',
      w.cloudCoverPct !== undefined ? `nuages ${nombre(w.cloudCoverPct)} %` : '',
      w.precipitationMm !== undefined ? `pluie ${nombre(w.precipitationMm)} mm` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

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

  // --- Retouche des photos ---
  const photoCourante = $derived(photos[indexPhoto]);
  let recadrage = $state(false);
  let occupePhoto = $state(false);
  let erreurPhoto = $state('');

  /** Lance une retouche, puis signale le changement (la fiche est alors rechargée). */
  async function retoucher(action: (obsId: string, photoId: string) => Promise<Observation>) {
    if (!obs || !photoCourante || occupePhoto) return;
    occupePhoto = true;
    erreurPhoto = '';
    try {
      onChanged(await action(obs.id, photoCourante.id));
    } catch (e) {
      erreurPhoto = `Retouche impossible : ${e instanceof Error ? e.message : String(e)}`;
      occupePhoto = false;
    }
  }

  const definirPrincipale = () => retoucher(setMainPhoto);
  const recadrer = (r: CropRect) => retoucher((obsId, photoId) => cropPhoto(obsId, photoId, r));
  function retirer() {
    if (confirm('Retirer cette photo de l’observation ? Elle sera effacée de cet appareil.')) void retoucher(removePhoto);
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
    {#if obs}<GroupIcon group={obs.group} size="1.5rem" />{/if}
    <span>{groupe.label}</span>
  </header>

  <div class="corps">
    {#if introuvable}
      <p class="alerte">Observation introuvable.</p>
    {:else if obs}
      {#if photos.length && recadrage && url}
        <PhotoCrop {url} busy={occupePhoto} onCancel={() => (recadrage = false)} onApply={recadrer} />
      {:else if photos.length}
        <div class="photo">
          {#if url}<img src={url} alt="" />{/if}
          {#if photos.length > 1}
            <button class="fleche gauche" onclick={() => (indexPhoto = (indexPhoto - 1 + photos.length) % photos.length)} aria-label="Photo précédente">‹</button>
            <button class="fleche droite" onclick={() => (indexPhoto = (indexPhoto + 1) % photos.length)} aria-label="Photo suivante">›</button>
            <span class="compte">{indexPhoto + 1} / {photos.length}</span>
          {/if}
          {#if photoCourante && obs.mainPhotoId === photoCourante.id}<span class="principale">Photo principale</span>{/if}
        </div>
        <div class="outils-photo">
          {#if photoCourante && obs.mainPhotoId !== photoCourante.id}
            <button class="outil" disabled={occupePhoto} onclick={definirPrincipale}>★ Principale</button>
          {/if}
          <button class="outil" disabled={occupePhoto || !url} onclick={() => (recadrage = true)}>✂ Recadrer</button>
          <button class="outil danger" disabled={occupePhoto} onclick={retirer}>🗑 Retirer</button>
        </div>
        {#if erreurPhoto}<p class="alerte marge">{erreurPhoto}</p>{/if}
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
            {#if obs.placeName || obs.commune || obs.departement}{[obs.placeName, obs.commune, obs.departement].filter(Boolean).join(', ')}<br />{/if}
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

          {#if obs.sex || obs.stage}
            <dt>Individus</dt>
            <dd>{[obs.sex, obs.stage].flatMap((v) => (v ? [labelOf(v)] : [])).join(' · ')}</dd>
          {/if}

          <dt>Contact</dt>
          <dd>{obs.contacts.map(labelOf).join(', ')}</dd>

          {#if obs.behaviours?.length || obs.behaviourNote}
            <dt>Comportement</dt>
            <dd>{[...(obs.behaviours ?? []).map(labelOf), obs.behaviourNote].filter(Boolean).join(', ')}</dd>
          {/if}

          {#if obs.atlasCode}
            <dt>Code atlas</dt>
            <dd>{labelOf(obs.atlasCode)}</dd>
          {/if}

          {#if obs.habitats?.length || obs.substrate}
            <dt>Milieu</dt>
            <dd>{[...(obs.habitats ?? []).map(labelOf), obs.substrate].filter(Boolean).join(', ')}</dd>
          {/if}

          {#if obs.weather}
            <dt>Météo</dt>
            <dd>{meteo(obs)}</dd>
          {/if}

          {#if obs.notes}
            <dt>Remarques</dt>
            <dd>{obs.notes}</dd>
          {/if}

          {#if obs.tags.length}
            <dt>Étiquettes</dt>
            <dd>{obs.tags.join(', ')}</dd>
          {/if}
        </dl>

        <div class="actions">
          <button class="bouton" onclick={() => obs && onEdit(obs)}>Modifier</button>
          <button class="bouton danger" onclick={supprimer}>Supprimer l'observation</button>
        </div>
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
  .actions {
    display: grid;
    gap: 10px;
  }
  .principale {
    position: absolute;
    left: 10px;
    bottom: 10px;
    padding: 2px 10px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 0.85rem;
  }
  .outils-photo {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px 0;
  }
  .outil {
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--bord);
    border-radius: 22px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
  }
  .outil.danger {
    color: var(--alerte);
  }
  .outil:disabled {
    opacity: 0.5;
  }
  .marge {
    padding: 8px 16px 0;
  }
  dt {
    color: var(--texte-doux);
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
</style>
