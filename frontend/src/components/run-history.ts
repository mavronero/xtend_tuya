/** <xt-run-history .runs=${Run[]} ?metered .valveOf=${fn}>: completed runs as
 * a table, newest first, like SmartLife's history (Trello Sijuj2Dd): date,
 * start, end, duration, liters, L/min; `valveOf` adds a Valve column (a
 * metering point's log spans valve swaps). Shows a page and "Show more". */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { Run } from "../farm/data.ts";
import { runLpm } from "../farm/run-log.ts";
import { dayLabel, time } from "./format.ts";
import { farmTokens } from "./theme.ts";

const PAGE = 5;

function duration(seconds: number): string {
  const min = Math.round(seconds / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

export class XtRunHistory extends LitElement {
  @property({ attribute: false }) runs: Run[] = [];
  /** The valve has a flow meter: show liters (else "–"). */
  @property({ type: Boolean }) metered = true;
  /** Label of the valve that made a run ("#712"); set = show a Valve column. */
  @property({ attribute: false }) valveOf?: (device_id: string) => string;
  @state() private _shown = PAGE;

  render() {
    const rows = [...this.runs].sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
    if (!rows.length) return html`<div class="empty">No runs recorded in the last 30 days.</div>`;
    return html`
      <table>
        <thead>
          <tr>
            ${this.valveOf ? html`<th>Valve</th>` : nothing}
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th class="num">Duration</th>
            <th class="num">Liters</th>
            <th class="num" title="Mean flow: liters per minute of the run">L/min</th>
          </tr>
        </thead>
        <tbody>
          ${rows.slice(0, this._shown).map((r) => {
            const start = Date.parse(r.start);
            const liters = typeof r.liters === "number" ? `${Math.round(r.liters)} L` : "–";
            const dry = this.metered && r.liters === 0;
            const lpm = this.metered ? runLpm(r) : null;
            return html`<tr>
              ${this.valveOf ? html`<td class="valve">${this.valveOf(r.device_id)}</td>` : nothing}
              <td>${dayLabel(start)}</td>
              <td>${time(start)}</td>
              <td>${time(Date.parse(r.end))}</td>
              <td class="num">${duration(r.duration_seconds ?? 0)}</td>
              <td class="num ${dry ? "dry" : ""}" title=${dry ? "No water measured" : ""}>
                ${this.metered ? liters : "–"}
              </td>
              <td class="num">${lpm !== null ? lpm.toFixed(1) : ""}</td>
            </tr>`;
          })}
        </tbody>
      </table>
      ${rows.length > this._shown
        ? html`<button @click=${() => (this._shown += PAGE)}>Show more (${rows.length - this._shown})</button>`
        : nothing}
    `;
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: block;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
      }
      th {
        text-align: left;
        font-weight: 500;
        color: var(--xt-dim);
        font-size: 0.8rem;
        padding: 4px 6px;
        border-bottom: 1px solid var(--xt-track);
      }
      td {
        padding: 6px;
        white-space: nowrap;
        border-bottom: 1px solid color-mix(in srgb, var(--xt-track) 60%, transparent);
      }
      .num {
        text-align: right;
      }
      td.valve {
        color: var(--primary-color);
      }
      td.dry {
        color: var(--xt-bad);
      }
      .empty {
        color: var(--xt-dim);
        padding: 8px 0;
      }
      button {
        all: unset;
        cursor: pointer;
        color: var(--primary-color);
        padding: 8px 6px 0;
        font-size: 0.9rem;
      }
    `,
  ];
}

if (!customElements.get("xt-run-history")) customElements.define("xt-run-history", XtRunHistory);
