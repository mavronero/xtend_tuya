# Layered architecture: valves and farm

Status: design proposal, 2026-09-24. Nothing is implemented yet.
Goal: textbook layering with no visible change. Everything prod depends on
stays byte-identical (see "Frozen surface").

Sources this design builds on:

- Tuya specs per product (`status_range`, `function`, `local_strategy`) in
  `tests/fixtures/*_devices.json.gz`
- Byte-level decoding: `~/Documents/work/irrigation-dp-decoding.md` (QT-08W) and
  `irrigation-t3-dp-decode.md` (QT-08W-T3)
- The QT-10W-T3 supplier spec (XLSX, 2026-08-17)
- The 2026-09-14 audit and incident history

## 1. Principles

These apply to every layer. Review checks them, and tests enforce them where
they can.

1. **Dependency rule.** Dependencies point down only. Upper layers reach lower
   ones through narrow, typed interfaces: `TuyaPort` and the HA contract. An
   import-boundary test fails the build when this is violated.
2. **Functional core, imperative shell.** Protocol knowledge (DP byte formats)
   and domain rules (runs, locations, balance) live in pure modules. These
   import neither HA nor the network, and are tested against captured real
   payloads. HA and cloud I/O stay in thin shells around them.
3. **Value objects.** Domain data are frozen dataclasses (`ValveRef`,
   `TimerSpec`, `TimerSlot`, `CommandResult`, `QuotaState`, `Capabilities`),
   never loose dicts.
4. **Expected failures are results, not exceptions.** Quota exceeded, offline,
   and unsupported all come back as `CommandResult`. Exceptions are for bugs.
5. **No module-level mutable state.** State belongs to one object per hub, held
   in `entry.runtime_data`. Today's globals (`LOCATION_MAP`, the quota lockout,
   `INSTANCES`, `_SCHEDULED`) go away.
6. **Single writer.** Every piece of state has exactly one writer. Everything
   else reads.
7. **Composition over inheritance.** Device differences come from
   declarative profiles and codecs. Today they come from inherited wrappers
   (T3 reuse via MRO) and ~84 inline `if _is_t3` branches.
8. **Strict typing** (mypy `--strict`) on all new packages. Ports are
   `Protocol`s, so tests can use fakes without monkeypatching.
9. **No speculative abstraction.** An interface exists only when it has at
   least two real implementations today: a real one and a test fake count.
   The local-LAN transport (§3) is named but not built.

## 2. Layers

```
L4  UI                frontend/: cards, dashboard strategy
L3  Farm domain       farm/: runs, location tree, pumps, balance, notifications, checks
──── HA contract: entities + services + CommandResult  (farm/contract.py) ────
L2  Valve drivers     entity_parser/valves/: profiles, codecs, timer state, driver
──── TuyaPort  (transport/port.py) ────
L1  Tuya transport    multi_manager/ (upstream) + transport/: accounts, spec merge,
                      hub ownership, quota counter, circuit breaker
```

| Layer | May import | Must not know |
|---|---|---|
| L1 | HA core, upstream libs | DP semantics, "valve", farm |
| L2 | L1 via `TuyaPort` only; HA entity base classes | locations, dashboard, notification policy |
| L3 | HA core; `farm/contract.py` names | Tuya, DPs, `MultiManager`, hubs |
| L4 | HA frontend APIs; L3/L2 endpoints and services | Python internals |

## 3. L1: Tuya transport

Upstream's `multi_manager/` stays the base. The fork's own additions move out
of it into `transport/`, which keeps our diff against upstream small.

```
transport/
  port.py      TuyaPort protocol + CloudTuyaPort (wraps MultiManager)
  quota.py     per-hub monthly controllable counter (from multi_manager/shared/quota.py)
  breaker.py   per-hub circuit breaker for Tuya error 60001001
```

