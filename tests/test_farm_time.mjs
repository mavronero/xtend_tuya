// Farm-time helpers: times show in the farm's zone, not the viewer's.
// Run: node --experimental-strip-types tests/test_farm_time.mjs
import assert from "node:assert/strict";
import {
  setFarmTimeZone,
  wallClock,
  farmDayStart,
  farmAddDays,
  farmWeekStart,
  farmHourOfDay,
  fromWallClock,
} from "../frontend/src/components/farm-time.ts";

setFarmTimeZone("Asia/Nicosia");
// 05:00 Nicosia (UTC+3 in September) = 02:00 UTC — a Berlin browser would say 04:00.
const run = Date.UTC(2026, 8, 25, 2, 0);
const w = wallClock(run);
assert.deepEqual([w.year, w.month, w.day, w.hour, w.minute, w.weekday], [2026, 9, 25, 5, 0, 5]);
assert.equal(farmHourOfDay(run), 5);
assert.equal(fromWallClock(2026, 9, 25, 5, 0), run);
assert.equal(farmDayStart(run), Date.UTC(2026, 8, 24, 21, 0));
// 01:30 farm time is still the 25th although UTC says the 24th
assert.equal(farmDayStart(Date.UTC(2026, 8, 24, 22, 30)), Date.UTC(2026, 8, 24, 21, 0));
assert.equal(farmAddDays(run, 1), Date.UTC(2026, 8, 25, 21, 0));
assert.equal(farmWeekStart(run), Date.UTC(2026, 8, 20, 21, 0)); // Mon 21 Sept 00:00
// DST end (Cyprus, 25 Oct 2026 04:00 → 03:00): the day is 25 h, next midnight is UTC+2
assert.equal(farmAddDays(Date.UTC(2026, 9, 25, 6), 1), Date.UTC(2026, 9, 25, 22, 0));
console.log("ok");
