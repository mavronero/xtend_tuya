/** Lane packing for the irrigation calendar grid (pure, testable).
 *
 * Events in one day column are laid out side by side when they overlap in
 * time. Greedy: sort by start, then planned before completed (Simon's
 * "planned always before completed" ask), then name; each event takes the
 * first lane whose previous occupant ended at or before its start.
 */

/** One block on the grid. After pairing, a planned slot that ran is ONE
 * event ("ran": drawn at the actual run times, plan kept in planStart/End),
 * so the eye never has to match a ghost to a bar. */
export type Kind = "planned" | "ran" | "missed" | "unplanned" | "running";

export interface LaneEvent {
  start: number; // ms
  end: number; // ms
  kind: Kind;
  name: string;
}

export interface Placed<T extends LaneEvent> {
  ev: T;
  lane: number;
  lanes: number; // total lanes in this event's overlap cluster
}

const KIND_ORDER: Record<Kind, number> = {
  planned: 0,
  missed: 0,
  ran: 1,
  unplanned: 1,
  running: 1,
};

export function packLanes<T extends LaneEvent>(events: T[]): Placed<T>[] {
  const sorted = [...events].sort(
    (a, b) =>
      a.start - b.start ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.name.localeCompare(b.name)
  );
  const out: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = -Infinity;
  const closeCluster = () => {
    const n = laneEnds.length;
    for (const p of cluster) p.lanes = n;
    cluster = [];
    laneEnds = [];
  };
  for (const ev of sorted) {
    if (ev.start >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((end) => end <= ev.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(ev.end);
    } else {
      laneEnds[lane] = ev.end;
    }
    const p: Placed<T> = { ev, lane, lanes: 0 };
    cluster.push(p);
    out.push(p);
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  closeCluster();
  return out;
}

export interface Pairable extends LaneEvent {
  key: string; // valve identity
  liters?: number | null;
  summary?: string;
  planStart?: number;
  planEnd?: number;
}

/** Pair planned slots with actual runs of the same valve (closest start
 * within `tolMs`, each run used once). Returns one event per outcome:
 *   planned   — slot still ahead (or within tolerance of now)
 *   ran       — slot ran: drawn at the run's times, plan kept alongside
 *   missed    — slot ended in the past and nothing ran
 *   unplanned — run with no slot near it
 *   running   — an open run (kept as is) */
export function pairPlanRuns<T extends Pairable>(
  plans: T[],
  runs: T[],
  nowMs: number,
  tolMs = 15 * 60 * 1000
): T[] {
  const used = new Set<T>();
  const out: T[] = [];
  for (const plan of [...plans].sort((a, b) => a.start - b.start)) {
    let best: T | null = null;
    for (const run of runs) {
      if (used.has(run) || run.key !== plan.key) continue;
      const d = Math.abs(run.start - plan.start);
      if (d <= tolMs && (!best || d < Math.abs(best.start - plan.start))) best = run;
    }
    if (best) {
      used.add(best);
      out.push({
        ...best,
        kind: best.kind === "running" ? "running" : "ran",
        planStart: plan.start,
        planEnd: plan.end,
        summary: `${best.summary ?? ""}
planned ${plan.summary ?? ""}`,
      });
    } else if (plan.end + tolMs < nowMs) {
      out.push({ ...plan, kind: "missed" });
    } else {
      out.push(plan);
    }
  }
  for (const run of runs) {
    if (used.has(run)) continue;
    out.push(run.kind === "running" ? run : { ...run, kind: "unplanned" });
  }
  return out;
}

/** One entry of HA's history API (minimal_response): state and when it began. */
export interface HistoryPoint {
  state: string;
  last_changed: string;
}

const OFFLINE_STATES = new Set(["unavailable", "unknown"]);

/** Offline stretches [start, end] within [from, to] from an entity's
 * history: every period its state was unavailable or unknown. The first
 * point is the state at `from` (HA includes it). */
export function offlineSpans(points: HistoryPoint[], from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  points.forEach((p, i) => {
    if (!OFFLINE_STATES.has(p.state)) return;
    const start = Math.max(from, Date.parse(p.last_changed));
    const next = points[i + 1];
    const end = Math.min(to, next ? Date.parse(next.last_changed) : to);
    if (end <= start) return;
    const last = out[out.length - 1];
    if (last && last[1] >= start) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  });
  return out;
}