```python
class TuyaPort(Protocol):                    # one instance per hub
    def device(self, device_id: str) -> DeviceSnapshot | None
    def owner_of(self, device_id: str) -> str | None
    async def send_dp(self, device_id: str, commands: list[DpCommand]) -> WriteResult
    async def cloud(self, method: str, path: str, body: object = None) -> CloudResult
    def quota(self) -> QuotaState

@dataclass(frozen=True)
class DeviceSnapshot:
    device_id: str; product_id: str; category: str; online: bool
    status: Mapping[str, object]       # copy; never the live dict
    spec: DeviceSpec                   # merged status_range/function (dpId, type, range, access)

@dataclass(frozen=True)
class QuotaState:
    used: int; limit: int
    counted: frozenset[str]            # already counted this month -> commanding again is free
    locked_until: datetime | None
    resets_on: date
```

Responsibilities, and the facts behind them:

- **Merging specs.** SmartLife sharing lists only DP 1 and DP 11 for the QT-08W.
  The full spec comes only from OpenAPI. L1 merges both, and L2 sees one
  `DeviceSpec`.
- **Hub ownership.** 81 devices are visible in both OpenAPI hubs. Each has
  exactly one owner, and only the owner's port serves it. This replaces the
  sticky-by-registry rule (4.4.234) and the cross-hub mirror guard (4.4.255).
- **Quota and breaker per hub.** Each OpenAPI project has its own quota.
  Today's module-global lockout wrongly blocks both hubs. The counting moves
  here from `note_cloud_write` and `_note_controllable_command`.
- **Operational prerequisite, documented but not in code:** the QT-08W-T3
  answers only in **DP instruction** mode (Tuya console, per product).
- **Settings.** Each hub gets its own `HubSettings` (§3.1). They are injected
  into the port and the driver.
- **Transport adapters.** Today there is one, `CloudTuyaPort`. A later
  `LocalTuyaPort` (LAN, local keys, **no quota**) would be a second adapter
  behind the same port, with no change in L2. It is not built (principle 9).
  The port is what makes it possible.

### 3.1 Hub settings (options flow)

Only the quota handling depends on the Tuya plan. Dual write, resync, and spec
merge reflect how the devices and the cloud behave, so they apply on every
plan.

| Mechanism | Depends on plan | Why |
|---|---|---|
| Quota counter / limit | yes | Trial: 10 controllable devices per month. Paid plans: more or unlimited |
| Circuit breaker (60001001) | indirectly | Fires only when the limit is hit. Stays armed on every plan: free when idle, protective otherwise |
| Cloud timer mirror | no | UX (SmartLife visibility). Its own option |
| Resync, spec merge | no | Device and cloud behaviour |

```python
@dataclass(frozen=True)
class HubSettings:                        # transport/settings.py: the ONLY reader of entry.options
    plan: Literal["trial", "paid", "custom"] = "trial"
    controllable_limit: int | None = 10   # None = unlimited
    cloud_timer_mirror: bool = True
```

- A step in the existing upstream options flow ("Configure"), one per hub.
- Defaults reproduce today's behaviour. A missing option means the default,
  so existing installs (prod) behave the same with no migration.
- Tuya offers no endpoint for plan or usage, so these settings are
  configured, not detected.
- Changing an option triggers an entry reload (standard update listener).
- Not configurable (principle 9): the breaker duration (6 h). Farm settings
  (watchdog threshold, notification channel, leak tolerance) belong in the
  farm's own options flow (L3).

## 4. L2: Valve drivers

### 4.1 Device types in the fleet

| Profile | product_id | Fleet | Tuya spec | Byte formats |
|---|---|---|---|---|
| QT-08W ("Valve Controller") | `o6dagifntoafakst` | 101 | fixtures: 32 status / 21 function | irrigation-dp-decoding.md |
| QT-08W-T3 | `rjnqkjk1pct15ku2` | 11 | fixtures: 31 / 28 | irrigation-t3-dp-decode.md |
| Smart Water Timer | `nxquc5lb` | 3 | fixtures: `switch`, `countdown`, `timer`, `cycle_timing`, `battery_percentage`, … | not decoded |
| Bluetooth Water Timer | `t2cak5zb` | 4 in HA (121 in the fleet) | fixtures, dpId 0 (BLE sub-device), CamelCase codes | not decoded |
| QT-10W-T3 gateway (future) | `si2az3qwxylq39ft` | 0 | XLSX | same family as T3 |

