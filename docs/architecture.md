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
   import-boundary test fails the build when this is violated. Two
   exemptions: the composition root (`__init__.py`) wires the layers and may
   import each layer's entry point. Type-only imports (`if TYPE_CHECKING:`)
   are not a runtime dependency; L2 entities are handed `XTDevice` /
   `MultiManager` by the upstream entity factory and may name those types,
   but may not call into them.
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
L3  Farm domain       farm/: runs, sites + metering points, pumps, balance, notifications, checks
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
    def quota(self) -> QuotaState          # deferred until L3 needs it (principle 9)

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
entity_parser/valves/            (upstream plugin mechanism; was entity_parser/fdm5kw/, renamed in step 6a)
  init.py                        plugin entry
  model.py                       ValveRef, Capabilities, TimerSpec, TimerSlot, CommandResult
  profiles.py                    ValveProfile + one instance per product; PROFILES by product_id
  codecs/                        pure, stdlib only
    time_task.py                 QT-08W 11-byte, T3 12-byte
    single_run.py                one_control (QT-08W), cyc_control_N (T3)
    t3_status.py                 sat_N (battery, sun flag, next run), flow_sta_N (volume + duration)
    counter_custom.py            QT-08W "dur,vol" / bare number; T3 CSV "mode,flag,dur,vol,ts", 0xFFFE sentinel
    run_times.py                 start_time / close_time
  timer_state.py                 TimerState: single writer for slots; per-hass registry of live states
  driver.py                      target(hass, device_id) -> (port, profile) | CommandResult
  timer_service.py               set / delete / resync timers (the command side)
  control_service.py             start / stop single runs
  sensor.py                      entity descriptors + DP wrappers (read side)
  services.py                    service names/schemas, registered via get_services()
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

