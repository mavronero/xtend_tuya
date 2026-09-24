// Lane packing + plan/run pairing for the irrigation calendar card.
// Run: node --experimental-strip-types tests/test_calendar_lanes.mjs
import assert from "node:assert/strict";
import { packLanes, pairPlanRuns, offlineSpans } from "../frontend/src/calendar-lanes.ts";

const M = 60_000;
const ev = (start, end, kind, name, key = name) => ({ start: start * M, end: end * M, kind, name, key });

// Overlapping trio takes 3 lanes; a later lone event gets its own cluster.
let placed = packLanes([
  ev(0, 10, "ran", "b"),
  ev(0, 10, "planned", "b"),
  ev(5, 15, "planned", "a"),
  ev(30, 40, "planned", "z"),
]);
assert.deepEqual(
  placed.map((p) => [p.ev.name, p.ev.kind, p.lane, p.lanes]),
  [
    ["b", "planned", 0, 3], // planned before ran at the same start
    ["b", "ran", 1, 3],
    ["a", "planned", 2, 3],
    ["z", "planned", 0, 1],
  ]
);

// Back-to-back events reuse the lane (end <= start).
placed = packLanes([ev(0, 10, "planned", "a"), ev(10, 20, "planned", "b")]);
assert.deepEqual(placed.map((p) => p.lane), [0, 0]);

// Pairing: v1 ran 2 min late → one "ran" block at the run's times with the plan kept;
// v1's second slot missed; v2's slot still ahead; v3 ran without a plan.
const now = 100 * M;
const plans = [ev(10, 20, "planned", "v1"), ev(40, 50, "planned", "v1"), ev(120, 130, "planned", "v2")];
const runs = [ev(12, 22, "ran", "v1"), ev(60, 65, "ran", "v3")];
const paired = pairPlanRuns(plans, runs, now).map((e) => [e.key, e.kind, e.start / M, e.planStart == null ? null : e.planStart / M]);
assert.deepEqual(paired, [
  ["v1", "ran", 12, 10],
  ["v1", "missed", 40, null],
  ["v2", "planned", 120, null],
  ["v3", "unplanned", 60, null],
]);
// A slot that just ended stays "planned" for the tolerance window (run may still land).
assert.equal(pairPlanRuns([ev(85, 95, "planned", "v9")], [], now)[0].kind, "planned");
// An open run keeps "running" whether paired or not.
assert.equal(pairPlanRuns([ev(10, 20, "planned", "v1")], [ev(11, 25, "running", "v1")], now)[0].kind, "running");

// Offline stretches from registry-sensor history (Timeline view).
{
  const t = (h) => new Date(Date.UTC(2026, 8, 24, h)).toISOString();
  const at = (h) => Date.parse(t(h));
  const pts = [
    { state: "unavailable", last_changed: t(0) }, // state at the range start
    { state: "1", last_changed: t(2) },
    { state: "unknown", last_changed: t(5) },
    { state: "unavailable", last_changed: t(6) }, // joins the stretch before
    { state: "2", last_changed: t(8) },
    { state: "unavailable", last_changed: t(22) }, // runs to the range end
  ];
  assert.deepEqual(offlineSpans(pts, at(1), at(23)), [
    [at(1), at(2)],
    [at(5), at(8)],
    [at(22), at(23)],
  ]);
  assert.deepEqual(offlineSpans([{ state: "1", last_changed: t(0) }], at(1), at(23)), []);
}

console.log("ok calendar lanes");