The plugin currently matches only on category `sfkzq` (`PRODUCT_ID` is defined
but unused). New rule: **profile by product_id.** An unknown product gets no
valve profile and falls back to the generic xtend entities, as it does today.

**Decided:** Smart Water Timer and BLE Water Timer get a *minimal read-only
profile* now. It has `Capabilities` plus a `DpMap` for verified DPs only, with
no codecs and no commands (the driver returns `unsupported`). Their generic
entities stay unchanged. This way L3 knows the capabilities of every valve
with no "no profile" special case.

- Smart Water Timer: `run_signal="switch"` (the watchdog already relies on
  it), `battery=True` (`battery_percentage`), no timers, no flow meter.
- BLE: `run_signal="none"`, everything else empty. `Flow`/`FlowCount`
  exist in the spec but have not been decoded; extend the profile once they
  are.

### 4.2 Package layout

```
entity_parser/valves/            (upstream plugin mechanism; replaces entity_parser/fdm5kw/)
  init.py                        plugin entry
  model.py                       ValveRef, Capabilities, TimerSpec, TimerSlot, CommandResult
  profiles.py                    ValveProfile + one instance per product; PROFILES by product_id
  codecs/                        pure, stdlib only
    time_task.py                 QT-08W 11-byte, T3 12-byte
    single_run.py                one_control (QT-08W), cyc_control_N (T3)
    t3_status.py                 sat_N (battery, sun flag, next run), flow_sta_N (volume + duration)
    counter_custom.py            QT-08W "dur,vol" / bare number; T3 CSV "mode,flag,dur,vol,ts", 0xFFFE sentinel
    run_times.py                 start_time / close_time
  specs/<product_id>.json        checked-in Tuya spec (from fixtures; never local keys)
  timer_state.py                 TimerState: single writer for slots
  driver.py                      ValveDriver(port, profile): the command side
  entities.py                    entity descriptors: read state, write nothing
  services.py                    HA service shims -> driver (names/schemas unchanged)
```

### 4.3 Profile (declarative) instead of branches

```python
@dataclass(frozen=True)
class Capabilities:
    channels: int                          # valves per device: 1; QT-10W: 4
    run_signal: Literal["switch", "counter", "none"]   # how a run shows up (T3: no switch during a run)
    flow_meter: FlowMeter | None           # QT-08W: Hall sensor, 2–25 L/min, stalls below 2
    single_run: frozenset[RunMode]         # QT-08W: duration (volume unverified); T3: duration only
    timers: TimerCaps | None               # slots, modes, cloud mirror yes/no
    battery: bool

@dataclass(frozen=True)
class ValveProfile:
    product_id: str
    capabilities: Capabilities
    dp: DpMap                              # semantic -> DP code per channel
    timer_codec: TimerCodec | None
    single_run_codec: SingleRunCodec | None
    last_run_codec: LastRunCodec | None
```

**Channel ≠ program.** On the T3, `_0.._3` are *program* channels, and only
`_0` is used (writes to `time_task_1` are ignored). On the QT-10W, `_0.._3` are
*valve* channels, and DP 102 `list` maps channel to valve. `DpMap` resolves
`(ValveRef.channel, meaning)` to a DP code per profile, so the driver never
sees suffixes.

`ValveRef = (device_id, channel)`. For all current profiles the channel is 0,
so the frozen entity/unique_id scheme stays unchanged.

### 4.4 Codecs: pure, tested against real captures

Every codec is `encode(value) -> bytes` / `decode(bytes) -> value`, and is
tested with the payloads captured in the decode docs. Examples:

- `time_task` QT-08W: byte[1] = enabled (not count), byte[10] = constant 1.
  Disabled slots stay in place (the 4.4.179 fix).
- `time_task_0` T3: 12 bytes `[00, index, b2, mode, value(4B BE), H, M, days(bit0=Mon), en]`.
  Only `time_task_0` accepts writes, as a sliding window.
