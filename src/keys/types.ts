// Structure des clés d'identification et de l'annuaire de clés en ligne.

import type { GroupId } from '../domain/groups';

/** Une étape de clé : une question et ses réponses possibles. */
export interface KeyQuestion {
  type: 'question';
  texte: string;
  choix: {
    /** Description du caractère à observer. */
    texte: string;
    /** Identifiant du nœud suivant (question ou résultat). */
    vers: string;
  }[];
}

/** L'aboutissement d'une clé. */
export interface KeyResult {
  type: 'resultat';
  /** Nom français. */
  nom: string;
  /** Nom scientifique. */
  sci?: string;
  /** Remarques : limites, confusions possibles, exceptions. */
  texte?: string;
  /** Clé à enchaîner pour aller plus loin (identifiant). */
  suite?: string;
  /** Branche de l'annuaire où trouver des clés plus fines. */
  annuaire?: string[];
}

export type KeyNode = KeyQuestion | KeyResult;

export interface IdKey {
  id: string;
  titre: string;
  /** Ce que la clé couvre, et jusqu'à quel niveau. */
  portee: string;
  groupe: GroupId;
  /** Identifiant du premier nœud. */
  debut: string;
  noeuds: Record<string, KeyNode>;
}

/** Une ressource d'identification en ligne. */
export interface KeyLink {
  /** Position dans l'arborescence, du plus large au plus précis. */
  path: string[];
  title: string;
  url: string;
  author: string;
  /** Code de langue : fr, en, de… */
  language: string;
  /** clé, guide illustré, planches comparatives, site de référence, ouvrage PDF */
  kind: string;
  /** Ce que la ressource permet d'identifier. */
  scope: string;
  year: number | null;
  /** Vrai si le lien a été ajouté sans être ouvert pour contrôle (source reconnue). */
  nonVerifie?: boolean;
}