A **spec conformance test** checks each profile's `DpMap` against the
product's real Tuya spec, which is already in the prod fixtures (no copied
spec files). In the specs the byte DPs are typed `String`, not `Raw` (DP
instruction mode), so the test checks existence and direction (read = in the
status spec, write = a writable function). It catches typos in DP codes (the product itself
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

As built in step 6, the command side is two modules of functions rather than
a `ValveDriver` class. Their only shared state is the port and profile that
`target()` resolves per call, so a class would add nothing (principle 9).

```python
def target(hass, device_id) -> Target | CommandResult      # Target = (port, profile)
async def set_timer(hass, data) -> CommandResult            # timer_service.py
async def delete_timer(hass, data) -> CommandResult
async def resync_from_cloud(hass, data) -> dict             # rich counts, unchanged
async def start_watering(hass, data) -> CommandResult       # control_service.py
async def stop_watering(hass, data) -> CommandResult

@dataclass(frozen=True)
class CommandResult:
    device_id: str                                    # ValveRef(device, channel) arrives with the QT-10W
    dp: Literal["ok", "failed", "unsupported"]        # device effect: fires or not
    cloud: Literal["ok", "skipped", "failed", "n/a"]  # SmartLife visibility
    reason: str | None                                # "quota_lockout", "mirror_disabled", "no_timers", ...
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

L3 will read `Capabilities` and decide with them. Exposing them (attribute or
endpoint) is deferred until the first L3 consumer exists: the Smart Water
Timer and BLE have no registry sensor to carry an attribute, so the right
channel depends on that consumer. Uses:

- Watchdog coverage: `run_signal == "none"` means the valve cannot be watched.
- Leak balance: without a `flow_meter`, water is counted as "unmetered" instead
  of skewing the balance.
- Flow thresholds: min 2 L/min on the QT-08W.

Planned after the split, each building on L3 and the contract. The farm
model was decided with the PO on 2026-09-24:

```
Site                                   Metering point (MP, "location" in the API)
  id, name                               id, name
  parent_site_id?  -> tree               site_id  -> exactly one site
  pump (dated, optional)                 pump (dated, optional, overrides the site's)
                                         valve: at most ONE at a time (dated history)
```

- **Filtering by a site includes its whole subtree.** "Big Farm" also returns
  the MPs of FF East.
- **Pump resolution:** the MP's own pump first, then its site's, then up
  through the parent sites.
- **Valve exchange:** assigning valve B to an MP that holds valve A ends A's
  assignment and opens B's. A then has no MP. A valve can only have one MP,
  so B's previous assignment ends too (already true today).
- **Metering data belongs to the MP, not to the valve.** Runs are stored per
  valve and attributed to an MP through the dated assignments
  (`location_for_run`). This already works that way.
- **Naming:** the UI and the code say "metering point" and "site". The API keeps
  `irrigation_locations` and `location_id` / `location` in `/runs`, which is
  the frozen `ha_sync` contract. Those names only change together with the
  backend.
- **Spatial data (PO, 2026-09-24):** sites and MPs will carry geometry so
  they can be drawn on a map. Store it as an optional **GeoJSON geometry**
  (RFC 7946, WGS84 lon/lat) per object: usually a `Point` for an MP, and a
  `Polygon` / `MultiPolygon` for a site (a site may also have a `Point`, e.g.
  as its label position). GeoJSON is the format maps (Leaflet, HA map, QGIS)
  and PostGIS read directly. MPs already have `lat` / `lon` today; they become
  a `Point`, and the API keeps `lat` / `lon` as fields derived from the Point
  for compatibility. Nothing is built until a map view is planned
  (principle 9). Only the storage shape is decided now, so the site model
  does not have to be migrated a second time.
- **Migration:** add `site_id`, and enforce one valve per MP. On prod
  (2026-09-24) one of 76 locations breaks that rule: "FG Fig Trees" has both
  968 and 803 open. Simon decides whether to split it into two MPs.

Also planned: a notification
store (whose sources include `CommandResult` and the checks), and the leak
balance (pump meter via long-term statistics vs. the sum of runs).

### 5.1 Farm model: storage, API, migration (groundwork for the UI)

Designed 2026-09-24, before the UI rework (views: Overview/Valves,
Sites, Calendar, ...). Everything stays in the existing store
`xtend_tuya.irrigation_locations` (the key is frozen) and in
`location_model.py` (pure stdlib, tested without HA).

**Storage (store version 1 → 2, migrated in `Store._async_migrate_func`):**

```
data = {
  "sites":     {id: {id, name, parent_id | None, geometry | None, created}},
  "locations": {id: {id, name, site_id | None, description, expected_lpm,
                     geometry | None, aliases, created}},       # = metering points
  "assignments":      [{location_id, device_id, begin, end, source}],   # unchanged
  "pumps":     {id: {id, name, meter_entity, created}},
  "pump_assignments": [{pump_id, target_kind: "site" | "location",
                        target_id, begin, end}],
}
```

- `geometry` is a GeoJSON geometry object. The migration turns today's
  `lat` / `lon` into a `Point`; the API keeps returning `lat` / `lon`,
  derived from that Point.
- `site_id` stays nullable: an MP without a site shows up under "No site".
  The migration fills it wherever the seed can (see below).
- `parent_id` must not create a cycle; that is checked in `update_site`.
- A pump is a meter entity (m³ total, e.g.
  `sensor.big_farm_1_fct_total_delivered_flow_mc`), nothing more for now.
  Pump assignments are dated like valve assignments. Resolving the pump for an
  MP at time t: the MP's own open assignment at t, else its site's, else up
  the parent chain.

**Rules enforced in `location_model.py`:**

- `assign_device(device, mp)`: the MP's currently open valve, if it is
  another one, is closed at `now` (valve exchange). The valve's own previous
  MP is closed too (as today).
- Existing double assignments (FG Fig Trees: 968 + 803) are left alone by
  the migration. The rule only acts on new assignments. Simon decides whether
  to split the MP.
- Deleting a site or MP is not offered. Ending assignments is; empty sites
  can be deleted. Nothing with history is ever deleted.

**API (additive on `/api/xtend_tuya/irrigation_locations`):**

- GET adds `sites` (flat list with `parent_id`; the cards build the tree),
  `pumps`, plus `site_id` and `pump` (resolved now, with `inherited_from`)
  per location.
- POST adds the actions `create_site`, `update_site` (name, parent_id),
  `delete_site` (empty only: no child sites, no MPs, no pump history),
  `set_location_site`, `create_pump`, `assign_pump` / `end_pump_assignment`.
  Geometry is stored but not editable yet (no map view is planned); an MP's
  `lat` / `lon` edit writes its Point.
- `/runs` (the `ha_sync` contract) is untouched. Adding `site_id` there waits
  for the backend.

**Seed (one time):**

- One site per Tuya room of the MP's open valve (from `valve_room`). On prod
  (2026-09-24) that gives 10 sites for 76 MPs, and no MP spans two rooms:
  Big Farm (4), FF East (19), FF West (18), Farmhouse Farm (5),
  Farmhouse Garden (13), Flatland+Citrus (3), Honeymoon (7),
  Olive Terrace (3), RT+FV (Big Farm) (1), Workshop Trees (3).
- The tree (e.g. FF East and FF West under Big Farm) and the pumps are not
  guessed. They are set by hand in the Sites view.
- `valve_room` is only known once the home walk has run, so the seed runs
  on the first locations GET or 15-minute re-arm that sees a room, not in
  the migration. An MP whose valve has no room keeps `site_id` None. Dev has
  no rooms (fake cloud, no OpenAPI uid), so the seed is covered by the unit
  test and checked on prod after the release.

### 5.2 Dashboard delivery: one valve view (2026-09-24)

The strategy no longer generates one view per valve. There is a single
hidden subview `valve` (panel) with `custom:irrigation-valve-detail-card`,
which shows the valve named in the URL (`valve?id=<tuya id>`) with the same
three columns as before (`buildValveView`). The header keeps only the main
sections (Overview, Locations, Calendar, ...); a valve is opened by tapping
it, and the back arrow returns. Every link goes through `view_path`.

On dev (112 valves) the saved config shrinks from 400 KB to 113 KB. A valve
opens in about 0.3 s after a reload and switches in about 0.1 s. The saved
prod dashboard keeps its per-valve views until it is re-synced: all old
card types stay defined, so nothing breaks before that.

### 5.3 Pumps (2026-09-24)

A pump is a farm record, not an HA entity: `{name, meter_entity,
flow_entity?, pressure_entity?, status_entity?}`, the entity ids of whatever
integration measures it (on prod DAB Pumps / Esybox Mini 3: `…_fct_total_
delivered_flow_mc` m³ total, `…_vf_flowliter` L/min, `…_vp_pressurebar`,
`…_pumpstatus`). The farm layer never talks to that integration: live
values come from `hass.states`, history from the recorder's long-term
statistics (`GET /api/xtend_tuya/pump_stats`, hourly, 31 days max, cached
5 min, only the entities stored on pumps and metered connections).

- **Feeds** are derived, never stored per valve: MP's own pump assignment,
  else its site's, else up the parent sites (dated assignments; the tree
  as it is now). The first pump a site or MP gets holds since forever, a
  change is dated.
- **Connected devices** (`pump_connections`, dated): any HA device, role
  `consumer` (uses the water; one pump at a time; optional meter counts in
  the balance) or `monitor` (pressure, tank level; any number of pumps).
  Valves are not connectable: they reach a pump only through their MP.
- **Balance** over a range: pump delivered = valves (runs of the MPs it fed
  when each run ended) + metered consumers + unaccounted. Pumps also fill
  tanks and taps, so unaccounted is never zero; its size and trend are the
  leak signal.
- Pumps view (`custom:irrigation-pumps-card`): list with live status,
  figures, balance tiles, chart (24 h / 7 d / 30 d), feeds, connected
  devices; Edit creates a pump from an HA device (entities prefilled by
  name), assigns it, connects devices.

### 5.4 Planned: an Irrigation panel

HA's sidebar has no submenus. Instead of Lovelace views (sidebar → header
tabs → site tree), the integration will register one `panel_custom`
"Irrigation" with its own navigation rail: Valves, Sites (the tree),
Pumps, Calendar, Timeline, Flow. The cards are already self-contained, so
the panel is a router around them. It removes the saved dashboard config
and "Re-sync valves". Built once the remaining views exist.

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

Rule: tests import the real code. 24 of the 25 standalone tests in
`tests/*.py` used to re-implement the logic they checked ("mirror") or grep
the source text, so they stayed green even when the code drifted. All of
them are now real tests in `tests/unit/` (a few behaviours in `tests/ha/`),
each checked against deliberately broken code (41 mutations in step 8b, all
caught):

| Step | Converted |
|---|---|
| 4 | `test_quota_accounting` C6 part |
| 5 | `entity_parser/fdm5kw/test_t3_decode.py` → `test_codecs.py` |
| 7 | `test_resync_guard` → `test_timer_state.py` |
| 8a | `test_entry_hygiene` C16 part → `test_location_service.py` |
| 8b | device map / ownership: `test_device_ownership`, `test_multimap_mirror_guard`, `test_master_map_registry`, `test_device_map_swap`, `test_device_object_identity`, `test_detached_device_build`, `test_device_deepcopy`, `test_dp_collapse_trace`; setup / runtime: `test_runtime_data_lookup`, `test_background_load`, `test_entry_hygiene` (+ `tests/ha/test_entry_lifecycle.py`), `test_stall_sampler`, `test_last_report_ts`; transport: `test_quota_accounting` C10, `test_mq_supervisor`, `test_openapi_timeouts`, `test_sharing_api_retry` + `test_sharing_mq_overrides` → `test_sharing.py`, `test_smart_home_device_list_fallback` |

Five standalone scripts remain. They already run the real code
(`test_runs_store`, `test_water_math`, `test_location_model`,
`test_bootstrap_bundles`, `test_no_stdlib_shadowing`).

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
| 4 | L1: `TuyaPort` (`transport/port.py`), `transport/quota.py` (moved), `transport/breaker.py`; timer/control services use only the port | breaker per hub; after a trip, remaining cloud writes in the same call are skipped (were still sent); a 60001001 on a GET also trips | dev: snapshot diff empty; all 6 services on a QT-08W + T3 give identical results and DP effects; unit tests on the real port; ratchet 12 → 6 |
| 4b | L1: `HubSettings` (`transport/settings.py`) + options step "Tuya plan and SmartLife sync"; quota card shows "no limit" for paid | new options; defaults = today; with the mirror off, resync refuses (it would clear every HA timer) | dev: snapshot diff empty, service results identical, step renders with translations; harness: flow validates, stores, reloads, quota tracker unlimited. Not covered by a test: "Configure API" keeping `hub_settings` (code review only) |
| 5 | L2a: `entity_parser/fdm5kw/codecs/` (time_task, single_run, t3_status, counter_custom, run_times; pure, stdlib only, bytes in/out); wrappers and services use them; T3 timer wrappers are single inheritance with a swapped `decode` (the MRO diamond is gone); dead `_decode_start_time` and stale docstrings removed; `test_t3_decode.py` (shipped inside the integration) replaced by `tests/unit/test_codecs.py` | none | 1,040,000 old/new parity comparisons (random + edge frames); codec tests on every captured payload; conformance vs the fixture specs; >200 real prod DP values decode; `test_codecs_are_pure`; dev: 1,331 valve entity values identical, snapshot diff empty, services identical |
| 6a | Rename `entity_parser/fdm5kw` → `entity_parser/valves` | none | dev: values and snapshot identical |
| 6 | L2b: `profiles.py` (QT-08W, T3 and read-only Smart Water Timer + BLE, by product_id with a DP-signature fallback), `driver.py` (`target()` + `CommandResult`), timer/control services profile-driven with no product branches; plugin extension point `XTCustomEntityParser.get_services()` so L1 no longer knows the valve services; the device layer owns its liters plausibility (`codecs/liters.py`) | services may return a `CommandResult` (`success` kept, `dp` / `cloud` / `reason` added); read-only profiles get "unsupported" (previously a Smart Water Timer was sent QT-08W frames) | 79 tests incl. driver tests on a fake port; dev: 1,331 values, snapshot and service effects identical; ratchet 6 → 3. The soak test was skipped (decision b): it only changes L3 wording later |
| 7 | L2c: `timer_state.py`: `TimerState` per valve is the only writer of the slots (DP reports, resync clear, restore); live states registered per HA instance in `hass.data` (replaces the class global `INSTANCES`); location updates via a dispatcher signal (replaces the global `REFRESH_LISTENERS`); timer_service no longer reaches into `entity._dpcode_wrapper` | none | 72,399-state parity old vs new accumulation (QT-08W + T3, deletes, duplicates, repeats, short frames); resync mirror test replaced by real tests; dev: 1,331 values incl. the slots of 112 registry sensors identical across restart, a timer survives set → restart → delete, services identical |
| 8a | Ratchet to zero: `location_service` runs on `TuyaPort` (new `openapi_uid`), its map and schedule set live in `hass.data`; the registry sensor no longer schedules (the composition root does, per hub); boundary test knows the composition root and type-only imports | none | 0 violations (mutation-checked); location_service unit tests replace the C16 source-text checks; dev: values/snapshot/services identical. The home/room walk cannot run on dev (fake cloud has no OpenAPI uid): check `valve_home` on prod after the release |
| 8b | All 19 remaining mirror tests → real tests (3 parallel agents in isolated worktrees, tests only, 41 mutations all caught); 5 production comments that pointed at deleted mirrors now point at the real tests | none | 200 tests green |
| 8c | `mypy --strict` on transport/, valves codecs/profiles/driver/timer_state, farm contract/location_model/water_math (`mypy.ini`, enforced by `tests/unit/test_typing.py`) | none | 18 files clean |
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
