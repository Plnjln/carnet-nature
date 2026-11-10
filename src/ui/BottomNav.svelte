<script lang="ts">
  // Barre de navigation du bas : deux écrans, le gros bouton « + », deux écrans.
  import { SCREENS, type Screen } from './screens';

  let {
    current,
    onNavigate,
    onAdd,
  }: { current: Screen; onNavigate: (s: Screen) => void; onAdd: () => void } = $props();

  const gauche = SCREENS.slice(0, 2);
  const droite = SCREENS.slice(2);
</script>

<nav class="barre" aria-label="Navigation principale">
  {#each gauche as s (s.id)}
    <button class="onglet" class:actif={current === s.id} aria-current={current === s.id ? 'page' : undefined} onclick={() => onNavigate(s.id)}>
      <span class="icone" aria-hidden="true">{s.icon}</span>
      <span>{s.label}</span>
    </button>
  {/each}

  <button class="ajouter" aria-label="Nouvelle observation" onclick={onAdd}>+</button>

  {#each droite as s (s.id)}
    <button class="onglet" class:actif={current === s.id} aria-current={current === s.id ? 'page' : undefined} onclick={() => onNavigate(s.id)}>
      <span class="icone" aria-hidden="true">{s.icon}</span>
      <span>{s.label}</span>
    </button>
  {/each}
</nav>

<style>
  .barre {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 1fr 1fr 88px 1fr 1fr;
    align-items: end;
    background: var(--surface);
    border-top: 2px solid var(--bord);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .onglet {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 64px;
    border: 0;
    background: none;
    color: var(--texte-doux);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .onglet.actif {
    color: var(--accent);
  }
  .icone {
    font-size: 1.5rem;
    line-height: 1;
  }
  .ajouter {
    justify-self: center;
    width: 76px;
    height: 76px;
    margin-bottom: 10px;
    border-radius: 50%;
    border: 4px solid var(--surface);
    background: var(--accent);
    color: var(--sur-accent);
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }
  .ajouter:active {
    transform: scale(0.94);
  }
</style>
