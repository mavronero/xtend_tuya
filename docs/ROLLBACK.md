# Prod rollback and deploy discipline (mavronero/xtend_tuya)

Rule since 2026-09-16: **symptoms after an update → roll back first, debug second.**
Rollback is 5 minutes. Debugging while manual watering is dead cost 3 hours.

## Last known good
Whoever deploys writes the previous version here before updating.

| date | deployed | previous (rollback target) | smoke |
|---|---|---|---|
| 2026-09-16 | 4.4.255 | 4.4.250 (251–254 collapse the device map) | ok, canary 824 watered |

## Rollback (HACS, ~5 min)
1. HA → HACS → Xtend Tuya → ⋮ → **Redownload** → pick the rollback version → Download.
   From a console instead: `hass.callWS({type:'hacs/repository/download', repository:'1206944093', version:'v4.4.250'})`.
2. Settings → System → **Restart Home Assistant** (a real restart; a "quick reload" does not re-import).
3. Wait for both hubs to load (~2 min), then run the smoke check (below). Version on the
   integration page must show the rollback version — if not, it was a soft restart, restart again.
4. Tell Simon. Then debug on the branch, not on prod.

## Deploy checklist
- Before tagging: `.venv-test/bin/pytest` (real-HA harness, `tests/ha/README.md`) and the
  standalone checks `for t in tests/test_*.py; do python3 $t; done`. All green or no release.
- One change per release. 4.4.251 was 45 files from four audit streams; nobody could bisect it.
- Deploy only when you can watch the next 15 minutes. Not last thing in the evening, not right
  before Simon's 06:00 round.
- After restart: `HA_TOKEN=… python3 scripts/prod_smoke.py --expect <version> [--water]`
  (or paste `scripts/prod_smoke.js` into the prod tab's console). Must print `SMOKE OK`.
- Card bundle changes additionally need "Re-sync valves" on the dashboard.
- Update the table above.

## What the smoke check guards against (all real incidents)
- entry never reaches `loaded` (4.4.249 proxy cancel, 4.4.251 NamedTuple crash)
- version on disk ≠ loaded (HACS desync / soft restart)
- device map DP-collapsed: QT-08W < 20 functions, T3 without `time_task_0`/`cyc_control_0`
  (4.4.251–254 cross-hub mirror, the Aug 2026 relapses)
- valves all unavailable (token / MQ outage)
- `--water`: a real 10 s run on OF Verbs (824), switch must go on then off
