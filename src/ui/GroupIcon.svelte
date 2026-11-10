<script lang="ts">
  // Icône d'un groupe taxonomique : silhouette dessinée si elle existe, émoji sinon.
  // La silhouette prend la couleur du texte environnant.
  import { GROUPS, type GroupId } from '../domain/groups';

  let { group, size = '1.4rem' }: { group: GroupId; size?: string } = $props();

  const info = $derived(GROUPS[group] ?? GROUPS.autres);
</script>

{#if info.svg}
  <svg
    class="icone"
    viewBox="0 0 24 24"
    style="width: {size}; height: {size}"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1.1"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {@html info.svg}
  </svg>
{:else}
  <span class="icone" style="font-size: {size}" aria-hidden="true">{info.icon}</span>
{/if}

<style>
  .icone {
    flex: none;
    display: inline-block;
    line-height: 1;
    vertical-align: middle;
  }
</style>
