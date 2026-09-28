// Timeline rows: one per metering point, runs attributed by the dated assignment.
// Run: node --experimental-strip-types tests/test_timeline_rows.mjs
import assert from "node:assert/strict";
import { timelineRows, NO_MP_GROUP } from "../frontend/src/farm/timeline-rows.ts";
import { EMPTY_FARM_DATA } from "../frontend/src/farm/data.ts";

const H = 3_600_000;
const t = (h) => Date.UTC(2026, 8, 26, h); // 26 Sep, hours UTC
const iso = (ms) => new Date(ms).toISOString();

const valve = (id, name) => ({ device_id: id, registry_entity: `sensor.${id}_reg`, valve_name: name });
const ev = (id, h) => ({ key: `sensor.${id}_reg`, start: t(h), end: t(h) + H / 6, kind: "ran" });

// FG Carob Bed: 977 until 12:39, then 712 until 14:31, then empty (26 Sep, UTC).
// 977 has been removed from Tuya: HA no longer knows it, only its stored runs.
const carob = {
  id: "carob", name: "FG Carob Bed", site_id: "garden", valves: [], expected_lpm: null, description: "", pump: null,
  assignments: [
    { device_id: "v977", begin: t(0) - 90 * 24 * H, end: t(12) + 39 * 60_000 },
    { device_id: "v712", begin: t(14) + 15 * 60_000, end: t(14) + 31 * 60_000 },
  ],
};
const east08 = {
  id: "east08", name: "FF East Verbs 08", site_id: "east", valves: ["v712"], expected_lpm: null, description: "", pump: null,
  assignments: [{ device_id: "v712", begin: t(14) + 32 * 60_000, end: null }],
};
const data = {
  ...EMPTY_FARM_DATA,
  sites: [
    { id: "garden", name: "Farmhouse Garden", parent_id: null },
    { id: "east", name: "FF East", parent_id: null },
  ],
  locations: [carob, east08],
  locationOf: { v712: east08 },
  runs: [
    { device_id: "v977", start: iso(t(7)), end: iso(t(7) + H / 6), duration_seconds: 600, liters: 0 },
    { device_id: "v712", start: iso(t(14) + 20 * 60_000), end: iso(t(14) + 25 * 60_000), duration_seconds: 300, liters: 2 },
  ],
};
const valves = [valve("v712", "FF East Verbs 08 (712)"), valve("v711", "FG Carob bed 711")];
const events = [
  { ...ev("v712", 14), start: t(14) + 20 * 60_000 }, // while at FG Carob Bed
  { ...ev("v712", 15), start: t(15) }, // after the move to FF East Verbs 08
  ev("v711", 14), // 711 never had a metering point
];
const retired = (r, mp) => ({ key: `retired:${r.device_id}`, start: Date.parse(r.start), end: Date.parse(r.end), kind: "ran", mp: mp.id });
const rows = timelineRows(valves, events, data, retired, [t(0), t(24)], { site: null, search: "" });
const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

// History stays on the place: 977's removed-valve run and 712's first run on FG Carob Bed.
assert.deepEqual(byName["FG Carob Bed"].evs.map((e) => e.key), ["sensor.v712_reg", "retired:v977"]);
assert.equal(byName["FG Carob Bed"].valve, null); // no valve there now
assert.equal(byName["FG Carob Bed"].group, "Farmhouse Garden");
// 712's later run goes to where it was then; the row shows 712 as its valve now.
assert.deepEqual(byName["FF East Verbs 08"].evs.map((e) => e.start), [t(15)]);
assert.equal(byName["FF East Verbs 08"].valve.device_id, "v712");
// A valve without a metering point keeps its own row.
assert.equal(byName["FG Carob bed 711"].group, NO_MP_GROUP);
assert.equal(byName["FG Carob bed 711"].evs.length, 1);
// Sites by name, the catch-all groups last.
assert.deepEqual(rows.map((r) => r.group), ["Farmhouse Garden", "FF East", NO_MP_GROUP]);

// Site filter keeps only that subtree; valves without a point drop out, as before.
assert.deepEqual(
  timelineRows(valves, events, data, retired, [t(0), t(24)], { site: "garden", search: "" }).map((r) => r.name),
  ["FG Carob Bed"]
);
// Search matches the point, its valve now, or the group.
assert.deepEqual(
  timelineRows(valves, events, data, retired, [t(0), t(24)], { site: null, search: "712" }).map((r) => r.name),
  ["FF East Verbs 08"]
);
// A removed valve's run outside the window is not drawn.
assert.equal(
  timelineRows(valves, events, data, retired, [t(8), t(24)], { site: null, search: "" }).find((r) => r.name === "FG Carob Bed").evs.length,
  1
);

console.log("ok: timeline rows follow the metering point");
