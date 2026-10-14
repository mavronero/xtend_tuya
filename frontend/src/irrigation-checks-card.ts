/** custom:irrigation-checks-card: every valve that needs someone, one list
 * per problem (farm/checks.ts), each row opens the valve.
 *
 *   type: custom:irrigation-checks-card
 *   collapsed: [offline]      # lists that start collapsed (default: offline)
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistantLike } from "./farm/discovery.ts";
import { FarmController } from "./farm/controller.ts";
import { computeChecks, type CheckKind, type CheckSection } from "./farm/checks.ts";
import { navigate } from "./components/navigate.ts";
import { farmTokens } from "./components/theme.ts";

interface CardConfig {
  type: string;
  collapsed?: CheckKind[];
}

const ICON: Record<CheckKind, string> = {
  stopped: "mdi:water-off-outline",
  no_flow: "mdi:water-alert-outline",
  timer: "mdi:timer-alert-outline",
  all_off: "mdi:timer-off-outline",
  battery: "mdi:battery-alert-variant-outline",
  offline: "mdi:wifi-off",
};

export class IrrigationChecksCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistantLike;
  @state() private _config?: CardConfig;
  @state() private _open: Partial<Record<CheckKind, boolean>> = {};
  private _farm = new FarmController(this);

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 12;
  }

  private _isOpen(kind: CheckKind): boolean {
    return this._open[kind] ?? !(this._config?.collapsed ?? ["offline"]).includes(kind);
  }

  private _section(sec: CheckSection) {
    const open = this._isOpen(sec.kind);
    return html`<section>
      <button class="title" @click=${() => (this._open = { ...this._open, [sec.kind]: !open })} aria-expanded=${open}>
        <ha-icon icon=${ICON[sec.kind]}></ha-icon>
        <span>${sec.title}</span><span class="count">${sec.checks.length}</span>
        <ha-icon class="chev" icon=${open ? "mdi:chevron-up" : "mdi:chevron-down"}></ha-icon>
      </button>
      ${open
        ? html`<div class="hint">${sec.hint}</div>
            <ha-card>
              ${sec.checks.map((c) => {
                const s = c.summary;
                const place = [s.location?.name, s.site?.name].filter(Boolean).join(" · ");
                return html`<div class="row" role="link" tabindex="0" @click=${() => navigate(s.view_path)}
                  @keydown=${(e: KeyboardEvent) => e.key === "Enter" && navigate(s.view_path)}>
                  <span class="num">${s.number ? `#${s.number}` : ""}</span>
                  <span class="name" title=${s.name}>${s.name}${place ? html`<span class="dim"> · ${place}</span>` : nothing}</span>
                  <span class="detail">${c.detail}</span>
                </div>`;
              })}
            </ha-card>`
        : nothing}
    </section>`;
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._farm.loaded) return html`<ha-card><div class="msg">Loading checks…</div></ha-card>`;
    const all = this._farm.summaries();
    const sections = computeChecks(all, this._farm.valves, this.hass.states ?? {}, this._farm.data, Date.now());
    const valves = new Set(sections.filter((s) => s.kind !== "offline").flatMap((s) => s.checks.map((c) => c.summary.device_id)));
    return html`
      <div class="head">
        <h2>Checks</h2>
        <span class="dim">${valves.size ? `${valves.size} of ${all.length} valves need a look` : `All ${all.length} valves OK`}</span>
      </div>
      ${this._farm.error ? html`<div class="msg err">Could not load farm data: ${this._farm.error}</div>` : nothing}
      ${sections.map((s) => this._section(s))}
    `;
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 400;
      }
      section {
        margin-bottom: 20px;
      }
      .title {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        cursor: pointer;
        font-size: 1.2rem;
        font-weight: 500;
        padding: 4px 0 4px;
        color: var(--primary-text-color);
      }
      ha-icon {
        --mdc-icon-size: 20px;
        color: var(--xt-dim);
        flex: none;
      }
      .chev {
        margin-left: auto;
      }
      .count,
      .dim {
        color: var(--xt-dim);
        font-weight: 400;
      }
      .hint {
        color: var(--xt-dim);
        font-size: 0.9rem;
        margin: 0 0 8px 28px;
      }
      ha-card {
        overflow: hidden;
      }
      .row {
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr) minmax(0, 1.4fr);
        gap: 4px 12px;
        align-items: baseline;
        padding: 10px 14px;
        cursor: pointer;
        border-top: 1px solid var(--xt-track);
        font-size: 0.95rem;
      }
      .row:first-child {
        border-top: none;
      }
      .row:hover,
      .row:focus-visible {
        background: color-mix(in srgb, var(--primary-color) 6%, transparent);
        outline: none;
      }
      .num {
        color: var(--xt-dim);
        font-variant-numeric: tabular-nums;
      }
      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      @media (max-width: 600px) {
        .row {
          grid-template-columns: 44px minmax(0, 1fr);
        }
        .detail {
          grid-column: 2;
        }
      }
      .msg {
        padding: 16px;
        color: var(--xt-dim);
      }
      .err {
        color: var(--xt-bad);
      }
    `,
  ];
}

if (!customElements.get("irrigation-checks-card")) customElements.define("irrigation-checks-card", IrrigationChecksCard);
