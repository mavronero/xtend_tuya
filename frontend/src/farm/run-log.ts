/** A valve page's watering log (pure). Like the Timeline, it follows the
 * metering point: a valve at one lists every run made there, whichever
 * valve made it (the point it was assigned to when the run started), so the
 * log survives valve swaps. A valve without one lists its own runs. */

import { mpAt, type FarmData, type MeteringPoint, type Run } from "./data.ts";

export function logRuns(data: FarmData, device: string): { mp: MeteringPoint | null; runs: Run[] } {
  const mp = data.locationOf[device] ?? null;
  const runs = mp
    ? data.runs.filter((r) => mpAt(data, r.device_id, Date.parse(r.start))?.id === mp.id)
    : data.runs.filter((r) => r.device_id === device);
  return { mp, runs };
}

/** Mean flow of a run; null when it measured no water or ran under a minute. */
export function runLpm(r: Run): number | null {
  const min = (r.duration_seconds ?? 0) / 60;
  return typeof r.liters === "number" && r.liters > 0 && min >= 1 ? r.liters / min : null;
}
