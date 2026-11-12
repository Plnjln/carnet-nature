// Annuaire des clés en ligne : liens relevés dans les listes tenues par la communauté naturaliste
// (Les carnets nature de Jessica, Le Monde des insectes, Quel est cet animal).
// Ajoutés SANS contrôle du lien, le 13 novembre 2026 ; signalés comme tels dans l'app.
// Le classement dans l'arborescence est le mien : corriger `path` si une ressource est mal rangée.

import type { KeyLink } from './types';

const JESSICA = 'Lien relevé sur Les carnets nature de Jessica';
const LMDI = 'Le Monde des insectes (insecte.org)';

/** Lien de la liste de Jessica Joachim. */
function j(path: string[], title: string, url: string, language = 'fr', kind = 'clé', scope = ''): KeyLink {
  return { path, title, url, author: JESSICA, language, kind, scope: scope || `${title}.`, year: null, nonVerifie: true };
}

/** Fil « bibliographie » du forum Le Monde des insectes pour un groupe. */
function biblio(path: string[], groupe: string, sujet: string): KeyLink {
  return {
    path,
    title: `Bibliographie et documents d'identification : ${groupe}`,
    url: `https://www.insecte.org/forum/viewtopic.php?${sujet}`,
    author: LMDI,
    language: 'fr',
    kind: 'fil de forum',
    scope: `Fil du forum qui recense les ouvrages, clés et documents en ligne pour identifier les ${groupe.toLowerCase()}.`,
    year: null,
    nonVerifie: true,
  };
}

const I = 'Insectes';
const COL = [I, 'Coléoptères'];
const DIP = [I, 'Diptères'];
const HYM = [I, 'Hyménoptères'];
const HEM = [I, 'Hémiptères'];
const LEP = [I, 'Lépidoptères'];
const CHARANCONS = [...COL, 'Curculionoidea (charançons)'];
const CHRYSO = [...COL, 'Chrysomelidae (chrysomèles)'];
const SCARA = [...COL, 'Scarabaeoidea (bousiers, hannetons, cétoines)'];
const TIPULES = [...DIP, 'Tipuloidea (tipules)'];
const EMPIDIDAE = [...DIP, 'Empididae'];
const ICHNEUMONS = [...HYM, 'Ichneumonoidea (ichneumons, braconides)'];
const ABEILLES = [...HYM, 'Apoidea (abeilles)'];
const GUEPES = [...HYM, 'Vespidae (guêpes)'];
const PUNAISES = [...HEM, 'Hétéroptères (punaises)'];
const CICADELLES = [...HEM, 'Auchénorrhynques (cigales, cicadelles)'];

