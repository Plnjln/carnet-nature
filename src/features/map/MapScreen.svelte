<script lang="ts">
  // Carte de toutes les observations (MapLibre GL, rendu WebGL).
  // Les points sont regroupés en grappes quand on dézoome ; le regroupement est fait par la
  // carte elle-même, ce qui reste fluide avec plus de 10 000 points.
  import type { FeatureCollection, Point } from 'geojson';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onDestroy, onMount } from 'svelte';
  import { db } from '../../db/db';
  import { GROUPS, type GroupId } from '../../domain/groups';
  import type { ObsLite } from '../../domain/types';
  import { filters } from '../../stores/filters.svelte';
  import { obsStore } from '../../stores/obs.svelte';
  import GroupIcon from '../../ui/GroupIcon.svelte';

  let {
    onOpen,
    onCreateAt,
  }: { onOpen: (id: string) => void; onCreateAt: (lat: number, lon: number) => void } = $props();

  type FondId = 'osm' | 'plan' | 'ortho';
  const ign = (couche: string, format: string) =>
    `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${couche}&STYLE=normal&FORMAT=${format}&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
  const FONDS: { id: FondId; label: string; tuiles: string; attribution: string }[] = [
    { id: 'osm', label: 'OSM', tuiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© contributeurs OpenStreetMap' },
    { id: 'plan', label: 'Plan IGN', tuiles: ign('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'), attribution: '© IGN' },
    { id: 'ortho', label: 'Photo aérienne', tuiles: ign('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'), attribution: '© IGN' },
  ];
  const CLE_VUE = 'carte-vue';
  const CLE_FOND = 'carte-fond';

  let conteneur: HTMLDivElement | undefined = $state();
  let carte: maplibregl.Map | undefined;
  let bulle: maplibregl.Popup | undefined;
  let pret = $state(false);
  let fond = $state<FondId>('osm');
  let masques = $state.raw<GroupId[]>([]);
  let legendeOuverte = $state(false);

  // Observations localisées qui passent les filtres (partagés avec la galerie).
  const localisees = $derived(filters.rows.filter((o) => o.lat !== undefined && o.lon !== undefined));
  const visibles = $derived(masques.length ? localisees.filter((o) => !masques.includes(o.group)) : localisees);
  const sansPosition = $derived(filters.rows.length - localisees.length);
  const groupesPresents = $derived.by(() => {
    const compte = new Map<GroupId, number>();
    for (const o of localisees) compte.set(o.group, (compte.get(o.group) ?? 0) + 1);
    return (Object.keys(GROUPS) as GroupId[]).filter((g) => compte.has(g)).map((g) => ({ id: g, n: compte.get(g) ?? 0 }));
  });

  function donnees(rows: ObsLite[]): FeatureCollection<Point> {
    return {
      type: 'FeatureCollection',
      features: rows.map((o) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [o.lon as number, o.lat as number] },
        properties: { id: o.id, g: o.group },
      })),
    };
  }

  /** Couleur du point selon le groupe. */
  function couleurParGroupe(): maplibregl.ExpressionSpecification {
    const paires: string[] = [];
    for (const g of Object.keys(GROUPS) as GroupId[]) paires.push(g, GROUPS[g].color);
    return ['match', ['get', 'g'], ...paires, '#666666'] as unknown as maplibregl.ExpressionSpecification;
  }

  function cadrer(rows: ObsLite[]) {
    if (!carte || rows.length === 0) return;
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;
    for (const o of rows) {
      const lat = o.lat as number;
      const lon = o.lon as number;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    carte.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 60, maxZoom: 14, duration: 0 },
    );
  }

  async function ouvrirBulle(id: string, position: [number, number]) {
    if (!carte) return;
    const o = obsStore.rows.find((r) => r.id === id);
    if (!o) return;
    bulle?.remove();

    const el = document.createElement('div');
    el.className = 'bulle-obs';
    let adresseImage = '';
    if (o.photoId) {
      const ligne = await db.photoThumbs.get(o.photoId);
      if (ligne) {
        adresseImage = URL.createObjectURL(ligne.blob);
        const img = document.createElement('img');
        img.src = adresseImage;
        img.alt = '';
        el.appendChild(img);
      }
    }
    const nom = document.createElement('strong');
    nom.textContent = o.vern || o.sci;
    el.appendChild(nom);
    if (o.vern) {
      const sci = document.createElement('em');
      sci.textContent = o.sci;
      el.appendChild(sci);
    }
    const infos = document.createElement('small');
    const date = new Date(o.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    infos.textContent = `${date}${o.count > 1 ? ` · ×${o.count}` : ''}${o.place ? ` · ${o.place}` : ''}`;
    el.appendChild(infos);
    const bouton = document.createElement('button');
    bouton.textContent = 'Ouvrir la fiche';
    bouton.addEventListener('click', () => onOpen(id));
    el.appendChild(bouton);

    bulle = new maplibregl.Popup({ offset: 14, maxWidth: '260px' }).setLngLat(position).setDOMContent(el).addTo(carte);
    bulle.on('close', () => {
      if (adresseImage) URL.revokeObjectURL(adresseImage);
    });
  }

  onMount(() => {
    if (!conteneur) return;
    try {
      const memorise = localStorage.getItem(CLE_FOND) as FondId | null;
      if (memorise && FONDS.some((f) => f.id === memorise)) fond = memorise;
    } catch {
      // Stockage indisponible.
    }

    const sources: Record<string, maplibregl.SourceSpecification> = {};
    const couches: maplibregl.LayerSpecification[] = [];
    for (const f of FONDS) {
      sources[`fond-${f.id}`] = { type: 'raster', tiles: [f.tuiles], tileSize: 256, maxzoom: 19, attribution: f.attribution };
      couches.push({ id: `fond-${f.id}`, type: 'raster', source: `fond-${f.id}`, layout: { visibility: f.id === fond ? 'visible' : 'none' } });
    }

    const m = new maplibregl.Map({
      container: conteneur,
      style: {
        version: 8,
        // Polices des étiquettes de grappes (serveur de démonstration de MapLibre).
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources,
        layers: couches,
      },
      center: [2.5, 46.6],
      zoom: 5,
      maxZoom: 19,
      attributionControl: { compact: true },
    });
    carte = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    // Bouton « ma position ».
    m.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');
    m.addControl(new maplibregl.ScaleControl({}), 'bottom-left');

    m.on('load', () => {
      m.addSource('obs', { type: 'geojson', data: donnees(visibles), cluster: true, clusterRadius: 46, clusterMaxZoom: 15 });
      m.addLayer({
        id: 'grappes',
        type: 'circle',
        source: 'obs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#17603f',
          'circle-opacity': 0.9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 100, 26, 1000, 32],
        },
      });
      m.addLayer({
        id: 'grappes-nombre',
        type: 'symbol',
        source: 'obs',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Open Sans Semibold'], 'text-size': 13, 'text-allow-overlap': true },
        paint: { 'text-color': '#ffffff' },
      });
      m.addLayer({
        id: 'points',
        type: 'circle',
        source: 'obs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': couleurParGroupe(),
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Vue : celle de la dernière visite, sinon cadrage sur les observations.
      let restauree = false;
      try {
        const vue = JSON.parse(localStorage.getItem(CLE_VUE) ?? 'null') as { c: [number, number]; z: number } | null;
        if (vue && Array.isArray(vue.c) && typeof vue.z === 'number') {
          m.jumpTo({ center: vue.c, zoom: vue.z });
          restauree = true;
        }
      } catch {
        // Vue mémorisée illisible : on recadre.
      }
      if (!restauree) cadrer(visibles);
      pret = true;
    });

    // Tap sur une grappe : zoom jusqu'à ce qu'elle s'ouvre.
    m.on('click', 'grappes', async (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const source = m.getSource('obs') as maplibregl.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id as number);
      m.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom });
    });
    // Tap sur un point : bulle avec l'essentiel ; le bouton ouvre la fiche.
    m.on('click', 'points', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      void ouvrirBulle(String(f.properties.id), (f.geometry as Point).coordinates as [number, number]);
    });
    for (const couche of ['grappes', 'points']) {
      m.on('mouseenter', couche, () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', couche, () => (m.getCanvas().style.cursor = ''));
    }
    // Appui long (ou clic droit) : nouvelle observation à cet endroit.
    m.on('contextmenu', (e) => {
      e.preventDefault();
      onCreateAt(e.lngLat.lat, e.lngLat.lng);
    });
    m.on('moveend', () => {
      try {
        const c = m.getCenter();
        localStorage.setItem(CLE_VUE, JSON.stringify({ c: [c.lng, c.lat], z: m.getZoom() }));
      } catch {
        // Stockage indisponible.
      }
    });
  });

  onDestroy(() => {
    bulle?.remove();
    carte?.remove();
    carte = undefined;
  });

  // Les points suivent les filtres et la légende.
  $effect(() => {
    const data = donnees(visibles);
    if (!pret || !carte) return;
    (carte.getSource('obs') as maplibregl.GeoJSONSource | undefined)?.setData(data);
  });

  function changerFond(id: FondId) {
    fond = id;
    if (carte && pret) {
      for (const f of FONDS) carte.setLayoutProperty(`fond-${f.id}`, 'visibility', f.id === id ? 'visible' : 'none');
    }
    try {
      localStorage.setItem(CLE_FOND, id);
    } catch {
      // Stockage indisponible.
    }
  }

  function basculerGroupe(g: GroupId) {
    masques = masques.includes(g) ? masques.filter((x) => x !== g) : [...masques, g];
  }
</script>

<div class="carte" bind:this={conteneur}></div>

<div class="outils">
  <div class="fonds" role="group" aria-label="Fond de carte">
    {#each FONDS as f (f.id)}
      <button class="pastille" class:active={fond === f.id} onclick={() => changerFond(f.id)}>{f.label}</button>
    {/each}
  </div>

  <button class="pastille" class:active={legendeOuverte} onclick={() => (legendeOuverte = !legendeOuverte)}>
    Légende{masques.length ? ` (${masques.length} masqué${masques.length > 1 ? 's' : ''})` : ''}
  </button>

  {#if legendeOuverte}
    <div class="legende">
      {#each groupesPresents as g (g.id)}
        <button class="groupe" class:masque={masques.includes(g.id)} style="--couleur: {GROUPS[g.id].color}" onclick={() => basculerGroupe(g.id)}>
          <span class="point"></span>
          <GroupIcon group={g.id} size="1.1rem" />
          <span class="nom">{GROUPS[g.id].label}</span>
          <span class="nombre">{g.n.toLocaleString('fr-FR')}</span>
        </button>
      {:else}
        <p class="doux">Aucune observation localisée.</p>
      {/each}
    </div>
  {/if}

  {#if filters.actifs || sansPosition > 0}
    <p class="note">
      {visibles.length.toLocaleString('fr-FR')} point{visibles.length > 1 ? 's' : ''}
      {#if filters.actifs} · filtres de la galerie actifs <button class="lien" onclick={() => filters.effacer()}>effacer</button>{/if}
      {#if sansPosition > 0} · {sansPosition.toLocaleString('fr-FR')} sans position{/if}
    </p>
  {/if}
</div>

<style>
  .carte {
    position: fixed;
    left: 0;
    right: 0;
    top: calc(64px + env(safe-area-inset-top));
    bottom: calc(64px + env(safe-area-inset-bottom));
    z-index: 1;
    background: var(--bord);
  }
  .outils {
    position: fixed;
    left: 10px;
    top: calc(74px + env(safe-area-inset-top));
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    max-width: calc(100vw - 70px);
    pointer-events: none;
  }
  .outils > * {
    pointer-events: auto;
  }
  .fonds {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pastille {
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--bord);
    border-radius: 22px;
    background: var(--surface);
    color: var(--texte);
    font-weight: 700;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }
  .pastille.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--sur-accent);
  }
  .legende {
    display: flex;
    flex-direction: column;
    max-height: 46vh;
    overflow-y: auto;
    padding: 6px;
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  .groupe {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--texte);
    text-align: left;
    font-weight: 600;
  }
  .groupe.masque {
    opacity: 0.4;
    text-decoration: line-through;
  }
  .point {
    width: 14px;
    height: 14px;
    flex: none;
    border-radius: 50%;
    background: var(--couleur);
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px var(--bord);
  }
  .nom {
    flex: 1;
  }
  .nombre {
    color: var(--texte-doux);
    font-weight: 400;
  }
  .note {
    margin: 0;
    padding: 6px 12px;
    border-radius: 12px;
    background: var(--surface);
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }
  .lien {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-weight: 700;
    text-decoration: underline;
  }

  /* Contenu de la bulle : créé hors du composant, donc stylé globalement. */
  :global(.maplibregl-popup-content) {
    padding: 10px;
    border-radius: 14px;
    color: #10201a;
  }
  :global(.bulle-obs) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 180px;
    font: inherit;
    font-size: 15px;
  }
  :global(.bulle-obs img) {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 6px;
  }
  :global(.bulle-obs small) {
    color: #4a5a52;
  }
  :global(.bulle-obs button) {
    margin-top: 8px;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    background: #17603f;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
  }
</style>
