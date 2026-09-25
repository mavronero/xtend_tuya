/** <xt-mp-editor>: side panel (bottom sheet on a phone) to edit one
 * metering point: details, site, valve exchange, valve history.
 *
 * Presentational: it fires events and the container talks to the API.
 *   xt-mp-save     {name, description, expected_lpm, site_id}
 *   xt-mp-assign   device_id   put this valve here (exchanges the current one)
 *   xt-mp-unassign device_id   end this valve's assignment here
 *   xt-close
 */

import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { MeteringPoint } from "../farm/data.ts";
import type { ValveStatus } from "../farm/valve-summary.ts";
import { batteryIcon } from "./format.ts";
import { farmTokens } from "./theme.ts";
import { farmDate } from "./farm-time.ts";

/** A valve the metering point can take, with where it is now. */
export interface ValveOption {
  device_id: string;
  label: string;
  status: ValveStatus;
  battery: number | null;
  /** Name of the metering point holding it now, if any. */
  at: string | null;
}

export interface SiteOption {
  id: string;
  path: string;
}

export interface MpSaveDetail {
  name: string;
  description: string;
  expected_lpm: number | null;
  site_id: string | null;
}

const STATUS_TEXT: Record<ValveStatus, string> = { watering: "Watering", idle: "Idle", offline: "Offline" };

function date(ms: number): string {
  return farmDate(ms, { day: "numeric", month: "short", year: "numeric" });
}

export class XtMpEditor extends LitElement {
  @property({ attribute: false }) mp?: MeteringPoint;
  @property({ attribute: false }) sites: SiteOption[] = [];
  @property({ attribute: false }) valves: ValveOption[] = [];
  @property({ type: Boolean }) busy = false;
  @property() error: string | null = null;

