/** Lane packing for the irrigation calendar grid (pure, testable).
 *
 * Events in one day column are laid out side by side when they overlap in
 * time. Greedy: sort by start, then planned before completed (Simon's
 * "planned always before completed" ask), then name; each event takes the
 * first lane whose previous occupant ended at or before its start.
 */

export interface LaneEvent {
  start: number; // ms
  end: number; // ms
  kind: "planned" | "completed" | "running" | "missed";
  name: string;
}

export interface Placed<T extends LaneEvent> {
  ev: T;
  lane: number;
  lanes: number; // total lanes in this event's overlap cluster
}

const KIND_ORDER: Record<LaneEvent["kind"], number> = {
  planned: 0,
  missed: 0,
  running: 1,
  completed: 1,
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

/** A planned slot counts as missed when it ended in the past and no run of
 * the same valve started within `tolMs` of its start. */
export function isMissed(
  planned: { start: number; end: number; key: string },
  runs: { start: number; key: string }[],
  nowMs: number,
  tolMs = 15 * 60 * 1000
): boolean {
  if (planned.end > nowMs) return false;
  return !runs.some(
    (r) => r.key === planned.key && Math.abs(r.start - planned.start) <= tolMs
  );
}
