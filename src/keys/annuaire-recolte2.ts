// Annuaire des clés en ligne : seconde récolte sur des pages d'index (16 novembre 2026).
// Sources : dossier de documents du GRENHA, publications en ligne de l'association R.A.R.E.,
// Online-Keys.net (diptères), répertoire de Diptera.info.
// Liens ajoutés SANS contrôle ; le classement est fait d'après le nom des fichiers.

import type { KeyLink } from './types';

function r(path: string[], title: string, url: string, author: string, language = 'fr', kind = 'clé', scope = '', year: number | null = null): KeyLink {
  return { path, title, url, author, language, kind, scope: scope || `${title}.`, year, nonVerifie: true };
}

const GRENHA = 'http://grenha.fr/documents/';
const RARE = 'https://r-a-r-e.fr/wp-content/uploads/';
const OK = 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=';
const SOURCE_GRENHA = 'Document diffusé par le GRENHA';
const SOURCE_RARE = 'Association R.A.R.E. (Roussillonnaise d’entomologie)';
const SOURCE_OK = 'Online-Keys.net (Paul Beuk)';

const I = 'Insectes';
const COL = [I, 'Coléoptères'];
const DIP = [I, 'Diptères'];
const CARABES = [...COL, 'Carabidae (carabiques)'];
const GRANDS_CARABES = [...CARABES, 'Carabus, Cychrus, Calosoma'];
const CICINDELES = [...CARABES, 'Cicindelinae (cicindèles)'];
const LONGICORNES = [...COL, 'Cerambycidae (longicornes)'];
const SCARA = [...COL, 'Scarabaeoidea (bousiers, hannetons, cétoines)'];
const LEP = [I, 'Lépidoptères'];

