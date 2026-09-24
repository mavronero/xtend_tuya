"""util.get_config_entry_runtime_data against the runtime_data shapes stored in prod.

Replaces tests/test_runtime_data_lookup.py (a mirror of the lookup).

The case that matters is core Tuya's DeviceListener: HA core stores a bare
DeviceListener in the official Tuya entry's runtime_data, carrying only
`hass`, `_entry` and `manager` (core 2026.7.4). A previous lookup also required
`.listener` / `.device_listener`, returned None for every official Tuya entry
and silently disabled override detection on every install.
"""

from __future__ import annotations

from types import SimpleNamespace

from custom_components.xtend_tuya.util import get_config_entry_runtime_data


def _lookup(runtime_data):
    return get_config_entry_runtime_data(None, SimpleNamespace(runtime_data=runtime_data), "tuya")  # type: ignore[arg-type]


def test_core_tuya_device_listener_resolves():
    manager = object()
    core = SimpleNamespace(hass=object(), _entry=object(), manager=manager)  # no .listener / .device_listener

    got = _lookup(core)

    assert got is not None, "official Tuya runtime_data must resolve: override detection depends on it"
    assert got.device_manager is manager
    assert got.device_listener is core, "the listener is the runtime_data object itself"
    assert got.generic_runtime_data is core


def test_xtend_runtime_data_resolves():
    manager = object()
    got = _lookup(SimpleNamespace(manager=manager, listener=object()))
    assert got is not None and got.device_manager is manager


def test_device_manager_attribute_resolves():
    manager = object()
    got = _lookup(SimpleNamespace(device_manager=manager))
    assert got is not None and got.device_manager is manager


def test_unusable_shapes_yield_none():
    assert _lookup(None) is None
    assert _lookup(SimpleNamespace(hass=object())) is None  # entry caught mid-setup, no manager yet
    assert get_config_entry_runtime_data(None, None, "tuya") is None  # type: ignore[arg-type]