  private _fire(type: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private _save(e: Event): void {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value;
    const lpm = val("expected_lpm").trim();
    this._fire("xt-mp-save", {
      name: val("name"),
      description: val("description"),
      expected_lpm: lpm === "" ? null : Number(lpm),
      site_id: val("site_id") || null,
    } satisfies MpSaveDetail);
  }

  private _valveLine(o: ValveOption | undefined, id: string) {
    return html`<div class="valve">
      <ha-icon icon="mdi:valve"></ha-icon>
      <span class="num">${o?.label ?? id}</span>
      ${o ? html`<i class=${o.status}></i><span>${STATUS_TEXT[o.status]}</span>` : nothing}
      ${o?.battery != null
        ? html`<span class="dim"><ha-icon icon=${batteryIcon(o.battery)}></ha-icon>${Math.round(o.battery)} %</span>`
        : nothing}
      <button type="button" class="link danger" ?disabled=${this.busy} @click=${() => this._fire("xt-mp-unassign", id)}>
        Remove
      </button>
    </div>`;
  }

  render() {
    const mp = this.mp;
    if (!mp) return nothing;
    const byId = new Map(this.valves.map((v) => [v.device_id, v]));
    // Free valves first, then those at other metering points (they move here).
    const candidates = this.valves
      .filter((v) => !mp.valves.includes(v.device_id))
      .sort((a, b) => Number(!!a.at) - Number(!!b.at) || a.label.localeCompare(b.label, undefined, { numeric: true }));
    const history = [...mp.assignments].sort((a, b) => (b.begin ?? 0) - (a.begin ?? 0));
    return html`
      <div class="backdrop" @click=${() => this._fire("xt-close")}></div>
      <aside role="dialog" aria-label="Edit ${mp.name}">
        <header>
          <h2>${mp.name}</h2>
          <button type="button" class="icon" aria-label="Close" @click=${() => this._fire("xt-close")}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </header>

        <form @submit=${this._save}>
          <label>Name <input name="name" .value=${mp.name} required /></label>
          <label
            >Site
            <select name="site_id">
              <option value="" ?selected=${!mp.site_id}>— no site —</option>
              ${this.sites.map((s) => html`<option value=${s.id} ?selected=${s.id === mp.site_id}>${s.path}</option>`)}
            </select>
          </label>
          <label
            >Expected L/min
            <input name="expected_lpm" type="number" min="0" step="0.1" .value=${mp.expected_lpm?.toString() ?? ""} />
          </label>
          <label>Description <textarea name="description" rows="2" .value=${mp.description}></textarea></label>
          <button type="submit" class="primary" ?disabled=${this.busy}>Save</button>
        </form>

        <section>
          <h3>Valve</h3>
          ${mp.valves.length
            ? mp.valves.map((id) => this._valveLine(byId.get(id), id))
            : html`<div class="dim">No valve assigned.</div>`}
          <label
            >${mp.valves.length ? "Exchange for" : "Assign"}
            <select
              ?disabled=${this.busy}
              @change=${(e: Event) => {
                const sel = e.target as HTMLSelectElement;
                if (sel.value) this._fire("xt-mp-assign", sel.value);
                sel.value = "";
              }}
            >
              <option value="">Choose a valve…</option>
              ${candidates.map(
                (v) => html`<option value=${v.device_id}>${v.label}${v.at ? ` — now at ${v.at}` : " — free"}${v.status === "offline" ? " (offline)" : ""}</option>`
              )}
            </select>
          </label>
          <p class="hint dim">
            ${mp.valves.length > 1
              ? "Both current valves' assignments end now (one valve per metering point)."
              : mp.valves.length
                ? "The current valve's assignment ends now."
                : "The valve leaves the metering point it is at now."}
            This metering point keeps its whole history.
          </p>
        </section>

        ${history.length
          ? html`<section>
              <h3>Valve history</h3>
              <ul>
                ${history.map(
                  (a) => html`<li>
                    <span class="num">${byId.get(a.device_id)?.label ?? a.device_id}</span>
                    <span class="dim"
                      >${a.begin ? date(a.begin) : "from the start"} – ${a.end ? date(a.end) : "now"}</span
                    >
                  </li>`
                )}
              </ul>
            </section>`
          : nothing}
        ${this.error ? html`<div class="error">${this.error}</div>` : nothing}
      </aside>
    `;
  }

  static styles = [
    farmTokens,
    css`
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 8;
      }
      aside {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(420px, 100vw);
        z-index: 9;
        overflow: auto;
        box-sizing: border-box;
        padding: 16px 20px 24px;
        background: var(--card-background-color, #fff);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-size: 0.95rem;
      }
      @media (max-width: 620px) {
        aside {
          top: auto;
          max-height: 85vh;
          border-radius: 16px 16px 0 0;
        }
      }
      header {
        display: flex;
        align-items: center;
      }
      h2 {
        flex: 1;
        margin: 0;
        font-size: 1.3rem;
        font-weight: 500;
      }
      h3 {
        margin: 0 0 8px;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-color);
      }
      form,
      section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--xt-dim);
      }
      input,
      select,
      textarea,
      button {
        font: inherit;
        color: var(--primary-text-color);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        padding: 6px 10px;
        min-height: 36px;
        box-sizing: border-box;
      }
      button {
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .primary {
        align-self: flex-start;
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
        padding: 6px 20px;
      }
      .icon,
      .link {
        border: none;
        background: none;
        min-height: 0;
        padding: 4px;
      }
      .link.danger {
        color: var(--xt-bad);
        margin-left: auto;
      }
      ha-icon {
        --mdc-icon-size: 18px;
        color: var(--xt-dim);
      }
      .valve {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .valve i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--xt-ok);
        margin-left: 4px;
      }
      .valve i.watering {
        background: var(--xt-water);
      }
      .valve i.offline {
        background: var(--xt-off);
      }
      .valve .dim {
        display: inline-flex;
        align-items: center;
      }
      .num {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }
      .dim {
        color: var(--xt-dim);
      }
      .hint {
        margin: 0;
        font-size: 0.8rem;
      }
      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .error {
        color: var(--xt-bad);
      }
    `,
  ];
}

if (!customElements.get("xt-mp-editor")) customElements.define("xt-mp-editor", XtMpEditor);
