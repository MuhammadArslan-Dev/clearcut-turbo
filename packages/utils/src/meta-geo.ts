export interface MetaGeoData {
  ct?: string;
  st?: string;
  zp?: string;
  country: string;
}

const CACHE_KEY = "meta_geo_data";

/**
 * Meta's advanced-matching city/state/zip come from IP geolocation — none of
 * the apps ask users for their address. Country is hardcoded ("in") since
 * every exam here (CTET/HTET/etc.) targets India-only learners, so no lookup
 * is needed for that one field. Cached in sessionStorage so repeated calls
 * within a visit (e.g. multiple Meta events on one page) don't re-fetch.
 */
export async function getMetaGeoData(): Promise<MetaGeoData> {
  if (typeof window === "undefined") return { country: "in" };

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — fall through
  }

  const data: MetaGeoData = { country: "in" };

  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const json = await res.json();
      if (json?.city) data.ct = json.city;
      if (json?.region) data.st = json.region;
      if (json?.postal) data.zp = json.postal;
    }
  } catch {
    // Geolocation lookup failed — Meta events still send with country only
  }

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }

  return data;
}