- `one_control` QT-08W: `[lead=0, value(4B BE), flag]` for a duration run (lead=1 is
  ignored by the firmware: the 4.4.183 flood bug).
- `cyc_control_0` T3: `[00,00,value(4B BE),01,00,00,flag]`, where flag 1 = start and 0 = stop.
- `counter_custom` QT-08W: `"30,17"`, or a bare number (→ none). T3: CSV with
  sentinel 65534 = aborted.

A **spec conformance test** checks each profile's `DpMap` against
`specs/<product_id>.json`. It catches typos in DP codes (the product itself
spells DP 113 `sta_3`) and type mismatches before anything reaches a device.

### 4.5 Timer state: single writer

`TimerState` (one per valve) is the only thing that changes slots. It is fed
by (a) decoded DP reports and (b) the driver after a successful write.
Entities only read it. This replaces the path where `timer_service` writes into
`Fdm5kwTimerRegistryEntity.INSTANCES[id]._dpcode_wrapper.slots`, which led to
the slot collision (969) and the resync edge cases.

Persistence is unchanged: TimerState restores from the registry entity's last
state. A separate Store comes only if that proves insufficient.

**The device DP is the truth; the cloud registry is a mirror.** A disable in
SmartLife does not reach the device DP (live test 08-12: three valves watered
with cloud status=0).

### 4.6 Driver: the command side, and where the quota workarounds live

```python
class ValveDriver:
    def __init__(self, port: TuyaPort, profiles: Mapping[str, ValveProfile]) -> None
    async def set_timer(self, valve: ValveRef, spec: TimerSpec) -> CommandResult
    async def delete_timer(self, valve: ValveRef, slot: int) -> CommandResult
    async def start(self, valve: ValveRef, run: RunSpec) -> CommandResult
    async def stop(self, valve: ValveRef) -> CommandResult
    async def resync(self, valve: ValveRef) -> CommandResult

@dataclass(frozen=True)
class CommandResult:
    valve: ValveRef
    dp: Literal["ok", "failed", "unsupported"]        # device effect: fires or not
    cloud: Literal["ok", "skipped", "failed", "n/a"]  # SmartLife visibility
    reason: str | None                                # "quota_lockout", "offline", "unsupported_mode", ...
    retry_after: datetime | None
```

| Workaround today | After |
|---|---|
| Quota counter (`quota.py`, `note_cloud_write`) | L1 `transport/quota.py`, visible as `QuotaState` |
| Circuit breaker (module-global) | L1 `transport/breaker.py`, **per hub** |
| Dual write: DP + cloud timer | Driver: DP first, then cloud through the port. `CommandResult` carries both outcomes. **Decided:** the mirror stays, as `HubSettings.cloud_timer_mirror` (default on). Without it SmartLife would not show timers set in HA, and the drift check would flag all of them |
| Silently degrade to DP-only + persistent notification | L2 returns `cloud="skipped", reason="quota_lockout"`; **L3 decides** whether and how to notify |
| Resync from cloud | `ValveDriver.resync`, reading through `port.cloud("GET")`. It matches on top-level `time`+`loops`, because T3 app timers return `functions:[]` |
| Two OpenAPI projects | Config; unchanged |

The services (`xtend_tuya.fdm5kw_*`) keep their names and request schemas and
return `CommandResult` as an optional response. Existing callers (cards,
`prod_smoke`) see no difference.

## 5. L3: Farm domain

Phase 0 is only a move plus a boundary. The features come later.

```
farm/
  contract.py        the only names L3 may know (discovery, translation_keys, attrs, services)
  calendar.py  runs_store.py  irrigation_locations.py  location_model.py
  water_math.py      (copy; L2 has its own codec math)
  frontend.py
calendar.py          top-level shim (HA loads platforms from the integration root)
```

L3 reads `Capabilities`, exposed as registry entity attributes, and decides
with them:

- Watchdog coverage: `run_signal == "none"` means the valve cannot be watched.
- Leak balance: without a `flow_meter`, water is counted as "unmetered" instead
  of skewing the balance.
