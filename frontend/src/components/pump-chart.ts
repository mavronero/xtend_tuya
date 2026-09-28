/** <xt-pump-chart .buckets=${Bucket[]} period="hour">: per period, what the
 * pump delivered (outline) against what the valves and metered consumers
 * took (filled, stacked). The gap between them is the unaccounted water.
 * Y axis in m³; the consumer sliver is drawn but not in the legend. */

import { LitElement, html, svg, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { niceTicks, type Bucket } from "../farm/pump-summary.ts";
import { volume } from "./format.ts";
import { farmTokens } from "./theme.ts";
import { farmDate, farmTime } from "./farm-time.ts";

const H = 160;
const PAD = 18;

export class XtPumpChart extends LitElement {
  @property({ attribute: false }) buckets: Bucket[] = [];
  @property() period: "hour" | "day" = "hour";

  private _label(ms: number): string {
    return this.period === "hour" ? farmTime(ms) : farmDate(ms, { weekday: "short", day: "numeric" });
  }

  render() {
    const n = this.buckets.length;
    if (!n) return nothing;
    // Liters; at least 100 L so an idle range does not show a 0.001 m³ axis.
    const peak = Math.max(100, ...this.buckets.map((b) => Math.max(b.pump ?? 0, b.valves + b.consumers)));
    const ticks = niceTicks(peak / 1000);
    const max = ticks[ticks.length - 1] * 1000;
    const digits = ticks[1] < 1 ? String(ticks[1]).split(".")[1].length : 0;
    const w = 100 / n;
    const y = (l: number) => (l / max) * (H - PAD);
    // Every 4 h over 24 h; days: each one for a week, every 5th over 30.
    const every = this.period === "hour" ? 4 : n > 10 ? 5 : 1;
    return html`
      <div class="unit">m³</div>
      <div class="plot">
        <div class="y">
          ${ticks.map((t) => html`<span style="top:${H - PAD - y(t * 1000)}px">${t.toFixed(digits)}</span>`)}
        </div>
        <div>
          <svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" role="img" aria-label="Pump delivery against valve and consumer use">
            ${ticks.map((t) => svg`<line class="grid" x1="0" x2="100" y1=${H - PAD - y(t * 1000)} y2=${H - PAD - y(t * 1000)}></line>`)}
            ${this.buckets.map((b, i) => {
              const x = i * w;
              const used = b.valves + b.consumers;
              const title = `${this._label(b.start)}: pump ${b.pump === null ? "no data" : volume(b.pump)}, valves ${volume(b.valves)}${
                b.consumers ? `, consumers ${volume(b.consumers)}` : ""
              }${b.pump !== null ? `, unaccounted ${volume(b.pump - used)}` : ""}`;
              return svg`<g>
                <title>${title}</title>
                <rect class="hit" x=${x} y="0" width=${w} height=${H - PAD}></rect>
                ${b.pump !== null
                  ? svg`<rect class="pump" x=${x + w * 0.1} y=${H - PAD - y(b.pump)} width=${w * 0.8} height=${y(b.pump)}></rect>`
                  : nothing}
                <rect class="valves" x=${x + w * 0.25} y=${H - PAD - y(b.valves)} width=${w * 0.5} height=${y(b.valves)}></rect>
                <rect class="consumers" x=${x + w * 0.25} y=${H - PAD - y(used)} width=${w * 0.5} height=${y(b.consumers)}></rect>
              </g>`;
            })}
          </svg>
          <div class="axis">
            ${this.buckets.map((b, i) => html`<span style="left:${(i + 0.5) * w}%">${i % every === 0 ? this._label(b.start) : ""}</span>`)}
          </div>
        </div>
      </div>
      <div class="legend">
        <span><i class="pump"></i>Pump volume</span>
        <span><i class="valves"></i>Valve volume</span>
      </div>
    `;
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: block;
        --xt-consumer: var(--teal-color, #009688);
      }
      svg {
        width: 100%;
        height: ${H}px;
        display: block;
      }
      .unit {
        font-size: 0.7rem;
        color: var(--xt-dim);
        margin-bottom: 6px;
      }
      .plot {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 6px;
      }
      .y {
        position: relative;
        min-width: 2em;
        font-size: 0.7rem;
        color: var(--xt-dim);
        font-variant-numeric: tabular-nums;
      }
      .y span {
        position: absolute;
        right: 0;
        transform: translateY(-50%);
      }
      .grid {
        stroke: var(--xt-track);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .hit {
        fill: transparent;
      }
      g:hover .hit {
        fill: color-mix(in srgb, var(--primary-color) 6%, transparent);
      }
      .pump {
        fill: color-mix(in srgb, var(--xt-water) 14%, transparent);
        stroke: var(--xt-water);
        stroke-width: 0.25;
        vector-effect: non-scaling-stroke;
      }
      .valves {
        fill: var(--xt-water);
      }
      .consumers {
        fill: var(--xt-consumer);
      }
      .axis {
        position: relative;
        height: 16px;
        font-size: 0.7rem;
        color: var(--xt-dim);
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 0.8rem;
        color: var(--xt-dim);
        margin-top: 4px;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .legend i {
        width: 10px;
        height: 10px;
        border-radius: 2px;
      }
      i.pump {
        background: color-mix(in srgb, var(--xt-water) 14%, transparent);
        border: 1px solid var(--xt-water);
      }
      i.valves {
        background: var(--xt-water);
      }
    `,
  ];
}

if (!customElements.get("xt-pump-chart")) customElements.define("xt-pump-chart", XtPumpChart);
