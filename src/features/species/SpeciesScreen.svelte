<script lang="ts">
  // Onglet « Espèces » : la life list (un taxon par ligne, avec sa première observation),
  // les compteurs par groupe et par année, et l'accès à la recherche dans TAXREF.
  import { GROUPS, type GroupId } from '../../domain/groups';
  import { obsStore } from '../../stores/obs.svelte';
  import { normalize } from '../../taxonomy/normalize';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import RefPhoto from '../../ui/RefPhoto.svelte';
  import Thumb from '../../ui/Thumb.svelte';
  import { newPerYear, summarize, type SpeciesSummary } from './species';
  import TaxonSearchScreen from './TaxonSearchScreen.svelte';

  let { onOpenSpecies }: { onOpenSpecies: (e: SpeciesSummary) => void } = $props();

  type Tri = 'recentes' | 'frequentes' | 'alpha';
  const TRIS: { id: Tri; label: string }[] = [
    { id: 'recentes', label: 'Dernières découvertes' },
    { id: 'frequentes', label: 'Les plus vues' },
    { id: 'alpha', label: 'A → Z' },
  ];
  const PAS = 100;

  let tri = $state<Tri>('recentes');
  let recherche = $state('');
  let groupe = $state<GroupId | ''>('');
  let limite = $state(PAS);
  let rechercheTaxref = $state(false);

  const resume = $derived(summarize(obsStore.rows));
  const parAnnee = $derived(newPerYear(resume.especes));
  const parGroupe = $derived.by(() => {
    const compte = new Map<GroupId, number>();
    for (const e of resume.especes) compte.set(e.group, (compte.get(e.group) ?? 0) + 1);
    return (Object.keys(GROUPS) as GroupId[]).filter((g) => compte.has(g)).map((g) => ({ id: g, n: compte.get(g) ?? 0 }));
  });

  const liste = $derived.by(() => {
    const mots = normalize(recherche).split(' ').filter(Boolean);
    const garde = resume.especes.filter((e) => {
      if (groupe && e.group !== groupe) return false;
      if (mots.length === 0) return true;
      const texte = normalize(`${e.vern} ${e.sci} ${e.family} ${e.order}`);
      return mots.every((m) => texte.includes(m));
    });
    if (tri === 'recentes') garde.sort((a, b) => b.premiere - a.premiere);
    else if (tri === 'frequentes') garde.sort((a, b) => b.n - a.n || a.sci.localeCompare(b.sci));
    else garde.sort((a, b) => (a.vern || a.sci).localeCompare(b.vern || b.sci, 'fr'));
    return garde;
  });

  const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<section class="page">
  <h1>Mes espèces</h1>

  {#if !obsStore.loaded}
    <p class="doux">Chargement…</p>
  {:else if resume.especes.length === 0}
    <p class="doux">Ta liste se remplira au fil des observations : chaque taxon identifié y apparaît avec la date de sa première observation.</p>
  {:else}
    <p class="total"><strong>{resume.especes.length.toLocaleString('fr-FR')}</strong> taxon{resume.especes.length > 1 ? 's' : ''} observé{resume.especes.length > 1 ? 's' : ''}</p>
    {#if resume.nonRapprochees > 0}
      <p class="doux">{resume.nonRapprochees.toLocaleString('fr-FR')} observation{resume.nonRapprochees > 1 ? 's' : ''} au nom saisi librement ne {resume.nonRapprochees > 1 ? 'sont' : 'est'} pas comptée{resume.nonRapprochees > 1 ? 's' : ''}.</p>
    {/if}

    <div class="puces">
      <button class="puce" class:active={groupe === ''} onclick={() => (groupe = '')}>Tout</button>
      {#each parGroupe as g (g.id)}
        <button class="puce" class:active={groupe === g.id} onclick={() => (groupe = groupe === g.id ? '' : g.id)}>
          <GroupIcon group={g.id} size="1.2rem" />
          {GROUPS[g.id].label}
          <span class="nombre">{g.n}</span>
        </button>
      {/each}
    </div>

    <details class="annees">
      <summary>Nouveaux taxons par année</summary>
      <ul>
        {#each parAnnee as a (a.annee)}
          <li><span>{a.annee}</span><strong>{a.n.toLocaleString('fr-FR')}</strong></li>
        {/each}
      </ul>
    </details>

    <input class="champ" type="search" placeholder="Chercher dans ma liste" autocomplete="off" bind:value={recherche} oninput={() => (limite = PAS)} />

    <div class="puces">
      {#each TRIS as t (t.id)}
        <button class="puce petite" class:active={tri === t.id} onclick={() => (tri = t.id)}>{t.label}</button>
      {/each}
    </div>

    <ul class="liste">
      {#each liste.slice(0, limite) as e (e.key)}
        <li>
          <button class="ligne" style="--couleur: {GROUPS[e.group].color}" onclick={() => onOpenSpecies(e)}>
            <span class="vignette">
              {#if e.photoId}
                <Thumb photoId={e.photoId} />
              {:else}
                <!-- Pas encore de photo personnelle : photo de référence, sinon icône du groupe. -->
                <RefPhoto sci={e.sci}><GroupIcon group={e.group} size="1.6rem" /></RefPhoto>
              {/if}
            </span>
            <span class="texte">
              <strong>{e.vern || e.sci}</strong>
              {#if e.vern}<em>{e.sci}</em>{/if}
              <small>1ʳᵉ obs. {date(e.premiere)} · {e.n} obs.</small>
            </span>
          </button>
        </li>
      {/each}
    </ul>
    {#if liste.length > limite}
      <button class="bouton secondaire" onclick={() => (limite += PAS)}>Afficher plus ({(liste.length - limite).toLocaleString('fr-FR')} restants)</button>
    {:else if liste.length === 0}
      <p class="doux">Aucun taxon ne correspond.</p>
    {/if}
  {/if}

  <h2>Référentiel</h2>
  <button class="bouton secondaire" onclick={() => (rechercheTaxref = !rechercheTaxref)}>
    {rechercheTaxref ? 'Masquer la recherche TAXREF' : 'Chercher un taxon dans TAXREF'}
  </button>
</section>

{#if rechercheTaxref}
  <TaxonSearchScreen />
{/if}

<style>
  .total {
    font-size: 1.15rem;
    margin-bottom: 4px;
  }
  .puces {
    display: flex;
    gap: 8px;
    margin: 10px -16px;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .puce {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--bord);
    border-radius: 22px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 600;
  }
  .puce.petite {
    min-height: 40px;
    font-size: 0.92rem;
  }
  .puce.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
  }
  .nombre {
    opacity: 0.75;
    font-weight: 400;
  }
  .annees {
    margin: 4px 0 12px;
    padding: 0 16px;
    border-radius: 14px;
    background: var(--surface);
  }
  .annees summary {
    min-height: 52px;
    display: flex;
    align-items: center;
    font-weight: 700;
    cursor: pointer;
  }
  .annees ul {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
  }
  .annees li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid var(--bord);
  }
  .champ {
    width: 100%;
    min-height: 52px;
    padding: 0 16px;
    font-size: 1.05rem;
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
    margin: 4px 0 12px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .ligne {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px;
    border: 0;
    border-left: 8px solid var(--couleur);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
  }
  .vignette {
    flex: none;
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    overflow: hidden;
    background: color-mix(in srgb, var(--couleur) 18%, var(--surface));
    color: var(--couleur);
  }
  .texte {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .texte strong,
  .texte em {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .texte small {
    color: var(--texte-doux);
  }
</style>
