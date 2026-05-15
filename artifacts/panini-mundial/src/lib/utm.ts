const UTM_KEY = "panini_utms";
const UTM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type UtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  src: string | null;
  sck: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
};

function getFromUrl(): Partial<UtmParams> {
  const p = new URLSearchParams(window.location.search);
  const get = (k: string) => p.get(k);

  const src = get("src") ?? (get("xid") ? get("xid") : null);

  return {
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_term: get("utm_term"),
    utm_content: get("utm_content"),
    src,
    sck: get("sck"),
    fbclid: get("fbclid"),
    gclid: get("gclid"),
    ttclid: get("ttclid"),
  };
}

export function captureAndSaveUtms(): void {
  try {
    const fromUrl = getFromUrl();
    const hasAny = Object.values(fromUrl).some((v) => v !== null);
    if (!hasAny) return;

    const entry = { data: fromUrl, savedAt: Date.now() };
    localStorage.setItem(UTM_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

function readUtmifyPixelSck(): string | null {
  // UTMify pixel.js stores its session sck in one of these locations
  const candidates = ["utmify_sck", "__utmify_sck", "utmify-sck", "utmifySck"];
  for (const key of candidates) {
    try {
      const val = localStorage.getItem(key);
      if (val) return val;
    } catch { /* ignore */ }
  }
  // Also try cookies
  try {
    const match = document.cookie.match(/(?:^|;\s*)utmify_sck=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch { /* ignore */ }
  return null;
}

export function readUtms(): UtmParams {
  const empty: UtmParams = {
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_term: null, utm_content: null, src: null, sck: null,
    fbclid: null, gclid: null, ttclid: null,
  };

  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return empty;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > UTM_TTL_MS) {
      localStorage.removeItem(UTM_KEY);
      return empty;
    }
    const result = { ...empty, ...data };
    // If sck not captured from URL, try UTMify pixel's own stored sck
    if (!result.sck) {
      result.sck = readUtmifyPixelSck();
    }
    return result;
  } catch {
    return empty;
  }
}
