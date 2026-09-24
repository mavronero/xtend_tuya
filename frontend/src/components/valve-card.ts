/** <xt-valve-card .summary=${ValveSummary}>: one valve at a glance.
 *
 * Presentational only: renders a ValveSummary and fires `xt-valve-open`
 * (detail: view_path) on tap. The container decides what opening means. */

import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { Badge, RunInfo, ValveSummary } from "../farm/valve-summary.ts";

const BADGE_TEXT: Record<Badge, string> = {
  low_battery: "Low battery",
  stale: "No report 36 h",
  missed: "Missed",
  no_flow: "No water flow",
};

const BADGE_TITLE: Record<Badge, string> = {
  low_battery: "Battery below 20 %",
  stale: "The valve has not reported for more than 36 hours",
  missed: "A planned run in the last 24 hours did not happen",
  no_flow: "The last run measured no water",
};

/** mdi:battery-10 … mdi:battery, like HA's own battery icon. */
function batteryIcon(pct: number): string {
  if (pct >= 95) return "mdi:battery";
  if (pct < 10) return "mdi:battery-outline";
  return `mdi:battery-${Math.floor(pct / 10) * 10}`;
}

const DAY_MS = 86_400_000;

function dayLabel(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const day0 = new Date(now);
  day0.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - day0.getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function time(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function since(ms: number, now = Date.now()): string {
  const min = Math.round((now - ms) / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
}

function runText(r: RunInfo): string {
  const parts = [`${dayLabel(r.start)} ${time(r.start)}`, `${Math.round(r.minutes)} min`];
  if (r.liters !== null) parts.push(`${Math.round(r.liters)} L`);
  return parts.join(" · ");
}

/** "FF East 07 (907)" -> "FF East 07"; the number is shown separately. */
function baseName(s: ValveSummary): string {
  const stripped = s.number ? s.name.replace(/\s*\(\d+\)\s*$/, "") : s.name;
  return stripped || s.name;
}

export class XtValveCard extends LitElement {
  @property({ attribute: false }) summary?: ValveSummary;

  private _open(): void {
    if (!this.summary) return;
    this.dispatchEvent(
      new CustomEvent("xt-valve-open", { detail: this.summary.view_path, bubbles: true, composed: true })
    );
  }

  private _status(s: ValveSummary) {
    if (s.status === "watering") {
      const flow = s.flow_lpm !== null ? ` · ${s.flow_lpm.toFixed(1)} L/min` : "";
      return html`<span class="status watering" title="Watering now"><i></i>Watering${s.since ? ` since ${time(s.since)}` : ""}${flow}</span>`;
    }
    if (s.status === "offline") {
      return html`<span class="status offline" title="Not reachable"><i></i>Offline${s.since ? ` for ${since(s.since)}` : ""}</span>`;
    }
    return html`<span class="status idle" title="Online, not watering"><i></i>Idle</span>`;
  }

  private _week(s: ValveSummary) {
    const max = Math.max(...s.week.daily, 0);
    const unit = s.week.unit;
    const total = unit === "L" ? `${Math.round(s.week.liters)} L` : `${Math.round(s.week.minutes)} min`;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const day = (i: number) =>
      new Date(today.getTime() - (6 - i) * DAY_MS).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    return html`<div class="week">
      <ha-icon icon="mdi:chart-bar" title="Last 7 days"></ha-icon>
      <div class="bars">
        ${s.week.daily.map(
          (v, i) =>
            html`<span
              title="${day(i)}: ${Math.round(v)} ${unit}"
              style="height:${max > 0 ? Math.max(8, (v / max) * 100) : 8}%"
              class=${v > 0 ? "on" : ""}
            ></span>`
        )}
      </div>
      <span class="dim" title="Last 7 days: number of runs and total ${unit === "L" ? "water" : "watering time"}"
        >${s.week.runs} runs · ${total}</span
      >
    </div>`;
  }

  render() {
    const s = this.summary;
    if (!s) return nothing;
    // The metering point usually carries the valve's name; show it only
    // when it says something new, then the site.
    const mp = s.location && s.location.name !== baseName(s) ? s.location.name : null;
    const place = s.location ? [mp, s.site?.name].filter(Boolean).join(" · ") : "No location";
    return html`<ha-card class=${s.status} @click=${this._open} tabindex="0" role="link" aria-label=${s.name}>
      <div class="head">
        <span class="name" title=${s.name}>${baseName(s)}</span>
        ${s.number ? html`<span class="num" title="Valve number">#${s.number}</span>` : nothing}
        ${s.battery !== null
          ? html`<span class="battery ${s.badges.includes("low_battery") ? "low" : ""}" title="Battery ${Math.round(s.battery)} %"
              ><ha-icon icon=${batteryIcon(s.battery)}></ha-icon>${Math.round(s.battery)} %</span
            >`
          : nothing}
      </div>
      ${place
        ? html`<div class="place dim" title="Metering point · site">
            <ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${place}</span>
          </div>`
        : nothing}
      ${this._status(s)}
      <dl>
        <dt title="Last run"><ha-icon icon="mdi:history"></ha-icon></dt>
        <dd title="Last run: start · duration${s.has_flow_meter ? " · water" : ""}">${s.last ? runText(s.last) : "–"}</dd>
        <dt title="Next planned run"><ha-icon icon="mdi:calendar-clock"></ha-icon></dt>
        <dd title="Next planned run: start · duration">${s.next ? runText(s.next) : "–"}</dd>
      </dl>
      ${this._week(s)}
      ${s.badges.length
        ? html`<div class="badges">
            ${s.badges.map(
              (b) => html`<span class="badge ${b}" title=${BADGE_TITLE[b]}>${BADGE_TEXT[b]}${b === "missed" && s.missed > 1 ? ` ${s.missed}` : ""}</span>`
            )}
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
    ha-card.offline {
      opacity: 0.7;
    }
    .head {
      display: flex;
      align-items: baseline;
      gap: 8px;
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
    .num,
    .battery {
      font-variant-numeric: tabular-nums;
      color: var(--xt-dim);
    }
    .battery {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--xt-dim);
      flex: none;
    }
    .battery.low ha-icon {
      color: var(--error-color, #db4437);
    }
    .battery.low {
      color: var(--error-color, #db4437);
      font-weight: 600;
    }
    .dim {
      color: var(--xt-dim);
    }
    .place {
      margin-top: -4px;
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .place span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .status.offline i {
      background: var(--disabled-text-color, #bdbdbd);
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
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 22px;
      width: 70px;
      flex: none;
    }
    .bars span {
      flex: 1;
      border-radius: 2px;
      background: var(--divider-color, #e0e0e0);
    }
    .bars span.on {
      background: var(--xt-water);
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
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
      color: var(--primary-text-color);
    }
    .badge.missed,
    .badge.no_flow {
      background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent);
    }
  `;
}

if (!customElements.get("xt-valve-card")) customElements.define("xt-valve-card", XtValveCard);
