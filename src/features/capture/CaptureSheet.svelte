<script lang="ts">
  // Saisie rapide : un taxon, la position GPS et l'heure. Tout le reste est optionnel.
  // Parcours le plus court : « + » → tap sur un taxon récent → « Enregistrer ».
  import { onDestroy, onMount } from 'svelte';
  import { createObservation, getRecentTaxa, toRecent, type RecentTaxon } from '../../db/observations';
  import { GROUPS } from '../../domain/groups';
  import type { Certainty, Observation } from '../../domain/types';
  import { watchPosition, type Fix } from '../../geo/position';
  import { initTaxonIndex, searchTaxa } from '../../taxonomy/client';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let { onClose, onSaved }: { onClose: () => void; onSaved: (o: Observation) => void } = $props();

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

  let query = $state('');
  let hits = $state.raw<RecentTaxon[]>([]);
  let recents = $state.raw<RecentTaxon[]>([]);
  let choisi = $state.raw<RecentTaxon | null>(null);
  let indexPret = $state(false);

  let fix = $state.raw<Fix | null>(null);
  let gpsMessage = $state('Recherche de la position…');

  let dateChamp = $state(pourChamp(new Date()));
  let dateModifiee = $state(false);
  let effectif = $state(1);
  let certitude = $state<Certainty>('certain');
  let notes = $state('');
  let photos = $state.raw<{ fichier: File; url: string }[]>([]);

  let enregistrement = $state(false);
  let erreur = $state('');
  let champTaxon: HTMLInputElement | undefined = $state();
  let dernier = 0;
  let arreterGps = () => {};

  onMount(async () => {
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
    initTaxonIndex()
      .then(() => (indexPret = true))
      .catch(() => (indexPret = false));
    recents = await getRecentTaxa();
    // Sans taxon récent à proposer, on ouvre directement le clavier.
    if (recents.length === 0) champTaxon?.focus();
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

  function ajouterPhotos(e: Event) {
    const champ = e.currentTarget as HTMLInputElement;
    const nouvelles = Array.from(champ.files ?? []).map((fichier) => ({ fichier, url: URL.createObjectURL(fichier) }));
    photos = [...photos, ...nouvelles];
    champ.value = '';
  }

  function retirerPhoto(url: string) {
    URL.revokeObjectURL(url);
    photos = photos.filter((p) => p.url !== url);
  }

  async function enregistrer() {
    if (!query.trim() || enregistrement) return;
    enregistrement = true;
    erreur = '';
    try {
      const obs = await createObservation({
        taxonInput: query,
        taxon: choisi ?? undefined,
        // Si la date n'a pas été touchée, on prend l'instant exact de l'enregistrement.
        startAt: dateModifiee ? new Date(dateChamp) : new Date(),
        fix: fix ?? undefined,
        count: effectif,
        certainty: certitude,
        notes,
        photos: photos.map((p) => p.fichier),
      });
      onSaved(obs);
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
      enregistrement = false;
    }
  }
</script>

<div class="feuille" role="dialog" aria-modal="true" aria-label="Nouvelle observation">
  <header class="tete">
    <h1>Nouvelle observation</h1>
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
      <div class="recents">
        {#each recents as r (r.cdNom)}
          <button class="recent" style="--couleur: {GROUPS[r.group].color}" onclick={() => choisir(r)}>
            <span class="teinte"><GroupIcon group={r.group} size="1.3rem" /></span>
            {r.vern || r.sci}
          </button>
        {/each}
      </div>
    {/if}

    <p class="gps" class:alerte={!fix && gpsMessage !== 'Recherche de la position…'}>
      📍
      {#if fix}
        {fix.lat.toFixed(5)}, {fix.lon.toFixed(5)} · ± {fix.accuracyM} m{fix.altitudeM !== undefined ? ` · ${fix.altitudeM} m d'altitude` : ''}
      {:else}
        {gpsMessage}
      {/if}
    </p>

    <details>
      <summary>Date, effectif, certitude, photos, remarques</summary>

      <label class="ligne">
        <span>Date et heure</span>
        <input class="champ" type="datetime-local" bind:value={dateChamp} oninput={() => (dateModifiee = true)} />
      </label>

      <div class="ligne">
        <span>Effectif</span>
        <div class="compteur">
          <button class="rond" onclick={() => (effectif = Math.max(1, effectif - 1))} aria-label="Moins un">−</button>
          <input class="champ nombre" type="number" min="1" inputmode="numeric" bind:value={effectif} />
          <button class="rond" onclick={() => (effectif += 1)} aria-label="Plus un">+</button>
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

      <div class="ligne">
        <span>Photos</span>
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
    z-index: 30;
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
  .recents,
  .puces {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .recent,
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
  .recent {
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
