<script lang="ts">
  // Sorties de terrain : démarrer une sortie, et retrouver les sorties passées.
  import { onMount } from 'svelte';
  import { getTrack, listSessions } from '../../db/sessions';
  import type { FieldSession } from '../../domain/types';
  import { lengthM, type LonLat } from '../../geo/geometry';
  import { obsStore } from '../../stores/obs.svelte';
  import { sessionStore } from '../../stores/session.svelte';

  let {
    onClose,
    onStarted,
    onShow,
  }: {
    onClose: () => void;
    onStarted: (s: FieldSession) => void;
    /** Afficher les observations d'une sortie, dans la galerie ou sur la carte. */
    onShow: (s: FieldSession, ou: 'galerie' | 'carte') => void;
  } = $props();

  const aujourdhui = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  let nom = $state(`Sortie du ${aujourdhui}`);
  let lieu = $state('');
  let participants = $state('');
  let trace = $state(true);
  let demarrage = $state(false);
  let erreur = $state('');
  let sorties = $state.raw<FieldSession[]>([]);
  let longueurs = $state.raw<Record<string, number>>({});

  // Nombre d'observations et de taxons par sortie.
  const bilans = $derived.by(() => {
    const parSortie = new Map<string, { n: number; taxons: Set<string> }>();
    for (const o of obsStore.rows) {
      if (!o.session) continue;
      let b = parSortie.get(o.session);
      if (!b) {
        b = { n: 0, taxons: new Set() };
        parSortie.set(o.session, b);
      }
      b.n++;
      if (o.taxonKey) b.taxons.add(o.taxonKey);
    }
    return parSortie;
  });

  onMount(async () => {
    sorties = await listSessions();
    // Longueur des traces enregistrées.
    const mesures: Record<string, number> = {};
    for (const s of sorties.slice(0, 60)) {
      const t = await getTrack(s.id);
      if (t && t.points.length > 1) mesures[s.id] = lengthM(t.points.map((p): LonLat => [p[0], p[1]]));
    }
    longueurs = mesures;
  });

  async function demarrer() {
    if (demarrage) return;
    demarrage = true;
    erreur = '';
    try {
      const session = await sessionStore.start(
        { name: nom, placeName: lieu, participants: participants.split(',').map((p) => p.trim()).filter(Boolean) },
        trace,
      );
      onStarted(session);
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
      demarrage = false;
    }
  }

  function duree(s: FieldSession): string {
    if (!s.endAt) return 'en cours';
    const minutes = Math.round((Date.parse(s.endAt) - Date.parse(s.startAt)) / 60_000);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  }

  const distance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`);
  const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
</script>

<div class="fiche" role="dialog" aria-modal="true" aria-label="Sorties">
  <header class="tete">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <span>Sorties</span>
  </header>

  <div class="corps">
    <div class="contenu">
      {#if sessionStore.active}
        <p class="encart">Une sortie est en cours : « {sessionStore.active.name ?? 'Sortie'} ». Termine-la depuis le bandeau en haut de l'écran pour en démarrer une autre.</p>
      {:else}
        <h2>Démarrer une sortie</h2>
        <p class="doux">Pendant la sortie, chaque observation saisie s'y rattache, avec le lieu-dit prérempli.</p>
        <label class="ligne">
          <span>Nom</span>
          <input class="champ" type="text" bind:value={nom} />
        </label>
        <label class="ligne">
          <span>Lieu-dit (facultatif)</span>
          <input class="champ" type="text" placeholder="Ex. Étang neuf" bind:value={lieu} />
        </label>
        <label class="ligne">
          <span>Participants (facultatif, séparés par des virgules)</span>
          <input class="champ" type="text" bind:value={participants} />
        </label>
        <label class="case">
          <input type="checkbox" bind:checked={trace} />
          <span>Enregistrer la trace GPS</span>
        </label>
        {#if trace}
          <p class="doux">La trace n'avance que lorsque l'app est ouverte à l'écran. L'écran restera allumé pendant la sortie, ce qui consomme de la batterie.</p>
        {/if}
        {#if erreur}<p class="alerte">Démarrage impossible : {erreur}</p>{/if}
        <button class="bouton" onclick={demarrer} disabled={demarrage}>{demarrage ? 'Démarrage…' : 'Démarrer la sortie'}</button>
      {/if}

      <h2>Mes sorties</h2>
      {#if sorties.length === 0}
        <p class="doux">Aucune sortie enregistrée pour l'instant.</p>
      {:else}
        <ul class="liste">
          {#each sorties as s (s.id)}
            {@const b = bilans.get(s.id)}
            <li>
              <strong>{s.name ?? 'Sortie'}</strong>
              <small>
                {date(s.startAt)} · {duree(s)}{s.placeName ? ` · ${s.placeName}` : ''}{longueurs[s.id] ? ` · ${distance(longueurs[s.id])}` : ''}
              </small>
              <small>{b?.n ?? 0} observation{(b?.n ?? 0) > 1 ? 's' : ''}, {b?.taxons.size ?? 0} taxon{(b?.taxons.size ?? 0) > 1 ? 's' : ''}{s.participants?.length ? ` · avec ${s.participants.join(', ')}` : ''}</small>
              <div class="actions">
                <button class="pastille" onclick={() => onShow(s, 'galerie')}>Galerie</button>
                <button class="pastille" onclick={() => onShow(s, 'carte')}>Carte et trace</button>
              </div>
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
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .encart {
    margin: 12px 0 0;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface);
    font-weight: 600;
  }
  .ligne {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ligne > span {
    font-weight: 600;
    color: var(--texte-doux);
  }
  .champ {
    width: 100%;
    min-height: 52px;
    padding: 0 16px;
    font-size: 1.05rem;
    border: 2px solid var(--bord);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
  }
  .case {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    font-weight: 600;
  }
  .case input {
    width: 24px;
    height: 24px;
    accent-color: var(--accent);
  }
  .liste {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .liste li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface);
  }
  .liste small {
    color: var(--texte-doux);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .pastille {
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--accent);
    border-radius: 22px;
    background: transparent;
    color: var(--accent);
    font-weight: 700;
  }
</style>
