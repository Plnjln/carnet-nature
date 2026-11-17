<script lang="ts" module>
  // Icônes au trait de l'interface (repère 24 × 24), dessinées pour l'app.
  export type IconName =
    | 'galerie'
    | 'carte'
    | 'especes'
    | 'cles'
    | 'plus'
    | 'sortie'
    | 'donnees'
    | 'soleil'
    | 'lune'
    | 'auto'
    | 'retour'
    | 'fermer'
    | 'chercher'
    | 'feuille';

  const TRACES: Record<IconName, string> = {
    galerie: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    carte: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    especes: '<path d="M5 19.5C5 11 10.5 5 19.5 4.5 19.5 13 14 19 5.5 19.5"/><path d="M5 19.5 14 10.5"/>',
    cles: '<circle cx="8" cy="15.5" r="4"/><path d="m10.9 12.6 8.6-8.6M16.5 7l2.5 2.5M14 9.5l2 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sortie: '<circle cx="6" cy="19" r="1.8"/><circle cx="18" cy="5" r="1.8"/><path d="M6 17.2V9.5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v5a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6.8"/>',
    donnees: '<rect x="3.5" y="4" width="17" height="4.5" rx="1.2"/><path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    lune: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"/>',
    auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
    retour: '<path d="M15 5l-7 7 7 7"/>',
    fermer: '<path d="M6 6l12 12M18 6 6 18"/>',
    chercher: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
    feuille: '<path d="M6 18C6 10.5 11 5.5 19 5c0 8-5 13-12.5 13.5"/><path d="M6 18c2-3 5-6 9-8.5"/>',
  };
</script>

<script lang="ts">
  let { name, size = 24, stroke = 1.8 }: { name: IconName; size?: number | string; stroke?: number } = $props();
</script>

<svg
  class="icone"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {@html TRACES[name]}
</svg>

<style>
  .icone {
    flex: none;
    display: inline-block;
    vertical-align: middle;
  }
</style>
