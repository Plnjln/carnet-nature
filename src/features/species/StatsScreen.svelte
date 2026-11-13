<script lang="ts">
  // Graphiques : bilan par année, observations et taxons par mois, courbe d'accumulation, taxons par groupe.
  import { GROUPS, type GroupId } from '../../domain/groups';
  import { obsStore } from '../../stores/obs.svelte';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import { perMonth, summarize } from './species';
  import { accumulation, taxaPerMonth, yearly } from './stats';

  let { onClose }: { onClose: () => void } = $props();

  const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  // Dimensions du graphique d'accumulation (unités du dessin).
  const L = 600;
  const H = 220;

  const rows = $derived(obsStore.rows);
  const especes = $derived(summarize(rows).especes);
  const annees = $derived(yearly(rows, especes));
  const obsParMois = $derived(perMonth(rows));
  const taxonsParMois = $derived(taxaPerMonth(rows));
  const courbe = $derived(accumulation(especes));
  const parGroupe = $derived.by(() => {
    const compte = new Map<GroupId, number>();
    for (const e of especes) compte.set(e.group, (compte.get(e.group) ?? 0) + 1);
    return (Object.keys(GROUPS) as GroupId[])
      .filter((g) => compte.has(g))
      .map((g) => ({ id: g, n: compte.get(g) ?? 0 }))
      .sort((a, b) => b.n - a.n);
  });
  const maxGroupe = $derived(Math.max(1, ...parGroupe.map((g) => g.n)));

  // Tracé en escalier : le total ne monte qu'à chaque nouvelle espèce.
  const trace = $derived.by(() => {
    if (courbe.length === 0) return '';
    const t0 = courbe[0].t;
    const duree = Math.max(1, Math.max(Date.now(), courbe[courbe.length - 1].t) - t0);
    const total = courbe[courbe.length - 1].n;
    const x = (t: number) => ((t - t0) / duree) * L;
    const y = (n: number) => H - (n / total) * H;
    let d = `M0,${H}`;
    for (const p of courbe) d += ` H${x(p.t).toFixed(1)} V${y(p.n).toFixed(1)}`;
    return `${d} H${L}`;
  });

  const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
</script>

{#snippet barres(valeurs: number[], legende: string)}
  {@const max = Math.max(1, ...valeurs)}
  <div class="barres" role="img" aria-label="{legende} : {valeurs.map((n, i) => `${MOIS_LONGS[i]} ${n}`).join(', ')}">
    {#each valeurs as n, i (i)}
      <div class="mois" title="{MOIS_LONGS[i]} : {n}">
        <span class="valeur">{n || ''}</span>
        <span class="barre" style="height: {n ? Math.max(4, (n / max) * 100) : 0}%"></span>
        <span class="lettre">{MOIS[i]}</span>
      </div>
    {/each}
  </div>
{/snippet}

<div class="fiche" role="dialog" aria-modal="true" aria-label="Statistiques">
  <header class="tete">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <span>Statistiques</span>
  </header>

  <div class="corps">
    <div class="contenu">
      {#if rows.length === 0}
        <p class="doux">Les graphiques apparaîtront avec tes premières observations.</p>
      {:else}
        <h2>Bilan par année</h2>
        <table>
          <thead>
            <tr><th>Année</th><th>Observations</th><th>Taxons</th><th>Nouveaux</th></tr>
          </thead>
          <tbody>
            {#each annees as a (a.annee)}
              <tr>
                <td>{a.annee}</td>
                <td>{a.observations.toLocaleString('fr-FR')}</td>
                <td>{a.taxons.toLocaleString('fr-FR')}</td>
                <td>{a.nouveaux.toLocaleString('fr-FR')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="doux">« Nouveaux » : taxons observés pour la première fois cette année-là.</p>

        <h2>Courbe d'accumulation</h2>
        {#if courbe.length}
          <p class="doux">Nombre cumulé de taxons depuis ta première observation : {courbe[courbe.length - 1].n.toLocaleString('fr-FR')} à ce jour.</p>
          <div class="courbe">
            <svg viewBox="-4 -6 {L + 8} {H + 12}" preserveAspectRatio="none" role="img" aria-label="Courbe du nombre cumulé de taxons">
              <line x1="0" y1={H} x2={L} y2={H} class="axe" />
              <line x1="0" y1="0" x2="0" y2={H} class="axe" />
              <line x1="0" y1={H / 2} x2={L} y2={H / 2} class="repere" />
              <path d={trace} class="trait" />
            </svg>
            <div class="echelle">
              <span>{date(courbe[0].t)}</span>
              <span>aujourd'hui</span>
            </div>
          </div>
        {:else}
          <p class="doux">Aucun taxon identifié pour l'instant.</p>
        {/if}

        <h2>Observations par mois</h2>
        <p class="doux">Toutes années confondues.</p>
        {@render barres(obsParMois, 'Observations par mois')}

        <h2>Taxons par mois</h2>
        <p class="doux">Nombre de taxons différents observés chaque mois, toutes années confondues.</p>
        {@render barres(taxonsParMois, 'Taxons par mois')}

        <h2>Taxons par groupe</h2>
        <ul class="groupes">
          {#each parGroupe as g (g.id)}
            <li style="--couleur: {GROUPS[g.id].color}">
              <span class="etiquette"><GroupIcon group={g.id} size="1.1rem" /> {GROUPS[g.id].label}</span>
              <span class="jauge"><span style="width: {(g.n / maxGroupe) * 100}%"></span></span>
              <strong>{g.n.toLocaleString('fr-FR')}</strong>
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
    padding: 4px 16px 16px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 14px;
    overflow: hidden;
    background: var(--surface);
  }
  th,
  td {
    padding: 10px 12px;
    text-align: right;
    border-bottom: 1px solid var(--bord);
  }
  th:first-child,
  td:first-child {
    text-align: left;
    font-weight: 700;
  }
  th {
    color: var(--texte-doux);
    font-size: 0.85rem;
  }
  tr:last-child td {
    border-bottom: 0;
  }
  .courbe {
    padding: 12px;
    border-radius: 14px;
    background: var(--surface);
  }
  svg {
    display: block;
    width: 100%;
    height: 200px;
  }
  .axe {
    stroke: var(--texte-doux);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  .repere {
    stroke: var(--bord);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
  .trait {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .echelle {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 0.82rem;
    color: var(--texte-doux);
  }
  .barres {
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
    font-size: 0.7rem;
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
  .groupes {
    list-style: none;
    margin: 0;
    padding: 4px 12px;
    border-radius: 14px;
    background: var(--surface);
  }
  .groupes li {
    display: grid;
    grid-template-columns: minmax(120px, 34%) 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
  }
  .etiquette {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--couleur);
    font-weight: 600;
    min-width: 0;
  }
  .jauge {
    height: 14px;
    border-radius: 7px;
    background: var(--fond);
    overflow: hidden;
  }
  .jauge span {
    display: block;
    height: 100%;
    border-radius: 7px;
    background: var(--couleur);
  }
</style>
