/** FarmController: the data side of every farm card, as a Lit reactive
 * controller. Loads farm data and discovers valves once a minute (and on
 * demand after an edit); the host renders from `summaries()`. */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { discoverValves, fetchLocations, type HomeAssistantLike, type ValveEntities } from "./discovery.ts";
import { EMPTY_FARM_DATA, FARM_CHANGED_EVENT, invalidateFarmData, loadFarmData, type FarmData } from "./data.ts";
import { summarize, type ValveSummary } from "./valve-summary.ts";
import { syncFarmTimeZone } from "../components/farm-time.ts";

const REFRESH_MS = 60_000;
// A failed load is mostly HA restarting: try again soon, not in a minute.
const RETRY_MS = 10_000;
// HA pushes state changes many times a second and every card re-renders on
// each; statuses a second or two old are fine, a frozen page is not.
const SUMMARY_TTL_MS = 2_000;

type Host = ReactiveControllerHost & { hass?: HomeAssistantLike };

/** Readable text of a callApi rejection: {status_code, body} with body the
 * parsed JSON (or text), or an Error. */
export function errText(e: unknown): string {
  const o = e as { status_code?: number; body?: unknown; error?: string; message?: string } | null;
  const b = o?.body as { error?: string; message?: string } | string | null | undefined;
  return (
    (typeof b === "string" ? b : (b?.error ?? b?.message)) ??
    o?.error ??
    o?.message ??
    (o?.status_code ? `HTTP ${o.status_code}` : String(e))
  );
}

export class FarmController implements ReactiveController {
  valves: ValveEntities[] = [];
  data: FarmData = EMPTY_FARM_DATA;
  loaded = false;
  error: string | null = null;
  private host: Host;
  private timer?: number;
  private retry?: number;
  private connected = false;
  private busy = false;
  private rerun = false;
  private memo: { at: number; data: FarmData; valves: ValveEntities[]; list: ValveSummary[] } | null = null;

  constructor(host: Host) {
    this.host = host;
    host.addController(this);
  }

  private onFarmChanged = (): void => void this.refresh(true);

  hostConnected(): void {
    this.connected = true;
    this.timer = window.setInterval(() => void this.refresh(), REFRESH_MS);
    window.addEventListener(FARM_CHANGED_EVENT, this.onFarmChanged);
  }

  hostDisconnected(): void {
    this.connected = false;
    if (this.timer) window.clearInterval(this.timer);
    window.clearTimeout(this.retry);
    window.removeEventListener(FARM_CHANGED_EVENT, this.onFarmChanged);
  }

  hostUpdated(): void {
    syncFarmTimeZone(this.host.hass as { config?: { time_zone?: string } } | undefined);
    // First load as soon as hass arrives.
    if (!this.loaded && !this.busy && this.host.hass) void this.refresh();
  }

  /** Reload now; `changed` drops the shared cache after an edit. */
  async refresh(changed = false): Promise<void> {
    const hass = this.host.hass;
    if (!hass) return;
    if (this.busy) {
      // A load is in flight and may predate the edit: run once more after it.
      if (changed) this.rerun = true;
      return;
    }
    if (changed) invalidateFarmData();
    this.busy = true;
    window.clearTimeout(this.retry);
    try {
      let failed: unknown;
      const [data, locations] = await Promise.all([
        loadFarmData(hass).catch((e: unknown) => ((failed = e), null)),
        fetchLocations(hass), // never rejects
      ]);
      // Discovery walks every entity; once a minute is plenty. It needs no
      // farm data, so the valve list shows even while that fails.
      this.valves = discoverValves(hass, locations);
      if (!data) throw failed;
      this.data = data;
      this.error = null;
    } catch (e) {
      // 404 (views not registered yet) / 502-504 (proxy) / no status: restarting.
      const code = (e as { status_code?: number } | null)?.status_code;
      this.error =
        !code || code === 404 || code >= 502 ? `Home Assistant is starting, retrying… (${errText(e)})` : errText(e);
      if (this.connected) this.retry = window.setTimeout(() => void this.refresh(), RETRY_MS);
    } finally {
      this.busy = false;
      this.loaded = true;
      this.host.requestUpdate();
    }
    if (this.rerun) {
      this.rerun = false;
      await this.refresh(true);
    }
  }

  /** Summaries against the live states, recomputed at most every 2 s. */
  summaries(): ValveSummary[] {
    const hass = this.host.hass;
    if (!hass) return [];
    const now = Date.now();
    const m = this.memo;
    if (m && m.data === this.data && m.valves === this.valves && now - m.at < SUMMARY_TTL_MS) return m.list;
    const list = this.valves.map((v) => summarize(v, hass.states, this.data, now));
    this.memo = { at: now, data: this.data, valves: this.valves, list };
    return list;
  }

  /** Summary of one valve only (a valve's own page). */
  summaryOf(deviceId: string): ValveSummary | undefined {
    const hass = this.host.hass;
    const v = this.valves.find((x) => x.device_id === deviceId);
    return hass && v ? summarize(v, hass.states, this.data, Date.now()) : undefined;
  }
}