- Flow thresholds: min 2 L/min on the QT-08W.

Planned after the split, each building on L3 and the contract: the location
tree with `parent_id`, dated pump assignment with inheritance, a notification
store (whose sources include `CommandResult` and the checks), and the leak
balance (pump meter via long-term statistics vs. the sum of runs).

### Contract L2 → L3 (current state, frozen)

- Registry sensor `*_irrigation_timer_registry`, with attributes `device_id`,
  `valve_name`, `slots`, `valve_home`, `valve_room`, plus **new** `capabilities`
  (additive)
- Sibling entities by `translation_key`: `start_time`, `end_time`/`close_time`,
  `watering_volume`, `last_watering_run`, `valve`, `indexed_switch`, `battery`,
  `indexed_irrigation_duration`
- Device identifiers `(xtend_tuya, <tuya id>)` / `(tuya, <tuya id>)`
- Services `xtend_tuya.fdm5kw_*`; `GET /api/xtend_tuya/valve_locations`

**Known leaks:** `valve_home`, `valve_room`, `valve_name` and the `valve`
translation key exist for the dashboard. They stay until the farm layer moves
to its own repo (phase B). They are then replaced by generic device metadata
behind a deprecation period, because the saved prod dashboard reads them.

## 6. Frozen surface (byte-identical through every step)

- `/api/xtend_tuya/runs`: SquidWeb `ha_sync` cron, frozen contract
- `/api/xtend_tuya/{irrigation_locations,valve_locations,calendar/<id>.ics}`
- `/xtend_tuya_static/cards/*.js`: bootstrap and the SW-cached index
- Custom element names `irrigation-*` and their config keys: the saved static
  prod dashboard (425 KB)
- `calendar.irrigation_planned` / `calendar.irrigation_completed` plus their
  unique_ids
- `.storage` keys `xtend_tuya.irrigation_runs`, `xtend_tuya.irrigation_locations`,
  `xtend_tuya_quota_<entry>`
- All entity ids and unique_ids: the watchdog automation, `ha_sync` `/api/states`
- Service names and request schemas

## 7. Tests (pyramid)

| Level | What | Where |
|---|---|---|
| Unit, pure | codecs against captured payloads; location_model; water_math | `tests/unit/` |
| Conformance | profile `DpMap` ⊆ `specs/<pid>.json` (codes, types, access) | `tests/unit/` |
| Driver | `ValveDriver` against `FakeTuyaPort`: dual write, breaker, unsupported, offline | `tests/unit/` |
| Architecture | import boundaries per layer (AST scan) | `tests/unit/` |
| Contract | the entities and attributes L3 relies on exist for every profile (prod fixtures) | `tests/ha/` |
| Integration | real HA + fake cloud (existing harness) | `tests/ha/` |
| Golden snapshot | endpoints, calendar month, ICS, entity list + attrs, service list: diff vs baseline | dev HA, then prod |

Rule: tests import the real code. About 16 of the 25 standalone tests in
`tests/*.py` re-implement the logic they check ("mirror") instead of importing
it, so they stay green even when the code drifts. Each is converted in the step
that touches its code, and not before, to avoid doing the work twice:

| Step | Mirror tests → real imports into `tests/unit/` |
|---|---|
| 3 (farm) | none: `test_runs_store`, `test_location_model`, `test_water_math` already import |
| 4 (L1) | `test_quota_accounting`, `test_device_ownership`, `test_multimap_mirror_guard`, `test_master_map_registry`, `test_device_map_swap`, `test_device_object_identity`, `test_detached_device_build`, `test_device_deepcopy`, `test_dp_collapse_trace`, `test_runtime_data_lookup`, `test_background_load`, `test_entry_hygiene` |
| 5–7 (L2) | `test_resync_guard`, `test_last_report_ts`, `entity_parser/fdm5kw/test_t3_decode.py` (→ codec tests) |
| 8 | the rest (upstream transport fixes): `test_mq_supervisor`, `test_openapi_timeouts`, `test_sharing_api_retry`, `test_sharing_mq_overrides`, `test_smart_home_device_list_fallback`, `test_stall_sampler` |

