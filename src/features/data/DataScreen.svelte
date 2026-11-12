<script lang="ts">
  // Écran « Données » : état du stockage local, outils de développement, sources et licences.
  import { onMount } from 'svelte';
  import { db, requestPersistence } from '../../db/db';
  import { loadProjection } from '../../db/projection';
  import { obsStore } from '../../stores/obs.svelte';
  import { initTaxonIndex, type IndexInfo } from '../../taxonomy/client';
  import { createBackup, lastBackupAt, restoreBackup } from './backup';
  import { dateFichier, download, loadActiveObservations, toCsv, toDarwinCore, toGeoJson } from './export';
  import { deleteFakeData, generateFakeData } from './fake-data';

  const versionInstallee = new Date(__BUILD_DATE__).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  let messageVersion = $state('');
  let miseAJourEnCours = $state(false);

  /** Demande au navigateur de chercher une version plus récente, l'installe et recharge la page. */
  async function mettreAJour() {
    miseAJourEnCours = true;
    messageVersion = '';
    try {
      const enregistrement = await navigator.serviceWorker?.getRegistration();
      if (!enregistrement) {
        location.reload();
        return;
      }
      await enregistrement.update();
      const nouveau = enregistrement.installing ?? enregistrement.waiting;
      if (!nouveau) {
        messageVersion = 'Tu as déjà la dernière version.';
      } else {
        messageVersion = 'Nouvelle version trouvée, installation…';
        await new Promise<void>((resolve) => {
          if (nouveau.state === 'activated') resolve();
          nouveau.addEventListener('statechange', () => {
            if (nouveau.state === 'activated') resolve();
          });
          setTimeout(resolve, 20_000);
        });
        location.reload();
      }
    } catch {
      messageVersion = 'Vérification impossible (pas de réseau ?).';
    }
    miseAJourEnCours = false;
  }

  let derniereSauvegarde = $state<Date | null>(null);
  let messageDonnees = $state('');
  let progressionSauvegarde = $state('');

  const pourcent = (fait: number, total: number) => (total ? `${Math.round((fait / total) * 100)} %` : '');

  async function exporter(format: 'csv' | 'geojson' | 'dwc') {
    occupe = true;
    messageDonnees = '';
    try {
      const obs = await loadActiveObservations();
      if (obs.length === 0) {
        messageDonnees = 'Aucune observation à exporter.';
      } else {
        const date = dateFichier();
        if (format === 'csv') download(toCsv(obs), `carnet-nature-${date}.csv`);
        else if (format === 'geojson') download(toGeoJson(obs), `carnet-nature-${date}.geojson`);
        else download(toDarwinCore(obs), `carnet-nature-darwin-core-${date}.csv`);
        messageDonnees = `${obs.length.toLocaleString('fr-FR')} observations exportées.`;
      }
    } catch (e) {
      messageDonnees = `Échec de l'export : ${e instanceof Error ? e.message : String(e)}`;
    }
    occupe = false;
  }

  async function sauvegarder() {
    occupe = true;
    messageDonnees = '';
    try {
      const r = await createBackup((fait, total) => (progressionSauvegarde = pourcent(fait, total)));
      const date = dateFichier();
      r.volumes.forEach((volume, i) => {
        const suffixe = r.volumes.length > 1 ? `-partie${i + 1}sur${r.volumes.length}` : '';
        // Les téléchargements sont espacés : le navigateur bloque ceux qui partent en rafale.
        setTimeout(() => download(volume, `carnet-nature-sauvegarde-${date}${suffixe}.zip`), i * 1200);
      });
      const taille = r.volumes.reduce((n, v) => n + v.size, 0);
      messageDonnees = `Sauvegarde créée : ${r.observations.toLocaleString('fr-FR')} observations, ${r.photos.toLocaleString('fr-FR')} photos, ${mo(taille)}${r.volumes.length > 1 ? ` en ${r.volumes.length} fichiers` : ''}. Range ${r.volumes.length > 1 ? 'ces fichiers' : 'ce fichier'} ailleurs que sur cet appareil.`;
      derniereSauvegarde = await lastBackupAt();
    } catch (e) {
      messageDonnees = `Échec de la sauvegarde : ${e instanceof Error ? e.message : String(e)}`;
    }
    progressionSauvegarde = '';
    occupe = false;
  }

  async function restaurer(e: Event) {
    const champ = e.currentTarget as HTMLInputElement;
    const fichiers = Array.from(champ.files ?? []);
    champ.value = '';
    if (fichiers.length === 0) return;
    occupe = true;
    messageDonnees = '';
    try {
      const r = await restoreBackup(fichiers, (fait, total) => (progressionSauvegarde = pourcent(fait, total)));
      messageDonnees = `Restauration terminée : ${r.observations.toLocaleString('fr-FR')} observations ajoutées ou mises à jour, ${r.inchangees.toLocaleString('fr-FR')} déjà à jour, ${r.images.toLocaleString('fr-FR')} images ajoutées.`;
    } catch (err) {
      messageDonnees = `Échec de la restauration : ${err instanceof Error ? err.message : String(err)}`;
    }
    progressionSauvegarde = '';
    occupe = false;
    await rafraichir();
    await obsStore.load();
  }

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
    derniereSauvegarde = await lastBackupAt();
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
  <p class="doux">Tout est enregistré sur cet appareil, et nulle part ailleurs : pense à sauvegarder régulièrement.</p>

  <h2>Sauvegarde</h2>
  <p class="doux">
    {#if derniereSauvegarde}
      Dernière sauvegarde : {derniereSauvegarde.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
    {:else}
      Aucune sauvegarde faite depuis cet appareil.
    {/if}
    Le fichier .zip contient les données et les photos.
  </p>
  <div class="actions">
    <button class="bouton" onclick={sauvegarder} disabled={occupe}>
      {occupe && progressionSauvegarde ? `En cours… ${progressionSauvegarde}` : 'Sauvegarder tout (.zip)'}
    </button>
    <label class="bouton secondaire" class:inactif={occupe}>
      Restaurer une sauvegarde
      <input type="file" accept=".zip,application/zip" multiple hidden disabled={occupe} onchange={restaurer} />
    </label>
  </div>
  <p class="doux">La restauration fusionne : elle ajoute ce qui manque et garde la version la plus récente de chaque observation.</p>

  <h2>Exports</h2>
  <div class="actions">
    <button class="bouton secondaire" onclick={() => exporter('csv')} disabled={occupe}>CSV (tableur)</button>
    <button class="bouton secondaire" onclick={() => exporter('geojson')} disabled={occupe}>GeoJSON (carte, SIG)</button>
    <button class="bouton secondaire" onclick={() => exporter('dwc')} disabled={occupe}>Darwin Core (GBIF, INPN)</button>
  </div>
  {#if messageDonnees}
    <p class="message">{messageDonnees}</p>
  {/if}

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

  <h2>Version</h2>
  <p class="doux">Version installée : {versionInstallee}.</p>
  <div class="actions">
    <button class="bouton secondaire" onclick={mettreAJour} disabled={miseAJourEnCours}>
      {miseAJourEnCours ? 'Vérification…' : 'Mettre à jour maintenant'}
    </button>
  </div>
  {#if messageVersion}
    <p class="message">{messageVersion}</p>
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
  .inactif {
    opacity: 0.5;
  }
  .message {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--surface);
    font-weight: 600;
  }
</style>