export const ANNUAIRE_COMMUNAUTE: KeyLink[] = [
  // ---------- Portails ----------
  { path: [I], title: 'Les carnets nature de Jessica – Clés d’identification', url: 'https://jessica-joachim.com/cles-didentification/', author: 'Jessica Joachim', language: 'fr', kind: 'site de référence', scope: 'Liste de liens vers des sites et des PDF utiles à la détermination de nombreux groupes d’arthropodes, classée par ordre et par famille.', year: null, nonVerifie: true },
  { path: [I], title: 'Quel est cet animal – Liste des clés de détermination', url: 'https://quelestcetanimal-lagalerie.com/liste-des-cles-de-determination/', author: 'Quel est cet animal ?', language: 'fr', kind: 'site de référence', scope: 'Liste des clés de détermination hébergées par la galerie, par ordre et par famille.', year: null, nonVerifie: true },
  { path: [I], title: 'Quel est cet insecte ? Clés de détermination', url: 'https://www.quelestcetanimal.com/fiches-pratiques/quel-est-cet-insecte-cles-de-determination/', author: 'Quel est cet animal ?', language: 'fr', kind: 'site de référence', scope: 'Fiches pratiques et clés pour déterminer un insecte, des ordres aux familles.', year: null, nonVerifie: true },
  { path: [I], title: 'Le Monde des insectes – forum et galerie', url: 'https://www.insecte.org/', author: LMDI, language: 'fr', kind: 'site de référence', scope: 'Forum d’identification par ordre, galerie de photos validées et articles ; la référence francophone pour faire confirmer une détermination.', year: null, nonVerifie: true },
  biblio([I], 'Documentation générale', 't=1634'),

  // ---------- Bibliographies du forum Le Monde des insectes ----------
  biblio([I, 'Odonates'], 'Odonates', 't=1545'),
  biblio([I, 'Orthoptères'], 'Orthoptères', 't=116505'),
  biblio([I, 'Dermaptères'], 'Dermaptères', 't=117120'),
  biblio([I, 'Lépismes et machilis'], 'Microcoryphia et Zygentoma', 't=78933'),
  biblio([I, 'Thysanoptères (thrips)'], 'Thysanoptères', 't=120177'),
  biblio([I, 'Phthiraptères (poux)'], 'Phthiraptères', 't=120175'),
  biblio([I, 'Psoques'], 'Psocoptères', 't=31272'),
  biblio(PUNAISES, 'Hétéroptères', 't=22649'),
  biblio(CICADELLES, 'Homoptères', 't=1632'),
  biblio([I, 'Névroptères'], 'Névroptères', 't=15228'),
  biblio(COL, 'Coléoptères', 'p=1058207'),
  biblio(DIP, 'Diptères', 't=13046'),
  biblio([I, 'Mécoptères'], 'Mécoptères', 't=14335'),
  biblio(LEP, 'Lépidoptères', 't=1625'),
  biblio(HYM, 'Hyménoptères', 't=153975'),
  biblio([I, 'Trichoptères, Plécoptères, Éphémères'], 'Trichoptères, Plécoptères et Éphémères', 't=12848'),
  biblio(['Arachnides'], 'Arachnides', 't=174974'),
  biblio(['Arachnides', 'Opilions'], 'Opilions', 't=113585'),
  biblio(['Arachnides', 'Acariens'], 'Acariens', 't=76384'),
  biblio(['Arachnides'], 'Autres Chélicérates', 't=148423'),

  // ---------- Petits ordres ----------
  j([I, 'Lépismes et machilis'], 'Microcoryphia et Zygentoma (fil du forum)', 'http://www.insecte.org/forum/viewtopic.php?t=78827', 'fr', 'fil de forum'),
  j([I, 'Lépismes et machilis', 'Machilidae'], 'Machilidae', 'http://www.spiderling.de/Projekte/Machilidae/Machilidae.htm', 'de', 'site de référence'),
  j([I, 'Lépismes et machilis'], 'Microcoryphia', 'http://www.sylvestris.org/microcoryphia/index.htm', 'en', 'site de référence'),
  j([I, 'Collemboles'], "Guide d'identification de quelques genres de collemboles", 'https://collembolla.blogspot.com/p/identification-guides.html', 'en', 'guide illustré'),
  j([I, 'Collemboles', 'Neanuridae'], 'Clé du genre Neanura', 'https://sciencepress.mnhn.fr/sites/default/files/articles/hd/a2017n1a5.pdf', 'fr'),
  j([I, 'Collemboles'], 'Collembola.org', 'https://www.collembola.org/', 'en', 'site de référence'),
  j([I, 'Éphémères'], 'Clé des familles d’éphémères', 'http://www.mouches.org/pdf/ento_cle_ephemere.pdf'),
  j([I, 'Psoques'], 'Psoques de Grande-Bretagne', 'https://www.brc.ac.uk/schemes/barkfly/key/key.htm', 'en'),
  j([I, 'Mantes'], 'Les mantes de France', 'http://www.insecte.org/spip.php?article80'),
  j([I, 'Mécoptères', 'Panorpa'], 'Clé d’identification des Panorpa de France (Tillier 2008)', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2012/11/Tillier-P.-2008-Cle%CC%81-didentification-des-Panorpa-de-France.pdf'),
  j([I, 'Mécoptères', 'Panorpa'], 'Panorpa de France : identification', 'http://mecoptera.free.fr/identification.html'),
  j([I, 'Mécoptères', 'Panorpa'], 'Panorpa de France : répartition par département', 'http://mecoptera.free.fr/repartition.html', 'fr', 'site de référence'),
  j([I, 'Mécoptères', 'Panorpa'], 'Panorpa mâles de France (fil du forum)', 'http://www.insecte.org/forum/viewtopic.php?f=48&t=28338', 'fr', 'fil de forum'),
  j([I, 'Névroptères', 'Ascalaphidae (ascalaphes)'], 'Clef de détermination des ascalaphes d’Europe occidentale', 'http://www.onem-france.org/ascalaphes/wakka.php?wiki=ClefdeDetermination'),
  j([I, 'Odonates', 'Libellulidae', 'Sympetrum'], 'Sympetrum (fil du forum)', 'http://www.insecte.org/forum/viewtopic.php?f=9&t=13878', 'fr', 'fil de forum'),
  j([I, 'Orthoptères'], 'Carnet des Orthoptères de Midi-Pyrénées', 'https://www.opie-mp.fr/wp-content/uploads/2025/03/Publication_CarnetOrthopteresMidiPyrenees2016.pdf', 'fr', 'guide illustré'),

  // ---------- Coléoptères ----------
  j(COL, 'ColéoFrance', 'https://xn--colofrance-d7a.cloudaccess.host/', 'fr', 'site de référence'),
  j(COL, 'Koleopterologie.de', 'http://www.koleopterologie.de/', 'de', 'site de référence'),
  j(COL, 'kerbtier.de – Beetles of the German fauna', 'https://www.kerbtier.de/enindex.html', 'en', 'site de référence', 'Galerie de référence très complète des coléoptères d’Allemagne, largement communs avec la France.'),
  j([...COL, 'Carabidae (carabiques)', 'Microlestes'], 'Microlestes de France', 'https://www.persee.fr/doc/linly_0366-1326_1998_num_67_2_11205'),
  j([...COL, 'Cantharidae (téléphores)', 'Malthodes'], 'Malthodes (Coleonet)', 'http://coleonet.de/coleo/texte/malthodes.htm', 'de'),
  j([...COL, 'Cerambycidae (longicornes)'], 'Cerambycidae du Massif armoricain', 'http://www.gretia.org/phocadownload/cahiers_gretia/IA03/Invertebres_Armoricains_N3_2009_32-34-Gouverneur-Guerard3-coleoptera-cerambycidae.pdf'),
  j([...COL, 'Cerambycidae (longicornes)', 'Rhagium'], 'Rhagium : planche comparative', 'https://www.galerie-insecte.org/galerie/view.php?ref=18102', 'fr', 'planches comparatives'),
  j([...COL, 'Cerambycidae (longicornes)'], 'Longhorn beetles of the West Palaearctic region', 'http://www.cerambyx.uochb.cz/', 'en', 'site de référence'),
  j([...CHRYSO, 'Cassidinae (cassides)'], 'Cassidinae du Royaume-Uni : clé illustrée', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2012/11/Subfamily-Cassidinae-illustrated-key-to-British-species.pdf', 'en'),
  j([...CHRYSO, 'Clytrinae'], 'Clytrinae de France (copie insecte.org)', 'http://www.insecte.org/photos/archives/CLYTRINAE.pdf'),
  j([...CHRYSO, 'Cryptocephalus'], 'Les Cryptocephalus de France', 'https://r-a-r-e.fr/wp-content/uploads/2020/06/Les-Cryptocephalus-de-France.pdf', 'fr', 'ouvrage PDF'),
  j([...COL, 'Cleridae (clairons)', 'Trichodes'], 'Les Trichodes de France', 'http://www.insecte.org/photos/archives/Les_Trichodes_de_France.pdf'),
  j([...COL, 'Coccinellidae (coccinelles)'], 'Clé des principales coccinelles de Wallonie', 'http://naturamosana.be/documents/cle_coccinelles.pdf'),
  j(CHARANCONS, 'Weevil guides (dossier de guides sur les charançons)', 'https://drive.google.com/drive/folders/0B008cp9g-Pm8fmx2aE5JUXpkX0czQ2F1bWtJZWZJb1JxM2JLM0djMi1Ea2RWUzluMHNGVGc?resourcekey=0-YMKORs4FJamr-aq3rYGOMQ', 'en', 'guide illustré'),
  j([...CHARANCONS, 'Cionus'], 'Cionus : planche', 'http://claude.schott.free.fr/Mecininae/Mecininae_PL6.jpg', 'fr', 'planches comparatives'),
  j([...CHARANCONS, 'Curculio'], 'Curculio : clé des espèces françaises (fil du forum)', 'http://insecte.org/forum/viewtopic.php?p=2495#p2495', 'fr', 'fil de forum'),
  j([...CHARANCONS, 'Curculio'], 'Curculio glandium (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?p=981395#p981395', 'fr', 'fil de forum'),
  j([...CHARANCONS, 'Lixus'], 'Clef des Lixus de France', 'https://www.insecte.org/photos/archives/Clef_des_Lixus_de_France_V1_9.pdf'),
  j([...CHARANCONS, 'Sitona'], 'Sitona de France (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?t=98259', 'fr', 'fil de forum'),
  j([...CHARANCONS, 'Sitona'], 'Sitona, Andrion, Coelositona, Charagmus', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2018/11/Sitona.pdf'),
  j([...CHARANCONS, 'Sitona'], 'Sitonini de Belgique', 'https://popups.uliege.be/2030-6318/index.php?id=2760&file=1&pid=2753'),
  j([...COL, 'Dermestidae', 'Anthrenus'], 'Anthrenus du groupe pimpinellae, région paléarctique', 'http://www.cassidae.uni.wroc.pl/Kadej_Anthrenus%20pimpinellae.pdf', 'en'),
  j([...COL, 'Coléoptères aquatiques', 'Graphoderus'], 'Graphoderus (Dytiscidae)', 'https://zookeys.pensoft.net/article/7002/element/2/19//', 'en'),
  j([...COL, 'Hydrophilidae', 'Sphaeridium'], 'Sphaeridium de France (1919)', 'https://www.persee.fr/doc/bsef_0037-928x_1919_num_24_13_26458'),
  j([...COL, 'Hydrophilidae', 'Sphaeridium'], "Sphaeridium de France (L'Entomologiste 2004, p. 125)", 'https://lentomologiste.fr/wp-content/uploads/2004-60/lentomologiste_2004_60_3.pdf'),
  j([...COL, 'Histeridae'], 'Histeridae de France (copie insecte.org)', 'https://www.insecte.org/photos/archives/histeridae_Secchi.pdf'),
  j([...COL, 'Lampyridae (vers luisants)'], 'Lampyridae de France (Constantin)', 'http://grenha.fr/documents/Lampyridae%20France%20-%20Constantin.pdf'),
  j([...COL, 'Lampyridae (vers luisants)', 'Lampyris'], 'Lampyris : femelles (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?f=1&t=143330&hilit=lampyris+noctiluca+ou+iberica', 'fr', 'fil de forum'),
  j([...COL, 'Latridiidae'], 'Latridiidae de France', 'https://www.persee.fr/doc/bsef_0037-928x_2008_num_113_1_16508'),
  j([...COL, 'Meloidae (méloés)', 'Meloe'], 'Meloe (fil de forum)', 'http://www.lenaturaliste.net/forum/viewtopic.php?t=8444', 'fr', 'fil de forum'),
  j([...COL, 'Oedemeridae (œdémères)'], 'Les Oedemeridae de la faune de France : clé de détermination', 'https://www.researchgate.net/publication/303164295_Les_Oedemeridae_Latreille_1810_de_la_faune_de_France_cle_de_determination_et_elements_d%27ecologie_et_de_biologie_Coleoptera_Tenebrionoidae'),
  j([...SCARA, 'Rutelidae (hannetons des jardins, anomales)'], 'Clé illustrée des Anomalinae de France', 'https://docplayer.fr/27754765-Cle-de-determination-illustree-des-anomalinae-de-france-coleoptera-scarabaeoidea-rutelidae.html'),
  j([...SCARA, 'Rutelidae (hannetons des jardins, anomales)'], 'Rutélides de métropole', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2021/02/Rutelides-de-me%CC%81tropole.pdf'),
  j([...SCARA, 'Cetoniidae (cétoines)'], 'Cétoines de France (copie insecte.org)', 'https://www.insecte.org/photos/archives/Cle_Cetoines_de_France_P_Zagatti.pdf'),
  j([...SCARA, 'Cetoniidae (cétoines)'], 'Cetoniinae : genres (fil du forum)', 'http://www.insecte.org/forum/viewtopic.php?f=1&t=129', 'fr', 'fil de forum'),
  j([...COL, 'Scraptiidae', 'Scraptia'], 'Scraptia de France (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?p=1431606#p1431606', 'fr', 'fil de forum'),
  j([...COL, 'Silphidae (silphes, nécrophores)'], 'Silphidae (Beetle News, octobre 2009)', 'https://www.amentsoc.org/publications/beetle-news/2009/beetle-news-vol-01-no-03-2009-october.pdf', 'en'),
  j([...COL, 'Silphidae (silphes, nécrophores)', 'Thanatophilus'], 'Thanatophilus (Coleonet)', 'http://coleonet.de/coleo/texte/thanatophilus.htm', 'de'),
  j([...COL, 'Staphylinidae (staphylins)', 'Paederus'], 'Paederus d’Italie (fil de forum)', 'http://www.entomologiitaliani.net/public/forum/phpBB3/viewtopic.php?f=286&t=5272', 'it', 'fil de forum'),
  j([...COL, 'Tenebrionidae (ténébrions)', 'Cteniopodini'], 'Cteniopodini de France (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?f=1&t=95251&hilit=omophlus', 'fr', 'fil de forum'),
  j([...COL, 'Tenebrionidae (ténébrions)', 'Helopinae'], 'Helopinae de France (Gallica)', 'https://gallica.bnf.fr/ark:/12148/bpt6k61229333/f17.image', 'fr', 'ouvrage PDF'),

  // ---------- Diptères ----------
  j(DIP, 'Diptera.info', 'https://diptera.info/news.php', 'en', 'site de référence'),
  j(DIP, 'Anatomie des diptères (glossaire illustré)', 'http://www.ento.csiro.au/biology/fly/flyGlossary.html', 'en', 'site de référence'),
  j(DIP, 'Anatomie des diptères (Tachinidae.eu)', 'http://www.tachinidae.eu/definition/definition.htm', 'en', 'site de référence'),
  j([...DIP, 'Anisopodidae', 'Sylvicola'], 'Sylvicola du Paléarctique', 'http://www.online-keys.net/infusions/keys/keys_view.php?key_no=1', 'en'),
  j([...DIP, 'Anthomyiidae'], 'Le complexe Anthomyia pluvialis en Europe', 'https://www.researchgate.net/publication/229692907_The_Anthomyia_pluvialis_complex_in_Europe_Diptera_Anthomyiidae', 'en'),
  j([...DIP, 'Asilidae (asiles)'], 'Asilidae : clé en ligne (robberflies.info)', 'http://www.robberflies.info/keyger/htmle/key.html', 'en'),
  j([...DIP, 'Asilidae (asiles)'], 'Asilidae (Geller-Grimm)', 'http://www.geller-grimm.de/asilidae.htm', 'en', 'site de référence'),
  j([...DIP, 'Asilidae (asiles)'], 'Asilidae du Royaume-Uni : genres et espèces', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2022/02/Asilidae-key-to-UK-genera-and-species.pdf', 'en'),
  j([...DIP, 'Asilidae (asiles)'], 'Asilidae des Pays-Bas et de Belgique : guide photo', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2016/12/fotogidsAsilidae.pdf', 'nl', 'guide illustré'),
  j([...DIP, 'Rhagionidae et Athericidae'], 'Rhagionidae et Athericidae d’Europe du nord-ouest', 'https://home.hccnet.nl/mp.van.veen/KEYS/Rhagionidae/Rhagionidae.html', 'en'),
  j([...DIP, 'Bibionidae (bibions)'], 'Bibio de Norvège', 'http://www.entomologi.no/journals/nje/old/V42/NJE_42_02_1995.pdf', 'en'),
  j([...DIP, 'Bibionidae (bibions)'], 'Bibio johannis', 'http://christophe.quintin.pagesperso-orange.fr/documents/68.Haenni&Quintin.pdf'),
  j([...DIP, 'Bombyliidae (bombyles)'], 'Bombyliidae d’Europe du nord-ouest', 'https://home.hccnet.nl/mp.van.veen/bombyliidae/bombgen.html', 'en'),
  j([...DIP, 'Bombyliidae (bombyles)', 'Villa'], 'Villa de Norvège', 'http://www.entomologi.no/journals/nje/2009-2/pdf/NJE-vol56-nr2-Falck.pdf', 'en'),
  j([...DIP, 'Calliphoridae et Rhinophoridae'], 'Calliphoridae et Rhinophoridae du Royaume-Uni (Steven Falk)', 'http://www.stevenfalk.co.uk/files/21577/testkeytobritishblowflies132016.pdf', 'en'),
  j([...DIP, 'Camillidae'], 'Camilla d’Europe de l’ouest', 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=7', 'en'),
  j([...DIP, 'Conopidae (conops)'], 'Conopidae d’Europe du nord-ouest', 'https://home.hccnet.nl/mp.van.veen/conopidae/ConGenera.html', 'en'),
  j(EMPIDIDAE, 'Empididae : clé illustrée des genres', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Key-to-genera-of-Empididae-illustrated.pdf', 'en'),
  j([...EMPIDIDAE, 'Clinocera'], 'Clinocera : clé des espèces', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Empididae-genus-Clinocera-key-to-species.pdf', 'en'),
  j([...EMPIDIDAE, 'Chelifera'], 'Chelifera : mâles du Royaume-Uni', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Genus-Chelifera-key-to-UK-males.pdf', 'en'),
  j([...EMPIDIDAE, 'Chelipoda'], 'Chelipoda : clé illustrée', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Empididae-genus-Chelipoda-illustrated-key.pdf', 'en'),
  j([...EMPIDIDAE, 'Empis'], 'Empis : clé illustrée', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Empididae-genus-Empis-illustrated-key.pdf', 'en'),
  j([...EMPIDIDAE, 'Rhamphomyia'], 'Rhamphomyia : clé illustrée', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Empididae-genus-Rhamphomyia-illustrated-key.pdf', 'en'),
  j([...EMPIDIDAE, 'Wiedemannia'], 'Wiedemannia : clé illustrée', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/04/Empididae-genus-Wiedemannia-illustrated-key.pdf', 'en'),
  j([...DIP, 'Heleomyzidae', 'Suillia'], 'Suillia du Royaume-Uni', 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=19', 'en'),
  j([...DIP, 'Hybotidae'], 'Elaphropeza et Stilpon du Paléarctique ouest', 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=4', 'en'),
  j([...DIP, 'Lauxaniidae'], 'Lauxaniidae (Shatalkin 1993)', 'https://diptera.info/downloads/Shatalkin-1993b.pdf', 'en'),
  j([...DIP, 'Lauxaniidae'], 'Minettia du groupe fasciata', 'https://diptera.info/downloads/Merz_2004.pdf', 'en'),
  j([...DIP, 'Lonchaeidae'], 'Lonchaeidae : clé des genres', 'https://lonchaeidae.myspecies.info/key-genera', 'en'),
  j([...DIP, 'Pipunculidae'], 'Pipunculidae : genres', 'http://www.kehlmaier.de/pipunculidae1.html', 'en'),
  j([...DIP, 'Scathophagidae'], 'Scathophagidae du Royaume-Uni', 'http://scathophagidae.myspecies.info/sites/scathophagidae.myspecies.info/files/scathophagid_key.pdf', 'en'),
  j([...DIP, 'Sepsidae'], 'Les Sepsidae d’Europe', 'https://www.researchgate.net/profile/Rudolf_Meier/publication/263429542_The_Sepsidae_Diptera_of_Europe/links/0046353ad408a4937d000000/The-Sepsidae-Diptera-of-Europe.pdf', 'en'),
  j([...DIP, 'Stratiomyidae (stratiomes)'], 'Stratiomyidae : clé des genres', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2012/11/cle%CC%81-genres-stratiomyidae.pdf'),
  j([...DIP, 'Stratiomyidae (stratiomes)'], 'Stratiomyidae : table de terrain', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2016/12/Veldtabel_Stratiomyidae.pdf', 'nl'),
  j([...DIP, 'Stratiomyidae (stratiomes)', 'Chloromyia'], 'Chloromyia formosa et speciosa', 'http://www.brc.ac.uk/soldierflies-and-allies/sites/www.brc.ac.uk.soldierflies-and-allies/files/Chloromyia%20formosa%20and%20speciosa.pdf', 'en'),
  j([...DIP, 'Syrphidae (syrphes)'], 'Syrphidae Community Website', 'https://syrphidae.myspecies.info/', 'en', 'site de référence'),
  j([...DIP, 'Syrphidae (syrphes)'], 'Syrphinae d’Europe', 'https://sciendo.com/article/10.2478/cszma-2013-0021', 'en'),
  j([...DIP, 'Syrphidae (syrphes)'], 'Larves de Syrphidae', 'http://cyrille.dussaix.pagesperso-orange.fr/_SYRPHIDAE_LARVA_DC2020/_INTRODUCTION.html', 'fr', 'guide illustré'),
  j([...DIP, 'Syrphidae (syrphes)', 'Chrysotoxum'], 'Chrysotoxum', 'http://web.archive.org/web/20070429223336/http://home.hccnet.nl/mp.van.veen/KEYS/Chrysotoxum/chytox_key.html', 'en'),
  j([...DIP, 'Syrphidae (syrphes)', 'Eristalis'], 'Eristalis', 'http://www.insecte.org/spip.php?article91'),
  j([...DIP, 'Syrphidae (syrphes)', 'Helophilus'], 'Les Helophilus les plus courants', 'http://www.insecte.org/spip.php?article25'),
  j([...DIP, 'Syrphidae (syrphes)', 'Melanostoma'], 'Melanostoma', 'http://lists.nottingham.ac.uk/pipermail/syrphidae/attachments/20151016/8d0d0749/attachment-0001.pdf', 'en'),
  j([...DIP, 'Syrphidae (syrphes)', 'Xanthogramma'], 'Xanthogramma', 'http://poutaa.net/kukkakarpaset/key_Xanthogramma.pdf', 'en'),
  j([...DIP, 'Tabanidae (taons)'], 'Tabanidae de Hongrie', 'http://horizon.documentation.ird.fr/exl-doc/pleins_textes/cahiers/entomo/18829.pdf', 'fr'),
  j([...DIP, 'Tachinidae (tachinaires)'], 'Tachinidae d’Europe centrale', 'http://tachinidae.myspecies.info/sites/tachinidae.myspecies.info/files/Central%20European%20Key%20-%20plus%20figures.pdf', 'en'),
  j([...DIP, 'Tachinidae (tachinaires)', 'Peleteria'], 'Peleteria d’Espagne', 'https://www.biodiversidadvirtual.org/taxofoto/sites/default/files/dip.9_0.pdf', 'es'),
  j([...DIP, 'Tephritidae'], 'Tephritidae de France', 'http://archives.picardie-nature.org/?action=lecteur&document=444'),
  j([...DIP, 'Therevidae'], 'Therevidae d’Europe du nord-ouest', 'https://home.hccnet.nl/mp.van.veen/therevidae/therevidae.html', 'en'),
  j(TIPULES, 'Tipulidae : clé des genres (Stubbs et Kramer)', 'http://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016b.pdf', 'en'),
  j(TIPULES, 'Tipules à longs palpes autres que Tipula', 'http://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016c.pdf', 'en'),
  j([...TIPULES, 'Tipula'], 'Tipula : sous-genres et espèces', 'https://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016d.pdf', 'en'),
  j([...TIPULES, 'Cylindrotomidae'], 'Cylindrotomidae', 'http://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016e.pdf', 'en'),
  j([...TIPULES, 'Pediciidae'], 'Pediciidae', 'https://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016f.pdf', 'en'),
  j([...TIPULES, 'Limoniidae'], 'Limnophilinae', 'https://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016g.pdf', 'en'),
  j([...TIPULES, 'Limoniidae'], 'Limoniinae', 'https://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016h.pdf', 'en'),
  j([...TIPULES, 'Limoniidae'], 'Limoniidae à cellule discale fermée', 'http://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016i.pdf', 'en'),
  j([...TIPULES, 'Limoniidae'], 'Tipules au sens large à cellule discale ouverte', 'http://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016j.pdf', 'en'),
  j([...TIPULES, 'Limoniidae', 'Molophilus'], 'Molophilus', 'https://ccw.naturalis.nl/documents/Stubbs_and_Kramer,_2016k.pdf', 'en'),
  j([...DIP, 'Ulidiidae'], 'Herina d’Europe', 'https://diptera.info/downloads/Kameneva_2007.pdf', 'en'),
  j([...DIP, 'Ulidiidae'], 'Ulidia d’Europe', 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=9', 'en'),
  j([...DIP, 'Xylophagidae'], 'Xylophagus d’Europe', 'https://www.online-keys.net/infusions/keys/keys_view.php?key_no=3', 'en'),

  // ---------- Hémiptères ----------
  j([...PUNAISES, 'Miridae'], 'Miridae.dk', 'http://www.miridae.dk/index.htm', 'en', 'site de référence'),
  j([...PUNAISES, 'Miridae'], 'Capsodes et Horistus (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?p=268870#p268870', 'fr', 'fil de forum'),
  j([...PUNAISES, 'Pentatomoidea', 'Pentatomidae', 'Carpocoris'], 'Carpocoris', 'http://hemiptera.free.fr/Carpocoris.html'),
  j([...PUNAISES, 'Pentatomoidea', 'Pentatomidae', 'Carpocoris'], 'Identification des larves du genre Carpocoris en France', 'https://www.researchgate.net/publication/279710214_Identification_des_larves_du_genre_Carpocoris_en_France_incluant_l%27espece_valide_Carpocoris_mediterraneus_Tamanini_1958_Hemiptera_Pentatomidae'),
  j(PUNAISES, 'Punaises rouge et noir', 'http://www.insecte.org/spip.php?article72', 'fr', 'planches comparatives'),
  j([...PUNAISES, 'Rhopalidae'], 'Rhopalidae d’Europe centrale', 'http://www.zsm.mwn.de/rhy/Rhopalidae.pdf', 'de'),
  j([...CICADELLES, 'Cercopidae (cercopes)'], 'Clé des Cercopidae du Massif armoricain', 'http://hemiptera.free.fr/Cle_Cercopidae.html'),
  j([...CICADELLES, 'Cicadidae (cigales)'], 'Clé illustrée des cigales de France continentale (ONEM)', 'https://cote-dor.lpo.fr/IMG/pdf/2010_ONEM_Cl%C3%A9%20illustr%C3%A9e%20des%20cigales%20de%20France%20continentale.pdf'),
  j([...CICADELLES, 'Aphrophoridae'], 'Philaenus et Neophilaenus (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?f=12&t=191015', 'fr', 'fil de forum'),
  j(CICADELLES, 'True hoppers of the Western Palaearctic', 'https://www.truehopperswp.com/', 'en', 'site de référence'),
  j([...HEM, 'Pucerons'], 'Pucerons selon la plante hôte (Aphids on the World’s Plants)', 'http://www.aphidsonworldsplants.info/C_HOSTS_AAIntro.htm', 'en'),

  // ---------- Hyménoptères ----------
  j(HYM, 'Hyménoptères parasites (Ponent)', 'http://ponent.atspace.org/fauna/ins/fam/hymenoptera/hymenoptera.htm', 'es', 'site de référence'),
  j([...HYM, 'Symphytes (tenthrèdes)'], 'Familles de Symphytes et genre Tenthredo (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?t=162749', 'fr', 'fil de forum'),
  j([...HYM, 'Symphytes (tenthrèdes)', 'Dolerus'], 'Dolerus : espèces paléarctiques', 'http://publication.nhmus.hu/pdf/folentom/FoliaEntHung_2000_Vol_61_95.pdf', 'en'),
  j([...HYM, 'Symphytes (tenthrèdes)', 'Rhogogaster'], 'Rhogogaster d’Europe', 'https://www.mapress.com/zootaxa/2015/f/zt04013p398.pdf', 'en'),
  j([...HYM, 'Chalcidoidea'], 'Chalcidoidea et Mymaromatoidea : clé des familles (NHM)', 'https://www.nhm.ac.uk/our-science/data/chalcidoids/keys1_14.html', 'en'),
  j([...HYM, 'Chalcidoidea', 'Perilampus'], 'Perilampus', 'https://www.persee.fr/doc/bsef_0037-928x_1952_num_57_5_18570'),
  j([...HYM, 'Chalcidoidea', 'Euplectrini'], 'Euplectrini d’Europe', 'https://jhr.pensoft.net/article/28810/', 'en'),
  j([...HYM, 'Chrysididae (chrysides)'], 'Clé des Chrysididae d’Italie (genres)', 'https://www.chrysis.net/chrysididae/key-for-the-italian-chrysididae/', 'en'),
  j([...HYM, 'Formicidae (fourmis)'], 'Clé des fourmis de France', 'http://cle.fourmis.free.fr/castes-fourmis.html'),
  j(ICHNEUMONS, 'Dossier de clés des Ichneumonoidea (Dropbox)', 'https://www.dropbox.com/sh/xvd7dbrypyp4mu6/AADezD_L82dHGc5DM2_xDNS8a?dl=0', 'en', 'site de référence', 'Dossier partagé rassemblant des clés par sous-famille, tribu et genre : Ichneumoninae (Ichneumon, Amblyteles, Cratichneumon…), Ophion, Pimplinae, Braconidae, Pompilidae.'),
  j(ICHNEUMONS, 'Ichneumonidae : clé des sous-familles', 'https://nocturnalichs.myspecies.info/sites/nocturnalichs.myspecies.info/files/Ich_subfamily_key_April_2015.pdf', 'en'),
  j(ICHNEUMONS, 'Ichneumonoidea nocturnes de Grande-Bretagne et d’Irlande', 'https://nocturnalichs.myspecies.info/sites/nocturnalichs.myspecies.info/files/keys%20for%20nocturnal%20workshop_April_2018%20%281%29_0.pdf', 'en'),
  j([...ICHNEUMONS, 'Pimpla'], 'Pimpla d’Europe', 'https://www.persee.fr/doc/linly_0366-1326_1967_num_36_2_5894'),
  j([...ICHNEUMONS, 'Diphyus'], 'Diphyus : femelles (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?f=3&t=218163', 'fr', 'fil de forum'),
  j([...ABEILLES, 'Andrena'], 'Andrena de Belgique et du nord de la France', 'http://www.atlashymenoptera.net/biblio/01500/Patiny_&_Terzo_2010_Andrena_Belgique_et_N_France_full.pdf'),
  j([...ABEILLES, 'Andrena'], 'Andrena de la péninsule Ibérique', 'https://jhr.pensoft.net/article/101873/', 'en'),
  j([...ABEILLES, 'Eucerini'], 'Proposition de clé des Eucerini de France', 'https://oabeilles.net/wp-content/uploads/2020/06/Proposition_cle_Eucerini_France_OA-MaA-130620.pdf'),
  j([...ABEILLES, 'Nomada'], 'Nomada d’Europe', 'https://www.zobodat.at/pdf/ENT_M3_0001-0253.pdf', 'de'),
  j([...ABEILLES, 'Halictidae'], 'Halictus et Lasioglossum de Belgique (Pauly 2014)', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/01/Pauly-2014-cle-Halictidae-Belgique.pdf'),
  j([...ABEILLES, 'Halictidae', 'Sphecodes'], 'Sphecodes de Belgique (Pauly 2016)', 'http://www.atlashymenoptera.net/biblio/01500/Pauly_2016_Sphecodes%20Belgique%20LQ.pdf'),
  j([...ABEILLES, 'Halictidae', 'Sphecodes'], 'Sphecodes d’Europe centrale', 'https://www.researchgate.net/publication/231181295_Review_and_identification_of_the_cuckoo_bees_of_Central_Europe_Hymenoptera_Halictidae_Sphecodes', 'en'),
  j([...ABEILLES, 'Megachilidae'], 'Megachilidae de Belgique (Pauly 2015)', 'http://www.atlashymenoptera.net/biblio/Pauly_2015_cl%C3%A9_Megachilidae_Belgique.pdf'),
  j([...HYM, 'Pompilidae (pompiles)'], 'Clef des genres de pompiles d’Europe occidentale et des Canaries', 'http://www.shnao.eu/IMG/pdf/clef_des_genres_pompiles_d_europe_extrait_du_livre_les_pompiles_.pdf'),
  j(GUEPES, 'Vespidae d’Europe centrale', 'https://www.aemnp.eu/data/article-1132/1113-46_0_221.pdf', 'en'),
  j([...GUEPES, 'Eumeninae (guêpes maçonnes)'], 'Eumeninae : clé des genres', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2012/11/eumeninae.pdf'),
  j([...GUEPES, 'Eumeninae (guêpes maçonnes)', 'Microdynerus'], 'Microdynerus de France', 'https://www.persee.fr/doc/linly_0366-1326_2008_num_77_5_13681'),
  j([...GUEPES, 'Vespinae'], 'Vespinae (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?p=1304769#p1304769', 'fr', 'fil de forum'),
  j([...GUEPES, 'Vespinae'], 'Vespula vulgaris et Vespula germanica', 'https://guepes-frelons.forumgratuit.org/t562-vespula-vulgaris-vs-vespula-germanica', 'fr', 'fil de forum'),
  j([...GUEPES, 'Polistes'], 'Clé des Polistini de France', 'https://microcox.pagesperso-orange.fr/docs/clefs/cle%20polistes.pdf'),
  j([...GUEPES, 'Polistes'], 'Polistes du Paléarctique ouest', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5674218/', 'en'),
  j([...GUEPES, 'Polistes'], 'Polistes du groupe gallicus', 'https://zookeys.pensoft.net/article/3707/element/4/455//', 'en'),

  // ---------- Lépidoptères ----------
  j(LEP, 'Lépi’Net – Les carnets du lépidoptériste français', 'http://www.lepinet.fr/', 'fr', 'site de référence'),
  j(LEP, 'Lépidoptères de France méridionale et de Corse (Pathpiva)', 'http://pathpiva.wifeo.com/', 'fr', 'site de référence'),
  j(LEP, 'Lepiforum', 'https://lepiforum.org/', 'de', 'site de référence', 'Site de référence germanophone : planches de détermination et comparaisons d’espèces proches pour les papillons d’Europe.'),
  j(LEP, 'Lepidoptera Mundi', 'https://lepidoptera.eu/start.php', 'en', 'site de référence'),
  j([...LEP, 'Rhopalocères'], 'Papillons de Suisse : clé d’identification', 'https://lepido.ch/identifier-un-papillon/cle-didentification/'),
  j([...LEP, 'Rhopalocères'], 'UK Butterflies', 'https://www.ukbutterflies.co.uk/index.php', 'en', 'site de référence'),
  j([...LEP, 'Rhopalocères', 'Hesperiidae', 'Pyrgus'], 'Clé des Pyrgus (Faune Genève)', 'https://cdnfiles2.biolovision.net/www.faunegeneve.ch/userfiles/Papillonsdejour/PyrgusKey2017v1.1.pdf'),
  j([...LEP, 'Rhopalocères', 'Nymphalidae', 'Erebia'], 'Le genre Erebia en Auvergne', 'https://gepaauvergne.files.wordpress.com/2017/01/erebias1.pdf', 'fr', 'guide illustré'),
  j([...LEP, 'Rhopalocères', 'Nymphalidae', 'Melitaea'], 'Mise au point sur les mélitées (Faune Auvergne)', 'http://files.biolovision.net/www.faune-auvergne.org/userfiles/Documentations/Miseaupointsurlesmlites.pdf', 'fr', 'guide illustré'),
  j([...LEP, 'Zygaenidae (zygènes)', 'Zygaena'], 'Clé d’identification des Zygaena de France', 'https://www.fleetingwonders.com/cle-identification-zygaena.php'),
  j([...LEP, 'Hétérocères'], 'Norfolk Moths', 'https://norfolkmoths.co.uk/index.php', 'en', 'site de référence'),
  j([...LEP, 'Hétérocères'], 'Suffolk Moths', 'https://suffolkmoths.co.uk/', 'en', 'site de référence'),
  j([...LEP, 'Hétérocères', 'Crambidae'], 'Crambinae du Berkshire', 'https://quelestcetanimal-lagalerie.com/wp-content/uploads/2017/08/crambidae.pdf', 'en'),
  j([...LEP, 'Hétérocères', 'Noctuidae', 'Cucullia'], 'Cucullia de France : chenilles', 'https://oreina.org/artemisiae/biblio/docpdf/Demerg%C3%A8s2018-580.pdf'),
  j([...LEP, 'Hétérocères', 'Notodontidae', 'Furcula'], 'Furcula : planche comparative', 'https://www.galerie-insecte.org/galerie/view.php?adr=.%2Fimage%2Fdos172%2Ftemp%2Ffurcula_divers.jpg', 'fr', 'planches comparatives'),

  // ---------- Autres arthropodes ----------
  j(['Arachnides', 'Araignées'], 'Balades chez les Araignées', 'http://www.dipode-vie.net/Arachnides/Index.html', 'fr', 'site de référence'),
  j(['Arachnides', 'Araignées'], 'Wiki des araignées (Arages)', 'https://wiki.arages.de/index.php?title=Hauptseite', 'de', 'site de référence'),
  j(['Arachnides', 'Opilions'], 'Phalangium opilio et Mitopus (fil du forum)', 'https://www.insecte.org/forum/viewtopic.php?f=83&t=120132&hilit=phalangium+mitopus+comparaison', 'fr', 'fil de forum'),
  j(['Arachnides', 'Acariens'], 'Oribates de Norvège', 'https://artsdatabanken.no/Taxon/Acari/128967#_s::1631461104570', 'no', 'site de référence'),
  j(['Arachnides', 'Acariens', 'Erythraeidae'], 'Clé des Erythraeidae de Pologne', 'http://muzeum.bytom.pl/wp-content/uploads/2016/12/Przyroda_22online007.pdf', 'en'),
  j(['Crustacés', 'Isopodes terrestres (cloportes)'], 'Clé des Isopodes du nord de la France (GRETIA)', 'http://www.gretia.org/index.php/ressources/res-outils/cles-cloportes'),
  j(['Crustacés', 'Isopodes terrestres (cloportes)'], 'Cloportes de Grande-Bretagne et d’Irlande', 'http://zenza.pagesperso-orange.fr/cloportes/clef2.html'),
  j(['Crustacés', 'Isopodes terrestres (cloportes)'], 'Porcellionides et Orthometopon', 'http://www.gretia.org/phocadownload/cahiers_gretia/IA10/74-82_IA10_Noel&al_Deux_nouvelles_especes_Isopodes_terrestres.pdf'),

  // ---------- Mollusques ----------
  j(['Mollusques', 'Gastéropodes terrestres'], 'Mollusques terrestres (ID Tools)', 'http://idtools.org/id/mollusc/index.php', 'en'),
  j(['Mollusques', 'Gastéropodes terrestres'], 'Escargots terrestres : clé interactive (Xper3)', 'http://xper3.fr/xper3GeneratedFiles/publish/identification/3998718790916524426/mkey.html'),
  j(['Mollusques', 'Gastéropodes terrestres'], 'Escargots terrestres de France : planches (Gargominy et Ripken)', 'http://spn.mnhn.fr/sites_partenaires/malaco/wp-content/uploads/sites/6/2015/04/Malaco_2011_HS_Gargominy_Ripken_001_108.pdf', 'fr', 'planches comparatives'),
  j(['Mollusques', 'Gastéropodes terrestres', 'Clausiliidae (clausilies)'], 'Clausiliidae de France', 'http://spn.mnhn.fr/sites_partenaires/malaco/wp-content/uploads/sites/6/2015/04/Malaco_2011_HS_Gargominy_Neubert_109_122.pdf'),
  j(['Mollusques'], 'Mollusques des Bouches-du-Rhône', 'https://tourduvalat.centredoc.fr/doc_num.php?explnum_id=3042', 'fr', 'guide illustré'),

  // ---------- Reptiles ----------
  j(['Reptiles', 'Serpents', 'Mues'], 'Clé des mues de serpents de votre région', 'https://www.les-snats.com/articles/cle-des-mues-de-serpents-de-votre-region/'),
  j(['Reptiles', 'Squamates (lézards et serpents)'], 'Lézards d’Europe (Eurolizards)', 'https://www.eurolizards.com/', 'en', 'site de référence'),

  // ---------- Flore, lichens, champignons ----------
  j(['Plantes'], 'ID-Botanica', 'http://id-botanica.com/index.html', 'fr', 'site de référence'),
  j(['Plantes'], 'FloreAlpes', 'https://www.florealpes.com/index.php', 'fr', 'site de référence'),
  j(['Plantes'], 'Plante méditerranéenne', 'https://www.plante-mediterraneenne.fr/', 'fr', 'site de référence'),
  j(['Plantes'], 'Fleurs sauvages de l’Yonne et d’ailleurs', 'https://fleursauvageyonne.github.io/', 'fr', 'site de référence'),
  j(['Plantes'], 'Flore des Bouches-du-Rhône', 'http://etienne.aspord.free.fr/', 'fr', 'site de référence'),
  j(['Plantes', 'Orchidées'], 'Orchidées en France', 'http://perso.numericable.fr/~durbphil/Ouv2&Listalpha&Pres/sitorchidouv2.htm', 'fr', 'site de référence'),
  j(['Plantes', 'Orchidées'], 'Identification des orchidées sauvages', 'http://www.orchidee-poitou-charentes.org/spip.php?article2138'),
  j(['Plantes', 'Poacées (graminées)'], 'Connaître et identifier les Poacées', 'http://botarela.fr/Index.html', 'fr', 'site de référence'),
  j(['Plantes', 'Bryophytes (mousses)'], 'Découvrir les bryophytes', 'http://bryologia.gallica.free.fr/les-bryophytes-de-france.php', 'fr', 'site de référence'),
  j(['Champignons et lichens', 'Lichens'], 'Ways of Enlichenment', 'https://www.waysofenlichenment.net/', 'en', 'site de référence'),
  j(['Champignons et lichens'], 'Champignons de Charente-Maritime, Charente et Deux-Sèvres', 'https://www.mycocharentes.fr/index.php?page=Alpha', 'fr', 'site de référence'),
];
