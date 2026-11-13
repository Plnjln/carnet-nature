import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// L'app est servie par GitHub Pages sous https://<compte>.github.io/carnet-nature/
const BASE = '/carnet-nature/';

export default defineConfig({
  base: BASE,
  // Date de compilation, affichée dans l'onglet Données pour savoir quelle version est installée.
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Carnet Nature',
        short_name: 'Carnet',
        description: 'Carnet hors ligne pour observations naturalistes',
        lang: 'fr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#10201a',
        theme_color: '#1f6f4a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // L'app elle-même est mise en cache à l'installation (utilisable hors ligne).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // L'index TAXREF (plusieurs Mo) est mis en cache à la première utilisation :
        // meta.json est revérifié en ligne, les fichiers de données (nom versionné) ne changent jamais.
        // La carte (MapLibre) dépasse la limite par défaut de 2 Mo : on l'inclut quand même dans le cache hors ligne.
        maximumFileSizeToCacheInBytes: 4_000_000,
        runtimeCaching: [
          // Photos de référence (iNaturalist) déjà affichées : gardées pour un usage hors ligne.
          {
            urlPattern: ({ url }) => ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'].includes(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos-reference',
              expiration: { maxEntries: 3000, maxAgeSeconds: 180 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Tuiles de carte déjà consultées : gardées pour un usage hors ligne (2 mois, 4 000 tuiles au plus).
          {
            urlPattern: ({ url }) => ['tile.openstreetmap.org', 'data.geopf.fr', 'demotiles.maplibre.org'].includes(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tuiles',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // meta.json et statuts.json gardent le même nom d'une version à l'autre : on les revérifie en ligne.
            urlPattern: ({ url }) => url.pathname.endsWith('/taxref/meta.json') || url.pathname.endsWith('/taxref/statuts.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'taxref-meta', networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/taxref/'),
            handler: 'CacheFirst',
            options: { cacheName: 'taxref-donnees', expiration: { maxEntries: 12 } },
          },
        ],
      },
    }),
  ],
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
