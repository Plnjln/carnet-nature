// Clés d'orientation par familles, à l'intérieur des grands groupes.
//
// Même avertissement que pour cles.ts : clés rédigées par une IA, non relues par un spécialiste.
// Elles ne retiennent que les familles les plus souvent rencontrées en France métropolitaine :
// un animal qui ne correspond à aucun choix appartient sans doute à une famille non traitée.

import type { IdKey } from './types';

const COL = ['Insectes', 'Coléoptères'];
const HYM = ['Insectes', 'Hyménoptères'];
const DIP = ['Insectes', 'Diptères'];
const PUN = ['Insectes', 'Hémiptères', 'Hétéroptères (punaises)'];
const ARA = ['Arachnides', 'Araignées'];

export const CLES_FAMILLES: IdKey[] = [
  // ------------------------------------------------------------------ Coléoptères
  {
    id: 'coleopteres-familles',
    titre: 'Coléoptères : trouver la famille',
    portee: 'Coléoptères adultes : une vingtaine de familles parmi les plus rencontrées (la France en compte plus de cent).',
    groupe: 'coleopteres',
    debut: 'silhouette',
    noeuds: {
      silhouette: {
        type: 'question',
        texte: 'Y a-t-il un trait qui saute aux yeux ?',
        choix: [
          { texte: 'Élytres très courts, laissant presque tout l’abdomen à découvert ; corps allongé et souple.', vers: 'r-staphylinidae' },
          { texte: 'Tête prolongée vers l’avant en un rostre (une « trompe ») qui porte les antennes.', vers: 'r-curculionoidea' },
          { texte: 'Antennes très longues, au moins la moitié du corps, souvent rabattues vers l’arrière ; corps allongé.', vers: 'r-cerambycidae' },
          { texte: 'Antennes terminées par des feuillets qui s’ouvrent en éventail.', vers: 'lamelles' },
          { texte: 'Corps très bombé, presque en demi-sphère, souvent rouge, orange ou jaune à points ; petite tête à demi cachée.', vers: 'r-coccinellidae' },
          { texte: 'Vit dans l’eau ou à sa surface et nage.', vers: 'aquatiques' },
          { texte: 'Rien de tout cela.', vers: 'autres' },
        ],
      },
      lamelles: {
        type: 'question',
        texte: 'Antennes à feuillets : quel est l’aspect ?',
        choix: [
          { texte: 'Antennes coudées, feuillets écartés comme les dents d’un peigne ; chez le mâle, mandibules souvent très développées.', vers: 'r-lucanidae' },
          { texte: 'Antennes non coudées, feuillets qui se referment en une massue compacte ; corps trapu.', vers: 'r-scarabaeidae' },
        ],
      },
      aquatiques: {
        type: 'question',
        texte: 'Comment nage-t-il ?',
        choix: [
          { texte: 'Sous l’eau, en ramant des deux pattes arrière en même temps ; corps ovale, lisse et profilé ; remonte respirer par l’arrière.', vers: 'r-dytiscidae' },
          { texte: 'Sous l’eau, en remuant les pattes l’une après l’autre ; ventre argenté par une bulle d’air ; palpes aussi longs que les antennes.', vers: 'r-hydrophilidae' },
          { texte: 'À la surface, en tournoyant très vite, souvent en groupe ; petit, ovale, noir brillant.', vers: 'r-gyrinidae' },
        ],
      },
      autres: {
        type: 'question',
        texte: 'Quelle est l’allure générale ?',
        choix: [
          { texte: 'Coureur rapide au sol ; longues pattes, antennes fines en fil, fortes mandibules visibles ; souvent noir ou à reflets métalliques.', vers: 'r-carabidae' },
          { texte: 'Corps allongé et étroit ; posé sur le dos, il se détend avec un « clic » et saute ; angles arrière du pronotum en pointe.', vers: 'r-elateridae' },
          { texte: 'Corps très dur, en forme de torpille, à éclat métallique ; actif en plein soleil sur le bois ou les fleurs.', vers: 'r-buprestidae' },
          { texte: 'Corps ovale et bombé, souvent de couleur vive ou métallique ; sur le feuillage, dont il se nourrit.', vers: 'r-chrysomelidae' },
          { texte: 'Corps sombre et mat, démarche lente ; antennes en chapelet de perles ; lieux secs, sous les pierres, dans les maisons.', vers: 'r-tenebrionidae' },
          { texte: 'Corps aplati, noir ou noir et orange, antennes en massue ; sur les cadavres.', vers: 'r-silphidae' },
          { texte: 'Petit, ovale, couvert d’écailles ou de poils formant des dessins ; sur les fleurs ou dans les maisons.', vers: 'r-dermestidae' },
          { texte: 'Corps mou : élytres souples, qui se déforment sous le doigt.', vers: 'mous' },
        ],
      },
      mous: {
        type: 'question',
        texte: 'Corps mou : quel détail correspond ?',
        choix: [
          { texte: 'Allongé, tête bien visible ; rouge, orange, jaune ou noir ; très commun sur les fleurs en été.', vers: 'r-cantharidae' },
          { texte: 'Tête cachée sous le pronotum ; la femelle, sans ailes, émet de la lumière la nuit.', vers: 'r-lampyridae' },
          { texte: 'Élytres qui s’écartent vers l’arrière sans se rejoindre ; souvent vert métallique ; chez le mâle, fémurs arrière parfois très renflés.', vers: 'r-oedemeridae' },
          { texte: 'Gros, bleu-noir, élytres courts d’où dépasse un abdomen volumineux ; marche lentement au printemps.', vers: 'r-meloidae' },
          { texte: 'Très velu, à bandes rouges et bleu-noir ; antennes en massue ; sur les fleurs.', vers: 'r-cleridae' },
          { texte: 'Aplati, élytres rouge vif, antennes en peigne ou en scie.', vers: 'r-pyrochroidae' },
        ],
      },
      'r-staphylinidae': { type: 'resultat', nom: 'Staphylins', sci: 'Staphylinidae', texte: 'Famille immense. Ne pas confondre avec les perce-oreilles, qui portent une pince.', annuaire: COL },
      'r-curculionoidea': { type: 'resultat', nom: 'Charançons', sci: 'Curculionoidea', texte: 'Antennes coudées chez les Curculionidae, droites chez les apions et les cigariers.', annuaire: [...COL, 'Curculionoidea (charançons)'] },
      'r-cerambycidae': { type: 'resultat', nom: 'Longicornes (capricornes)', sci: 'Cerambycidae', annuaire: [...COL, 'Cerambycidae (longicornes)'] },
      'r-lucanidae': { type: 'resultat', nom: 'Lucanes', sci: 'Lucanidae', texte: 'Le Lucane cerf-volant est le plus grand coléoptère d’Europe ; la Petite biche est plus commune.', annuaire: COL },
      'r-scarabaeidae': {
        type: 'resultat',
        nom: 'Scarabées : hannetons, cétoines, bousiers',
        sci: 'Scarabaeoidea',
        texte: 'Regroupe ici plusieurs familles voisines, dont les géotrupes (gros bousiers bleu-noir).',
        annuaire: [...COL, 'Scarabaeoidea (bousiers, hannetons, cétoines)'],
      },
      'r-coccinellidae': { type: 'resultat', nom: 'Coccinelles', sci: 'Coccinellidae', texte: 'Certaines chrysomèles leur ressemblent : leurs antennes sont plus longues et sans massue.', annuaire: [...COL, 'Coccinellidae (coccinelles)'] },
      'r-dytiscidae': { type: 'resultat', nom: 'Dytiques', sci: 'Dytiscidae', annuaire: [...COL, 'Coléoptères aquatiques'] },
      'r-hydrophilidae': { type: 'resultat', nom: 'Hydrophiles', sci: 'Hydrophilidae', annuaire: [...COL, 'Coléoptères aquatiques'] },
      'r-gyrinidae': { type: 'resultat', nom: 'Gyrins (tourniquets)', sci: 'Gyrinidae', texte: 'Leurs yeux sont divisés en deux : une moitié voit dans l’air, l’autre sous l’eau.', annuaire: [...COL, 'Coléoptères aquatiques'] },
      'r-carabidae': { type: 'resultat', nom: 'Carabes et carabiques', sci: 'Carabidae', annuaire: [...COL, 'Carabidae (carabiques)'] },
      'r-elateridae': { type: 'resultat', nom: 'Taupins', sci: 'Elateridae', annuaire: [...COL, 'Elateridae (taupins)'] },
      'r-buprestidae': { type: 'resultat', nom: 'Buprestes', sci: 'Buprestidae', annuaire: COL },
      'r-chrysomelidae': { type: 'resultat', nom: 'Chrysomèles', sci: 'Chrysomelidae', texte: 'Comprend les altises (sauteuses), les cassides (en bouclier) et les criocères.', annuaire: [...COL, 'Chrysomelidae (chrysomèles)'] },
      'r-tenebrionidae': { type: 'resultat', nom: 'Ténébrions', sci: 'Tenebrionidae', texte: 'Famille très variée : cette description ne vaut que pour les espèces sombres les plus typiques.', annuaire: [...COL, 'Tenebrionidae (ténébrions)'] },
      'r-silphidae': { type: 'resultat', nom: 'Silphes et nécrophores', sci: 'Silphidae', texte: 'Les nécrophores ont des élytres tronqués, souvent barrés d’orange.', annuaire: [...COL, 'Silphidae (silphes, nécrophores)'] },
      'r-dermestidae': { type: 'resultat', nom: 'Dermestes et anthrènes', sci: 'Dermestidae', annuaire: [...COL, 'Dermestidae'] },
      'r-cantharidae': { type: 'resultat', nom: 'Téléphores (cantharides)', sci: 'Cantharidae', annuaire: [...COL, 'Cantharidae (téléphores)'] },
      'r-lampyridae': { type: 'resultat', nom: 'Vers luisants et lucioles', sci: 'Lampyridae', annuaire: [...COL, 'Lampyridae (vers luisants)'] },
      'r-oedemeridae': { type: 'resultat', nom: 'Œdémères', sci: 'Oedemeridae', annuaire: [...COL, 'Oedemeridae (œdémères)'] },
      'r-meloidae': { type: 'resultat', nom: 'Méloés', sci: 'Meloidae', texte: 'Ne pas manipuler à mains nues : ils émettent un liquide irritant.', annuaire: [...COL, 'Meloidae (méloés)'] },
      'r-cleridae': { type: 'resultat', nom: 'Clairons', sci: 'Cleridae', annuaire: [...COL, 'Cleridae (clairons)'] },
      'r-pyrochroidae': { type: 'resultat', nom: 'Cardinaux', sci: 'Pyrochroidae', texte: 'À distinguer du Criocère du lis, plus petit, bombé et à antennes simples.', annuaire: COL },
    },
  },

  // ------------------------------------------------------------------ Hyménoptères
  {
    id: 'hymenopteres-groupes',
    titre: 'Hyménoptères : trouver le groupe',
    portee: 'Hyménoptères adultes, jusqu’aux grands groupes ou aux familles les plus connues.',
    groupe: 'hymenopteres',
    debut: 'taille',
    noeuds: {
      taille: {
        type: 'question',
        texte: 'Regarde la jonction entre le thorax et l’abdomen.',
        choix: [
          { texte: 'Pas d’étranglement : l’abdomen est attaché au thorax sur toute sa largeur.', vers: 'r-symphytes' },
          { texte: 'Un étranglement net, une « taille de guêpe ».', vers: 'apocrites' },
        ],
      },
      apocrites: {
        type: 'question',
        texte: 'Taille de guêpe : quel est l’aspect général ?',
        choix: [
          { texte: 'Antennes coudées ; un ou deux petits nœuds entre le thorax et l’abdomen ; vit en colonie, ouvrières sans ailes.', vers: 'r-formicidae' },
          { texte: 'Corps velu ; récolte le pollen, transporté sur les pattes arrière ou sous l’abdomen.', vers: 'abeilles' },
          { texte: 'Au repos, ailes pliées en long, donc étroites ; souvent jaune et noir, peu velue.', vers: 'guepes' },
          { texte: 'Corps élancé, antennes longues et fines toujours en mouvement ; chez la femelle, souvent une longue tarière.', vers: 'r-ichneumons' },
          { texte: 'Corps à éclat métallique très vif, vert, bleu et rouge ; se roule en boule.', vers: 'r-chrysididae' },
          { texte: 'Guêpe peu velue aux ailes à plat, qui chasse des proies et les emporte dans un terrier ou un nid.', vers: 'fouisseuses' },
          { texte: 'Minuscule, moins de 3 mm.', vers: 'r-chalcidiens' },
        ],
      },
      abeilles: {
        type: 'question',
        texte: 'Quelle abeille ?',
        choix: [
          { texte: 'Grosse, ronde, très velue, à bandes de couleur.', vers: 'r-bombus' },
          { texte: 'Brun doré, taille moyenne ; en grand nombre sur les fleurs, pelotes de pollen sur les pattes arrière.', vers: 'r-apis' },
          { texte: 'Autre abeille, le plus souvent solitaire.', vers: 'r-abeilles-sauvages' },
        ],
      },
      guepes: {
        type: 'question',
        texte: 'Guêpe aux ailes pliées en long :',
        choix: [
          { texte: 'Vit en colonie dans un nid de carton.', vers: 'r-vespidae-sociales' },
          { texte: 'Solitaire ; maçonne de petites urnes de terre ou niche dans des tiges.', vers: 'r-eumenes' },
        ],
      },
      fouisseuses: {
        type: 'question',
        texte: 'Quelles proies, quelle allure ?',
        choix: [
          { texte: 'Chasse les araignées ; très longues pattes arrière, court au sol en agitant sans cesse les ailes.', vers: 'r-pompilidae' },
          { texte: 'Abdomen relié au thorax par une longue tige fine ; chasse chenilles, sauterelles ou araignées.', vers: 'r-sphecidae' },
          { texte: 'Tête large et carrée, corps souvent noir et jaune ; chasse mouches, pucerons ou autres insectes.', vers: 'r-crabronidae' },
        ],
      },
      'r-symphytes': { type: 'resultat', nom: 'Tenthrèdes (« mouches à scie »)', sci: 'Symphyta', texte: 'Leurs larves ressemblent à des chenilles, avec davantage de fausses pattes.', annuaire: [...HYM, 'Symphytes (tenthrèdes)'] },
      'r-formicidae': { type: 'resultat', nom: 'Fourmis', sci: 'Formicidae', annuaire: [...HYM, 'Formicidae (fourmis)'] },
      'r-bombus': { type: 'resultat', nom: 'Bourdons', sci: 'Apidae, genre Bombus', texte: 'La couleur des bandes et du bout de l’abdomen oriente vers l’espèce, mais plusieurs se ressemblent beaucoup.', annuaire: [...HYM, 'Apoidea (abeilles)', 'Bombus (bourdons)'] },
      'r-apis': { type: 'resultat', nom: 'Abeille domestique', sci: 'Apis mellifera', texte: 'Attention aux éristales, des mouches qui l’imitent : une seule paire d’ailes et des antennes très courtes.', annuaire: [...HYM, 'Apoidea (abeilles)'] },
      'r-abeilles-sauvages': { type: 'resultat', nom: 'Abeilles sauvages', sci: 'Apoidea : Andrenidae, Halictidae, Megachilidae, Colletidae…', texte: 'Près de mille espèces en France. Les mégachiles et les osmies portent le pollen sous l’abdomen.', annuaire: [...HYM, 'Apoidea (abeilles)'] },
      'r-vespidae-sociales': { type: 'resultat', nom: 'Guêpes sociales, frelons, polistes', sci: 'Vespidae : Vespinae et Polistinae', texte: 'Les polistes ont un abdomen en fuseau et laissent pendre leurs pattes en vol ; leur nid n’a pas d’enveloppe.', annuaire: [...HYM, 'Vespidae (guêpes)'] },
      'r-eumenes': { type: 'resultat', nom: 'Guêpes maçonnes et potières', sci: 'Vespidae : Eumeninae', annuaire: [...HYM, 'Vespidae (guêpes)', 'Eumeninae (guêpes maçonnes)'] },
      'r-ichneumons': { type: 'resultat', nom: 'Ichneumons et braconides', sci: 'Ichneumonoidea', texte: 'Parasitoïdes d’autres insectes. La tarière n’est pas un dard.', annuaire: [...HYM, 'Ichneumonoidea (ichneumons, braconides)'] },
      'r-chrysididae': { type: 'resultat', nom: 'Guêpes dorées (chrysides)', sci: 'Chrysididae', annuaire: [...HYM, 'Chrysididae (chrysides)'] },
      'r-pompilidae': { type: 'resultat', nom: 'Pompiles', sci: 'Pompilidae', annuaire: [...HYM, 'Pompilidae (pompiles)'] },
      'r-sphecidae': { type: 'resultat', nom: 'Sphex et ammophiles', sci: 'Sphecidae', annuaire: HYM },
      'r-crabronidae': { type: 'resultat', nom: 'Crabronides (philanthes, cerceris, bembex)', sci: 'Crabronidae', annuaire: HYM },
      'r-chalcidiens': { type: 'resultat', nom: 'Micro-hyménoptères', sci: 'Chalcidoidea, Cynipoidea et autres', texte: 'Détermination réservée aux spécialistes. Les cynips sont responsables de nombreuses galles.', annuaire: [...HYM, 'Chalcidoidea'] },
    },
  },

  // ------------------------------------------------------------------ Diptères
  {
    id: 'dipteres-familles',
    titre: 'Diptères : trouver la famille',
    portee: 'Mouches, moustiques et tipules adultes : une quinzaine de familles parmi les plus rencontrées.',
    groupe: 'dipteres',
    debut: 'antennes',
    noeuds: {
      antennes: {
        type: 'question',
        texte: 'Regarde les antennes et la silhouette.',
        choix: [
          { texte: 'Antennes longues, de nombreux petits articles ; corps grêle, longues pattes fines.', vers: 'nematoceres' },
          { texte: 'Antennes très courtes, de trois articles ; corps plus trapu, allure de mouche.', vers: 'brachyceres' },
        ],
      },
      nematoceres: {
        type: 'question',
        texte: 'Antennes longues : lequel ?',
        choix: [
          { texte: 'Grand, pattes démesurées et fragiles qui se détachent facilement.', vers: 'r-tipules' },
          { texte: 'Petit, longue trompe piqueuse dirigée vers l’avant.', vers: 'r-culicidae' },
          { texte: 'Allure de moustique mais sans trompe piqueuse ; antennes du mâle en plumeau ; essaims au-dessus de l’eau.', vers: 'r-chironomidae' },
          { texte: 'Noir, trapu, velu ; vole lourdement, pattes pendantes, souvent en nombre au printemps.', vers: 'r-bibionidae' },
        ],
      },
      brachyceres: {
        type: 'question',
        texte: 'Allure de mouche : qu’est-ce qui correspond ?',
        choix: [
          { texte: 'Fait du surplace en vol ; imite souvent une guêpe, une abeille ou un bourdon ; sur les fleurs.', vers: 'r-syrphidae' },
          { texte: 'Corps très velu, longue trompe rigide pointée vers l’avant ; butine en vol stationnaire.', vers: 'r-bombyliidae' },
          { texte: 'Grosse mouche aux yeux énormes, souvent irisés ; la femelle pique le bétail et l’homme.', vers: 'r-tabanidae' },
          { texte: 'Prédatrice : pattes fortes et épineuses, « moustache » sur la face, creux marqué entre les yeux.', vers: 'r-asilidae' },
          { texte: 'Corps aplati, souvent vert métallique ou jaune et noir ; au repos, ailes posées à plat l’une sur l’autre.', vers: 'r-stratiomyidae' },
          { texte: 'Petite, vert métallique, longues pattes ; court sur les feuilles et la vase.', vers: 'r-dolichopodidae' },
          { texte: 'Petite, ailes ornées de taches ou de bandes, qu’elle agite au repos.', vers: 'r-tephritidae' },
          { texte: 'Mouche trapue, à fortes soies sur le corps.', vers: 'calyptrates' },
        ],
      },
      calyptrates: {
        type: 'question',
        texte: 'Mouche trapue à soies :',
        choix: [
          { texte: 'Corps bleu ou vert métallique.', vers: 'r-calliphoridae' },
          { texte: 'Corps gris ; thorax rayé de noir, abdomen en damier gris et noir.', vers: 'r-sarcophagidae' },
          { texte: 'Abdomen hérissé de très fortes soies dressées ; souvent sur les fleurs.', vers: 'r-tachinidae' },
          { texte: 'Grise ou noirâtre, sans rien de tout cela : allure de mouche domestique.', vers: 'r-muscidae' },
        ],
      },
      'r-tipules': { type: 'resultat', nom: 'Tipules (cousins)', sci: 'Tipuloidea', texte: 'Inoffensives : elles ne piquent pas.', annuaire: [...DIP, 'Tipuloidea (tipules)'] },
      'r-culicidae': { type: 'resultat', nom: 'Moustiques', sci: 'Culicidae', annuaire: DIP },
      'r-chironomidae': { type: 'resultat', nom: 'Chironomes', sci: 'Chironomidae', annuaire: DIP },
      'r-bibionidae': { type: 'resultat', nom: 'Bibions (mouches de la Saint-Marc)', sci: 'Bibionidae', annuaire: [...DIP, 'Bibionidae (bibions)'] },
      'r-syrphidae': { type: 'resultat', nom: 'Syrphes', sci: 'Syrphidae', texte: 'Le critère sûr est une fausse nervure au milieu de l’aile, visible sur une bonne photo.', annuaire: [...DIP, 'Syrphidae (syrphes)'] },
      'r-bombyliidae': { type: 'resultat', nom: 'Bombyles', sci: 'Bombyliidae', annuaire: [...DIP, 'Bombyliidae (bombyles)'] },
      'r-tabanidae': { type: 'resultat', nom: 'Taons', sci: 'Tabanidae', annuaire: [...DIP, 'Tabanidae (taons)'] },
      'r-asilidae': { type: 'resultat', nom: 'Asiles', sci: 'Asilidae', annuaire: [...DIP, 'Asilidae (asiles)'] },
      'r-stratiomyidae': { type: 'resultat', nom: 'Stratiomes (mouches armées)', sci: 'Stratiomyidae', annuaire: [...DIP, 'Stratiomyidae (stratiomes)'] },
      'r-dolichopodidae': { type: 'resultat', nom: 'Dolichopodes', sci: 'Dolichopodidae', annuaire: DIP },
      'r-tephritidae': { type: 'resultat', nom: 'Mouches des fruits', sci: 'Tephritidae', texte: 'D’autres petites familles ont aussi les ailes tachées (Ulidiidae, Platystomatidae).', annuaire: [...DIP, 'Tephritidae'] },
      'r-calliphoridae': { type: 'resultat', nom: 'Mouches bleues et vertes', sci: 'Calliphoridae', texte: 'Quelques Muscidae et Tachinidae sont aussi métalliques.', annuaire: [...DIP, 'Calliphoridae et Rhinophoridae'] },
      'r-sarcophagidae': { type: 'resultat', nom: 'Mouches à damier', sci: 'Sarcophagidae', annuaire: DIP },
      'r-tachinidae': { type: 'resultat', nom: 'Tachinaires', sci: 'Tachinidae', texte: 'Leurs larves parasitent d’autres insectes, souvent des chenilles.', annuaire: [...DIP, 'Tachinidae (tachinaires)'] },
      'r-muscidae': { type: 'resultat', nom: 'Mouches domestiques et apparentées', sci: 'Muscidae et familles voisines', texte: 'Groupe difficile : plusieurs familles ne se séparent qu’à la loupe (Muscidae, Anthomyiidae, Fanniidae).', annuaire: DIP },
    },
  },

  // ------------------------------------------------------------------ Punaises
  {
    id: 'punaises-familles',
    titre: 'Punaises : trouver la famille',
    portee: 'Punaises adultes, terrestres et aquatiques : les familles les plus rencontrées.',
    groupe: 'hemipteres',
    debut: 'milieu',
    noeuds: {
      milieu: {
        type: 'question',
        texte: 'Où vit-elle ?',
        choix: [
          { texte: 'Elle marche ou patine à la surface de l’eau.', vers: 'surface' },
          { texte: 'Elle nage sous l’eau.', vers: 'sous-eau' },
          { texte: 'Sur la terre ferme : végétation, sol, écorces.', vers: 'terrestres' },
        ],
      },
      surface: {
        type: 'question',
        texte: 'À la surface :',
        choix: [
          { texte: 'Pattes médianes et arrière très longues, écartées en croix ; glisse par saccades.', vers: 'r-gerridae' },
          { texte: 'Corps fin comme une aiguille, tête très allongée ; marche lentement sur l’eau.', vers: 'r-hydrometridae' },
        ],
      },
      'sous-eau': {
        type: 'question',
        texte: 'Sous l’eau :',
        choix: [
          { texte: 'Nage sur le dos, ventre en l’air, avec deux longues pattes en rames.', vers: 'r-notonectidae' },
          { texte: 'Nage sur le ventre ; dos plat finement strié ; pattes avant courtes, en palettes.', vers: 'r-corixidae' },
          { texte: 'Pattes avant en pinces, long tube respiratoire au bout de l’abdomen ; se déplace lentement.', vers: 'r-nepidae' },
          { texte: 'Ovale, aplatie, vert olive ; pattes avant en crochets ; bonne nageuse.', vers: 'r-naucoridae' },
        ],
      },
      terrestres: {
        type: 'question',
        texte: 'Sur la terre ferme :',
        choix: [
          { texte: 'Corps en bouclier ; grand écusson triangulaire atteignant au moins le milieu de l’abdomen ; antennes de cinq articles.', vers: 'r-pentatomoidea' },
          { texte: 'Brune, allongée, robuste ; bords de l’abdomen débordant des ailes ; antennes de quatre articles.', vers: 'r-coreidae' },
          { texte: 'Rouge et noire.', vers: 'rouges' },
          { texte: 'Petite, molle, fragile ; antennes fines ; une encoche près du bout de la partie coriace de l’aile.', vers: 'r-miridae' },
          { texte: 'Prédatrice : tête étroite suivie d’un « cou », rostre court et arqué.', vers: 'r-reduviidae' },
          { texte: 'Minuscule et plate ; dos et ailes ornés d’un réseau de dentelle.', vers: 'r-tingidae' },
        ],
      },
      rouges: {
        type: 'question',
        texte: 'Rouge et noire :',
        choix: [
          { texte: 'Très commune au pied des tilleuls et des mauves, en groupes ; ailes le plus souvent courtes ; dessin évoquant un masque.', vers: 'r-pyrrhocoridae' },
          { texte: 'Ailes entières, avec une partie membraneuse noire ; sur les plantes, souvent sur les dompte-venins, séneçons ou lauriers-roses.', vers: 'r-lygaeidae' },
          { texte: 'Rayée de rouge et de noir dans le sens de la longueur ; sur les ombellifères.', vers: 'r-graphosoma' },
        ],
      },
      'r-gerridae': { type: 'resultat', nom: 'Gerris (patineurs)', sci: 'Gerridae', texte: 'Les vélies, plus petites et à pattes plus courtes, vivent sur les ruisseaux.', annuaire: PUN },
      'r-hydrometridae': { type: 'resultat', nom: 'Hydromètres', sci: 'Hydrometridae', annuaire: PUN },
      'r-notonectidae': { type: 'resultat', nom: 'Notonectes', sci: 'Notonectidae', texte: 'Leur piqûre est douloureuse.', annuaire: PUN },
      'r-corixidae': { type: 'resultat', nom: 'Corises', sci: 'Corixidae', annuaire: PUN },
      'r-nepidae': { type: 'resultat', nom: 'Nèpe et ranatre', sci: 'Nepidae', texte: 'La nèpe est large et plate comme une feuille morte ; la ranatre est en bâtonnet.', annuaire: PUN },
      'r-naucoridae': { type: 'resultat', nom: 'Naucore', sci: 'Naucoridae', texte: 'Pique fort si on la saisit.', annuaire: PUN },
      'r-pentatomoidea': {
        type: 'resultat',
        nom: 'Punaises à bouclier',
        sci: 'Pentatomoidea',
        texte: 'Surtout des Pentatomidae. Familles voisines : Acanthosomatidae, Scutelleridae (écusson couvrant tout l’abdomen), Cydnidae (noires, fouisseuses).',
        annuaire: [...PUN, 'Pentatomoidea'],
      },
      'r-coreidae': { type: 'resultat', nom: 'Corées', sci: 'Coreidae', texte: 'Les Rhopalidae, plus petits, ont des ailes en partie transparentes.', annuaire: PUN },
      'r-pyrrhocoridae': { type: 'resultat', nom: 'Gendarme', sci: 'Pyrrhocoris apterus (Pyrrhocoridae)', annuaire: PUN },
      'r-lygaeidae': { type: 'resultat', nom: 'Lygées', sci: 'Lygaeidae', texte: 'Lygaeus equestris et Spilostethus pandurus sont les plus remarqués.', annuaire: PUN },
      'r-graphosoma': { type: 'resultat', nom: 'Punaise arlequin', sci: 'Graphosoma italicum (Pentatomidae)', annuaire: [...PUN, 'Pentatomoidea'] },
      'r-miridae': { type: 'resultat', nom: 'Mirides', sci: 'Miridae', texte: 'La plus grande famille de punaises ; détermination souvent difficile.', annuaire: [...PUN, 'Miridae'] },
      'r-reduviidae': { type: 'resultat', nom: 'Réduves', sci: 'Reduviidae', texte: 'Peuvent piquer si on les manipule.', annuaire: PUN },
      'r-tingidae': { type: 'resultat', nom: 'Tigres (punaises réticulées)', sci: 'Tingidae', annuaire: PUN },
    },
  },

  // ------------------------------------------------------------------ Araignées
  {
    id: 'araignees-familles',
    titre: 'Araignées : trouver la famille',
    portee: 'Araignées adultes, d’après la toile et le comportement : une douzaine de familles courantes.',
    groupe: 'arachnides',
    debut: 'toile',
    noeuds: {
      toile: {
        type: 'question',
        texte: 'Y a-t-il une toile de chasse ?',
        choix: [
          { texte: 'Oui, une toile régulière en roue, avec rayons et spirale.', vers: 'orbitele' },
          { texte: 'Oui, une nappe prolongée par un tube où l’araignée se tient à l’affût.', vers: 'r-agelenidae' },
          { texte: 'Oui, une petite nappe horizontale sous laquelle l’araignée se tient à l’envers.', vers: 'r-linyphiidae' },
          { texte: 'Oui, un réseau de fils en tous sens, sans forme nette ; abdomen globuleux.', vers: 'r-theridiidae' },
          { texte: 'Très longues pattes fines ; pend dans une toile lâche aux angles des plafonds et des caves.', vers: 'r-pholcidae' },
          { texte: 'Non : elle chasse sans toile.', vers: 'errantes' },
        ],
      },
      orbitele: {
        type: 'question',
        texte: 'Toile en roue :',
        choix: [
          { texte: 'Corps très allongé, longues pattes tendues dans l’axe ; grandes mâchoires ; près de l’eau.', vers: 'r-tetragnathidae' },
          { texte: 'Abdomen arrondi ou anguleux ; se tient au centre de la toile ou dans une cachette reliée par un fil.', vers: 'r-araneidae' },
        ],
      },
      errantes: {
        type: 'question',
        texte: 'Sans toile de chasse :',
        choix: [
          { texte: 'Deux gros yeux tournés vers l’avant ; pattes courtes ; avance par petits bonds, de jour.', vers: 'r-salticidae' },
          { texte: 'Pattes avant plus longues, écartées comme celles d’un crabe ; se déplace de côté ; à l’affût sur les fleurs.', vers: 'r-thomisidae' },
          { texte: 'Court au sol ; la femelle traîne un cocon blanc accroché à l’arrière, puis porte ses petits sur le dos.', vers: 'r-lycosidae' },
          { texte: 'Grande, pattes groupées deux à deux en croix au repos ; la femelle tient son cocon dans les mâchoires.', vers: 'r-pisauridae' },
          { texte: 'Avant du corps rouge orangé, abdomen beige ; grandes mâchoires ; sous les pierres et les écorces.', vers: 'r-dysderidae' },
          { texte: 'Sombre, veloutée, allongée ; nocturne ; se cache le jour dans une loge de soie.', vers: 'r-gnaphosidae' },
        ],
      },
      'r-agelenidae': { type: 'resultat', nom: 'Agélènes et tégénaires', sci: 'Agelenidae', annuaire: ARA },
      'r-linyphiidae': { type: 'resultat', nom: 'Linyphies et érigones', sci: 'Linyphiidae', texte: 'La famille la plus riche en espèces en Europe ; la plupart sont minuscules.', annuaire: ARA },
      'r-theridiidae': { type: 'resultat', nom: 'Théridions', sci: 'Theridiidae', texte: 'Comprend les stéatodes et, dans le Midi, la Malmignatte.', annuaire: ARA },
      'r-pholcidae': { type: 'resultat', nom: 'Pholques', sci: 'Pholcidae', texte: 'À ne pas confondre avec les opilions, qui n’ont ni taille ni toile.', annuaire: ARA },
      'r-tetragnathidae': { type: 'resultat', nom: 'Tétragnathes', sci: 'Tetragnathidae', texte: 'Les Metellina, de la même famille, sont plus trapues et ressemblent à de petites épeires.', annuaire: ARA },
      'r-araneidae': { type: 'resultat', nom: 'Épeires et argiopes', sci: 'Araneidae', annuaire: ARA },
      'r-salticidae': { type: 'resultat', nom: 'Saltiques (araignées sauteuses)', sci: 'Salticidae', annuaire: ARA },
      'r-thomisidae': { type: 'resultat', nom: 'Araignées-crabes', sci: 'Thomisidae', texte: 'Les Philodromidae leur ressemblent mais sont plus rapides, aux pattes de longueur plus égale.', annuaire: ARA },
      'r-lycosidae': { type: 'resultat', nom: 'Araignées-loups', sci: 'Lycosidae', annuaire: ARA },
      'r-pisauridae': { type: 'resultat', nom: 'Pisaure et dolomèdes', sci: 'Pisauridae', texte: 'La femelle tisse une toile-pouponnière pour ses jeunes, qu’elle garde.', annuaire: ARA },
      'r-dysderidae': { type: 'resultat', nom: 'Dysdères', sci: 'Dysderidae', texte: 'Six yeux seulement. Elles chassent les cloportes.', annuaire: ARA },
      'r-gnaphosidae': { type: 'resultat', nom: 'Gnaphoses et drasses', sci: 'Gnaphosidae', texte: 'Les Clubionidae, plus claires, ont le même mode de vie.', annuaire: ['Arachnides', 'Araignées', 'Araignées sans toile de chasse'] },
    },
  },

  // ------------------------------------------------------------------ Amphibiens
  {
    id: 'amphibiens-genres',
    titre: 'Amphibiens : trouver le groupe',
    portee: 'Amphibiens adultes de France métropolitaine, jusqu’au genre ou au groupe d’espèces.',
    groupe: 'amphibiens',
    debut: 'queue',
    noeuds: {
      queue: {
        type: 'question',
        texte: 'L’animal a-t-il une queue ?',
        choix: [
          { texte: 'Oui : corps allongé, quatre pattes de même taille.', vers: 'urodeles' },
          { texte: 'Non : corps ramassé, pattes arrière plus longues, faites pour sauter.', vers: 'anoures' },
        ],
      },
      urodeles: {
        type: 'question',
        texte: 'Avec une queue :',
        choix: [
          { texte: 'Noir luisant à taches jaunes ; terrestre, sort par temps humide.', vers: 'r-salamandre-tachetee' },
          { texte: 'Entièrement noire ; Alpes, en altitude.', vers: 'r-salamandre-noire' },
          { texte: 'Peau rugueuse brun-gris, tête aplatie ; torrents froids des Pyrénées ou de Corse.', vers: 'r-euproctes' },
          { texte: 'Doigts à demi palmés ; grottes et lieux très humides, extrême sud-est.', vers: 'r-speleomantes' },
          { texte: 'Dans l’eau au printemps, queue aplatie en nageoire ; le mâle porte souvent une crête.', vers: 'r-tritons' },
        ],
      },
      anoures: {
        type: 'question',
        texte: 'Sans queue : regarde la peau et la pupille.',
        choix: [
          { texte: 'Petite, peau lisse vert vif, bout des doigts en ventouses ; grimpe dans la végétation.', vers: 'r-hyla' },
          { texte: 'Peau couverte de verrues, grosse glande allongée derrière l’œil ; marche plus qu’elle ne saute.', vers: 'crapauds' },
          { texte: 'Ventre jaune vif marbré de noir ; pupille en forme de cœur ; petite, mares et ornières.', vers: 'r-bombina' },
          { texte: 'Pupille verticale, en fente.', vers: 'pupille-verticale' },
          { texte: 'Peau lisse, longues pattes arrière, bonne sauteuse ; pupille horizontale.', vers: 'grenouilles' },
        ],
      },
      crapauds: {
        type: 'question',
        texte: 'Crapaud :',
        choix: [
          { texte: 'Grand, brun uni, œil orangé ; pas de ligne sur le dos.', vers: 'r-bufo' },
          { texte: 'Plus petit, une fine ligne jaune au milieu du dos ; œil jaune-vert ; court comme une souris.', vers: 'r-epidalea' },
        ],
      },
      'pupille-verticale': {
        type: 'question',
        texte: 'Pupille verticale :',
        choix: [
          { texte: 'Petit, trapu, gris, verruqueux ; chant flûté d’une seule note ; le mâle porte les œufs autour des pattes arrière.', vers: 'r-alytes' },
          { texte: 'Yeux très saillants, peau lisse ; une lame cornée tranchante au talon ; s’enfouit dans le sable.', vers: 'r-pelobates' },
          { texte: 'Svelte, dos semé de petites taches vert vif ; bonne grimpeuse et sauteuse.', vers: 'r-pelodytes' },
        ],
      },
      grenouilles: {
        type: 'question',
        texte: 'Grenouille :',
        choix: [
          { texte: 'Brune ; une tache sombre en masque derrière l’œil ; souvent loin de l’eau.', vers: 'r-rana' },
          { texte: 'Verte ou brun-vert, sans masque ; reste dans l’eau ou sur la berge ; chant sonore, sacs vocaux aux coins de la bouche.', vers: 'r-pelophylax' },
          { texte: 'Allure de grenouille trapue, museau pointu, pupille ronde ou en goutte ; Corse, ou introduite localement.', vers: 'r-discoglossus' },
        ],
      },
      'r-salamandre-tachetee': { type: 'resultat', nom: 'Salamandre tachetée', sci: 'Salamandra salamandra', annuaire: ['Amphibiens', 'Adultes'] },
      'r-salamandre-noire': { type: 'resultat', nom: 'Salamandre noire', sci: 'Salamandra atra', texte: 'Il existe aussi la Salamandre de Lanza, très localisée dans les Alpes du Sud.', annuaire: ['Amphibiens', 'Adultes'] },
      'r-euproctes': { type: 'resultat', nom: 'Euproctes', sci: 'Calotriton asper (Pyrénées), Euproctus montanus (Corse)', annuaire: ['Amphibiens', 'Adultes'] },
      'r-speleomantes': { type: 'resultat', nom: 'Spélerpès', sci: 'Speleomantes strinatii', annuaire: ['Amphibiens', 'Adultes'] },
      'r-tritons': {
        type: 'resultat',
        nom: 'Tritons',
        sci: 'Triturus, Lissotriton, Ichthyosaura',
        texte: 'Grands tritons : crêté et marbré (Triturus). Petits tritons : palmé et ponctué (Lissotriton). Le Triton alpestre a le ventre orange uni (Ichthyosaura).',
        annuaire: ['Amphibiens', 'Adultes'],
      },
      'r-hyla': { type: 'resultat', nom: 'Rainettes', sci: 'Hyla', texte: 'La bande sombre du flanc s’arrête à l’épaule chez la Rainette méridionale et se prolonge jusqu’à l’aine chez la Rainette verte.', annuaire: ['Amphibiens', 'Adultes', 'Rainettes (Hyla)'] },
      'r-bufo': { type: 'resultat', nom: 'Crapaud commun et Crapaud épineux', sci: 'Bufo bufo, Bufo spinosus', annuaire: ['Amphibiens', 'Adultes'] },
      'r-epidalea': { type: 'resultat', nom: 'Crapaud calamite', sci: 'Epidalea calamita', texte: 'Le Crapaud vert, sans ligne dorsale et à taches vertes, est très localisé (Alsace, Corse).', annuaire: ['Amphibiens', 'Adultes'] },
      'r-bombina': { type: 'resultat', nom: 'Sonneur à ventre jaune', sci: 'Bombina variegata', annuaire: ['Amphibiens', 'Adultes'] },
      'r-alytes': { type: 'resultat', nom: 'Alyte accoucheur', sci: 'Alytes obstetricans', annuaire: ['Amphibiens', 'Adultes'] },
      'r-pelobates': { type: 'resultat', nom: 'Pélobates', sci: 'Pelobates cultripes, Pelobates fuscus', annuaire: ['Amphibiens', 'Adultes'] },
      'r-pelodytes': { type: 'resultat', nom: 'Pélodyte ponctué', sci: 'Pelodytes punctatus', annuaire: ['Amphibiens', 'Adultes'] },
      'r-rana': { type: 'resultat', nom: 'Grenouilles brunes', sci: 'Rana', texte: 'Grenouille rousse, agile et des Pyrénées : à séparer par la longueur des pattes, le museau et le tympan.', annuaire: ['Amphibiens', 'Adultes', 'Grenouilles brunes (Rana)'] },
      'r-pelophylax': { type: 'resultat', nom: 'Grenouilles vertes', sci: 'Pelophylax', texte: 'Complexe d’espèces et d’hybrides : la détermination à vue est souvent impossible.', annuaire: ['Amphibiens', 'Adultes'] },
      'r-discoglossus': { type: 'resultat', nom: 'Discoglosses', sci: 'Discoglossus', annuaire: ['Amphibiens', 'Adultes'] },
    },
  },

  // ------------------------------------------------------------------ Reptiles
  {
    id: 'reptiles-groupes',
    titre: 'Reptiles : trouver le groupe',
    portee: 'Reptiles de France métropolitaine, jusqu’au groupe ou au genre.',
    groupe: 'reptiles',
    debut: 'forme',
    noeuds: {
      forme: {
        type: 'question',
        texte: 'Quelle est la forme générale ?',
        choix: [
          { texte: 'Une carapace.', vers: 'tortues' },
          { texte: 'Pas de pattes.', vers: 'sans-pattes' },
          { texte: 'Quatre pattes et une queue.', vers: 'lezards' },
        ],
      },
      tortues: {
        type: 'question',
        texte: 'Tortue :',
        choix: [
          { texte: 'Terrestre ; carapace bombée, jaune et noire ; Var et Corse.', vers: 'r-hermann' },
          { texte: 'Aquatique ; carapace sombre, tête et pattes semées de points ou de traits jaunes.', vers: 'r-cistude' },
          { texte: 'Aquatique ; une tache rouge ou jaune vif sur la tempe.', vers: 'r-trachemys' },
          { texte: 'Aquatique ; carapace brun olive, cou rayé d’orange ; Pyrénées-Orientales et Hérault.', vers: 'r-mauremys' },
        ],
      },
      'sans-pattes': {
        type: 'question',
        texte: 'Sans pattes : approche-toi sans toucher.',
        choix: [
          { texte: 'Écailles lisses et luisantes, corps raide ; il cligne des yeux ; petit (30 à 45 cm).', vers: 'r-orvet' },
          { texte: 'Pupille en fente verticale ; dessus de la tête couvert surtout de petites écailles ; corps trapu, queue courte.', vers: 'r-viperes' },
          { texte: 'Pupille ronde ; dessus de la tête couvert de neuf grandes plaques ; corps élancé, longue queue fine.', vers: 'r-couleuvres' },
        ],
      },
      lezards: {
        type: 'question',
        texte: 'Quatre pattes :',
        choix: [
          { texte: 'Doigts élargis en ventouses ; grimpe aux murs, surtout la nuit ; Midi.', vers: 'r-geckos' },
          { texte: 'Corps cylindrique lisse et brillant, pattes minuscules ; se faufile dans l’herbe ; Midi.', vers: 'r-seps' },
          { texte: 'Lézard classique : pattes bien développées, longue queue, écailles en grain.', vers: 'r-lacertidae' },
        ],
      },
      'r-hermann': { type: 'resultat', nom: 'Tortue d’Hermann', sci: 'Testudo hermanni', annuaire: ['Reptiles'] },
      'r-cistude': { type: 'resultat', nom: 'Cistude d’Europe', sci: 'Emys orbicularis', annuaire: ['Reptiles'] },
      'r-trachemys': { type: 'resultat', nom: 'Tortue de Floride', sci: 'Trachemys scripta', texte: 'Espèce introduite, exotique envahissante.', annuaire: ['Reptiles'] },
      'r-mauremys': { type: 'resultat', nom: 'Émyde lépreuse', sci: 'Mauremys leprosa', annuaire: ['Reptiles'] },
      'r-orvet': { type: 'resultat', nom: 'Orvet', sci: 'Anguis', texte: 'Un lézard sans pattes, inoffensif.', annuaire: ['Reptiles', 'Squamates (lézards et serpents)'] },
      'r-viperes': {
        type: 'resultat',
        nom: 'Vipères',
        sci: 'Vipera',
        texte: 'Venimeuses : ne jamais manipuler. La Couleuvre vipérine les imite, mais elle a la pupille ronde et vit près de l’eau.',
        annuaire: ['Reptiles', 'Serpents'],
      },
      'r-couleuvres': {
        type: 'resultat',
        nom: 'Couleuvres',
        sci: 'Colubridae et Natricidae',
        texte: 'Couleuvres helvétique et vipérine près de l’eau, verte et jaune, d’Esculape, coronelles, Couleuvre de Montpellier dans le Midi.',
        annuaire: ['Reptiles', 'Serpents'],
      },
      'r-geckos': { type: 'resultat', nom: 'Geckos', sci: 'Tarentola, Hemidactylus, Euleptes', annuaire: ['Reptiles', 'Squamates (lézards et serpents)'] },
      'r-seps': { type: 'resultat', nom: 'Seps strié', sci: 'Chalcides striatus', annuaire: ['Reptiles', 'Squamates (lézards et serpents)'] },
      'r-lacertidae': {
        type: 'resultat',
        nom: 'Lézards',
        sci: 'Lacertidae',
        texte: 'Lézard des murailles (le plus commun), lézards verts, Lézard ocellé, Lézard vivipare, Lézard des souches, psammodromes.',
        annuaire: ['Reptiles', 'Squamates (lézards et serpents)'],
      },
    },
  },
];
