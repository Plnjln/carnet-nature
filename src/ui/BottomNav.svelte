<script lang="ts">
  // Barre de navigation du bas : deux écrans, le bouton « + », deux écrans.
  import Icon from './Icon.svelte';
  import { SCREENS, type Screen } from './screens';

  let {
    current,
    onNavigate,
    onAdd,
  }: { current: Screen; onNavigate: (s: Screen) => void; onAdd: () => void } = $props();

  const gauche = SCREENS.slice(0, 2);
  const droite = SCREENS.slice(2);
</script>

{#snippet onglet(s: (typeof SCREENS)[number])}
  <button class="onglet" class:actif={current === s.id} aria-current={current === s.id ? 'page' : undefined} onclick={() => onNavigate(s.id)}>
    <span class="pastille"><Icon name={s.icon} size={22} stroke={current === s.id ? 2.1 : 1.8} /></span>
    <span class="libelle">{s.label}</span>
  </button>
{/snippet}

<nav class="barre" aria-label="Navigation principale">
  {#each gauche as s (s.id)}{@render onglet(s)}{/each}

  <button class="ajouter" aria-label="Nouvelle observation" onclick={onAdd}>
    <Icon name="plus" size={30} stroke={2.4} />
  </button>

  {#each droite as s (s.id)}{@render onglet(s)}{/each}
</nav>

<style>
  .barre {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 1fr 1fr 84px 1fr 1fr;
    align-items: center;
    height: calc(68px + env(safe-area-inset-bottom));
    padding: 0 6px env(safe-area-inset-bottom);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--bord);
  }
  .onglet {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: 60px;
    border: 0;
    background: none;
    color: var(--texte-doux);
  }
  .pastille {
    display: grid;
    place-items: center;
    width: 52px;
    height: 30px;
    border-radius: 15px;
    transition: background-color 0.18s ease, color 0.18s ease;
  }
  .libelle {
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .onglet.actif {
    color: var(--accent);
  }
  .onglet.actif .pastille {
    background: var(--accent-doux);
  }
  .onglet.actif .libelle {
    font-weight: 700;
  }
  .ajouter {
    justify-self: center;
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    margin-top: -26px;
    border-radius: 22px;
    border: 0;
    background: var(--accent);
    color: var(--sur-accent);
    box-shadow:
      0 0 0 5px var(--fond),
      0 8px 20px color-mix(in srgb, var(--accent) 45%, transparent);
    transition: transform 0.12s ease;
  }
  .ajouter:active {
    transform: scale(0.94);
  }
</style>
