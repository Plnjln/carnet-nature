<script lang="ts">
  // Formulaire d'observation, pour la saisie rapide comme pour la modification.
  // Saisie rapide : un taxon, la position GPS et l'heure suffisent ; tout le reste est dans des
  // sections dépliables. Parcours le plus court : « + » → tap sur un taxon récent → « Enregistrer ».
  import { onDestroy, onMount } from 'svelte';
  import {
    createObservation,
    detailsFromObservation,
    emptyDetails,
    getRecentTaxa,
    recentFromObservation,
    toRecent,
    updateObservation,
    type ObsDetails,
    type ObsPosition,
    type RecentTaxon,
  } from '../../db/observations';
  import { GROUPS, type GroupId } from '../../domain/groups';
  import type { Certainty, FieldSession, Observation } from '../../domain/types';
  import { ATLAS, behavioursFor, contactsFor, HABITATS, SEXES, stagesFor } from '../../domain/vocab';
  import { watchPosition, type Fix } from '../../geo/position';
  import { readPhotoInfo } from '../../media/exif';
  import { initTaxonIndex, searchTaxa } from '../../taxonomy/client';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import StatusBadges from '../../ui/StatusBadges.svelte';

  let {
    obs,
    position,
    session,
    onClose,
    onSaved,
  }: {
    /** Observation à modifier ; absente pour une nouvelle saisie. */
    obs?: Observation;
    /** Point choisi sur la carte (appui long), pour une nouvelle saisie. */
    position?: { lat: number; lon: number };
    /** Sortie en cours : la nouvelle observation s'y rattache, avec son lieu-dit. */
    session?: FieldSession | null;
    onClose: () => void;
    onSaved: (o: Observation) => void;
  } = $props();

  const modification = obs !== undefined;

  const CERTITUDES: { id: Certainty; label: string }[] = [
    { id: 'certain', label: 'Certain' },
    { id: 'probable', label: 'Probable' },
    { id: 'a-confirmer', label: 'À confirmer' },
  ];

  const deuxChiffres = (n: number) => String(n).padStart(2, '0');
  /** Date au format attendu par un champ « datetime-local » (heure locale). */
  function pourChamp(d: Date): string {
    return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}T${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`;
  }

  // --- Taxon ---
  let query = $state(obs ? obs.taxon?.vernacularName || obs.taxon?.scientificName || obs.taxonInput : '');
  let hits = $state.raw<RecentTaxon[]>([]);
  let recents = $state.raw<RecentTaxon[]>([]);
  let choisi = $state.raw<RecentTaxon | null>(obs ? recentFromObservation(obs) : null);
  let indexPret = $state(false);
  const groupe = $derived<GroupId>(choisi?.group ?? 'autres');

  // --- Position ---
  let fix = $state.raw<Fix | null>(null);
  let gpsMessage = $state('Recherche de la position…');
  // Coordonnées tapées à la main (prioritaires sur le GPS quand elles sont remplies).
  let latTexte = $state(obs?.lat !== undefined ? String(obs.lat) : position ? position.lat.toFixed(6) : '');
  let lonTexte = $state(obs?.lon !== undefined ? String(obs.lon) : position ? position.lon.toFixed(6) : '');
  // D'où viennent les coordonnées du champ : tapées, choisies sur la carte, ou lues dans une photo.
  let sourceCoord = $state<'manuel' | 'carte' | 'exif'>(position ? 'carte' : 'manuel');
  const LIBELLE_SOURCE = { manuel: 'saisie à la main', carte: 'point choisi sur la carte', exif: 'position de la photo' } as const;
  let infoPhoto = $state('');

  // --- Reste du formulaire ---
  let dateChamp = $state(pourChamp(obs ? new Date(obs.startAt) : new Date()));
  let dateModifiee = $state(false);
  let effectif = $state<number | null>(obs?.count?.value ?? 1);
  let certitude = $state<Certainty>(obs?.certainty ?? 'certain');
  let notes = $state(obs?.notes ?? '');
  let details = $state<ObsDetails>(obs ? detailsFromObservation(obs) : { ...emptyDetails(), placeName: session?.placeName ?? '' });
  let etiquettes = $state(obs ? obs.tags.join(', ') : '');
  let photos = $state.raw<{ fichier: File; url: string }[]>([]);

  let enregistrement = $state(false);
  let erreur = $state('');
  let champTaxon: HTMLInputElement | undefined = $state();
  let dernier = 0;
  let arreterGps = () => {};

  onMount(async () => {
    if (!modification) {
      arreterGps = watchPosition(
        (f) => {
          // On garde le relevé le plus précis.
          if (!fix || f.accuracyM <= fix.accuracyM) fix = f;
          gpsMessage = '';
        },
        (m) => {
          if (!fix) gpsMessage = m;
        },
      );
    }
    initTaxonIndex()
      .then(() => (indexPret = true))
      .catch(() => (indexPret = false));
    recents = await getRecentTaxa();
    // Sans taxon récent à proposer, on ouvre directement le clavier.
    if (!modification && recents.length === 0) champTaxon?.focus();
  });

  onDestroy(() => {
    arreterGps();
    for (const p of photos) URL.revokeObjectURL(p.url);
  });

  async function chercher() {
    choisi = null;
    const moi = ++dernier;
    if (!indexPret || query.trim().length < 2) {
      hits = [];
      return;
    }
    try {
      const r = await searchTaxa(query, 8);
      if (moi === dernier) hits = r.hits.map(toRecent);
    } catch {
      hits = [];
    }
  }

  function choisir(t: RecentTaxon) {
    choisi = t;
    query = t.vern || t.sci;
    hits = [];
    dernier++;
  }

  /** Ajoute ou retire une valeur d'une liste à choix multiples. */
  function basculer<T>(liste: T[], valeur: T): T[] {
    return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
  }

  function ajouterPhotos(e: Event) {
    const champ = e.currentTarget as HTMLInputElement;
    const nouvelles = Array.from(champ.files ?? []).map((fichier) => ({ fichier, url: URL.createObjectURL(fichier) }));
    photos = [...photos, ...nouvelles];
    // Photo choisie dans la galerie (pas prise à l'instant) : on reprend sa date et sa position.
    const depuisGalerie = !champ.hasAttribute('capture');
    champ.value = '';
    if (!modification && depuisGalerie && nouvelles.length) void reprendreInfosPhoto(nouvelles[0].fichier);
  }

  /** Propose la date et le GPS enregistrés dans la photo, sans écraser ce qui a été saisi à la main. */
  async function reprendreInfosPhoto(fichier: File) {
    const info = await readPhotoInfo(fichier);
    const repris: string[] = [];
    if (info.takenAt && !dateModifiee) {
      dateChamp = pourChamp(info.takenAt);
      dateModifiee = true;
      repris.push(`date (${info.takenAt.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })})`);
    }
    if (info.lat !== undefined && info.lon !== undefined && (sourceCoord === 'exif' || (!latTexte.trim() && !lonTexte.trim()))) {
      latTexte = info.lat.toFixed(6);
      lonTexte = info.lon.toFixed(6);
      sourceCoord = 'exif';
      repris.push('position');
    }
    infoPhoto = repris.length
      ? `Repris de la photo : ${repris.join(' et ')}.`
      : "Cette photo ne contient ni date ni position exploitable : la date et le GPS actuels sont utilisés.";
  }

  function retirerPhoto(url: string) {
    URL.revokeObjectURL(url);
    photos = photos.filter((p) => p.url !== url);
  }

  /** Position à enregistrer : coordonnées tapées, sinon position d'origine (modification) ou GPS. */
  function positionFinale(): ObsPosition | undefined {
    const lat = latTexte.trim();
    const lon = lonTexte.trim();
    if (lat || lon) {
      const la = Number(lat.replace(',', '.'));
      const lo = Number(lon.replace(',', '.'));
      if (!lat || !lon || !Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
        throw new Error('Coordonnées invalides : latitude entre -90 et 90, longitude entre -180 et 180.');
      }
      // Coordonnées d'origine inchangées : on garde aussi leur précision et leur altitude.
      if (obs && obs.lat === la && obs.lon === lo) {
        return { lat: la, lon: lo, accuracyM: obs.accuracyM, altitudeM: obs.altitudeM, source: obs.locationSource ?? 'manuel' };
      }
      return { lat: la, lon: lo, source: sourceCoord };
    }
    if (fix) return { lat: fix.lat, lon: fix.lon, accuracyM: fix.accuracyM, altitudeM: fix.altitudeM, source: 'gps' };
    return undefined;
  }

  async function enregistrer() {
    if (!query.trim() || enregistrement) return;
    enregistrement = true;
    erreur = '';
    try {
      details.tags = etiquettes.split(',').map((e) => e.trim()).filter(Boolean);
      const saisie = {
        taxonInput: query,
        taxon: choisi ?? undefined,
        // Nouvelle saisie dont la date n'a pas été touchée : on prend l'instant exact de l'enregistrement.
        startAt: modification || dateModifiee ? new Date(dateChamp) : new Date(),
        position: positionFinale(),
        count: effectif,
        certainty: certitude,
        notes,
        details,
        newPhotos: photos.map((p) => p.fichier),
        sessionId: obs ? undefined : session?.id,
      };
      if (Number.isNaN(saisie.startAt.getTime())) throw new Error('Date invalide.');
      onSaved(obs ? await updateObservation(obs.id, saisie) : await createObservation(saisie));
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
      enregistrement = false;
    }
  }
</script>

<div class="feuille" role="dialog" aria-modal="true" aria-label={modification ? "Modifier l'observation" : 'Nouvelle observation'}>
  <header class="tete">
    <h1>{modification ? "Modifier l'observation" : 'Nouvelle observation'}</h1>
    <button class="fermer" onclick={onClose} aria-label="Fermer">✕</button>
  </header>

  <div class="corps">
    <input
      class="champ"
      type="search"
      placeholder="Espèce (nom français ou scientifique)"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      bind:this={champTaxon}
      bind:value={query}
      oninput={chercher}
    />

    {#if choisi}
      <p class="choix" style="--couleur: {GROUPS[choisi.group].color}">
        <span class="teinte"><GroupIcon group={choisi.group} size="1.6rem" /></span>
        <span><strong>{choisi.vern || choisi.sci}</strong> <em>{choisi.sci}</em></span>
      </p>
      <!-- Ce qui mérite l'attention au moment de la saisie : espèce protégée, menacée ou envahissante. -->
      <StatusBadges cdNom={choisi.cdNom} important />
    {:else if hits.length}
      <ul class="propositions">
        {#each hits as h (h.cdNom)}
          <li>
            <button class="proposition" style="--couleur: {GROUPS[h.group].color}" onclick={() => choisir(h)}>
              <span class="teinte"><GroupIcon group={h.group} size="1.6rem" /></span>
              <span class="noms"><strong>{h.vern || h.sci}</strong><em>{h.sci}</em></span>
            </button>
          </li>
        {/each}
      </ul>
    {:else if query.trim().length >= 2}
      <p class="doux">Aucune proposition : le nom sera enregistré tel quel et rapproché plus tard.</p>
    {:else if recents.length}
      <p class="doux">Derniers taxons</p>
      <div class="puces">
        {#each recents as r (r.cdNom)}
          <button class="puce recent" style="--couleur: {GROUPS[r.group].color}" onclick={() => choisir(r)}>
            <span class="teinte"><GroupIcon group={r.group} size="1.3rem" /></span>
            {r.vern || r.sci}
          </button>
        {/each}
      </div>
    {/if}

    {#if !modification && session}
      <p class="doux">Rattachée à la sortie « {session.name ?? 'Sortie'} ».</p>
    {/if}

    {#if !modification}
      <label class="puce photo-rapide">
        🖼️ Partir d'une photo (date et position reprises)
        <input type="file" accept="image/*" multiple hidden onchange={ajouterPhotos} />
      </label>
      {#if infoPhoto}<p class="doux">{infoPhoto}</p>{/if}
      {#if photos.length}<p class="doux">{photos.length} photo{photos.length > 1 ? 's' : ''} jointe{photos.length > 1 ? 's' : ''}.</p>{/if}

      <p class="gps" class:alerte={!fix && !latTexte.trim() && gpsMessage !== 'Recherche de la position…'}>
        📍
        {#if latTexte.trim() && lonTexte.trim()}
          {latTexte}, {lonTexte} · {LIBELLE_SOURCE[sourceCoord]}
        {:else if fix}
          {fix.lat.toFixed(5)}, {fix.lon.toFixed(5)} · ± {fix.accuracyM} m{fix.altitudeM !== undefined ? ` · ${fix.altitudeM} m d'altitude` : ''}
        {:else}
          {gpsMessage}
        {/if}
      </p>
    {/if}

    <details>
      <summary>Date, effectif, certitude</summary>
      <label class="ligne">
        <span>Date et heure</span>
        <input class="champ" type="datetime-local" bind:value={dateChamp} oninput={() => (dateModifiee = true)} />
      </label>
      <div class="ligne">
        <span>Effectif</span>
        <div class="compteur">
          <button class="rond" onclick={() => (effectif = Math.max(1, (effectif ?? 1) - 1))} aria-label="Moins un">−</button>
          <input class="champ nombre" type="number" min="1" inputmode="numeric" bind:value={effectif} />
          <button class="rond" onclick={() => (effectif = (effectif ?? 0) + 1)} aria-label="Plus un">+</button>
        </div>
      </div>
      <div class="ligne">
        <span>Certitude</span>
        <div class="puces">
          {#each CERTITUDES as c (c.id)}
            <button class="puce" class:active={certitude === c.id} onclick={() => (certitude = c.id)}>{c.label}</button>
          {/each}
        </div>
      </div>
    </details>

    <details>
      <summary>Sexe et stade</summary>
      <div class="ligne">
        <span>Sexe</span>
        <div class="puces">
          {#each SEXES as s (s.id)}
            <button class="puce" class:active={details.sex === s.id} onclick={() => (details.sex = details.sex === s.id ? undefined : s.id)}>{s.label}</button>
          {/each}
        </div>
      </div>
      <div class="ligne">
        <span>Stade</span>
        <div class="puces">
          {#each stagesFor(groupe) as s (s.id)}
            <button class="puce" class:active={details.stage === s.id} onclick={() => (details.stage = details.stage === s.id ? undefined : s.id)}>{s.label}</button>
          {/each}
        </div>
      </div>
    </details>

    <details>
      <summary>Contact et comportement</summary>
      <div class="ligne">
        <span>Type de contact</span>
        <div class="puces">
          {#each contactsFor(groupe) as c (c.id)}
            <button class="puce" class:active={details.contacts.includes(c.id)} onclick={() => (details.contacts = basculer(details.contacts, c.id))}>{c.label}</button>
          {/each}
        </div>
      </div>
      <div class="ligne">
        <span>Comportement</span>
        <div class="puces">
          {#each behavioursFor(groupe) as c (c.id)}
            <button class="puce" class:active={details.behaviours.includes(c.id)} onclick={() => (details.behaviours = basculer(details.behaviours, c.id))}>{c.label}</button>
          {/each}
        </div>
        <input class="champ" type="text" placeholder="Précision (ex. plante butinée)" bind:value={details.behaviourNote} />
      </div>
      {#if groupe === 'oiseaux'}
        <div class="ligne">
          <span>Code atlas de nidification</span>
          <div class="puces">
            {#each ATLAS as a (a.id)}
              <button class="puce" class:active={details.atlasCode === a.id} onclick={() => (details.atlasCode = details.atlasCode === a.id ? undefined : a.id)}>{a.label}</button>
            {/each}
          </div>
        </div>
      {/if}
    </details>

    <details>
      <summary>Milieu</summary>
      {#each HABITATS as famille (famille.label)}
        <div class="ligne">
          <span>{famille.label}</span>
          <div class="puces">
            {#each famille.choix as h (h.id)}
              <button class="puce" class:active={details.habitats.includes(h.id)} onclick={() => (details.habitats = basculer(details.habitats, h.id))}>{h.label}</button>
            {/each}
          </div>
        </div>
      {/each}
      <label class="ligne">
        <span>Support ou plante hôte</span>
        <input class="champ" type="text" bind:value={details.substrate} />
      </label>
    </details>

    <details>
      <summary>Lieu</summary>
      <label class="ligne">
        <span>Lieu-dit</span>
        <input class="champ" type="text" placeholder="Rempli automatiquement si laissé vide" bind:value={details.placeName} />
      </label>
      <label class="ligne">
        <span>Commune</span>
        <input class="champ" type="text" placeholder="Remplie automatiquement si laissée vide" bind:value={details.commune} />
      </label>
      <div class="ligne">
        <span>Coordonnées (latitude, longitude)</span>
        <div class="coordonnees">
          <input class="champ" type="text" inputmode="decimal" placeholder={fix ? fix.lat.toFixed(5) : 'Latitude'} aria-label="Latitude" bind:value={latTexte} oninput={() => (sourceCoord = 'manuel')} />
          <input class="champ" type="text" inputmode="decimal" placeholder={fix ? fix.lon.toFixed(5) : 'Longitude'} aria-label="Longitude" bind:value={lonTexte} oninput={() => (sourceCoord = 'manuel')} />
        </div>
        {#if !modification}<small class="doux">Laisse vide pour utiliser le GPS.</small>{/if}
      </div>
    </details>

    <details>
      <summary>Photos, remarques, étiquettes</summary>
      <div class="ligne">
        <span>{modification ? 'Ajouter des photos' : 'Photos'}</span>
        <div class="puces">
          <label class="puce">
            📷 Appareil photo
            <input type="file" accept="image/*" capture="environment" hidden onchange={ajouterPhotos} />
          </label>
          <label class="puce">
            🖼️ Galerie
            <input type="file" accept="image/*" multiple hidden onchange={ajouterPhotos} />
          </label>
        </div>
        {#if photos.length}
          <div class="vignettes">
            {#each photos as p (p.url)}
              <button class="vignette" onclick={() => retirerPhoto(p.url)} aria-label="Retirer cette photo">
                <img src={p.url} alt="" />
                <span aria-hidden="true">✕</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <label class="ligne">
        <span>Remarques</span>
        <textarea class="champ zone" rows="2" bind:value={notes}></textarea>
      </label>
      <label class="ligne">
        <span>Étiquettes (séparées par des virgules)</span>
        <input class="champ" type="text" autocapitalize="off" bind:value={etiquettes} />
      </label>
    </details>

    {#if erreur}
      <p class="alerte">Enregistrement impossible : {erreur}</p>
    {/if}
  </div>

  <footer class="pied">
    <button class="bouton enregistrer" onclick={enregistrer} disabled={!query.trim() || enregistrement}>
      {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  </footer>
</div>

<style>
  .feuille {
    position: fixed;
    inset: 0;
    z-index: 35;
    display: flex;
    flex-direction: column;
    background: var(--fond);
  }
  .tete {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 8px 16px;
    padding-top: calc(8px + env(safe-area-inset-top));
    background: var(--accent);
    color: var(--sur-accent);
  }
  .tete h1 {
    margin: 0;
    font-size: 1.2rem;
  }
  .fermer {
    width: 48px;
    height: 48px;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.4rem;
  }
  .corps {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pied {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 2px solid var(--bord);
    background: var(--surface);
  }
  .enregistrer {
    width: 100%;
    min-height: 64px;
    font-size: 1.2rem;
  }
  .champ {
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    font-size: 1.1rem;
    border: 2px solid var(--bord);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
  }
  details .champ {
    background: var(--fond);
  }
  .champ:focus {
    outline: 3px solid var(--accent);
    border-color: var(--accent);
  }
  .zone {
    padding: 12px 16px;
    font-family: inherit;
  }
  .propositions {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .proposition,
  .choix {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    margin: 0;
    padding: 8px 12px;
    border: 0;
    border-left: 8px solid var(--couleur);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    font-size: 1.05rem;
  }
  .noms {
    display: flex;
    flex-direction: column;
  }
  .teinte {
    display: inline-flex;
    color: var(--couleur);
  }
  .puces {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .puce {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 52px;
    padding: 0 16px;
    border: 2px solid var(--bord);
    border-radius: 26px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
  }
  details .puce {
    background: var(--fond);
  }
  .photo-rapide {
    align-self: flex-start;
  }
  .puce.recent {
    border-color: var(--couleur);
  }
  .puce.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
  }
  .gps {
    margin: 0;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--surface);
    font-weight: 600;
  }
  details {
    border-radius: 14px;
    background: var(--surface);
    padding: 0 16px;
  }
  summary {
    min-height: 56px;
    display: flex;
    align-items: center;
    font-weight: 700;
    cursor: pointer;
  }
  .ligne {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 0 14px;
  }
  .ligne > span {
    font-weight: 600;
    color: var(--texte-doux);
  }
  .compteur {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nombre {
    width: 110px;
    text-align: center;
  }
  .coordonnees {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .rond {
    width: 56px;
    height: 56px;
    flex: none;
    border: 2px solid var(--accent);
    border-radius: 50%;
    background: transparent;
    color: var(--accent);
    font-size: 1.6rem;
    font-weight: 700;
  }
  .vignettes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .vignette {
    position: relative;
    width: 84px;
    height: 84px;
    padding: 0;
    border: 0;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bord);
  }
  .vignette img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .vignette span {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    line-height: 26px;
  }
</style>
