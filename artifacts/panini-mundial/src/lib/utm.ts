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
    return { ...empty, ...data };
  } catch {
    return empty;
  }
}
