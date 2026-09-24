/** <xt-site-card .summary=${SiteSummary}>: one site (with its sub-sites)
 * at a glance, in the valve card's language. Fires `xt-site-open`
 * (detail: site id) on tap. */

import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { SiteSummary } from "../farm/site-summary.ts";
import { liters, when } from "./format.ts";
import "./week-bars.ts";

export class XtSiteCard extends LitElement {
  @property({ attribute: false }) summary?: SiteSummary;

  private _open(): void {
    if (!this.summary) return;
    this.dispatchEvent(new CustomEvent("xt-site-open", { detail: this.summary.id, bubbles: true, composed: true }));
  }

  render() {
    const s = this.summary;
    if (!s) return nothing;
    const status = s.watering
      ? html`<span class="status watering" title="Valves watering now"><i></i>${s.watering} watering</span>`
      : html`<span class="status" title="Valves online / valves in this site"><i></i>${s.online} / ${s.valves} online</span>`;
    return html`<ha-card @click=${this._open} tabindex="0" role="link" aria-label=${s.path}>
      <div class="head">
        <span class="name" title=${s.path}>${s.name}</span>
        ${s.children.length
          ? html`<span class="dim" title="Sub-sites"><ha-icon icon="mdi:file-tree-outline"></ha-icon>${s.children.length}</span>`
          : nothing}
        <span class="dim" title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${s.mps}</span>
      </div>
      ${s.pump
        ? html`<div class="row dim" title="Pump${s.pump.via ? `, inherited from ${s.pump.via}` : ""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${s.pump.name}${s.pump.via ? ` · via ${s.pump.via}` : ""}</span>
          </div>`
        : nothing}
      ${status}
      <dl>
        <dt title="Last run in this site"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run in this site">${s.last ? when(s.last) : "–"}</dd>
        <dt title="Next planned run in this site"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run in this site">${s.next ? when(s.next) : "–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${s.week.daily}></xt-week-bars>
        <span class="dim" title="Last 7 days: runs and water of all valves in this site"
          >${s.week.runs} runs · ${liters(s.week.liters)}</span
        >
      </div>
      ${s.attention || s.offline
        ? html`<div class="badges">
            ${s.attention
              ? html`<span class="badge warn" title="Valves with a warning (battery, no report, missed run, no water)"
                  >${s.attention} need attention</span
                >`
              : nothing}
            ${s.offline ? html`<span class="badge" title="Valves not reachable">${s.offline} offline</span>` : nothing}
          </div>`
        : nothing}
    </ha-card>`;
  }

  static styles = css`
    :host {
      display: block;
      --xt-water: var(--state-switch-active-color, #f9a825);
      --xt-dim: var(--secondary-text-color, #727272);
    }
    ha-card {
      padding: 12px 14px;
      cursor: pointer;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    ha-card:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .head .dim {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-variant-numeric: tabular-nums;
    }
    .name {
      font-size: 1.05rem;
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--xt-dim);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: -4px;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success-color, #4caf50);
    }
    .status.watering {
      font-weight: 500;
    }
    .status.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 10px;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    dt {
      display: flex;
      align-items: center;
    }
    dd {
      margin: 0;
    }
    .week {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .week ha-icon {
      align-self: center;
      margin-right: -2px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .badge {
      font-size: 0.75rem;
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--disabled-text-color, #bdbdbd) 30%, transparent);
    }
    .badge.warn {
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
    }
  `;
}

if (!customElements.get("xt-site-card")) customElements.define("xt-site-card", XtSiteCard);
