<script lang="ts">
  // Écran « Données » : état du stockage local, outils de développement, sources et licences.
  import { onMount } from 'svelte';
  import { db, requestPersistence } from '../../db/db';
  import { loadProjection } from '../../db/projection';
  import { obsStore } from '../../stores/obs.svelte';
  import { initTaxonIndex, type IndexInfo } from '../../taxonomy/client';
  import { deleteFakeData, generateFakeData } from './fake-data';

  let persistant = $state<boolean | null>(null);
  let utilise = $state<number | null>(null);
  let quota = $state<number | null>(null);
  let nbObs = $state<number | null>(null);
  let nbPhotos = $state<number | null>(null);
  let index = $state<IndexInfo | null>(null);

  let occupe = $state(false);
  let progression = $state('');
  let message = $state('');

  const mo = (octets: number) => `${(octets / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;

  async function rafraichir() {
    try {
      persistant = (await navigator.storage?.persisted?.()) ?? null;
      const estimation = await navigator.storage?.estimate?.();
      utilise = estimation?.usage ?? null;
      quota = estimation?.quota ?? null;
    } catch {
      persistant = null;
    }
    nbObs = await db.observations.where('deleted').equals(0).count();
    nbPhotos = await db.photos.count();
  }

  onMount(() => {
    void rafraichir();
    initTaxonIndex()
      .then((i) => (index = i))
      .catch(() => (index = null));
  });

  async function demanderPersistance() {
    persistant = await requestPersistence();
    if (!persistant) message = "Le navigateur n'a pas accordé le stockage persistant. Installer l'app sur l'écran d'accueil aide en général.";
  }

  async function generer() {
    occupe = true;
    message = '';
    try {
      const r = await generateFakeData(10_000, (fait, total) => (progression = `${fait.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')}`));
      message = `${r.observations.toLocaleString('fr-FR')} observations et ${r.photos.toLocaleString('fr-FR')} miniatures créées en ${(r.ms / 1000).toFixed(1)} s${r.depuisIndex ? '' : ' (index TAXREF indisponible : liste de secours)'}.`;
    } catch (e) {
      message = `Échec : ${e instanceof Error ? e.message : String(e)}`;
    }
    progression = '';
    occupe = false;
    await rafraichir();
    await obsStore.load();
  }

  async function supprimer() {
    if (!confirm('Supprimer toutes les observations factices ?')) return;
    occupe = true;
    message = '';
    try {
      const n = await deleteFakeData();
      message = `${n.toLocaleString('fr-FR')} observations factices supprimées.`;
    } catch (e) {
      message = `Échec : ${e instanceof Error ? e.message : String(e)}`;
    }
    occupe = false;
    await rafraichir();
    await obsStore.load();
  }

  async function mesurer() {
    occupe = true;
    try {
      const r = await loadProjection();
      message = `Projection en mémoire : ${r.rows.length.toLocaleString('fr-FR')} observations chargées en ${r.ms} ms.`;
    } catch (e) {
      message = `Échec : ${e instanceof Error ? e.message : String(e)}`;
    }
    occupe = false;
  }
</script>

<section class="page">
  <h1>Données</h1>
  <p class="doux">Tout est enregistré sur cet appareil. L'export et la sauvegarde arrivent à l'étape suivante.</p>

  <h2>Stockage</h2>
  <ul class="faits">
    <li><span>Observations</span><strong>{nbObs?.toLocaleString('fr-FR') ?? '…'}</strong></li>
    <li><span>Photos</span><strong>{nbPhotos?.toLocaleString('fr-FR') ?? '…'}</strong></li>
    <li>
      <span>Espace utilisé</span>
      <strong>{utilise !== null ? mo(utilise) : '…'}{quota ? ` sur ${mo(quota)}` : ''}</strong>
    </li>
    <li>
      <span>Stockage persistant</span>
      <strong>{persistant === null ? 'inconnu' : persistant ? 'oui' : 'non'}</strong>
    </li>
  </ul>
  {#if persistant === false}
    <button class="bouton secondaire" onclick={demanderPersistance}>Demander le stockage persistant</button>
  {/if}

  <h2>Développement</h2>
  <p class="doux">Jeu de données factice pour vérifier que l'app reste fluide avec 10 000 observations.</p>
  <div class="actions">
    <button class="bouton" onclick={generer} disabled={occupe}>
      {occupe && progression ? progression : 'Générer 10 000 observations'}
    </button>
    <button class="bouton secondaire" onclick={mesurer} disabled={occupe}>Mesurer le chargement</button>
    <button class="bouton danger" onclick={supprimer} disabled={occupe}>Supprimer les données factices</button>
  </div>
  {#if message}
    <p class="message">{message}</p>
  {/if}

  <h2>Sources et licences</h2>
  <p class="doux">
    Noms et classification : {index ? index.source : 'TAXREF'} — Gargominy O (2025). TAXREF. UAR PatriNat (OFB-MNHN-CNRS-IRD), Paris.
    Licence CC BY 4.0.
    {#if index}Index généré le {new Date(index.genereLe).toLocaleDateString('fr-FR')}.{/if}
  </p>
  <p class="doux">Fonds de carte (à venir) : © contributeurs OpenStreetMap, © IGN Géoplateforme.</p>
</section>

<style>
  .faits {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    border-radius: 14px;
    background: var(--surface);
  }
  .faits li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bord);
  }
  .faits li:last-child {
    border-bottom: 0;
  }
  .actions {
    display: grid;
    gap: 10px;
  }
  .message {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--surface);
    font-weight: 600;
  }
</style>
