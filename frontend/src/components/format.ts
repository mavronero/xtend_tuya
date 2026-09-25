/** Date and duration wording shared by the farm cards. */

import { farmDate, farmDayStart, farmTime } from "./farm-time.ts";

export const DAY_MS = 86_400_000;

/** "Today", "Yesterday", "Tomorrow", else "Mon 22 Sept". */
export function dayLabel(ms: number, now = Date.now()): string {
  const day0 = farmDayStart(now);
  const diff = Math.round((farmDayStart(ms) - day0) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return farmDate(ms, { weekday: "short", day: "numeric", month: "short" });
}

export function time(ms: number): string {
  return farmTime(ms);
}

export function when(ms: number): string {
  return `${dayLabel(ms)} ${time(ms)}`;
}

/** "12 min", "5 h", "3 d" since ms. */
export function since(ms: number, now = Date.now()): string {
  const min = Math.round((now - ms) / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
}

/** "1,240 L" */
export function liters(l: number): string {
  return `${Math.round(l).toLocaleString()} L`;
}

/** mdi:battery-10 … mdi:battery, like HA's own battery icon. */
export function batteryIcon(pct: number): string {
  if (pct >= 95) return "mdi:battery";
  if (pct < 10) return "mdi:battery-outline";
  return `mdi:battery-${Math.floor(pct / 10) * 10}`;
}

/** "450 L" below a cubic metre, else "3.2 m³". */
export function volume(l: number): string {
  return Math.abs(l) < 1000 ? `${Math.round(l)} L` : `${(l / 1000).toFixed(1)} m³`;
}
