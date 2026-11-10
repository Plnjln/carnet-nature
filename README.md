# Carnet Nature

Carnet hors ligne pour observations naturalistes. Application personnelle : pas de compte, pas de serveur, toutes les données restent sur l'appareil.

Adresse de l'app : **https://lapinlapin2.github.io/carnet-nature/**

## Où en est le projet

Étape 1, le socle :

- application installable sur téléphone (PWA), utilisable hors ligne ;
- schéma de données complet (observations, photos, sorties, traces, file d'attente d'enrichissement) ;
- index TAXREF de la faune embarqué, avec recherche floue hors ligne (onglet **Espèces**) ;
- générateur de 10 000 observations factices pour tester les performances (onglet **Données**).

À venir : saisie rapide, photos, galerie, exports et sauvegarde, puis carte, fiche espèce et life list.

## Mettre l'app en ligne (une seule fois)

1. Sur la page du dépôt GitHub : **Settings → Pages**.
2. Sous **Build and deployment**, dans **Source**, choisir **GitHub Actions**.

Ensuite, chaque modification de la branche `main` republie l'app automatiquement. On suit la publication dans l'onglet **Actions** du dépôt : une coche verte signifie que l'app est en ligne, une croix rouge qu'il y a une erreur à corriger.

## Mettre à jour le code depuis le navigateur

1. Page du dépôt → **Add file → Upload files**.
2. Glisser dans la zone tout le contenu du dossier `carnet-nature` (y compris le dossier `.github`).
3. En bas de page, cliquer sur **Commit changes**.

## Installer l'app sur un téléphone Android

1. Ouvrir l'adresse de l'app dans Chrome.
2. Menu ⋮ → **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
3. Ouvrir une première fois l'onglet **Espèces** avec du réseau : l'index TAXREF se télécharge et reste ensuite disponible hors ligne.

## Développer sur un ordinateur (facultatif)

Il faut Node.js 22 ou plus récent.

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests de la recherche floue
npm run check    # vérification des types
npm run build    # version de production dans dist/
```

Pour reconstruire l'index TAXREF en local : télécharger et décompresser l'archive `https://ipt.gbif.fr/archive.do?r=taxref` dans `.taxref-src/`, puis lancer `npm run taxref -- .taxref-src public/taxref`.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `src/domain/` | Types de données, groupes taxonomiques |
| `src/db/` | Base locale (IndexedDB via Dexie), projection en mémoire |
| `src/taxonomy/` | Recherche floue de taxons (Web Worker) |
| `src/features/` | Écrans : saisie, galerie, carte, espèces, données |
| `src/ui/` | Composants d'interface communs |
| `scripts/` | Conversion de TAXREF en index compact |
| `tests/` | Tests automatiques |
| `.github/workflows/` | Publication automatique sur GitHub Pages |

## Sources de données et licences

- **TAXREF v18.0** — Gargominy O (2025). TAXREF. UAR PatriNat (OFB-MNHN-CNRS-IRD), Paris. https://doi.org/10.15468/vqueam. Licence CC BY 4.0 (archive publiée sur l'IPT de GBIF France). L'index embarqué couvre la faune, de la classe à la sous-espèce, métropole et outre-mer.
- **Fonds de carte** (à venir) — © contributeurs OpenStreetMap ; © IGN, Géoplateforme.