The boundary test (`tests/unit/test_layer_boundaries.py`) is a ratchet. Its
`KNOWN_VIOLATIONS` lists every current violation (12 at step 1). It fails on a
new violation and also on a fixed one that is still listed, so the list only
ever shrinks.

## 8. Steps (each one is a release; one change per release)

| # | Step | Behaviour change | Proof |
|---|---|---|---|
| 1 | Test hygiene: remove the duplicate `test_irrigation_locations_seed_once_from_names`; add `tests/unit/` to pytest; boundary ratchet (12 known violations) | none (tests only) | pytest green |
| 2 | Golden snapshot tool `scripts/golden_snapshot.py` (capture/diff, `--at` pins all windows) | none (tooling) | dev and prod each captured twice: no difference; mutation check catches registry/card/service changes |
| 3 | Phase 0: `farm/` + `contract.py` (`discover_valves`, `device_identifiers`) + contract test | none | dev: snapshot diff empty (before/after with a restart in between), no errors; pytest 6 passed + 1 strict xfail |
| 3a | Fix: offline valves discovered (6b21fef3), released right after 3 | past runs of offline valves back in the calendar | dev diff: only additions |
| 4 | L1: `TuyaPort`, `transport/quota.py`, `transport/breaker.py` | breaker per hub | snapshot diff empty; driver/breaker unit tests |
| 4b | L1: `HubSettings` + options flow step (plan, limit, mirror) | new options; defaults = today | snapshot diff empty; options flow test; prod without options = unchanged |
| 5 | L2a: codecs out (pure) + `specs/` + conformance test; entities use the codecs | none | snapshot diff empty; codec tests on captures |
| 6 | L2b: profiles + `ValveDriver` on the port; services return `CommandResult` | optional response | snapshot diff empty; driver tests. **Prerequisite:** soak test of DP-only timers (below) |
| 7 | L2c: `TimerState` single writer | none intended | rehearsal on dev (set/delete/resync/SmartLife disable); highest risk |
| 8 | Boundary test without xfails; mypy strict green | none | CI |
| — | Farm features on L3 + contract | — | — |

The dev HA fake cloud (`onprem-staging/ha-dev`) patches
`MultiManager.setup_entry`. From step 4 on it can fake `TuyaPort` instead,
which is simpler.

## 9. Open questions

1. Hub ownership: explicit owner table (config) or a derived rule?
2. Retire core `tuya`: repoint the pump/tank automations first. Out of scope,
   but it removes the third copy.
3. **ICS feed: broken since it shipped, so nobody uses it** (found in step 2).
   `_validate_token` awaits `hass.auth.async_validate_access_token`, which is a
   *sync* `@callback`. The resulting TypeError is swallowed, so every request
   gets 401, including on prod. The golden snapshot records the status (401).
   Decide separately: remove the feed (recommended, since nobody noticed it
   was missing), or fix it in its own release. Not inside a refactor step.

6. ~~Offline valves are invisible to the farm layer~~. **Fixed** in commit
   6b21fef3, released on its own after step 3. `discover_valves` now resolves
   through entity registry → device registry. On prod this affected 32 of
   111 valves; their past runs are back in the calendar. "Valves without
   location" stays online-only. Offline valves get their own group together
   with Simon's online/offline filter (L4, later).
7. `dev_reg.async_get_device(identifiers=…)` is deprecated and stops working
   in **HA 2027.8** (contract.py, calendar, irrigation_locations). Switch to
   `async_get_device_by_identifier` along with the fix in item 6.

## 10. Soak test: DP-only timers (before step 6, prod action, needs approval)

DP-only is already the fallback whenever the quota breaker has tripped. The
63 s test (2026-06-05, 809) is too thin to rely on.

- One T3 (706) and one QT-08W. Set a DP-only timer about 60 min ahead, keep
  SmartLife open in the foreground, and check that the device fires
  (`counter_custom` / runs).
- If it fails, then while the breaker is tripped L3 has to report "timer not
  guaranteed", not only "not visible in SmartLife".
