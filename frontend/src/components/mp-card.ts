/** <xt-mp-card .summary=${MpSummary}>: a metering point (a place) at a
 * glance. Its current valve is one line of the card; tapping that line fires
 * `xt-valve-open` (detail: the valve's view_path). */

import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { MpBadge, MpSummary, MpValve } from "../farm/mp-summary.ts";
import type { RunInfo } from "../farm/valve-summary.ts";
import { batteryIcon, when } from "./format.ts";
import "./week-bars.ts";
import { farmTokens } from "./theme.ts";

const BADGE: Record<MpBadge, [string, string, "warn" | "bad"]> = {
  no_valve: ["No valve", "No valve is assigned to this metering point", "warn"],
  low_battery: ["Low battery", "The valve's battery is below 20 %", "warn"],
  stale: ["No report 36 h", "The valve has not reported for more than 36 hours", "warn"],
  missed: ["Missed", "A planned run in the last 24 hours did not happen", "bad"],
  no_flow: ["No water flow", "The last run here measured no water", "bad"],
  flow_low: ["Flow low", "Mean flow of the last 30 days is well below the expected L/min", "bad"],
  flow_high: ["Flow high", "Mean flow of the last 30 days is well above the expected L/min (leak?)", "bad"],
};

const STATUS_TEXT: Record<MpValve["status"], string> = { watering: "Watering", idle: "Idle", offline: "Offline" };

function runText(r: RunInfo): string {
  const parts = [when(r.start), `${Math.round(r.minutes)} min`];
  if (r.liters !== null) parts.push(`${Math.round(r.liters)} L`);
  return parts.join(" · ");
}

export class XtMpCard extends LitElement {
  @property({ attribute: false }) summary?: MpSummary;

  private _openValve(e: Event, v: MpValve): void {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("xt-valve-open", { detail: v.view_path, bubbles: true, composed: true }));
  }

  private _valve(v: MpValve) {
    return html`<button class="valve ${v.status}" @click=${(e: Event) => this._openValve(e, v)} title="Open valve ${v.name}">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${v.number ? `#${v.number}` : v.name}</span>
      <i></i><span>${STATUS_TEXT[v.status]}</span>
      ${v.battery !== null
        ? html`<span class="battery" title="Battery ${Math.round(v.battery)} %"
            ><ha-icon icon=${batteryIcon(v.battery)}></ha-icon>${Math.round(v.battery)} %</span
          >`
        : nothing}
    </button>`;
  }

  private _flow(s: MpSummary) {
    if (s.avg_lpm === null) return nothing;
    const expected = s.expected_lpm ? ` · expected ${s.expected_lpm}` : "";
    return html`<div class="row" title="Mean flow of the last 30 days' runs${s.expected_lpm ? " vs. the expected L/min" : ""}">
      <ha-icon icon="mdi:speedometer"></ha-icon><span>${s.avg_lpm.toFixed(1)} L/min${expected}</span>
    </div>`;
  }

  render() {
    const s = this.summary;
    if (!s) return nothing;
    const unit = s.week.unit;
    const total = unit === "L" ? `${Math.round(s.week.liters)} L` : `${Math.round(s.week.minutes)} min`;
    return html`<ha-card class=${s.status}>
      <div class="name" title="Metering point">${s.name}</div>
      ${s.valves.length ? s.valves.map((v) => this._valve(v)) : html`<div class="row dim">No valve assigned</div>`}
      ${s.pump
        ? html`<div class="row" title="Pump${s.pump.via ? `, inherited from ${s.pump.via}` : ""}">
            <ha-icon icon="mdi:pump"></ha-icon><span>${s.pump.name}${s.pump.via ? ` · via ${s.pump.via}` : ""}</span>
          </div>`
        : nothing}
      <dl>
        <dt title="Last run here"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run here: start · duration · water">${s.last ? runText(s.last) : "–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${s.next ? runText(s.next) : "–"}</dd>
      </dl>
      <div class="week">
        <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
        <xt-week-bars .daily=${s.week.daily} unit=${unit}></xt-week-bars>
        <span class="dim" title="Last 7 days here, across valve exchanges">${s.week.runs} runs · ${total}</span>
      </div>
      ${this._flow(s)}
      ${s.badges.length
        ? html`<div class="badges">
            ${s.badges.map((b) => {
              const [text, title, tone] = BADGE[b];
              return html`<span class="badge ${tone}" title=${title}>${text}${b === "missed" && s.missed > 1 ? ` ${s.missed}` : ""}</span>`;
            })}
          </div>`
        : nothing}
    </ha-card>`;
  }

  static styles = [
    farmTokens,
    css`
    :host {
      display: block;
    }
    ha-card {
      padding: 12px 14px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    ha-card.empty {
      border-style: dashed;
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .name {
      font-size: 1.05rem;
      font-weight: 500;
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
      gap: 6px;
    }
    .valve {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border-radius: 8px;
      padding: 2px 6px;
      margin: 0 -6px;
    }
    .valve:hover,
    .valve:focus-visible {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .valve .num {
      color: var(--primary-color);
      font-variant-numeric: tabular-nums;
    }
    .valve i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--xt-ok);
      margin-left: 4px;
    }
    .valve.watering {
      font-weight: 500;
    }
    .valve.watering i {
      background: var(--xt-water);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
    }
    .valve.offline i {
      background: var(--xt-off);
    }
    .battery {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--xt-dim);
      font-variant-numeric: tabular-nums;
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
    }
    .badge.warn {
      background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
    }
    .badge.bad {
      background: color-mix(in srgb, var(--xt-bad) 18%, transparent);
    }
  `,
  ];
}

if (!customElements.get("xt-mp-card")) customElements.define("xt-mp-card", XtMpCard);
