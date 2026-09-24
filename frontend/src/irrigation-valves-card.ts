/** custom:irrigation-valves-card: filter bar + valve sections.
 *
 *   type: custom:irrigation-valves-card
 *   filter: true              # show the filter bar (default true)
 *   site: <site id>           # fixed site (subtree), e.g. on a site's view
 *   sections: [watering, attention, sites, offline, unassigned]
 *   collapsed: [offline]      # sections that start collapsed
 *
 * Composes the pure farm modules (discovery, data, summary, filter) with the
 * presentational components; valves are discovered at runtime, so a new
 * valve shows up without re-syncing the dashboard.
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { discoverValves, fetchLocations, type HomeAssistantLike, type ValveEntities } from "./farm/discovery.ts";
import { EMPTY_FARM_DATA, loadFarmData, type FarmData } from "./farm/data.ts";
import { summarize, type ValveSummary } from "./farm/valve-summary.ts";
import {
  ALL_SECTIONS,
  NO_FILTER,
  applyFilter,
  sectionize,
  type SectionKey,
  type StatusFilter,
  type ValveFilter,
} from "./farm/valve-filter.ts";
import "./components/valve-filter-bar.ts";
import "./components/valve-section.ts";

interface CardConfig {
  type: string;
  filter?: boolean;
  site?: string;
  sections?: SectionKey[];
  collapsed?: SectionKey[];
}

const REFRESH_MS = 60_000;
const FILTER_KEY = "xt-valves-filter";

function loadFilter(): ValveFilter {
  try {
    return { ...NO_FILTER, ...JSON.parse(localStorage.getItem(FILTER_KEY) ?? "{}") };
  } catch {
    return NO_FILTER;
  }
}

function saveFilter(f: ValveFilter): void {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(f));
  } catch {
    /* private window: keep it in memory only */
  }
}

export class IrrigationValvesCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistantLike;
  @state() private _config?: CardConfig;
  @state() private _data: FarmData = EMPTY_FARM_DATA;
  @state() private _filter: ValveFilter = loadFilter();
  @state() private _error: string | null = null;
  @state() private _valves: ValveEntities[] = [];
  @state() private _valvesAt = 0;
  private _timer?: number;

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 12;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => void this._refresh(), REFRESH_MS);
    void this._refresh();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) window.clearInterval(this._timer);
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("hass") && !changed.get("hass") && this.hass) void this._refresh();
  }

  private async _refresh(): Promise<void> {
    const hass = this.hass;
    if (!hass) return;
    try {
      const [data, locations] = await Promise.all([loadFarmData(hass), fetchLocations(hass)]);
      // Discovery walks every entity; once a minute is plenty.
      this._valves = discoverValves(hass, locations);
      this._valvesAt = Date.now();
      this._data = data;
      this._error = null;
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    }
  }

  private _onFilter(e: CustomEvent<ValveFilter>): void {
    this._filter = e.detail;
    saveFilter(e.detail);
  }

  private _onOpen(e: CustomEvent<string>): void {
    const base = window.location.pathname.split("/")[1] || "lovelace";
    window.history.pushState(null, "", `/${base}/${e.detail}`);
    window.dispatchEvent(new Event("location-changed"));
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._valvesAt) return html`<ha-card><div class="msg">Loading valves…</div></ha-card>`;
    const now = Date.now();
    const all: ValveSummary[] = this._valves.map((v) => summarize(v, this.hass!.states, this._data, now));
    const fixedSite = this._config.site ?? null;
    const base: ValveFilter = { ...this._filter, site: fixedSite ?? this._filter.site };
    const scoped = applyFilter(all, { ...base, status: "all" }, this._data.sites);
    const counts: Partial<Record<StatusFilter, number>> = {};
    for (const s of ["all", "watering", "attention", "offline"] as StatusFilter[]) {
      counts[s] = s === "all" ? scoped.length : applyFilter(scoped, { ...NO_FILTER, status: s }, this._data.sites).length;
    }
    const shown = applyFilter(scoped, { ...NO_FILTER, status: base.status }, this._data.sites);
    const sections = sectionize(shown, this._data.sites, this._config.sections ?? ALL_SECTIONS);
    const collapsed = new Set(this._config.collapsed ?? ["offline"]);

    return html`
      <div @xt-valve-open=${this._onOpen}>
        ${this._config.filter === false
          ? nothing
          : html`<xt-valve-filter-bar
              .sites=${fixedSite ? [] : this._data.sites}
              .value=${base}
              .counts=${counts}
              @xt-filter-changed=${this._onFilter}
            ></xt-valve-filter-bar>`}
        ${this._error ? html`<div class="msg err">Could not load farm data: ${this._error}</div>` : nothing}
        ${sections.length
          ? sections.map(
              (s) => html`<xt-valve-section .section=${s} ?collapsed=${collapsed.has(s.key)}></xt-valve-section>`
            )
          : html`<div class="msg">No valves match the filter.</div>`}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .msg {
      padding: 16px;
      color: var(--secondary-text-color);
    }
    .err {
      color: var(--error-color, #db4437);
    }
  `;
}

if (!customElements.get("irrigation-valves-card")) customElements.define("irrigation-valves-card", IrrigationValvesCard);
