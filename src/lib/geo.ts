import areasJson from "@/data/areas.json";
import type { Area } from "@/lib/types";

const areas = areasJson as Area[];

/** City centre, used when we don't know where the user is. */
export const AHMEDABAD: Area = { name: "Ahmedabad", lat: 23.0300, lng: 72.5600 };

export function getAreas(): Area[] {
  return areas;
}

/** Straight-line distance in km (haversine). */
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function nearestArea(point: { lat: number; lng: number }): Area {
  return areas.reduce((best, a) => (kmBetween(point, a) < kmBetween(point, best) ? a : best), areas[0]);
}

/** Finds a known area by name ("bodakdev", "Bodakdev, Ahmedabad", ...). */
export function findArea(query: string): Area | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    areas.find((a) => a.name.toLowerCase() === q) ??
    areas.find((a) => q.startsWith(a.name.toLowerCase())) ??
    areas.find((a) => a.name.toLowerCase().includes(q))
  );
}

/**
 * The device's position, or null when it's blocked or unavailable. Browsers
 * only allow this on https pages (and localhost).
 */
export function currentPosition(timeout = 8000): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      timeout,
      maximumAge: 60_000,
      enableHighAccuracy: true,
    });
  });
}
