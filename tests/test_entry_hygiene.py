"""Self-checks for the entry-lifecycle cleanups C12-C16.

Standalone (no Home Assistant import). Mirrors __init__.update_listener and
asserts the source invariants for the other four.

C12 tuya_sharing was silenced at CRITICAL process-wide, hiding the reconnect
     diagnostics of the very library the DP collapse was blamed on.
C13 device.__setattr__ = wrapped sets an INSTANCE attribute; Python resolves
     dunders on the type, so the hook never fired — dead code.
C14 update_listener was defined but never registered, so options changes
     needed a restart. Registering it naively risks a reload storm: HA fires
     the listener on any entry write and each reload costs ~5 cloud calls per
     device (~1250 for the 256-device hub).
C15 repair issues were only ever created; prod carried six, two of them for
     config entries that no longer exist.
C16 the location-service guard was keyed on id(multi_manager) — CPython
     reuses ids — and its 12 h timer was never bound to the entry.

Run: `python tests/test_entry_hygiene.py`
"""

import pathlib

SRC = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "xtend_tuya"


def should_reload(loaded_options, entry_id, current_options):
    """Mirror of __init__.update_listener."""
    return loaded_options.get(entry_id) != dict(current_options)


def demo():
    loaded = {"solar": {"endpoint": "eu", "access_id": "abc"}}
    # A write that changed nothing must not reload the hub.
    assert not should_reload(loaded, "solar", {"endpoint": "eu", "access_id": "abc"})
    # A real options change must.
    assert should_reload(loaded, "solar", {"endpoint": "us", "access_id": "abc"})
    assert should_reload(loaded, "solar", {"endpoint": "eu"})
    # An entry we have not loaded yet reloads rather than silently ignoring.
    assert should_reload(loaded, "simon", {"endpoint": "eu"})

    init = (SRC / "__init__.py").read_text()
    # C12
    assert 'getLogger("tuya_sharing").setLevel(logging.WARNING)' in init
    assert "logging.CRITICAL" not in init
    # C14
    assert "entry.add_update_listener(update_listener)" in init

    # C13: the dead instance-level dunder decoration and its callback are gone.
    decorators = (SRC / "multi_manager" / "managers" / "tuya_sharing"
                  / "ha_tuya_integration" / "tuya_decorators.py").read_text()
    handler = (SRC / "multi_manager" / "managers" / "tuya_sharing"
               / "ha_tuya_integration" / "config_entry_handler.py").read_text()
    assert 'method_name="__setattr__"' not in decorators
    assert "on_tuya_device_attribute_change" not in decorators + handler

    # C15
    iface = (SRC / "multi_manager" / "shared" / "interface" / "device_manager.py").read_text()
    iot = (SRC / "multi_manager" / "managers" / "tuya_iot" / "init.py").read_text()
    assert "async_delete_issue" in iface
    assert iot.count("clear_issue(") >= 5, "every raised issue needs a clear path"

    # C16: now a behaviour test, tests/unit/test_location_service.py
    print("ok")


if __name__ == "__main__":
    demo()
