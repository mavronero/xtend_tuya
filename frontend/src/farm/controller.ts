/** FarmController: the data side of every farm card, as a Lit reactive
 * controller. Loads farm data and discovers valves once a minute (and on
 * demand after an edit); the host renders from `summaries()`. */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { discoverValves, fetchLocations, type HomeAssistantLike, type ValveEntities } from "./discovery.ts";
import { EMPTY_FARM_DATA, invalidateFarmData, loadFarmData, type FarmData } from "./data.ts";
import { summarize, type ValveSummary } from "./valve-summary.ts";

const REFRESH_MS = 60_000;

type Host = ReactiveControllerHost & { hass?: HomeAssistantLike };

export class FarmController implements ReactiveController {
  valves: ValveEntities[] = [];
  data: FarmData = EMPTY_FARM_DATA;
  loaded = false;
  error: string | null = null;
  private host: Host;
  private timer?: number;
  private busy = false;

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

  /** Summaries against the live states, as of now. */
  summaries(): ValveSummary[] {
    const hass = this.host.hass;
    if (!hass) return [];
    const now = Date.now();
    return this.valves.map((v) => summarize(v, hass.states, this.data, now));
  }
}
