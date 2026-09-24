/** Colour tokens of the farm cards, in one place. Water that flowed is
 * blue (filled); a plan is an outline, never a fill, so the two never
 * mix up. Falls back to HA's theme colours. */

import { css } from "lit";

export const farmTokens = css`
  :host {
    --xt-water: var(--blue-color, #1e88e5);
    --xt-dim: var(--secondary-text-color, #727272);
    --xt-ok: var(--success-color, #4caf50);
    --xt-off: var(--disabled-text-color, #bdbdbd);
    --xt-warn: var(--warning-color, #ffa600);
    --xt-bad: var(--error-color, #db4437);
    --xt-track: var(--divider-color, #e0e0e0);
  }
`;
