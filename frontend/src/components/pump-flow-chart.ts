/** <xt-pump-flow-chart .lines=${FlowLines} .from=${ms} .to=${ms} period="hour">:
 * the pump's flow rate in L/min over the range, as a line; with statistics
 * (7 d / 30 d) the period maxima are a faint line above it. Axis and look
 * follow <xt-pump-chart>. */

import { LitElement, html, svg, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { niceTicks, periodStart, type FlowLines } from "../farm/pump-summary.ts";
import { XtPumpChart } from "./pump-chart.ts";
import { farmDate, farmTime } from "./farm-time.ts";

const H = 120;
const PAD = 18;

export class XtPumpFlowChart extends LitElement {
  @property({ attribute: false }) lines: FlowLines | null = null;
  @property({ attribute: false }) from = 0;
  @property({ attribute: false }) to = 0;
  @property() period: "hour" | "day" = "hour";

  private _label(ms: number): string {
    return this.period === "hour" ? farmTime(ms) : farmDate(ms, { weekday: "short", day: "numeric" });
  }

  render() {
    const l = this.lines;
    const span = this.to - this.from;
    if (!l || span <= 0) return nothing;
    // At least 10 L/min so an idle range does not show a 0.1 L/min axis.
    const ticks = niceTicks(Math.max(10, l.peak));
    const top = ticks[ticks.length - 1];
    const x = (ms: number) => Math.min(100, Math.max(0, ((ms - this.from) / span) * 100));
    const y = (v: number) => H - PAD - (v / top) * (H - PAD);
    const pts = (run: [number, number][]) => run.map(([t, v]) => `${x(t)},${y(v)}`).join(" ");
    // Same labels as the bars: every 4 h over 24 h; days, every 5th over 30.
    const step = this.period === "hour" ? 3_600_000 : 86_400_000;
    const every = this.period === "hour" ? 4 : span > 10 * 86_400_000 ? 5 : 1;
    const marks: number[] = [];
    for (let t = periodStart(this.from, this.period), i = 0; t < this.to; t += step, i++) if (i % every === 0 && t >= this.from) marks.push(t);
    return html`
      <div class="unit">L/min</div>
      <div class="plot">
        <div class="y">${ticks.map((t) => html`<span style="top:${y(t)}px">${t}</span>`)}</div>
        <div>
          <svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" role="img" aria-label="Pump flow rate">
            ${ticks.map((t) => svg`<line class="grid" x1="0" x2="100" y1=${y(t)} y2=${y(t)}></line>`)}
            ${l.max.map((run) => svg`<polyline class="max" points=${pts(run)}></polyline>`)}
            ${l.mean.map((run) => svg`<polyline class="flow" points=${pts(run)}></polyline>`)}
          </svg>
          <div class="axis">${marks.map((t) => html`<span style="left:${x(t)}%">${this._label(t)}</span>`)}</div>
        </div>
      </div>
      ${l.max.length
        ? html`<div class="legend"><span><i class="flow"></i>Mean</span><span><i class="max"></i>Max</span></div>`
        : nothing}
    `;
  }

  static styles = [
    XtPumpChart.styles,
    css`
      svg {
        height: ${H}px;
      }
      polyline {
        fill: none;
        vector-effect: non-scaling-stroke;
        stroke-linejoin: round;
      }
      .flow {
        stroke: var(--xt-water);
        stroke-width: 1.5;
      }
      .max {
        stroke: color-mix(in srgb, var(--xt-water) 35%, transparent);
        stroke-width: 1;
      }
      .legend i {
        height: 2px;
      }
      i.flow {
        background: var(--xt-water);
      }
      i.max {
        background: color-mix(in srgb, var(--xt-water) 35%, transparent);
      }
    `,
  ];
}

if (!customElements.get("xt-pump-flow-chart")) customElements.define("xt-pump-flow-chart", XtPumpFlowChart);
