<script lang="ts">
  // Recadrage simple : quatre curseurs rognent chaque bord, avec un aperçu de la zone gardée.
  import type { CropRect } from '../../db/photos';

  let {
    url,
    busy = false,
    onCancel,
    onApply,
  }: { url: string; busy?: boolean; onCancel: () => void; onApply: (r: CropRect) => void } = $props();

  const MAX = 45; // on ne rogne pas plus de 45 % par bord

  let gauche = $state(0);
  let droite = $state(0);
  let haut = $state(0);
  let bas = $state(0);

  const inchange = $derived(gauche + droite + haut + bas === 0);
</script>

<div class="recadrage">
  <div class="apercu">
    <div class="cadre">
      <img src={url} alt="" />
      <div class="ombre" style="left: 0; top: 0; bottom: 0; width: {gauche}%"></div>
      <div class="ombre" style="right: 0; top: 0; bottom: 0; width: {droite}%"></div>
      <div class="ombre" style="left: {gauche}%; right: {droite}%; top: 0; height: {haut}%"></div>
      <div class="ombre" style="left: {gauche}%; right: {droite}%; bottom: 0; height: {bas}%"></div>
    </div>
  </div>

  <div class="curseurs">
    <label><span>Gauche</span><input type="range" min="0" max={MAX} bind:value={gauche} /></label>
    <label><span>Droite</span><input type="range" min="0" max={MAX} bind:value={droite} /></label>
    <label><span>Haut</span><input type="range" min="0" max={MAX} bind:value={haut} /></label>
    <label><span>Bas</span><input type="range" min="0" max={MAX} bind:value={bas} /></label>
  </div>

  <div class="actions">
    <button class="bouton" disabled={inchange || busy} onclick={() => onApply({ left: gauche / 100, right: droite / 100, top: haut / 100, bottom: bas / 100 })}>
      {busy ? 'Recadrage…' : 'Appliquer le recadrage'}
    </button>
    <button class="bouton secondaire" disabled={busy} onclick={onCancel}>Annuler</button>
  </div>
  <p class="doux">Le recadrage remplace la photo enregistrée : il ne peut pas être annulé ensuite.</p>
</div>

<style>
  .recadrage {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
  .apercu {
    display: flex;
    justify-content: center;
    background: #000;
    border-radius: 12px;
    padding: 6px;
  }
  .cadre {
    position: relative;
    display: inline-block;
    line-height: 0;
  }
  .cadre img {
    max-width: 100%;
    max-height: 50vh;
  }
  .ombre {
    position: absolute;
    background: rgba(0, 0, 0, 0.68);
    pointer-events: none;
  }
  .curseurs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
  }
  .curseurs label {
    display: flex;
    flex-direction: column;
    font-weight: 600;
    color: var(--texte-doux);
  }
  .curseurs input {
    width: 100%;
    height: 40px;
    accent-color: var(--accent);
  }
  .actions {
    display: grid;
    gap: 8px;
  }
</style>
