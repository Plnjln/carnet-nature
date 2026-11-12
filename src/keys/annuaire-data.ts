// Annuaire des clés et guides d'identification en ligne.
// Pour ajouter un lien : copier une entrée dans l'un des fichiers ci-dessous, et ranger `path`
// du groupe le plus large au plus précis.
//   annuaire-insectes.ts, annuaire-autres.ts : liens ouverts et contrôlés un par un ;
//   annuaire-pistes.ts, annuaire-communaute.ts : liens de sources reconnues, ajoutés sans contrôle.

import { ANNUAIRE_AUTRES } from './annuaire-autres';
import { ANNUAIRE_COMMUNAUTE } from './annuaire-communaute';
import { ANNUAIRE_INSECTES } from './annuaire-insectes';
import { ANNUAIRE_PISTES } from './annuaire-pistes';
import type { KeyLink } from './types';

/** Date du dernier contrôle des liens vérifiés. */
export const ANNUAIRE_VERIFIE_LE = '2026-11-13';

export const ANNUAIRE: KeyLink[] = [...ANNUAIRE_INSECTES, ...ANNUAIRE_AUTRES, ...ANNUAIRE_PISTES, ...ANNUAIRE_COMMUNAUTE];
