"""Real-HA harness for the xtend_tuya fork.

The two Tuya cloud plugins are replaced by FakeAccount objects serving the
device lists captured from prod diagnostics. MultiManager, the merge/mirror
machinery, entity parsers and every platform run for real.
"""

from __future__ import annotations

import pathlib
from typing import Any

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .fake_cloud import FakeAccount, build_device, load_devices  # noqa: F401  (re-exported for tests)

FIXTURES = pathlib.Path(__file__).resolve().parent.parent / "fixtures"
DOMAIN = "xtend_tuya"

# Per config-entry id: the fake accounts MultiManager.setup_entry registers.
ACCOUNTS: dict[str, list[Any]] = {}


@pytest.fixture(autouse=True)
def _enable_custom_integrations(recorder_mock, enable_custom_integrations):
    # recorder_mock: the manifest depends on recorder (runs store, calendar).
    yield


def load_fixture_devices(name: str) -> list[dict]:
    return load_devices(FIXTURES / f"{name}_devices.json.gz")


@pytest.fixture
async def fake_plugins(hass, monkeypatch):
    """No real plugins; MultiManager.setup_entry registers ACCOUNTS[entry_id].

    Unloads every hub at teardown: the entry-bound timers (12 h homes walk,
    15 min calendar re-arm) are released on unload, and the HA harness
    rejects lingering timers."""
    from custom_components.xtend_tuya.const import AllowedPlugins
    from custom_components.xtend_tuya.multi_manager import multi_manager as mm_mod

    monkeypatch.setattr(AllowedPlugins, "get_plugins_to_load", staticmethod(lambda: []))
    # Debug-only daemon thread with no stop(); the HA harness rejects lingering threads.
    from custom_components.xtend_tuya.multi_manager.shared.debug import stall_sampler

    monkeypatch.setattr(stall_sampler, "start", lambda hass: None)
    original = mm_mod.MultiManager.setup_entry

    async def setup_entry(self):
        await original(self)
        for account in ACCOUNTS.get(self.config_entry.entry_id, []):
            await account.setup_from_entry(self.hass, self.config_entry, self)
        for account in self.accounts.values():
            account.on_post_setup()

    monkeypatch.setattr(mm_mod.MultiManager, "setup_entry", setup_entry)
    yield
    for entry_id in list(ACCOUNTS):
        if hass.config_entries.async_get_entry(entry_id) is not None:
            assert await hass.config_entries.async_unload(entry_id), f"unload failed for {entry_id}"
    await hass.async_block_till_done()
    ACCOUNTS.clear()


async def setup_hub(hass, title: str, accounts: list[FakeAccount]) -> MockConfigEntry:
    """Add a hub entry, run its setup AND its background load to completion."""
    from custom_components.xtend_tuya import _LOAD_TASKS

    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title=title, data={}, options={}, unique_id=title)
    entry.add_to_hass(hass)
    ACCOUNTS[entry.entry_id] = accounts
    assert await hass.config_entries.async_setup(entry.entry_id)
    await _LOAD_TASKS[entry.entry_id]  # raises if the load body raised
    await hass.async_block_till_done()
    return entry
