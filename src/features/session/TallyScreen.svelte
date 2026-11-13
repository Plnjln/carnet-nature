<script lang="ts">
  // Pointage : la liste des taxons de la sortie, un tap sur « +1 » ajoute un individu.
  // Chaque taxon correspond à une observation de la sortie, dont l'effectif augmente.
  import { onMount } from 'svelte';
  import { createObservation, emptyDetails, getRecentTaxa, incrementCount, toRecent, type RecentTaxon } from '../../db/observations';
  import { GROUPS } from '../../domain/groups';
  import type { FieldSession, Observation, ObsLite } from '../../domain/types';
  import { obsStore } from '../../stores/obs.svelte';
  import { sessionStore } from '../../stores/session.svelte';
  import { initTaxonIndex, searchTaxa } from '../../taxonomy/client';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let {
    session,
    onClose,
    onCreated,
    onChanged,
  }: {
    session: FieldSession;
    onClose: () => void;
    /** Un taxon a été ajouté au pointage (nouvelle observation). */
    onCreated: (o: Observation) => void;
    /** Un effectif a changé. */
    onChanged: (o: Observation) => void;
  } = $props();

  let query = $state('');
  let hits = $state.raw<RecentTaxon[]>([]);
  let recents = $state.raw<RecentTaxon[]>([]);
  let indexPret = $state(false);
  let occupe = $state(false);
  let erreur = $state('');
  let dernier = 0;

  // Une ligne par taxon : son observation la plus récente dans la sortie porte le compteur.
  const lignes = $derived.by(() => {
    const parTaxon = new Map<string, ObsLite>();
    for (const o of obsStore.rows) {
      if (o.session !== session.id || !o.taxonKey) continue;
      if (!parTaxon.has(o.taxonKey)) parTaxon.set(o.taxonKey, o); // la liste est triée de la plus récente à la plus ancienne
    }
    return Array.from(parTaxon.values()).sort((a, b) => (a.vern || a.sci).localeCompare(b.vern || b.sci, 'fr'));
  });
  const total = $derived(lignes.reduce((n, o) => n + o.count, 0));
  const dejaPointes = $derived(new Set(lignes.map((o) => o.taxonKey)));
  const suggestions = $derived(recents.filter((r) => !dejaPointes.has(`taxref:${r.cdNom}`)).slice(0, 8));

  onMount(async () => {
    initTaxonIndex()
      .then(() => (indexPret = true))
      .catch(() => (indexPret = false));
    recents = await getRecentTaxa();
  });

  async function chercher() {
    const moi = ++dernier;
    if (!indexPret || query.trim().length < 2) {
      hits = [];
      return;
    }
    try {
      const r = await searchTaxa(query, 6);
      if (moi === dernier) hits = r.hits.map(toRecent);
    } catch {
      hits = [];
    }
  }

  async function executer(action: () => Promise<void>) {
    if (occupe) return;
    occupe = true;
    erreur = '';
    try {
      await action();
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
    occupe = false;
  }

  const changer = (o: ObsLite, delta: number) => executer(async () => onChanged(await incrementCount(o.id, delta)));

  /** Ajoute un taxon au pointage ; s'il y est déjà, compte un individu de plus. */
  function ajouter(t: RecentTaxon) {
    query = '';
    hits = [];
    dernier++;
    const existante = lignes.find((o) => o.taxonKey === `taxref:${t.cdNom}`);
    if (existante) return changer(existante, 1);
    return executer(async () => {
      const f = sessionStore.fix;
      const details = emptyDetails();
      details.placeName = session.placeName ?? '';
      onCreated(
        await createObservation({
          taxonInput: t.vern || t.sci,
          taxon: t,
          startAt: new Date(),
          position: f ? { lat: f.lat, lon: f.lon, accuracyM: f.accuracyM, altitudeM: f.altitudeM, source: 'gps' } : undefined,
          count: 1,
          certainty: 'certain',
          details,
          newPhotos: [],
          sessionId: session.id,
        }),
      );
    });
  }
</script>

<div class="fiche" role="dialog" aria-modal="true" aria-label="Pointage">
  <header class="tete">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <span>Pointage · {lignes.length} taxon{lignes.length > 1 ? 's' : ''} · {total} individu{total > 1 ? 's' : ''}</span>
  </header>

  <div class="corps">
    <div class="contenu">
      <input
        class="champ"
        type="search"
        placeholder="Ajouter une espèce au pointage"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        bind:value={query}
        oninput={chercher}
      />

      {#if hits.length}
        <ul class="propositions">
          {#each hits as h (h.cdNom)}
            <li>
              <button class="proposition" style="--couleur: {GROUPS[h.group].color}" onclick={() => ajouter(h)}>
                <span class="teinte"><GroupIcon group={h.group} size="1.5rem" /></span>
                <span class="noms"><strong>{h.vern || h.sci}</strong><em>{h.sci}</em></span>
              </button>
            </li>
          {/each}
        </ul>
      {:else if suggestions.length && !query.trim()}
        <div class="puces">
          {#each suggestions as r (r.cdNom)}
            <button class="puce" style="--couleur: {GROUPS[r.group].color}" onclick={() => ajouter(r)}>+ {r.vern || r.sci}</button>
          {/each}
        </div>
      {/if}

      {#if erreur}<p class="alerte">{erreur}</p>{/if}

      {#if lignes.length === 0}
        <p class="doux">Ajoute une première espèce : elle apparaîtra ici avec son compteur. La position et l'heure sont celles du premier individu noté.</p>
      {:else}
        <ul class="compteurs">
          {#each lignes as o (o.taxonKey)}
            <li style="--couleur: {(GROUPS[o.group] ?? GROUPS.autres).color}">
              <span class="noms">
                <strong>{o.vern || o.sci}</strong>
                {#if o.vern}<em>{o.sci}</em>{/if}
              </span>
              <button class="moins" disabled={occupe || o.count <= 1} onclick={() => changer(o, -1)} aria-label="Retirer un individu">−</button>
              <span class="effectif">{o.count}</span>
              <button class="plus" disabled={occupe} onclick={() => changer(o, 1)} aria-label="Ajouter un individu">+1</button>
            </li>
          {/each}
        </ul>
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
    background: var(--accent);
    color: var(--sur-accent);
    font-weight: 700;
  }
  .retour {
    width: 48px;
    height: 48px;
    flex: none;
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
  .contenu {
    max-width: 760px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  .propositions,
  .compteurs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .proposition {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 12px;
    border: 0;
    border-left: 8px solid var(--couleur);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    font-size: 1.05rem;
  }
  .teinte {
    display: inline-flex;
    color: var(--couleur);
  }
  .noms {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .noms strong,
  .noms em {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .puces {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .puce {
    min-height: 48px;
    padding: 0 14px;
    border: 2px solid var(--couleur);
    border-radius: 24px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
  }
  .compteurs li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px 8px 12px;
    border-left: 8px solid var(--couleur);
    border-radius: 14px;
    background: var(--surface);
  }
  .effectif {
    min-width: 44px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 800;
  }
  .moins,
  .plus {
    flex: none;
    height: 64px;
    border-radius: 16px;
    font-weight: 800;
  }
  .moins {
    width: 52px;
    border: 2px solid var(--bord);
    background: transparent;
    color: var(--texte);
    font-size: 1.6rem;
  }
  .plus {
    width: 84px;
    border: 0;
    background: var(--accent);
    color: var(--sur-accent);
    font-size: 1.5rem;
  }
  .moins:disabled,
  .plus:disabled {
    opacity: 0.45;
  }
  .plus:active {
    transform: scale(0.95);
  }
</style>
