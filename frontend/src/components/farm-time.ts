/**
 * Farm wall-clock time.
 *
 * Valve timers fire in the farm's time zone, so every time the farm cards
 * show must be in it too — not the viewer's. A browser in Germany showed a
 * 05:00 timer's runs at 04:00 (Simon, 2026-09-25).
 *
 * The zone is Home Assistant's configured one (hass.config.time_zone).
 * Cards call setFarmTimeZone() from their hass setter; until one has, the
 * browser's zone is used.
 */

let zone: string | undefined;

export function setFarmTimeZone(tz: string | undefined | null): void {
  if (tz && tz !== zone) {
    zone = tz;
    fmtCache.clear();
  }
}

/** Sync from a hass object; cheap, call it from every hass setter. */
export function syncFarmTimeZone(hass: { config?: { time_zone?: string } } | undefined): void {
  setFarmTimeZone(hass?.config?.time_zone);
}

export function farmTimeZone(): string | undefined {
  return zone;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function fmt(opts: Intl.DateTimeFormatOptions, locale?: string): Intl.DateTimeFormat {
  const key = JSON.stringify([locale ?? "", opts]);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: zone });
    fmtCache.set(key, f);
  }
  return f;
}

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday, like Date.getDay() */
  weekday: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The farm's wall clock at `ms`. */
export function wallClock(ms: number): WallClock {
  const p: Record<string, string> = {};
  for (const { type, value } of fmt(
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
      hourCycle: "h23",
    },
    "en-US"
  ).formatToParts(ms))
    p[type] = value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
    weekday: WEEKDAYS.indexOf(p.weekday),
  };
}

/** Farm UTC offset (ms) at `ms`. */
function offsetAt(ms: number): number {
  const w = wallClock(ms);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** The instant of a farm wall-clock time (DST gaps resolve forward). */
export function fromWallClock(year: number, month: number, day: number, hour = 0, minute = 0): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - offsetAt(guess);
  return guess - offsetAt(first);
}

/** 00:00 farm time of the day containing `ms`. */
export function farmDayStart(ms: number): number {
  const w = wallClock(ms);
  return fromWallClock(w.year, w.month, w.day);
}

/** 00:00 farm time `n` days after the day containing `ms` (DST-safe). */
export function farmAddDays(ms: number, n: number): number {
  const w = wallClock(ms);
  const noon = Date.UTC(w.year, w.month - 1, w.day + n, 12);
  const d = new Date(noon);
  return fromWallClock(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Monday 00:00 farm time of the week containing `ms`. */
export function farmWeekStart(ms: number): number {
  return farmAddDays(ms, -((wallClock(ms).weekday + 6) % 7));
}

/** Hours since farm midnight, e.g. 5.5 for 05:30. */
export function farmHourOfDay(ms: number): number {
  const w = wallClock(ms);
  return w.hour + w.minute / 60;
}

/** toLocaleDateString in farm time. */
export function farmDate(ms: number, opts: Intl.DateTimeFormatOptions = {}): string {
  return fmt(opts).format(ms);
}

/** "05:00" in farm time. */
export function farmTime(ms: number): string {
  return fmt({ hour: "2-digit", minute: "2-digit" }).format(ms);
}
