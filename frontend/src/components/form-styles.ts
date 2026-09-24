/** Controls shared by the farm cards: card title bar, status dot, chips,
 * buttons and inputs. Use with farmTokens. */

import { css } from "lit";

export const formStyles = css`
  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 16px 4px;
  }
  .titlebar > ha-icon {
    --mdc-icon-size: 20px;
    color: var(--xt-dim);
  }
  .titlebar .title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .titlebar .title b {
    font-size: 1.1em;
    font-weight: 500;
  }
  .titlebar .title span {
    font-size: 0.85em;
    color: var(--xt-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9em;
    white-space: nowrap;
  }
  .status i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--xt-ok);
  }
  .status.watering {
    font-weight: 500;
  }
  .status.watering i {
    background: var(--xt-water);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
  }
  .status.manual i {
    background: var(--xt-warn);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-warn) 30%, transparent);
  }
  .status.offline i {
    background: var(--xt-off);
  }
  .body {
    padding: 8px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .label {
    font-size: 0.8em;
    color: var(--xt-dim);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    font: inherit;
    font-size: 0.9em;
    color: var(--primary-text-color);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--xt-track);
    border-radius: 18px;
    padding: 5px 14px;
    min-height: 34px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .chip ha-icon {
    --mdc-icon-size: 18px;
  }
  .chip.on {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .chip:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field input,
  .field select {
    font: inherit;
    font-size: 1.05em;
    color: var(--primary-text-color);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--xt-track);
    border-radius: 10px;
    padding: 8px 12px;
    min-height: 40px;
    box-sizing: border-box;
    width: 7em;
  }
  .field input:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  .field .unit {
    color: var(--xt-dim);
  }
  .btn {
    font: inherit;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    min-height: 42px;
    border-radius: 12px;
    border: 1px solid var(--xt-track);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .btn ha-icon {
    --mdc-icon-size: 20px;
  }
  .btn.primary {
    background: var(--xt-water);
    border-color: var(--xt-water);
    color: #fff;
  }
  .btn.warn {
    background: var(--xt-warn);
    border-color: var(--xt-warn);
    color: #fff;
  }
  .btn.danger {
    color: var(--xt-bad);
  }
  .btn.wide {
    width: 100%;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .icon-btn {
    border: none;
    background: none;
    border-radius: 50%;
    padding: 6px;
    display: flex;
    cursor: pointer;
    color: var(--xt-dim);
  }
  .icon-btn:hover:not([disabled]) {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  }
  .dim {
    color: var(--xt-dim);
  }
`;
