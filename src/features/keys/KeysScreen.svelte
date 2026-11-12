<script lang="ts">
  // Onglet « Clés » : les clés d'orientation par grands groupes, et l'annuaire des clés en ligne,
  // rangé en arborescence (Insectes › Coléoptères › famille › genre).
  import { GROUPS } from '../../domain/groups';
  import { chercherLiens, liensIci, sousRubriques, TOTAL_LIENS } from '../../keys/annuaire';
  import { CLES } from '../../keys/cles';
  import type { IdKey, KeyLink } from '../../keys/types';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let {
    chemin,
    onNavigate,
    onOpenKey,
  }: {
    /** Branche de l'annuaire affichée (tableau vide = racine). */
    chemin: string[];
    onNavigate: (chemin: string[]) => void;
    onOpenKey: (c: IdKey) => void;
  } = $props();

  const LANGUES: Record<string, string> = { fr: 'français', en: 'anglais', de: 'allemand', nl: 'néerlandais', es: 'espagnol', it: 'italien' };

  let recherche = $state('');

  const rubriques = $derived(sousRubriques(chemin));
  const liens = $derived(liensIci(chemin));
  const trouves = $derived(chercherLiens(recherche));
</script>

{#snippet carte(l: KeyLink, avecChemin: boolean)}
  <li class="lien">
    <a href={l.url} target="_blank" rel="noopener noreferrer">
      <strong>{l.title}</strong>
      {#if avecChemin}<small class="fil-lien">{l.path.join(' › ')}</small>{/if}
      <span>{l.scope}</span>
      <small>
        {l.kind} · {LANGUES[l.language] ?? l.language}{l.year ? ` · ${l.year}` : ''} · {l.author}
      </small>
      {#if l.nonVerifie}<small class="non-verifie">Lien non contrôlé</small>{/if}
    </a>
  </li>
{/snippet}

<section class="page">
  <h1>Clés d'identification</h1>

  <h2>Clés par grands groupes</h2>
  <p class="doux">Pour s'orienter jusqu'à l'ordre ou la famille, une question à la fois.</p>
  <ul class="cles">
    {#each CLES as c (c.id)}
      <li>
        <button class="cle" style="--couleur: {GROUPS[c.groupe].color}" onclick={() => onOpenKey(c)}>
          <span class="icone"><GroupIcon group={c.groupe} size="1.7rem" /></span>
          <span class="texte">
            <strong>{c.titre}</strong>
            <small>{c.portee}</small>
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <h2>Annuaire des clés en ligne</h2>
  {#if TOTAL_LIENS === 0}
    <p class="doux">L'annuaire est en cours de constitution.</p>
  {:else}
    <p class="doux">{TOTAL_LIENS} ressources gratuites, classées du groupe le plus large au plus précis. Elles s'ouvrent dans le navigateur et demandent du réseau. Celles marquées « lien non contrôlé » viennent de sources reconnues mais n'ont pas été ouvertes pour vérification.</p>

    <input class="champ" type="search" placeholder="Chercher (ex. taupins, syrphes, chauves-souris)" autocomplete="off" bind:value={recherche} />

    {#if recherche.trim()}
      <p class="doux">{trouves.length} résultat{trouves.length > 1 ? 's' : ''}</p>
      <ul class="liens">
        {#each trouves as l (l.url + l.path.join('/'))}
          {@render carte(l, true)}
        {/each}
      </ul>
    {:else}
      <nav class="fil" aria-label="Position dans l'annuaire">
        <button class="miette" onclick={() => onNavigate([])} disabled={chemin.length === 0}>Tout</button>
        {#each chemin as nom, i (i)}
          <span aria-hidden="true">›</span>
          <button class="miette" onclick={() => onNavigate(chemin.slice(0, i + 1))} disabled={i === chemin.length - 1}>{nom}</button>
        {/each}
      </nav>

      {#if rubriques.length}
        <ul class="rubriques">
          {#each rubriques as r (r.nom)}
            <li>
              <button class="rubrique" onclick={() => onNavigate([...chemin, r.nom])}>
                <span>{r.nom}</span>
                <span class="nombre">{r.n}</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if liens.length}
        {#if chemin.length}<p class="doux">Ressources pour « {chemin[chemin.length - 1]} » dans son ensemble</p>{/if}
        <ul class="liens">
          {#each liens as l (l.url)}
            {@render carte(l, false)}
          {/each}
        </ul>
      {:else if rubriques.length === 0}
        <p class="doux">Aucune ressource vérifiée pour cette rubrique pour l'instant.</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .cles,
  .liens,
  .rubriques {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .cle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 64px;
    padding: 10px 12px;
    border: 0;
    border-left: 8px solid var(--couleur);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
  }
  .icone {
    display: inline-flex;
    color: var(--couleur);
  }
  .texte {
    display: flex;
    flex-direction: column;
  }
  .texte small {
    color: var(--texte-doux);
  }
  .champ {
    width: 100%;
    min-height: 52px;
    margin-bottom: 10px;
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
  .fil {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    color: var(--texte-doux);
  }
  .miette {
    min-height: 40px;
    padding: 0 12px;
    border: 2px solid var(--bord);
    border-radius: 20px;
    background: var(--surface);
    color: var(--accent);
    font-weight: 700;
  }
  .miette:disabled {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
    opacity: 1;
  }
  .rubrique {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 0 16px;
    border: 0;
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    font-weight: 700;
    font-size: 1.02rem;
  }
  .nombre {
    min-width: 28px;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--fond);
    color: var(--texte-doux);
    text-align: center;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .lien a {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 2px solid var(--bord);
    background: var(--surface);
    color: var(--texte);
    text-decoration: none;
  }
  .lien strong {
    color: var(--accent);
    text-decoration: underline;
  }
  .lien small {
    color: var(--texte-doux);
  }
  .fil-lien {
    font-weight: 600;
  }
  .lien .non-verifie {
    font-style: italic;
  }
</style>
