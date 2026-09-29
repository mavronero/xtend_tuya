/** A searchable pick list: a text field over the browser's own datalist.
 * Typing "711", "carob" or a site narrows the list; picking an entry (or
 * typing it exactly and pressing Enter) calls `onPick` with its key. Replaces
 * long <select>s nobody could search (Simon, 2026-09-29).
 */

import { html, css } from "lit";

export interface PickOption {
  key: string;
  text: string;
}

export function pickList(
  id: string,
  placeholder: string,
  options: PickOption[],
  disabled: boolean,
  onPick: (key: string) => void
) {
  const commit = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const hit = options.find((o) => o.text === input.value);
    if (!hit) return;
    input.value = "";
    onPick(hit.key);
  };
  return html`<input
      class="pick"
      type="search"
      list=${id}
      placeholder=${placeholder}
      autocomplete="off"
      ?disabled=${disabled}
      @input=${(e: InputEvent) => {
        // Chrome/Safari report a datalist pick without an inputType (or as a
        // replacement); ordinary typing only filters.
        if (!e.inputType || e.inputType === "insertReplacementText") commit(e);
      }}
      @change=${commit}
    /><datalist id=${id}>${options.map((o) => html`<option value=${o.text}></option>`)}</datalist>`;
}

export const pickStyles = css`
  input.pick {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font: inherit;
    padding: 6px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    background: var(--card-background-color, transparent);
    color: var(--primary-text-color);
  }
`;
