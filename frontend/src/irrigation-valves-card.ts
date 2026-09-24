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
import type { HomeAssistantLike } from "./farm/discovery.ts";
import { FarmController } from "./farm/controller.ts";
import {
  ALL_SECTIONS,
  NO_FILTER,
  applyFilter,
  sectionize,
  type SectionKey,
  type StatusFilter,
  type ValveFilter,
} from "./farm/valve-filter.ts";
import { navigate } from "./components/navigate.ts";
import "./components/valve-filter-bar.ts";
import "./components/valve-section.ts";

interface CardConfig {
  type: string;
  filter?: boolean;
  site?: string;
  sections?: SectionKey[];
  collapsed?: SectionKey[];
}

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
  @state() private _filter: ValveFilter = loadFilter();
  private _farm = new FarmController(this);

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 12;
  }

  private _onFilter(e: CustomEvent<ValveFilter>): void {
    this._filter = e.detail;
    saveFilter(e.detail);
  }

  private _onOpen(e: CustomEvent<string>): void {
    navigate(e.detail);
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._farm.loaded) return html`<ha-card><div class="msg">Loading valves…</div></ha-card>`;
    const all = this._farm.summaries();
    const data = this._farm.data;
    const fixedSite = this._config.site ?? null;
    const base: ValveFilter = { ...this._filter, site: fixedSite ?? this._filter.site };
    const scoped = applyFilter(all, { ...base, status: "all" }, data.sites);
    const counts: Partial<Record<StatusFilter, number>> = {};
    for (const s of ["all", "watering", "attention", "offline"] as StatusFilter[]) {
      counts[s] = s === "all" ? scoped.length : applyFilter(scoped, { ...NO_FILTER, status: s }, data.sites).length;
    }
    const shown = applyFilter(scoped, { ...NO_FILTER, status: base.status }, data.sites);
    const sections = sectionize(shown, data.sites, this._config.sections ?? ALL_SECTIONS);
    const collapsed = new Set(this._config.collapsed ?? ["offline"]);

    return html`
      <div @xt-valve-open=${this._onOpen}>
        ${this._config.filter === false
          ? nothing
          : html`<xt-valve-filter-bar
              .sites=${fixedSite ? [] : data.sites}
              .value=${base}
              .counts=${counts}
              @xt-filter-changed=${this._onFilter}
            ></xt-valve-filter-bar>`}
        ${this._farm.error ? html`<div class="msg err">Could not load farm data: ${this._farm.error}</div>` : nothing}
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
