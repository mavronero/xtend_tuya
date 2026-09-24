"""Cross-entry device ownership arbitration, against the real MultiManager
claim_device / _registry_device_owner / release_devices.

One physical valve reaches two config entries at once: entry A through an
OpenAPI project, entry B through the SmartLife sharing account it was shared
into. Observed 2026-08-10 with RT Veggies 2 (708), device
bf423dd3ea314df3bfjkdk, held by both the solar-valves and simon.stuertz hubs.
Without arbitration both entries build entities with the same
`tuya.<device_id><dpcode>` unique IDs and HA drops a copy for each one
(~1600 errors per setup attempt, on every retry).
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.multi_manager import MultiManager

VALVE = "bf423dd3ea314df3bfjkdk"


class Hub:
    """Stub self: just what the three real methods touch."""

    claim_device = MultiManager.claim_device
    release_devices = MultiManager.release_devices
    _registry_device_owner = MultiManager._registry_device_owner

    def __init__(self, entry_id, live):
        self.config_entry = SimpleNamespace(entry_id=entry_id)
        self.hass = SimpleNamespace(
            config_entries=SimpleNamespace(async_get_entry=lambda e: e if e in live else None)
        )


@pytest.fixture
def registry(monkeypatch):
    """Owner table + the entity-registry cache: (unique_id minus 'tuya.', entry_id) rows."""
    monkeypatch.setattr(MultiManager, "device_owner", {})
    rows: list[tuple[str, str]] = []
    monkeypatch.setattr(MultiManager, "_registry_owner_cache", rows)
    return rows


@pytest.fixture
def live():
    return {"solar", "simon"}


@pytest.fixture
def hubs(registry, live):
    return Hub("solar", live), Hub("simon", live)


def test_first_entry_claims_second_is_refused(hubs):
    solar, simon = hubs
    assert solar.claim_device(VALVE) is True
    assert simon.claim_device(VALVE) is False


def test_owner_may_reclaim_its_own_device(hubs):
    """A reload re-runs update_master_device_map; the owner must not lock itself out."""
    solar, _ = hubs
    assert solar.claim_device(VALVE) is True
    assert solar.claim_device(VALVE) is True


def test_release_frees_the_device_for_the_other_entry(hubs):
    solar, simon = hubs
    solar.claim_device(VALVE)
    solar.release_devices()
    assert simon.claim_device(VALVE) is True


def test_claim_of_a_removed_entry_is_not_honoured(hubs, live):
    """Entry deleted without unloading cleanly: its claim must not strand the device."""
    solar, simon = hubs
    solar.claim_device(VALVE)
    live.discard("solar")
    assert simon.claim_device(VALVE) is True
    assert MultiManager.device_owner[VALVE] == "simon"


def test_release_only_touches_own_claims(hubs):
    solar, simon = hubs
    solar.claim_device("device-a")
    simon.claim_device("device-b")
    solar.release_devices()
    assert MultiManager.device_owner == {"device-b": "simon"}


def test_unrelated_devices_are_unaffected(hubs):
    solar, simon = hubs
    assert solar.claim_device("only-in-solar") is True
    assert simon.claim_device("only-in-simon") is True


def test_registry_owner_beats_boot_order(hubs, registry):
    """Chicken-house case 2026-08-10: simon's registry rows (and dashboards)
    predate the arbitration; solar boots first but must not steal the device."""
    solar, simon = hubs
    registry.append((VALVE + "motion_switch", "simon"))
    assert solar.claim_device(VALVE) is False
    assert simon.claim_device(VALVE) is True


def test_registry_owner_holds_while_its_entry_is_disabled(hubs, registry):
    """A disabled entry still exists (async_get_entry finds it); its entities
    must revive on re-enable."""
    solar, _ = hubs
    registry.append((VALVE + "motion_switch", "simon"))
    assert solar.claim_device(VALVE) is False


def test_registry_owner_of_a_deleted_entry_is_ignored(hubs, registry, live):
    solar, _ = hubs
    registry.append((VALVE + "motion_switch", "simon"))
    live.discard("simon")
    assert solar.claim_device(VALVE) is True


def test_runtime_owner_still_wins_over_registry(hubs, registry):
    """Once an entry has claimed this boot, the registry no longer overrides it."""
    solar, simon = hubs
    assert solar.claim_device("fresh-device") is True
    registry.append(("fresh-devicedp", "simon"))
    assert solar.claim_device("fresh-device") is True
    assert simon.claim_device("fresh-device") is False