export const ANNUAIRE_RECOLTE_2: KeyLink[] = [
  // ---------- GRENHA
  r([I], 'Documents du GRENHA', GRENHA, 'GRENHA', 'fr', 'site de référence', 'Dossier d’une quarantaine de clés et de documents d’identification en PDF, tous groupes confondus.'),
  r([I], 'B.A.-BA de l’entomologie', `${GRENHA}BABA%20entomo-Marie-Constance%20RAILLOT-2018.pdf`, 'Marie-Constance Raillot', 'fr', 'guide illustré', 'Document d’initiation à l’entomologie.', 2018),
  r([...LONGICORNES, 'Agapanthia'], 'Le genre Agapanthia', `${GRENHA}Agapanthia-BrugotRemi.pdf`, 'Rémi Brugot', 'fr', 'clé', 'Identification des longicornes du genre Agapanthia.'),
  r([...LONGICORNES, 'Lepturinae (leptures)'], 'Lepturinae', `${GRENHA}Lepturinae%20de%20Pierre%20Berger.pdf`, 'Pierre Berger', 'fr', 'guide illustré', 'Document d’identification des leptures.'),
  r([...COL, 'Cantharidae (téléphores)'], 'Cantharidae illustrés', `${GRENHA}Cantharidae_illustrees_anglais.pdf`, SOURCE_GRENHA, 'en', 'clé', 'Clé illustrée des téléphores, en anglais.'),
  r(GRANDS_CARABES, 'Carabes (GRETIA)', `${GRENHA}Carabes%20-%20Gretia.pdf`, 'GRETIA', 'fr', 'clé', 'Clé des grands carabes ; copie du document du GRETIA.'),
  r(CARABES, 'Clé des Carabidae (J.-L. Roger, INRA, Université de Rennes)', `${GRENHA}CarabidaeUniv_Rennes-JL_Roger_INRA.pdf`, 'J.-L. Roger', 'fr', 'clé', 'Clé des carabiques des milieux agricoles.'),
  r(CICINDELES, 'Cicindela gallica, hybrida et sylvicola : différences', `${GRENHA}Cicindela-diff%20gallica-hybrida-sylvicola.pdf`, SOURCE_GRENHA, 'fr', 'planches comparatives', 'Critères pour séparer trois cicindèles proches.'),
  r(CICINDELES, 'Les Cicindelidae en France', `${GRENHA}Cicindelidae%20en%20France%20Collomb.pdf`, 'Collomb', 'fr', 'guide illustré', 'Présentation et identification des cicindèles de France.'),
  r([...SCARA, 'Geotrupidae (géotrupes)'], 'Geotrupidae', `${GRENHA}Geotrupidae%20Peslier%20S.pdf`, 'S. Peslier', 'fr', 'clé', 'Identification des géotrupes.'),
  r([...SCARA, 'Hopliinae (hoplies)'], 'Hopliinae', `${GRENHA}Hopliinae%20Peslier.pdf`, 'S. Peslier', 'fr', 'clé', 'Identification des hoplies.'),
  r([...SCARA, 'Sericinae'], 'Sericidae', `${GRENHA}Sericidae%20Pesier%20S.pdf`, 'S. Peslier', 'fr', 'clé', 'Identification des séricines.'),
  r([...SCARA, 'Scarabaeus'], 'Scarabaeus', `${GRENHA}Scarabaeus.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Identification des scarabées du genre Scarabaeus.'),
  r(SCARA, 'Lucanides et Scarabéides de Vendée', `${GRENHA}Lucanides-Scarabeides-Vendee.pdf`, SOURCE_GRENHA, 'fr', 'guide illustré', 'Lucanes et scarabées de Vendée.'),
  r([...DIP, 'Tachinidae (tachinaires)'], 'Diptères Tachinidae', `${GRENHA}Dipteres-Tachinidae.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Document d’identification des tachinaires.'),
  r([...DIP, 'Bombyliidae (bombyles)'], 'Bombyliidae', `${GRENHA}bombilidae1_mc%20raillot.pdf`, 'Marie-Constance Raillot', 'fr', 'guide illustré', 'Document d’identification des bombyles.'),
  r([I, 'Éphémères'], 'Ephemeroptera : familles', `${GRENHA}Ephemeroptera_familles-INVFMR.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Clé des familles d’éphémères.'),
  r([I, 'Hyménoptères'], 'Hyménoptères (C. de Sainte-Foy)', `${GRENHA}Hymenopteres-C_deSainteFoy.pdf`, 'C. de Sainte-Foy', 'fr', 'guide illustré', 'Document de présentation des hyménoptères.'),
  r([I, 'Hyménoptères', 'Apoidea (abeilles)'], 'Clé des genres d’Apoidea (Scheuchl 2000)', `${GRENHA}Apoidae_genres-Scheuchl_2000.pdf`, 'E. Scheuchl', 'fr', 'clé', 'Clé des genres d’abeilles d’après Scheuchl.', 2000),
  r([I, 'Névroptères', 'Ascalaphidae (ascalaphes)'], 'Ascalaphes : clé', `${GRENHA}Ascalaphes%20-%20cle.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Clé des ascalaphes.'),
  r([I, 'Odonates'], 'Odonates d’Auvergne', `${GRENHA}Odonates%20d'Auvergne.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Document d’identification des odonates d’Auvergne.'),
  r([...LEP, 'Rhopalocères'], 'Papillons de jour du Loir-et-Cher', `${GRENHA}Papillons%20de%20jour%20du%20Loir-et-Cher.pdf`, SOURCE_GRENHA, 'fr', 'guide illustré', 'Identification des papillons de jour du Loir-et-Cher.'),
  r([...LEP, 'Rhopalocères', 'Hesperiidae', 'Pyrgus'], 'Les Pyrgus de France', `${GRENHA}Pyrgus%20de%20France%20-%20Jacquier.pdf`, 'Jacquier', 'fr', 'clé', 'Identification des hespéries du genre Pyrgus en France.'),
  r([...LEP, 'Zygaenidae (zygènes)', 'Zygaena'], 'Clé des Zygaena (version de mars 2025)', `${GRENHA}Cle%20Zygaena_v20250314.pdf`, SOURCE_GRENHA, 'fr', 'clé', 'Clé des zygènes du genre Zygaena.', 2025),
  r(['Arachnides', 'Araignées'], 'Clé de terrain des araignées (Drouard 2015)', `${GRENHA}Araignees-Cle%20de%20terrain-Drouard%202015.pdf`, 'Françoise Drouard', 'fr', 'clé', 'Clé de terrain des familles et genres d’araignées reconnaissables à vue.', 2015),

  // ---------- R.A.R.E.
  r([I], 'R.A.R.E. – publications en ligne', 'https://r-a-r-e.fr/', SOURCE_RARE, 'fr', 'site de référence', 'Monographies et numéros anciens de la revue en accès libre : carabes, chrysomèles, ténébrions, lithobies, fourmilions.'),
  r([...COL, 'Tenebrionidae (ténébrions)', 'Asida'], 'Les Asida de la faune de France', `${RARE}2019/10/Asida-de-la-faune-de-France.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie des ténébrions du genre Asida en France.'),
  r(GRANDS_CARABES, 'Monographie de Chrysocarabus rutilans', `${RARE}2019/10/Monographie-de-Chrysocarabus-rutilans.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie d’un carabe pyrénéen : sous-espèces et formes.'),
  r(GRANDS_CARABES, 'Monographie du sous-genre Iniopachys', `${RARE}2019/10/Monographie-du-sous-genre-Iniopachys.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie d’un sous-genre de carabes pyrénéens.'),
  r(GRANDS_CARABES, 'Monographie de Chrysocarabus punctatoauratus, partie I', `${RARE}2019/10/Monographie-de-Chrysocarabus-punctatoauratus-I-2.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie d’un carabe pyrénéen, première partie.'),
  r(GRANDS_CARABES, 'Monographie de Chrysocarabus punctatoauratus, partie II', `${RARE}2019/10/Monographie-de-Chrysocarabus-punctatoauratus-II-2.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie d’un carabe pyrénéen, seconde partie.'),
  r(GRANDS_CARABES, 'Monographie du sous-genre Megodontus', `${RARE}2019/10/Monographie-du-sous-genre-Megodontus.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie d’un sous-genre de carabes (Carabe violet et espèces voisines).'),
  r(GRANDS_CARABES, 'Monographie de Carabus auronitens', `${RARE}2019/10/Monographie-de-Carabus-auronitens-2.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Monographie du Carabe à reflets d’or.'),
  r(['Myriapodes', 'Chilopodes', 'Lithobiomorpha (lithobies)'], 'Lithobies de France', `${RARE}2019/10/Lithobies-de-France-1.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Identification des lithobies de France.'),
  r([I, 'Névroptères', 'Myrmeleontidae (fourmilions)'], 'Fourmilions de France', `${RARE}2020/06/Fourmilions-France.pdf`, SOURCE_RARE, 'fr', 'ouvrage PDF', 'Identification des fourmilions de France.'),

  // ---------- Online-Keys.net (diptères) et Diptera.info
  r(DIP, 'Online-Keys.net : Identification Keys', 'https://www.online-keys.net/infusions/keys/keys_view.php', SOURCE_OK, 'en', 'site de référence', 'Clés interactives en ligne pour plusieurs familles et genres de diptères d’Europe.'),
  r([...DIP, 'Lonchopteridae'], 'Lonchopteridae of Europe', `${OK}27`, 'P. L. Th. Beuk', 'en', 'clé', 'Clé des Lonchopteridae d’Europe.'),
  r([...DIP, 'Lonchopteridae'], 'Lonchopteridae of Europe (version PDF)', 'https://online-keys.net/downloads/OnlineIdentificationKeys-LonchopteridaeofEurope-P.L.Th.Beuk-20220902.pdf', 'P. L. Th. Beuk', 'en', 'clé', 'Clé des Lonchopteridae d’Europe, en PDF.', 2022),
  r([...DIP, 'Scatopsidae'], 'Scatopsidae', `${OK}23`, SOURCE_OK, 'en', 'clé', 'Clé en ligne des Scatopsidae.'),
  r([...DIP, 'Psilidae'], 'Psilidae', `${OK}34`, SOURCE_OK, 'en', 'clé', 'Clé en ligne des Psilidae.'),
  r([...DIP, 'Psilidae'], 'Psilidae (version PDF)', 'https://online-keys.net/downloads/OnlineIdentificationKeys-Psilidae-20230201.pdf', SOURCE_OK, 'en', 'clé', 'Clé des Psilidae, en PDF.', 2023),
  r([...DIP, 'Asteiidae'], 'Key to the Western Palaearctic Asteiidae', `${OK}6`, SOURCE_OK, 'en', 'clé', 'Clé des Asteiidae du Paléarctique occidental.'),
  r([...DIP, 'Hybotidae'], 'Key to genera and species of Hybotidae', `${OK}18`, SOURCE_OK, 'en', 'clé', 'Clé des genres et des espèces d’Hybotidae.'),
  r([...DIP, 'Hybotidae'], 'West-Palaearctic species of Elaphropeza', `${OK}16`, SOURCE_OK, 'en', 'clé', 'Clé des espèces ouest-paléarctiques du genre Elaphropeza.'),
  r([...DIP, 'Dolichopodidae'], 'Clé des genres de Dolichopodidae : mâles', 'http://ecocdk.free.fr/Dolicho/Grm/Grm.htm', 'Lien relevé sur Diptera.info', 'fr', 'clé', 'Clé en ligne des genres de Dolichopodidae, pour les mâles.'),
  r([...DIP, 'Dolichopodidae'], 'Clé des genres de Dolichopodidae : femelles', 'http://ecocdk.free.fr/Dolicho/Grf/Grf.htm', 'Lien relevé sur Diptera.info', 'fr', 'clé', 'Clé en ligne des genres de Dolichopodidae, pour les femelles.'),
];
