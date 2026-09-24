/** <xt-valve-filter-bar .sites .value .counts>: site, status and search.
 * Fires `xt-filter-changed` (detail: ValveFilter) on every change. */

import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import type { Site } from "../farm/data.ts";
import { NO_FILTER, sitePath, type StatusFilter, type ValveFilter } from "../farm/valve-filter.ts";
import { farmTokens } from "./theme.ts";

const STATUSES: [StatusFilter, string][] = [
  ["all", "All"],
  ["watering", "Watering"],
  ["attention", "Attention"],
  ["offline", "Offline"],
];

export class XtValveFilterBar extends LitElement {
  @property({ attribute: false }) sites: Site[] = [];
  @property({ attribute: false }) value: ValveFilter = NO_FILTER;
  @property({ attribute: false }) counts: Partial<Record<StatusFilter, number>> = {};

  private _set(patch: Partial<ValveFilter>): void {
    this.value = { ...this.value, ...patch };
    this.dispatchEvent(new CustomEvent("xt-filter-changed", { detail: this.value, bubbles: true, composed: true }));
  }

  render() {
    const sites = [...this.sites]
      .map((s) => ({ id: s.id, path: sitePath(this.sites, s.id) }))
      .sort((a, b) => a.path.localeCompare(b.path));
    return html`
      <select
        aria-label="Site"
        .value=${this.value.site ?? ""}
        @change=${(e: Event) => this._set({ site: (e.target as HTMLSelectElement).value || null })}
      >
        <option value="">All sites</option>
        ${sites.map((s) => html`<option value=${s.id} ?selected=${s.id === this.value.site}>${s.path}</option>`)}
      </select>
      <div class="chips" role="group" aria-label="Status">
        ${STATUSES.map(
          ([key, label]) => html`<button
            class=${this.value.status === key ? "on" : ""}
            aria-pressed=${this.value.status === key}
            @click=${() => this._set({ status: key })}
          >
            ${label}${this.counts[key] !== undefined ? html` <span>${this.counts[key]}</span>` : ""}
          </button>`
        )}
      </div>
      <input
        type="search"
        placeholder="Search valve, location, site"
        aria-label="Search"
        .value=${this.value.search}
        @input=${(e: Event) => this._set({ search: (e.target as HTMLInputElement).value })}
      />
    `;
  }

  static styles = [
    farmTokens,
    css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }
    select,
    input,
    button {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--xt-track);
      border-radius: 18px;
      padding: 6px 12px;
      min-height: 36px;
      box-sizing: border-box;
    }
    input {
      flex: 1;
      min-width: 180px;
    }
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    button {
      cursor: pointer;
    }
    button.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    button span {
      opacity: 0.75;
      font-variant-numeric: tabular-nums;
    }
  `,
  ];
}

if (!customElements.get("xt-valve-filter-bar")) customElements.define("xt-valve-filter-bar", XtValveFilterBar);
