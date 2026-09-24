/** custom:irrigation-sites-card: sites as master-detail.
 *
 *   type: custom:irrigation-sites-card
 *
 * Left: the site tree (navigation; hidden on narrow screens, where the site
 * cards drill down instead). Right: the selected site's header, its
 * sub-sites as site cards and its metering points as valve cards. The
 * selection lives in the URL (`?site=<id>`), so back works and a site can
 * be linked. Admins get an Edit mode: create, rename, move and delete
 * sites, and move metering points between sites.
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistantLike } from "./farm/discovery.ts";
import type { MeteringPoint, Site } from "./farm/data.ts";
import { FarmController } from "./farm/controller.ts";
import { childSites, NO_SITE, summarizeSite, type SiteSummary } from "./farm/site-summary.ts";
import { sitePath, subtree } from "./farm/valve-filter.ts";
import type { ValveSummary } from "./farm/valve-summary.ts";
import { liters } from "./components/format.ts";
import { navigate } from "./components/navigate.ts";
import "./components/site-card.ts";
import "./components/site-tree.ts";
import "./components/valve-card.ts";
import "./components/week-bars.ts";

type Hass = HomeAssistantLike & {
  user?: { is_admin?: boolean };
  callApi?: <T>(method: string, path: string, body?: unknown) => Promise<T>;
};

const API = "xtend_tuya/irrigation_locations";

function siteFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("site");
}

export class IrrigationSitesCard extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private _selected: string | null = siteFromUrl();
  @state() private _edit = false;
  @state() private _busy = false;
  @state() private _error: string | null = null;
  private _farm = new FarmController(this);
  private _onLocation = (): void => {
    this._selected = siteFromUrl();
  };

  setConfig(_config: unknown): void {}

  getCardSize(): number {
    return 12;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
  }

  // ------------------------------------------------------------ actions

  private _open(id: string | null): void {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("site", id);
    else url.searchParams.delete("site");
    window.history.pushState(null, "", url.pathname + url.search);
    this._selected = id;
    this._error = null;
  }

  private async _post(body: Record<string, unknown>): Promise<boolean> {
    if (!this.hass?.callApi) return false;
    this._busy = true;
    this._error = null;
    try {
      await this.hass.callApi("POST", API, body);
      await this._farm.refresh(true);
      return true;
    } catch (e) {
      const err = e as { body?: { error?: string }; message?: string };
      this._error = err.body?.error ?? err.message ?? String(e);
      return false;
    } finally {
      this._busy = false;
    }
  }

  private async _createSite(form: HTMLFormElement, parent: string | null): Promise<void> {
    const input = form.querySelector("input") as HTMLInputElement;
    if (!input.value.trim()) return;
    if (await this._post({ action: "create_site", name: input.value, parent_id: parent })) input.value = "";
  }

  private async _saveSite(form: HTMLFormElement, site: Site): Promise<void> {
    const name = (form.querySelector("input") as HTMLInputElement).value;
    const parent = (form.querySelector("select") as HTMLSelectElement).value || null;
    await this._post({ action: "update_site", id: site.id, name, parent_id: parent });
  }

  private async _deleteSite(site: Site): Promise<void> {
    if (await this._post({ action: "delete_site", id: site.id })) this._open(site.parent_id);
  }

  // ------------------------------------------------------------ render

  private _header(sum: SiteSummary | null, total: { sites: number; mps: number; valves: number; online: number }) {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "All sites" }];
    if (sum && sum.id !== NO_SITE) {
      const byId = new Map(this._farm.data.sites.map((s) => [s.id, s]));
      const chain: Site[] = [];
      for (let s = byId.get(sum.id); s && chain.length < 20; s = s.parent_id ? byId.get(s.parent_id) : undefined) chain.unshift(s);
      crumbs.push(...chain.map((s) => ({ id: s.id, name: s.name })));
    } else if (sum) crumbs.push({ id: NO_SITE, name: "No site" });
    const title = crumbs[crumbs.length - 1].name;
    return html`<div class="header">
      <nav class="crumbs" aria-label="Site path">
        ${crumbs.slice(0, -1).map(
          (c) => html`<a href="#" @click=${(e: Event) => (e.preventDefault(), this._open(c.id))}>${c.name}</a><span>›</span>`
        )}
      </nav>
      <div class="title-row">
        <h2>${title}</h2>
        ${this.hass?.user?.is_admin
          ? html`<button class="edit ${this._edit ? "on" : ""}" @click=${() => (this._edit = !this._edit)}>
              <ha-icon icon=${this._edit ? "mdi:check" : "mdi:pencil-outline"}></ha-icon>${this._edit ? "Done" : "Edit"}
            </button>`
          : nothing}
      </div>
      <div class="figures">
        ${sum
          ? html`
              <span title="Metering points"><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${sum.mps} metering points</span>
              <span title="Valves online / valves"><ha-icon icon="mdi:valve"></ha-icon>${sum.online} / ${sum.valves} online</span>
              ${sum.watering
                ? html`<span class="water" title="Valves watering now"><i></i>${sum.watering} watering</span>`
                : nothing}
              ${sum.attention ? html`<span class="warn" title="Valves with a warning">${sum.attention} need attention</span>` : nothing}
              <span title="Last 7 days"
                ><xt-week-bars .daily=${sum.week.daily}></xt-week-bars>${sum.week.runs} runs · ${liters(sum.week.liters)}</span
              >
              ${sum.pump
                ? html`<span title="Pump"><ha-icon icon="mdi:pump"></ha-icon>${sum.pump.name}${sum.pump.via ? ` · via ${sum.pump.via}` : ""}</span>`
                : nothing}
            `
          : html`
              <span><ha-icon icon="mdi:sprout-outline"></ha-icon>${total.sites} sites</span>
              <span><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${total.mps} metering points</span>
              <span><ha-icon icon="mdi:valve"></ha-icon>${total.online} / ${total.valves} online</span>
            `}
      </div>
    </div>`;
  }

  private _editSite(site: Site) {
    const sites = this._farm.data.sites;
    const own = subtree(sites, site.id);
    const parents = sites
      .filter((s) => !own.has(s.id))
      .map((s) => ({ id: s.id, path: sitePath(sites, s.id) }))
      .sort((a, b) => a.path.localeCompare(b.path));
    const empty =
      !sites.some((s) => s.parent_id === site.id) && !this._farm.data.locations.some((m) => m.site_id === site.id);
    return html`<form class="editor" @submit=${(e: Event) => (e.preventDefault(), this._saveSite(e.target as HTMLFormElement, site))}>
      <label>Name <input .value=${site.name} required /></label>
      <label
        >Part of
        <select>
          <option value="" ?selected=${!site.parent_id}>— top level —</option>
          ${parents.map((p) => html`<option value=${p.id} ?selected=${p.id === site.parent_id}>${p.path}</option>`)}
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Save</button>
      <button
        type="button"
        class="danger"
        ?disabled=${this._busy || !empty}
        title=${empty ? "Delete this site" : "Only an empty site can be deleted"}
        @click=${() => this._deleteSite(site)}
      >
        Delete
      </button>
    </form>`;
  }

  private _addSite(parent: string | null) {
    return html`<form class="editor" @submit=${(e: Event) => (e.preventDefault(), this._createSite(e.target as HTMLFormElement, parent))}>
      <label>${parent ? "New sub-site" : "New site"} <input placeholder="Name" /></label>
      <button type="submit" ?disabled=${this._busy}>Add</button>
    </form>`;
  }

  private _mpCard(mp: MeteringPoint, byDevice: Map<string, ValveSummary>) {
    const v = mp.valve ? byDevice.get(mp.valve) : undefined;
    const card = v
      ? html`<xt-valve-card .summary=${v} .siteContext=${mp.site_id}></xt-valve-card>`
      : html`<ha-card class="empty-mp"
          ><strong>${mp.name}</strong><span>No valve assigned</span></ha-card
        >`;
    if (!this._edit) return card;
    const sites = this._farm.data.sites
      .map((s) => ({ id: s.id, path: sitePath(this._farm.data.sites, s.id) }))
      .sort((a, b) => a.path.localeCompare(b.path));
    return html`<div class="mp-edit">
      ${card}
      <select
        aria-label="Move ${mp.name} to site"
        ?disabled=${this._busy}
        @change=${(e: Event) =>
          this._post({ action: "set_location_site", location_id: mp.id, site_id: (e.target as HTMLSelectElement).value || null })}
      >
        <option value="" ?selected=${!mp.site_id}>— no site —</option>
        ${sites.map((s) => html`<option value=${s.id} ?selected=${s.id === mp.site_id}>${s.path}</option>`)}
      </select>
    </div>`;
  }

  render() {
    if (!this.hass) return nothing;
    if (!this._farm.loaded) return html`<ha-card><div class="msg">Loading sites…</div></ha-card>`;
    const data = this._farm.data;
    const valves = this._farm.summaries();
    const byDevice = new Map(valves.map((v) => [v.device_id, v]));
    const hasNoSite = data.locations.some((m) => !m.site_id);
    const sel = this._selected && (this._selected === NO_SITE || data.sites.some((s) => s.id === this._selected)) ? this._selected : null;
    const site = sel && sel !== NO_SITE ? data.sites.find((s) => s.id === sel) ?? null : null;
    const sum = sel ? summarizeSite(sel, data, valves) : null;

    const childIds = sel ? sum!.children : [...childSites(data.sites, null).map((s) => s.id), ...(hasNoSite ? [NO_SITE] : [])];
    const children = childIds.map((id) => summarizeSite(id, data, valves));
    const mps = sel
      ? data.locations
          .filter((m) => (sel === NO_SITE ? !m.site_id : m.site_id === sel))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    const counts: Record<string, number> = {};
    for (const s of data.sites) counts[s.id] = data.locations.filter((m) => subtree(data.sites, s.id).has(m.site_id ?? "")).length;
    counts[NO_SITE] = data.locations.filter((m) => !m.site_id).length;
    const withLoc = valves.filter((v) => v.location);
    const total = {
      sites: data.sites.length,
      mps: data.locations.length,
      valves: withLoc.length,
      online: withLoc.filter((v) => v.status !== "offline").length,
    };

    return html`<div class="layout" @xt-site-open=${(e: CustomEvent<string | null>) => this._open(e.detail)} @xt-valve-open=${(e: CustomEvent<string>) => navigate(e.detail)}>
      <aside>
        <xt-site-tree .sites=${data.sites} .selected=${sel} .counts=${counts} ?noSite=${hasNoSite}></xt-site-tree>
      </aside>
      <main>
        ${this._header(sum, total)}
        ${this._error ? html`<div class="msg err">${this._error}</div>` : nothing}
        ${this._farm.error ? html`<div class="msg err">Could not load farm data: ${this._farm.error}</div>` : nothing}
        ${this._edit && site ? this._editSite(site) : nothing}
        ${children.length || (this._edit && sel !== NO_SITE)
          ? html`<h3>${sel ? "Sub-sites" : "Sites"} <span class="count">${children.length}</span></h3>
              <div class="grid">${children.map((c) => html`<xt-site-card .summary=${c}></xt-site-card>`)}</div>
              ${this._edit && sel !== NO_SITE ? this._addSite(sel) : nothing}`
          : nothing}
        ${mps.length
          ? html`<h3>Metering points <span class="count">${mps.length}</span></h3>
              <div class="grid">${mps.map((m) => this._mpCard(m, byDevice))}</div>`
          : nothing}
        ${!sel && !data.sites.length
          ? html`<div class="msg">No sites yet. Sites are created from the Tuya rooms once the valves report them, or by hand in Edit.</div>`
          : nothing}
      </main>
    </div>`;
  }

  static styles = css`
    :host {
      display: block;
      --xt-dim: var(--secondary-text-color, #727272);
    }
    .layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 8px;
      max-height: calc(100vh - 80px);
      overflow: auto;
    }
    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
      aside {
        display: none;
      }
    }
    ha-icon {
      --mdc-icon-size: 18px;
      color: var(--xt-dim);
    }
    .crumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.9rem;
      color: var(--xt-dim);
      min-height: 1.2em;
    }
    .crumbs a {
      color: var(--primary-color);
      text-decoration: none;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h2 {
      margin: 2px 0 8px;
      font-size: 1.6rem;
      font-weight: 400;
      flex: 1;
    }
    h3 {
      font-size: 1.2rem;
      font-weight: 500;
      margin: 24px 0 10px;
    }
    .count {
      color: var(--xt-dim);
      font-weight: 400;
      font-size: 0.9em;
    }
    .figures {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      align-items: center;
      font-variant-numeric: tabular-nums;
    }
    .figures span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .figures .water i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--state-switch-active-color, #f9a825);
    }
    .figures .warn {
      padding: 1px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--warning-color, #ffa600) 18%, transparent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
    .empty-mp {
      padding: 12px 14px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: var(--xt-dim);
      font-size: 0.9rem;
    }
    .empty-mp strong {
      color: var(--primary-text-color);
      font-size: 1.05rem;
      font-weight: 500;
    }
    .mp-edit {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .editor {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: flex-end;
      margin: 12px 0;
      padding: 12px;
      border: 1px dashed var(--divider-color, #e0e0e0);
      border-radius: 12px;
    }
    .editor label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--xt-dim);
    }
    input,
    select,
    button {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px 10px;
      min-height: 34px;
      box-sizing: border-box;
    }
    button {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    button[type="submit"],
    .edit.on {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .edit.on ha-icon {
      color: inherit;
    }
    .danger:not(:disabled) {
      color: var(--error-color, #db4437);
    }
    .msg {
      padding: 12px 0;
      color: var(--xt-dim);
    }
    .err {
      color: var(--error-color, #db4437);
    }
  `;
}

if (!customElements.get("irrigation-sites-card")) customElements.define("irrigation-sites-card", IrrigationSitesCard);
