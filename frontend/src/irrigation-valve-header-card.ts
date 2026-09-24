/** custom:irrigation-valve-header-card: the top of a valve's page, in the
 * valve card's language but wide: who and where the valve is, its state,
 * and the figures that answer "is it watering properly?" at a glance.
 *
 *   type: custom:irrigation-valve-header-card
 *   device_id: <tuya id>
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistantLike } from "./farm/discovery.ts";
import { FarmController } from "./farm/controller.ts";
import { summarizeMp } from "./farm/mp-summary.ts";
import type { RunInfo } from "./farm/valve-summary.ts";
import { batteryIcon, since, time, volume, when } from "./components/format.ts";
import { farmTokens } from "./components/theme.ts";
import "./components/week-bars.ts";
import "./components/spinner.ts";

interface CardConfig {
  type: string;
  device_id: string;
}

const BADGE: Record<string, [string, string, "warn" | "bad"]> = {
  low_battery: ["Low battery", "Battery below 20 %", "warn"],
  stale: ["No report 36 h", "The valve has not reported for more than 36 hours", "warn"],
  missed: ["Missed", "A planned run in the last 24 hours did not happen", "bad"],
  no_flow: ["No water flow", "The last run measured no water", "bad"],
  flow_low: ["Flow low", "Mean flow of the last 30 days is well below the expected L/min", "bad"],
  flow_high: ["Flow high", "Mean flow of the last 30 days is well above the expected L/min (leak?)", "bad"],
};

function runText(r: RunInfo): string {
  const parts = [`${Math.round(r.minutes)} min`];
  if (r.liters !== null) parts.push(`${Math.round(r.liters)} L`);
  return parts.join(" · ");
}

export class IrrigationValveHeaderCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistantLike;
  @state() private _config?: CardConfig;
  private _farm = new FarmController(this);

  setConfig(config: CardConfig): void {
    if (!config.device_id) throw new Error("device_id is required");
    this._config = config;
  }

  getCardSize(): number {
    return 3;
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._farm.loaded) return html`<ha-card class="loading"><xt-spinner></xt-spinner></ha-card>`;
    const now = Date.now();
    const valves = this._farm.summaries();
    const v = valves.find((x) => x.device_id === this._config!.device_id);
    if (!v) return html`<ha-card><div class="msg">Valve not found.</div></ha-card>`;
    const mpRec = this._farm.data.locations.find((m) => m.valves.includes(v.device_id));
    const mp = mpRec ? summarizeMp(mpRec, this._farm.data, valves, now) : null;
    // A metering point's view wins where it has one: its history survives
    // valve exchanges and it knows the expected flow.
    const week = mp?.week ?? v.week;
    const last = mp?.last ?? v.last;
    const badges = [...new Set([...(mp?.badges.filter((b) => b !== "no_valve") ?? []), ...v.badges])];
    const baseName = v.number ? v.name.replace(/\s*\(\d+\)\s*$/, "") : v.name;
    const status =
      v.status === "watering"
        ? html`<span class="status watering"><i></i>Watering${v.since ? ` since ${time(v.since)}` : ""}${v.flow_lpm !== null ? ` · ${v.flow_lpm.toFixed(1)} L/min` : ""}</span>`
        : v.status === "offline"
          ? html`<span class="status offline"><i></i>Offline${v.since ? ` for ${since(v.since)}` : ""}</span>`
          : html`<span class="status"><i></i>Idle</span>`;
    const total = week.unit === "L" ? volume(week.liters) : `${Math.round(week.minutes)} min`;

    return html`<ha-card>
      <div class="top">
        <div class="who">
          <div class="name-row">
            <h1>${baseName}</h1>
            ${v.number ? html`<span class="num" title="Valve number">#${v.number}</span>` : nothing}
            ${v.battery !== null
              ? html`<span class="battery ${v.badges.includes("low_battery") ? "low" : ""}" title="Battery ${Math.round(v.battery)} %"
                  ><ha-icon icon=${batteryIcon(v.battery)}></ha-icon>${Math.round(v.battery)} %</span
                >`
              : nothing}
          </div>
          ${status}
          <div class="where">
            ${mpRec
              ? html`<span title="Metering point"><ha-icon icon="mdi:map-marker-outline"></ha-icon>${mpRec.name}</span>
                  ${v.site ? html`<span title="Site"><ha-icon icon="mdi:sprout-outline"></ha-icon>${v.site.name}</span>` : nothing}`
              : html`<span class="dim">No metering point</span>`}
            ${mp?.pump
              ? html`<span title="Pump${mp.pump.via ? `, inherited from ${mp.pump.via}` : ""}"
                  ><ha-icon icon="mdi:pump"></ha-icon>${mp.pump.name}${mp.pump.via ? html`<span class="dim"> · via ${mp.pump.via}</span>` : nothing}</span
                >`
              : nothing}
          </div>
          ${badges.length
            ? html`<div class="badges">
                ${badges.map((b) => {
                  const [text, title, tone] = BADGE[b] ?? [b, b, "warn"];
                  return html`<span class="badge ${tone}" title=${title}>${text}</span>`;
                })}
              </div>`
            : nothing}
        </div>
        <div class="tiles">
          <div title="Last run: when, how long, how much">
            <span class="lbl"><ha-icon icon="mdi:history"></ha-icon>Last run</span>
            <b>${last ? when(last.start) : "–"}</b>
            <span class="dim">${last ? runText(last) : ""}</span>
          </div>
          <div title="Next planned run">
            <span class="lbl"><ha-icon icon="mdi:calendar-clock"></ha-icon>Next run</span>
            <b>${v.next ? when(v.next.start) : "–"}</b>
            <span class="dim">${v.next ? `${Math.round(v.next.minutes)} min` : "nothing planned"}</span>
          </div>
          <div title="Last 7 days${mp ? " at this metering point" : ""}">
            <span class="lbl"><ha-icon icon="mdi:chart-bar"></ha-icon>7 days</span>
            <b>${total}</b>
            <span class="week"><xt-week-bars .daily=${week.daily} unit=${week.unit}></xt-week-bars><span class="dim">${week.runs} runs</span></span>
          </div>
          ${mp?.avg_lpm != null
            ? html`<div title="Mean flow of the last 30 days' runs${mp.expected_lpm ? " vs. the expected L/min" : ""}">
                <span class="lbl"><ha-icon icon="mdi:speedometer"></ha-icon>Flow</span>
                <b>${mp.avg_lpm.toFixed(1)} L/min</b>
                <span class="dim">${mp.expected_lpm ? `expected ${mp.expected_lpm}` : "30-day mean"}</span>
              </div>`
            : nothing}
        </div>
      </div>
    </ha-card>`;
  }

  static styles = [
    farmTokens,
    css`
      ha-card {
        padding: 16px 18px;
      }
      ha-card.loading {
        min-height: 96px;
        display: grid;
        place-items: center;
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        gap: 16px 32px;
        align-items: flex-start;
      }
      .who {
        flex: 1 1 280px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .name-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 400;
      }
      .num {
        color: var(--primary-color);
        font-variant-numeric: tabular-nums;
      }
      .battery {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        color: var(--xt-dim);
        font-variant-numeric: tabular-nums;
      }
      .battery.low,
      .battery.low ha-icon {
        color: var(--xt-bad);
      }
      ha-icon {
        --mdc-icon-size: 18px;
        color: var(--xt-dim);
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.05rem;
      }
      .status i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--xt-ok);
      }
      .status.watering {
        font-weight: 500;
      }
      .status.watering i {
        background: var(--xt-water);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--xt-water) 30%, transparent);
      }
      .status.offline i {
        background: var(--xt-off);
      }
      .where {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 16px;
      }
      .where > span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .dim {
        color: var(--xt-dim);
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .badge {
        font-size: 0.8rem;
        padding: 2px 10px;
        border-radius: 12px;
      }
      .badge.warn {
        background: color-mix(in srgb, var(--xt-warn) 18%, transparent);
      }
      .badge.bad {
        background: color-mix(in srgb, var(--xt-bad) 18%, transparent);
      }
      .tiles {
        flex: 2 1 480px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .tiles > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border: 1px solid var(--xt-track);
        border-radius: 12px;
        min-width: 0;
      }
      .lbl {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--xt-dim);
      }
      .lbl ha-icon {
        --mdc-icon-size: 15px;
      }
      .tiles b {
        font-size: 1.15rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .week {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .msg {
        padding: 16px;
        color: var(--xt-dim);
      }
    `,
  ];
}

if (!customElements.get("irrigation-valve-header-card")) {
  customElements.define("irrigation-valve-header-card", IrrigationValveHeaderCard);
}
