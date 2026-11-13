<script lang="ts">
  // Étiquettes des statuts d'un taxon : protection, liste rouge, directives, espèce envahissante.
  import { formatStatuts, getStatuts, type StatutAffiche } from '../reference/statuts';

  let {
    cdNom,
    /** Affiche aussi l'intitulé officiel sous les étiquettes. */
    detail = false,
    /** N'affiche que ce qui mérite l'attention (masque « préoccupation mineure », etc.). */
    important = false,
  }: { cdNom: number | null; detail?: boolean; important?: boolean } = $props();

  let statuts = $state.raw<StatutAffiche[]>([]);

  $effect(() => {
    const id = cdNom;
    statuts = [];
    if (id === null) return;
    let annule = false;
    getStatuts(id).then((s) => {
      if (!annule) statuts = formatStatuts(s);
    });
    return () => {
      annule = true;
    };
  });

  const affiches = $derived(important ? statuts.filter((s) => s.ton !== 'neutre') : statuts);
</script>

{#if affiches.length}
  <div class="statuts">
    <div class="etiquettes">
      {#each affiches as s (s.texte)}
        <span class="etiquette {s.ton}" title={s.detail}>{s.texte}</span>
      {/each}
    </div>
    {#if detail}
      <ul>
        {#each affiches as s (s.texte)}
          <li>{s.detail}</li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .statuts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .etiquettes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .etiquette {
    padding: 4px 10px;
    border-radius: 14px;
    border: 2px solid var(--bord);
    background: var(--surface);
    color: var(--texte);
    font-size: 0.88rem;
    font-weight: 700;
  }
  .protege {
    border-color: #17603f;
    background: #17603f;
    color: #fff;
  }
  .menace {
    border-color: #a1260d;
    background: #a1260d;
    color: #fff;
  }
  .attention {
    border-color: #a86400;
    background: #a86400;
    color: #fff;
  }
  .envahissante {
    border-color: #6b2a8f;
    background: #6b2a8f;
    color: #fff;
  }
  ul {
    margin: 0;
    padding-left: 18px;
    font-size: 0.82rem;
    color: var(--texte-doux);
  }
</style>
