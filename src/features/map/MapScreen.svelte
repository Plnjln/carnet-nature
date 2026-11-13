<script lang="ts">
  // Carte de toutes les observations (MapLibre GL, rendu WebGL).
  // Les points sont regroupés en grappes quand on dézoome ; le regroupement est fait par la
  // carte elle-même, ce qui reste fluide avec plus de 10 000 points.
  // Outils : fonds de carte, légende par groupe, curseur de période (mois, année), carte de
  // chaleur, dessin d'une zone avec la liste de ses espèces, cercle de précision d'un point.
  import type { Feature, FeatureCollection, Point } from 'geojson';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onDestroy, onMount } from 'svelte';
  import { db } from '../../db/db';
  import { allTracks } from '../../db/sessions';
  import { GROUPS, type GroupId } from '../../domain/groups';
  import type { Observation, ObsLite } from '../../domain/types';
  import { circle, pointInPolygon, type LonLat } from '../../geo/geometry';
  import { filters } from '../../stores/filters.svelte';
  import { obsStore } from '../../stores/obs.svelte';
  import GroupIcon from '../../ui/GroupIcon.svelte';
  import { dateFichier, download, toCsv } from '../data/export';
  import { summarize } from '../species/species';

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
  const MOIS = ['Toute l’année', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const CLE_VUE = 'carte-vue';
  const CLE_FOND = 'carte-fond';
  const COUCHES_POINTS = ['grappes', 'grappes-nombre', 'points'];
  const VIDE: FeatureCollection = { type: 'FeatureCollection', features: [] };

  let conteneur: HTMLDivElement | undefined = $state();
  let carte: maplibregl.Map | undefined;
  let bulle: maplibregl.Popup | undefined;
  let pret = $state(false);
  let fond = $state<FondId>('osm');
  let masques = $state.raw<GroupId[]>([]);
  let legendeOuverte = $state(false);
  let periodeOuverte = $state(false);

  // Période : mois de l'année (0 = tous) et année (0 = toutes).
  let mois = $state(0);
  let annee = $state(0);
  let chaleur = $state(false);
  let traces = $state(false);
  let nbTraces = $state(0);

  // Zone dessinée : sommets posés un à un, puis zone fermée.
  let dessin = $state(false);
  let sommets = $state.raw<LonLat[]>([]);
  let zoneFermee = $state(false);
  let zoneReduite = $state(false);

  // Cercle de précision du point dont la bulle est ouverte.
  let precision = $state.raw<LonLat[] | null>(null);

  // Observations localisées qui passent les filtres (partagés avec la galerie).
  const localisees = $derived(filters.rows.filter((o) => o.lat !== undefined && o.lon !== undefined));
  const sansPosition = $derived(filters.rows.length - localisees.length);
  const annees = $derived.by(() => {
    const vues = new Set<number>();
    for (const o of localisees) vues.add(new Date(o.t).getFullYear());
    return Array.from(vues).sort((a, b) => b - a);
  });
  const dansPeriode = $derived(
    mois === 0 && annee === 0
      ? localisees
      : localisees.filter((o) => {
          const d = new Date(o.t);
          return (mois === 0 || d.getMonth() + 1 === mois) && (annee === 0 || d.getFullYear() === annee);
        }),
  );
  const dansZone = $derived(
    zoneFermee && sommets.length >= 3 ? dansPeriode.filter((o) => pointInPolygon(o.lon as number, o.lat as number, sommets)) : dansPeriode,
  );
  const visibles = $derived(masques.length ? dansZone.filter((o) => !masques.includes(o.group)) : dansZone);
  const groupesPresents = $derived.by(() => {
    const compte = new Map<GroupId, number>();
    for (const o of dansZone) compte.set(o.group, (compte.get(o.group) ?? 0) + 1);
    return (Object.keys(GROUPS) as GroupId[]).filter((g) => compte.has(g)).map((g) => ({ id: g, n: compte.get(g) ?? 0 }));
  });
  // Espèces de la zone, des plus observées aux moins observées.
  const especesZone = $derived(zoneFermee ? summarize(visibles).especes.sort((a, b) => b.n - a.n || a.sci.localeCompare(b.sci)) : []);
  const periodeActive = $derived(mois !== 0 || annee !== 0);

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

  /** Tracé de la zone : contour (fermé ou en cours) et sommets. */
  function traceZone(points: LonLat[], fermee: boolean): FeatureCollection {
    const features: Feature[] = points.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: p }, properties: {} }));
    if (fermee && points.length >= 3) {
      features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] }, properties: {} });
    } else if (points.length >= 2) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: points }, properties: {} });
    }
    return { type: 'FeatureCollection', features };
  }

  /** Couleur du point selon le groupe. */
  function couleurParGroupe(): maplibregl.ExpressionSpecification {
    const paires: string[] = [];
    for (const g of Object.keys(GROUPS) as GroupId[]) paires.push(g, GROUPS[g].color);
    return ['match', ['get', 'g'], ...paires, '#666666'] as unknown as maplibregl.ExpressionSpecification;
  }

  function cadrer(points: LonLat[], marge = 60) {
    if (!carte || points.length === 0) return;
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;
    for (const [lon, lat] of points) {
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
      { padding: marge, maxZoom: 14, duration: 0 },
    );
  }

  async function ouvrirBulle(id: string, position: LonLat) {
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
    const morceaux = [date];
    if (o.count > 1) morceaux.push(`×${o.count}`);
    if (o.place) morceaux.push(o.place);
    if (o.acc !== undefined) morceaux.push(`± ${o.acc} m`);
    infos.textContent = morceaux.join(' · ');
    el.appendChild(infos);
    const bouton = document.createElement('button');
    bouton.textContent = 'Ouvrir la fiche';
    bouton.addEventListener('click', () => onOpen(id));
    el.appendChild(bouton);

    // Cercle de précision du GPS autour du point (visible en zoomant).
    precision = o.acc !== undefined && o.acc > 0 ? circle(position[0], position[1], o.acc) : null;

    const ouverte = new maplibregl.Popup({ offset: 14, maxWidth: '260px' }).setLngLat(position).setDOMContent(el).addTo(carte);
    bulle = ouverte;
    ouverte.on('close', () => {
      if (adresseImage) URL.revokeObjectURL(adresseImage);
      if (bulle === ouverte) precision = null;
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
      const data = donnees(visibles);
      // Deux sources pour les mêmes points : l'une regroupée en grappes, l'autre brute pour la carte de chaleur.
      m.addSource('obs', { type: 'geojson', data, cluster: true, clusterRadius: 46, clusterMaxZoom: 15 });
      m.addSource('obs-chaleur', { type: 'geojson', data });
      m.addSource('zone', { type: 'geojson', data: VIDE });
      m.addSource('precision', { type: 'geojson', data: VIDE });
      m.addSource('traces', { type: 'geojson', data: VIDE });

      m.addLayer({
        id: 'chaleur',
        type: 'heatmap',
        source: 'obs-chaleur',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 12, 30, 16, 44],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 12, 1.6],
          'heatmap-opacity': 0.8,
        },
      });
      // Traces GPS des sorties.
      m.addLayer({ id: 'traces', type: 'line', source: 'traces', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#d1401c', 'line-width': 3.5, 'line-opacity': 0.85 } });
      m.addLayer({ id: 'precision', type: 'fill', source: 'precision', paint: { 'fill-color': '#2f7fd1', 'fill-opacity': 0.18, 'fill-outline-color': '#2f7fd1' } });
      m.addLayer({ id: 'zone-surface', type: 'fill', source: 'zone', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#17603f', 'fill-opacity': 0.12 } });
      m.addLayer({ id: 'zone-trait', type: 'line', source: 'zone', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': '#17603f', 'line-width': 3, 'line-dasharray': [2, 1] } });
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
      m.addLayer({ id: 'zone-sommets', type: 'circle', source: 'zone', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#17603f', 'circle-stroke-width': 3 } });

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
      if (!restauree) cadrer(visibles.map((o): LonLat => [o.lon as number, o.lat as number]));
      pret = true;
    });

    // Pendant le dessin d'une zone, chaque tap pose un sommet.
    m.on('click', (e) => {
      if (dessin) sommets = [...sommets, [e.lngLat.lng, e.lngLat.lat]];
    });
    // Tap sur une grappe : zoom jusqu'à ce qu'elle s'ouvre.
    m.on('click', 'grappes', async (e) => {
      const f = e.features?.[0];
      if (!f || dessin) return;
      const source = m.getSource('obs') as maplibregl.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id as number);
      m.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom });
    });
    // Tap sur un point : bulle avec l'essentiel ; le bouton ouvre la fiche.
    m.on('click', 'points', (e) => {
      const f = e.features?.[0];
      if (!f || dessin) return;
      void ouvrirBulle(String(f.properties.id), (f.geometry as Point).coordinates as LonLat);
    });
    for (const couche of ['grappes', 'points']) {
      m.on('mouseenter', couche, () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', couche, () => (m.getCanvas().style.cursor = dessin ? 'crosshair' : ''));
    }
    // Appui long (ou clic droit) : nouvelle observation à cet endroit.
    m.on('contextmenu', (e) => {
      e.preventDefault();
      if (!dessin) onCreateAt(e.lngLat.lat, e.lngLat.lng);
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

  const source = (nom: string) => carte?.getSource(nom) as maplibregl.GeoJSONSource | undefined;

  // Les points suivent les filtres, la période, la zone et la légende.
  $effect(() => {
    const data = donnees(visibles);
    if (!pret) return;
    source('obs')?.setData(data);
    source('obs-chaleur')?.setData(data);
  });

  // Bascule entre points et carte de chaleur.
  $effect(() => {
    const enChaleur = chaleur;
    if (!pret || !carte) return;
    carte.setLayoutProperty('chaleur', 'visibility', enChaleur ? 'visible' : 'none');
    for (const c of COUCHES_POINTS) carte.setLayoutProperty(c, 'visibility', enChaleur ? 'none' : 'visible');
  });

  $effect(() => {
    const trace = traceZone(sommets, zoneFermee);
    if (!pret) return;
    source('zone')?.setData(trace);
  });

  $effect(() => {
    const contour = precision;
    if (!pret) return;
    source('precision')?.setData(contour ? { type: 'Feature', geometry: { type: 'Polygon', coordinates: [contour] }, properties: {} } : VIDE);
  });

  // Traces GPS : toutes les sorties si le bouton est actif, ou seulement la sortie filtrée.
  $effect(() => {
    const seule = filters.sessionId;
    const voulues = traces || seule !== '';
    if (!pret) return;
    if (!voulues) {
      source('traces')?.setData(VIDE);
      return;
    }
    let annule = false;
    allTracks().then((toutes) => {
      if (annule) return;
      const features: Feature[] = toutes
        .filter((t) => t.points.length > 1 && (!seule || t.sessionId === seule))
        .map((t) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: t.points.map((p) => [p[0], p[1]]) }, properties: {} }));
      source('traces')?.setData({ type: 'FeatureCollection', features });
      nbTraces = features.length;
    });
    return () => {
      annule = true;
    };
  });

  $effect(() => {
    const enDessin = dessin;
    if (carte) carte.getCanvas().style.cursor = enDessin ? 'crosshair' : '';
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

  function commencerZone() {
    bulle?.remove();
    sommets = [];
    zoneFermee = false;
    zoneReduite = false;
    dessin = true;
  }

  function terminerZone() {
    if (sommets.length < 3) return;
    dessin = false;
    zoneFermee = true;
    cadrer(sommets, 90);
  }

  function effacerZone() {
    dessin = false;
    zoneFermee = false;
    sommets = [];
  }

  async function exporterZone() {
    const trouvees = await db.observations.bulkGet(visibles.map((o) => o.id));
    const obs = trouvees.filter((o): o is Observation => o !== undefined);
    if (obs.length) download(toCsv(obs), `carnet-nature-zone-${dateFichier()}.csv`);
  }
</script>

<div class="carte" bind:this={conteneur}></div>

<div class="outils">
  <div class="rangee" role="group" aria-label="Fond de carte">
    {#each FONDS as f (f.id)}
      <button class="pastille" class:active={fond === f.id} onclick={() => changerFond(f.id)}>{f.label}</button>
    {/each}
  </div>

  <div class="rangee">
    <button class="pastille" class:active={legendeOuverte} onclick={() => (legendeOuverte = !legendeOuverte)}>
      Légende{masques.length ? ` (${masques.length} masqué${masques.length > 1 ? 's' : ''})` : ''}
    </button>
    <button class="pastille" class:active={periodeOuverte || periodeActive} onclick={() => (periodeOuverte = !periodeOuverte)}>
      {periodeActive ? [mois ? MOIS[mois] : '', annee || ''].filter(Boolean).join(' ') : 'Période'}
    </button>
    <button class="pastille" class:active={chaleur} onclick={() => (chaleur = !chaleur)}>Chaleur</button>
    <button class="pastille" class:active={traces} onclick={() => (traces = !traces)}>
      Traces{traces ? ` (${nbTraces})` : ''}
    </button>
    {#if !dessin && !zoneFermee}
      <button class="pastille" onclick={commencerZone}>Zone</button>
    {/if}
  </div>

  {#if legendeOuverte}
    <div class="panneau legende">
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

  {#if periodeOuverte}
    <div class="panneau periode">
      <label>
        <span>Mois : <strong>{MOIS[mois]}</strong></span>
        <input type="range" min="0" max="12" bind:value={mois} aria-label="Mois de l'année" />
      </label>
      <label>
        <span>Année</span>
        <select bind:value={annee}>
          <option value={0}>Toutes</option>
          {#each annees as a (a)}
            <option value={a}>{a}</option>
          {/each}
        </select>
      </label>
      {#if periodeActive}
        <button class="lien" onclick={() => { mois = 0; annee = 0; }}>Toute la période</button>
      {/if}
    </div>
  {/if}

  {#if dessin}
    <div class="panneau">
      <p class="consigne">Touche la carte pour poser les sommets de la zone ({sommets.length} posé{sommets.length > 1 ? 's' : ''}).</p>
      <div class="rangee">
        <button class="pastille active" disabled={sommets.length < 3} onclick={terminerZone}>Terminer</button>
        <button class="pastille" disabled={sommets.length === 0} onclick={() => (sommets = sommets.slice(0, -1))}>Retirer le dernier</button>
        <button class="pastille" onclick={effacerZone}>Annuler</button>
      </div>
    </div>
  {/if}

  {#if filters.actifs || sansPosition > 0 || periodeActive}
    <p class="note">
      {visibles.length.toLocaleString('fr-FR')} point{visibles.length > 1 ? 's' : ''}
      {#if filters.actifs} · filtres de la galerie actifs <button class="lien" onclick={() => filters.effacer()}>effacer</button>{/if}
      {#if sansPosition > 0} · {sansPosition.toLocaleString('fr-FR')} sans position{/if}
    </p>
  {/if}
</div>

{#if zoneFermee}
  <div class="zone">
    <div class="zone-tete">
      <strong>
        Zone : {visibles.length.toLocaleString('fr-FR')} observation{visibles.length > 1 ? 's' : ''}, {especesZone.length.toLocaleString('fr-FR')} taxon{especesZone.length > 1 ? 's' : ''}
      </strong>
      <button class="lien" onclick={() => (zoneReduite = !zoneReduite)}>{zoneReduite ? 'Afficher la liste' : 'Réduire'}</button>
    </div>
    {#if !zoneReduite}
      <ul class="zone-liste">
        {#each especesZone as e (e.key)}
          <li>
            <span class="pastille-groupe" style="--couleur: {GROUPS[e.group].color}"><GroupIcon group={e.group} size="1rem" /></span>
            <span class="nom">{e.vern || e.sci}{#if e.vern} <em>{e.sci}</em>{/if}</span>
            <span class="nombre">{e.n}</span>
          </li>
        {:else}
          <li class="doux">Aucun taxon identifié dans cette zone.</li>
        {/each}
      </ul>
    {/if}
    <div class="rangee">
      <button class="pastille active" disabled={visibles.length === 0} onclick={exporterZone}>Exporter (CSV)</button>
      <button class="pastille" onclick={commencerZone}>Redessiner</button>
      <button class="pastille" onclick={effacerZone}>Effacer la zone</button>
    </div>
  </div>
{/if}

<style>
  .carte {
    position: fixed;
    left: 0;
    right: 0;
    /* --entete : hauteur de l'en-tête, plus grande quand le bandeau de sortie est affiché. */
    top: calc(var(--entete, 64px) + env(safe-area-inset-top));
    bottom: calc(64px + env(safe-area-inset-bottom));
    z-index: 1;
    background: var(--bord);
  }
  .outils {
    position: fixed;
    left: 10px;
    top: calc(var(--entete, 64px) + 10px + env(safe-area-inset-top));
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
  .rangee {
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
  .pastille:disabled {
    opacity: 0.5;
  }
  .panneau {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: min(340px, calc(100vw - 80px));
    padding: 10px;
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  .legende {
    gap: 0;
    padding: 6px;
    max-height: 46vh;
    overflow-y: auto;
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
    min-width: 0;
  }
  .nombre {
    color: var(--texte-doux);
    font-weight: 400;
  }
  .periode label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-weight: 600;
  }
  .periode input[type='range'] {
    width: 260px;
    max-width: 100%;
    height: 40px;
    accent-color: var(--accent);
  }
  .periode select {
    min-height: 44px;
    padding: 0 10px;
    border: 2px solid var(--bord);
    border-radius: 10px;
    background: var(--fond);
    color: var(--texte);
  }
  .consigne {
    margin: 0;
    font-weight: 600;
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
  .zone {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(96px + env(safe-area-inset-bottom));
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 560px;
    margin: 0 auto;
    padding: 12px;
    border-radius: 16px;
    background: var(--surface);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  }
  .zone-tete {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .zone-liste {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 30vh;
    overflow-y: auto;
  }
  .zone-liste li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-top: 1px solid var(--bord);
  }
  .pastille-groupe {
    display: inline-flex;
    color: var(--couleur);
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
