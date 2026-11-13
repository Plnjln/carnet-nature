// Petits calculs géométriques sur des coordonnées [longitude, latitude].

export type LonLat = [number, number];

/** Vrai si le point est à l'intérieur du polygone (méthode du rayon ; le polygone n'a pas besoin d'être fermé). */
export function pointInPolygon(lon: number, lat: number, polygone: LonLat[]): boolean {
  let dedans = false;
  for (let i = 0, j = polygone.length - 1; i < polygone.length; j = i++) {
    const [xi, yi] = polygone[i];
    const [xj, yj] = polygone[j];
    const coupe = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (coupe) dedans = !dedans;
  }
  return dedans;
}

/** Distance en mètres entre deux points proches (approximation plane, suffisante pour une trace de terrain). */
export function distanceM(a: LonLat, b: LonLat): number {
  const latMoyenne = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * 111_320 * Math.cos(latMoyenne);
  const dy = (b[1] - a[1]) * 111_320;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Longueur en mètres d'une suite de points. */
export function lengthM(points: LonLat[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceM(points[i - 1], points[i]);
  return total;
}

/** Contour fermé d'un cercle de `rayonM` mètres autour d'un point (approximation suffisante à l'échelle d'un site). */
export function circle(lon: number, lat: number, rayonM: number, segments = 48): LonLat[] {
  const dLat = rayonM / 111_320;
  const dLon = rayonM / (111_320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const contour: LonLat[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    contour.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return contour;
}
