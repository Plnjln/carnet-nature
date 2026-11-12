<script lang="ts">
  // Déroulement d'une clé : une question à la fois, avec le rappel des réponses déjà données.
  import { AVERTISSEMENT, CLES } from '../../keys/cles';
  import { nombreDans } from '../../keys/annuaire';
  import type { IdKey } from '../../keys/types';

  let {
    cle,
    onClose,
    onOpenKey,
    onOpenDirectory,
  }: {
    cle: IdKey;
    onClose: () => void;
    /** Enchaîner sur une autre clé. */
    onOpenKey: (c: IdKey) => void;
    /** Ouvrir une branche de l'annuaire. */
    onOpenDirectory: (chemin: string[]) => void;
  } = $props();

  // Réponses données : nœud de la question et texte du choix retenu.
  let parcours = $state.raw<{ noeud: string; reponse: string }[]>([]);
  let courant = $state(cle.debut);

  const noeud = $derived(cle.noeuds[courant]);
  const suite = $derived(noeud?.type === 'resultat' && noeud.suite ? CLES.find((c) => c.id === noeud.suite) : undefined);
  const branche = $derived(noeud?.type === 'resultat' && noeud.annuaire && nombreDans(noeud.annuaire) > 0 ? noeud.annuaire : undefined);

  function choisir(reponse: string, vers: string) {
    parcours = [...parcours, { noeud: courant, reponse }];
    courant = vers;
  }

  /** Revenir à une question déjà passée (et oublier ce qui a suivi). */
  function revenir(i: number) {
    courant = parcours[i].noeud;
    parcours = parcours.slice(0, i);
  }

  function recommencer() {
    parcours = [];
    courant = cle.debut;
  }
</script>

<div class="fiche" role="dialog" aria-modal="true" aria-label={cle.titre}>
  <header class="tete">
    <button class="retour" onclick={onClose} aria-label="Retour">←</button>
    <span>{cle.titre}</span>
  </header>

  <div class="corps">
    <div class="contenu">
      <p class="avertissement">{AVERTISSEMENT}</p>

      {#if parcours.length}
        <ol class="parcours">
          {#each parcours as etape, i (i)}
            <li>
              <button onclick={() => revenir(i)} title="Revenir à cette question">
                <span class="numero">{i + 1}</span>
                <span>{etape.reponse}</span>
              </button>
            </li>
          {/each}
        </ol>
      {/if}

      {#if !noeud}
        <p class="alerte">Cette clé est incomplète à cet endroit.</p>
      {:else if noeud.type === 'question'}
        <h1>{noeud.texte}</h1>
        <div class="choix">
          {#each noeud.choix as c (c.vers + c.texte)}
            <button class="option" onclick={() => choisir(c.texte, c.vers)}>{c.texte}</button>
          {/each}
        </div>
      {:else}
        <div class="resultat">
          <p class="doux">Résultat</p>
          <h1>{noeud.nom}</h1>
          {#if noeud.sci}<p><em>{noeud.sci}</em></p>{/if}
          {#if noeud.texte}<p>{noeud.texte}</p>{/if}
        </div>
        <div class="actions">
          {#if suite}
            <button class="bouton" onclick={() => onOpenKey(suite)}>Continuer : {suite.titre}</button>
          {/if}
          {#if branche}
            <button class="bouton" class:secondaire={!!suite} onclick={() => onOpenDirectory(branche)}>
              Clés en ligne : {branche.join(' › ')}
            </button>
          {/if}
          <button class="bouton secondaire" onclick={recommencer}>Recommencer</button>
        </div>
      {/if}

      {#if parcours.length && noeud?.type === 'question'}
        <button class="bouton secondaire petit" onclick={() => revenir(parcours.length - 1)}>← Question précédente</button>
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
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .avertissement {
    margin: 0;
    padding: 10px 14px;
    border-left: 5px solid var(--alerte);
    border-radius: 8px;
    background: var(--surface);
    font-size: 0.88rem;
    color: var(--texte-doux);
  }
  .parcours {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .parcours button {
    display: flex;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    border: 0;
    border-radius: 10px;
    background: var(--surface);
    color: var(--texte-doux);
    text-align: left;
    font-size: 0.9rem;
  }
  .numero {
    flex: none;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--accent);
    color: var(--sur-accent);
    font-weight: 700;
    font-size: 0.8rem;
  }
  h1 {
    margin: 0;
    font-size: 1.3rem;
  }
  .choix,
  .actions {
    display: grid;
    gap: 10px;
  }
  .option {
    min-height: 64px;
    padding: 14px 16px;
    border: 2px solid var(--bord);
    border-radius: 14px;
    background: var(--surface);
    color: var(--texte);
    text-align: left;
    font-size: 1.02rem;
    line-height: 1.35;
  }
  .option:active {
    border-color: var(--accent);
  }
  .resultat {
    padding: 16px;
    border-radius: 14px;
    border: 3px solid var(--accent);
    background: var(--surface);
  }
  .resultat .doux {
    margin: 0;
  }
  .petit {
    min-height: 48px;
    align-self: flex-start;
  }
</style>
