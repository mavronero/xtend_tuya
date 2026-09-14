"""Self-check for the background entry load introduced 2026-09-14.

Standalone (no Home Assistant import) — mirrors _load_failure_action and the
unload tolerance in __init__.py.

Why: the simon hub takes 2-4 min to load. When that ran inside
async_setup_entry, whoever awaited it could cancel it — HA's stage-2 boot
timeout, or the nabu.casa proxy dropping the UI "Reload" REST request (HA
2026.9 cancels the handler with it). Three cancelled setups in a row on
2026-09-14. The load now runs in an entry-owned background task; setup
returns immediately after the readiness gate.

Run: `python tests/test_background_load.py`
"""

import asyncio


class ConfigEntryAuthFailed(Exception):
    pass


class ConfigEntryNotReady(Exception):
    pass


def load_failure_action(err):
    """Mirror of __init__._load_failure_action."""
    if isinstance(err, asyncio.CancelledError):
        return "propagate"
    if isinstance(err, ConfigEntryAuthFailed):
        return "reauth"
    return "retry"


def unload_ok(results):
    """Mirror of the per-platform unload tolerance in async_unload_entry."""
    return all(r is True or isinstance(r, ValueError) for r in results)


def demo():
    # unload/reload cancels the task: must propagate so the task really stops
    assert load_failure_action(asyncio.CancelledError()) == "propagate"
    # bad token: reauth flow, no reload loop
    assert load_failure_action(ConfigEntryAuthFailed("sign invalid")) == "reauth"
    # transient (Tuya entry not ready, cloud hiccup, bug): reload later
    assert load_failure_action(ConfigEntryNotReady("tuya mid-setup")) == "retry"
    assert load_failure_action(RuntimeError("boom")) == "retry"

    # platforms never forwarded -> EntityComponent raises ValueError; tolerated
    assert unload_ok([True, ValueError("Config entry was never loaded!"), True])
    # a platform that genuinely refused to unload still fails the unload
    assert not unload_ok([True, False, True])
    assert not unload_ok([True, RuntimeError("x")])
    print("ok")


if __name__ == "__main__":
    demo()
