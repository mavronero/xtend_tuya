/** Farm data the valve views read: runs, planned slots, metering points and
 * sites. One loader, cached for a minute, so several cards on a page share
 * one set of requests. */

export interface Run {
  device_id: string;
  start: string;
  end: string;
  duration_seconds: number;
  liters?: number | null;
}

/** A planned slot from calendar.irrigation_planned; key = registry entity. */
export interface PlannedSlot {
  key: string;
  start: number;
  end: number;
}

export interface Site {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface MeteringPoint {
  id: string;
  name: string;
  site_id: string | null;
}

export interface FarmData {
  /** The last 30 days, so "last run" reaches past the week. */
  runs: Run[];
  planned: PlannedSlot[];
  sites: Site[];
  /** Tuya device id -> the metering point holding it now. */
  locationOf: Record<string, MeteringPoint>;
}

export const EMPTY_FARM_DATA: FarmData = { runs: [], planned: [], sites: [], locationOf: {} };

interface CallApi {
  callApi?: <T>(method: string, path: string) => Promise<T>;
}

interface LocationsResponse {
  locations?: (MeteringPoint & { devices?: { device_id: string; end: string | null }[] })[];
  sites?: Site[];
}

interface CalendarEvent {
  uid?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

const MAX_AGE_MS = 60_000;
const DAY_MS = 86_400_000;
// ponytail: one cache per bundle; a window global if cards from different
// bundles ever need to share it.
let cached: { at: number; data: Promise<FarmData> } | null = null;

export function loadFarmData(hass: CallApi, now = Date.now()): Promise<FarmData> {
  if (!cached || now - cached.at > MAX_AGE_MS) {
    const data = fetchFarmData(hass, now);
    cached = { at: now, data };
    data.catch(() => {
      if (cached?.data === data) cached = null;
    });
  }
  return cached.data;
}

async function fetchFarmData(hass: CallApi, now: number): Promise<FarmData> {
  if (!hass.callApi) return EMPTY_FARM_DATA;
  const iso = (ms: number) => encodeURIComponent(new Date(ms).toISOString());
  const [runs, locations, planned] = await Promise.all([
    hass.callApi<{ runs?: Run[] }>("GET", `xtend_tuya/runs?since=${iso(now - 30 * DAY_MS)}`),
    hass.callApi<LocationsResponse>("GET", "xtend_tuya/irrigation_locations"),
    hass.callApi<CalendarEvent[]>(
      "GET",
      `calendars/calendar.irrigation_planned?start=${iso(now - 2 * DAY_MS)}&end=${iso(now + 8 * DAY_MS)}`
    ),
  ]);
  const locationOf: Record<string, MeteringPoint> = {};
  for (const loc of locations?.locations ?? []) {
    for (const d of loc.devices ?? []) {
      if (d.end === null) locationOf[d.device_id] = { id: loc.id, name: loc.name, site_id: loc.site_id ?? null };
    }
  }
  const slots: PlannedSlot[] = [];
  for (const e of planned ?? []) {
    const start = Date.parse(e.start.dateTime ?? e.start.date ?? "");
    const end = Date.parse(e.end.dateTime ?? e.end.date ?? "");
    if (Number.isFinite(start)) slots.push({ key: (e.uid ?? "").split("#")[0], start, end: end > start ? end : start + 60_000 });
  }
  return { runs: runs?.runs ?? [], planned: slots, sites: locations?.sites ?? [], locationOf };
}
