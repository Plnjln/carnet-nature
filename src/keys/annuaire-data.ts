// Annuaire des clés et guides d'identification en ligne.
// Chaque lien a été ouvert et vérifié avant d'être ajouté (voir la date ci-dessous).
// Pour en ajouter un : copier une entrée dans l'un des fichiers ci-dessous, et ranger `path`
// du groupe le plus large au plus précis.

import { ANNUAIRE_AUTRES } from './annuaire-autres';
import { ANNUAIRE_INSECTES } from './annuaire-insectes';
import type { KeyLink } from './types';

/** Date de la dernière vérification des liens. */
export const ANNUAIRE_VERIFIE_LE = '2026-11-13';

export const ANNUAIRE: KeyLink[] = [...ANNUAIRE_INSECTES, ...ANNUAIRE_AUTRES];
