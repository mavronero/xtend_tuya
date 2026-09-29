// Valve page watering log: follows the metering point across valve swaps.
// Run: node --experimental-strip-types tests/test_run_log.mjs
import assert from "node:assert/strict";
import { logRuns, runLpm } from "../frontend/src/farm/run-log.ts";

const H = 3_600_000;
const now = Date.UTC(2026, 8, 24, 12);
const iso = (ms) => new Date(ms).toISOString();
const run = (id, startMs, min, liters) => ({
  device_id: id,
  start: iso(startMs),
  end: iso(startMs + min * 60_000),
  duration_seconds: min * 60,
  liters,
});

// 712 served the bed until 48 h ago, then 713 replaced it; 712 moved to "other".
const swap = now - 48 * H;
const bed = {
  id: "bed",
  name: "FG Carob Bed",
  site_id: null,
  valves: ["713"],
  assignments: [
    { device_id: "712", begin: null, end: swap },
    { device_id: "713", begin: swap, end: null },
  ],
};
const other = { id: "other", name: "Other", site_id: null, valves: ["712"], assignments: [{ device_id: "712", begin: swap, end: null }] };
const data = {
  runs: [
    run("712", now - 72 * H, 10, 100), // at the bed
    run("712", now - 24 * H, 10, 80), // at "other" now
    run("713", now - 6 * H, 5, 60), // at the bed
    run("999", now - 6 * H, 5, 0), // no metering point
  ],
  planned: [],
  locations: [bed, other],
  locationOf: { 713: bed, 712: other },
};

const log = logRuns(data, "713");
assert.equal(log.mp.id, "bed");
assert.deepEqual(log.runs.map((r) => r.device_id), ["712", "713"]);
assert.equal(logRuns(data, "712").runs.length, 1, "712's log is its current point's");

const own = logRuns(data, "999");
assert.equal(own.mp, null);
assert.deepEqual(own.runs.map((r) => r.device_id), ["999"]);

assert.equal(runLpm(run("x", now, 10, 100)), 10);
assert.equal(runLpm(run("x", now, 10, 0)), null, "dry run");
assert.equal(runLpm(run("x", now, 10, null)), null, "unmetered");
assert.equal(runLpm({ ...run("x", now, 1, 5), duration_seconds: 30 }), null, "under a minute");

console.log("run log ok");
