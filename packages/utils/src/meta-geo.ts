export interface MetaGeoData {
  ct?: string;
  st?: string;
  zp?: string;
  country: string;
}

const CACHE_KEY = "meta_geo_data";
const GEO_TIMEOUT_MS = 2500;

/**
 * Meta's advanced-matching city/state/zip come from IP geolocation — none of
 * the apps ask users for their address. Country is hardcoded ("in") since
 * every exam here (CTET/HTET/etc.) targets India-only learners, so no lookup
 * is needed for that one field. Cached in sessionStorage so repeated calls
 * within a visit (e.g. multiple Meta events on one page) don't re-fetch.
 *
 * Formatting follows Meta's advanced-matching docs: `ct` lowercase with
 * spaces removed, `st` lowercase two-letter code (ipapi's `region_code`, not
 * the full `region` name), `zp` as a string, `country` lowercase two-letter.
 * The lookup is time-boxed so a slow/blocked geo provider can never hold up
 * the caller (Lead/Purchase fire right before a redirect).
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

  // Both providers are free and keyless. ipwho.is is primary (open CORS, not
  // behind a bot challenge); ipapi.co is kept as a fallback — it returns 403
  // from some networks, so it can't be the only source.
  const providers: Array<{
    url: string;
    pick: (json: Record<string, unknown>) => { city?: string; region?: string; postal?: string };
  }> = [
    {
      url: "https://ipwho.is/",
      pick: (j) => (j.success === false ? {} : { city: j.city as string, region: j.region_code as string, postal: j.postal as string }),
    },
    {
      url: "https://ipapi.co/json/",
      pick: (j) => ({ city: j.city as string, region: j.region_code as string, postal: j.postal as string }),
    },
  ];

  for (const provider of providers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
    try {
      const res = await fetch(provider.url, { signal: controller.signal });
      if (!res.ok) continue;
      const { city, region, postal } = provider.pick(await res.json());
      if (city) data.ct = String(city).toLowerCase().replace(/\s+/g, "");
      if (region) data.st = String(region).toLowerCase();
      if (postal) data.zp = String(postal);
      if (data.ct || data.st || data.zp) break;
    } catch {
      // Timed out or blocked — try the next provider
    } finally {
      clearTimeout(timer);
    }
  }

  // Only cache a successful lookup; a timeout/block shouldn't pin
  // country-only data for the whole session.
  if (data.ct || data.st || data.zp) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }

  return data;
}
