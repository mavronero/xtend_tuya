/** FarmController: the data side of every farm card, as a Lit reactive
 * controller. Loads farm data and discovers valves once a minute (and on
 * demand after an edit); the host renders from `summaries()`. */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { discoverValves, fetchLocations, type HomeAssistantLike, type ValveEntities } from "./discovery.ts";
import { EMPTY_FARM_DATA, invalidateFarmData, loadFarmData, type FarmData } from "./data.ts";
import { summarize, type ValveSummary } from "./valve-summary.ts";

const REFRESH_MS = 60_000;
// HA pushes state changes many times a second and every card re-renders on
// each; statuses a second or two old are fine, a frozen page is not.
const SUMMARY_TTL_MS = 2_000;

type Host = ReactiveControllerHost & { hass?: HomeAssistantLike };

export class FarmController implements ReactiveController {
  valves: ValveEntities[] = [];
  data: FarmData = EMPTY_FARM_DATA;
  loaded = false;
  error: string | null = null;
  private host: Host;
  private timer?: number;
  private busy = false;
  private memo: { at: number; data: FarmData; valves: ValveEntities[]; list: ValveSummary[] } | null = null;

  constructor(host: Host) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this.timer = window.setInterval(() => void this.refresh(), REFRESH_MS);
  }

  hostDisconnected(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  hostUpdated(): void {
    // First load as soon as hass arrives.
    if (!this.loaded && !this.busy && this.host.hass) void this.refresh();
  }

  /** Reload now; `changed` drops the shared cache after an edit. */
  async refresh(changed = false): Promise<void> {
    const hass = this.host.hass;
    if (!hass || this.busy) return;
    if (changed) invalidateFarmData();
    this.busy = true;
    try {
      const [data, locations] = await Promise.all([loadFarmData(hass), fetchLocations(hass)]);
      // Discovery walks every entity; once a minute is plenty.
      this.valves = discoverValves(hass, locations);
      this.data = data;
      this.error = null;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.busy = false;
      this.loaded = true;
      this.host.requestUpdate();
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
