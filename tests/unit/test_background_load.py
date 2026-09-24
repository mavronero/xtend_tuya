"""Background entry load (2026-09-14, 4.4.249/250) against the real __init__.py.

Replaces tests/test_background_load.py (a mirror of _load_failure_action,
_entry_still_loading and the unload tolerance).

The simon hub takes 2-4 min to load. Inside async_setup_entry, whoever awaited
it could cancel it (HA's stage-2 boot timeout, the nabu.casa proxy dropping the
UI "Reload"): three cancelled setups on 2026-09-14. The load now runs in an
entry-owned background task, which routes its own failures.
"""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady

import custom_components.xtend_tuya as xt
from custom_components.xtend_tuya.const import DOMAIN, PLATFORMS


class FakeEntry:
    def __init__(self, entry_id="e1", state=ConfigEntryState.LOADED, runtime_data=None):
        self.entry_id = entry_id
        self.title = entry_id
        self.state = state
        self.runtime_data = runtime_data
        self.reauth_started = False

    def async_start_reauth(self, hass):
        self.reauth_started = True


@pytest.fixture
def load_done(monkeypatch):
    done: set[str] = set()
    monkeypatch.setattr(xt, "_LOAD_DONE", done)
    return done


@pytest.fixture
def later(monkeypatch):
    calls: list[float] = []
    monkeypatch.setattr(xt, "async_call_later", lambda hass, delay, action: calls.append(delay))
    return calls


def _body_raising(monkeypatch, err):
    async def body(*a):
        if err is not None:
            raise err

    monkeypatch.setattr(xt, "_async_load_entry_body", body)


async def _load(entry):
    await xt._async_load_entry(SimpleNamespace(), entry, None, None)  # type: ignore[arg-type]


async def test_successful_load_marks_entry_done(monkeypatch, load_done, later):
    _body_raising(monkeypatch, None)
    entry = FakeEntry()
    await _load(entry)
    assert "e1" in load_done
    assert not later and not entry.reauth_started


async def test_cancel_propagates_so_unload_really_stops_the_task(monkeypatch, load_done, later):
    _body_raising(monkeypatch, asyncio.CancelledError())
    with pytest.raises(asyncio.CancelledError):
        await _load(FakeEntry())
    assert not load_done and not later


async def test_auth_failure_starts_reauth_without_reload_loop(monkeypatch, load_done, later):
    _body_raising(monkeypatch, ConfigEntryAuthFailed("sign invalid"))
    entry = FakeEntry()
    await _load(entry)
    assert entry.reauth_started
    assert not later, "a bad token must not schedule reloads"
    assert not load_done


@pytest.mark.parametrize("err", [ConfigEntryNotReady("tuya mid-setup"), RuntimeError("boom")])
async def test_transient_failure_schedules_a_reload(monkeypatch, load_done, later, err):
    _body_raising(monkeypatch, err)
    entry = FakeEntry()
    await _load(entry)
    assert later == [xt.LOAD_RETRY_SECONDS]
    assert not entry.reauth_started and not load_done


def test_loaded_entry_counts_as_loading_until_background_load_finished(load_done):
    """4.4.250: HA says LOADED once async_setup_entry returns, before the device
    map exists. Registry cleanups must wait, or they delete the other hub's devices."""
    assert xt._entry_still_loading(ConfigEntryState.SETUP_IN_PROGRESS, DOMAIN, "a")
    assert xt._entry_still_loading(ConfigEntryState.LOADED, DOMAIN, "a")
    load_done.add("a")
    assert not xt._entry_still_loading(ConfigEntryState.LOADED, DOMAIN, "a")
    assert not xt._entry_still_loading(ConfigEntryState.SETUP_ERROR, DOMAIN, "b")
    # core tuya entries have no background load: LOADED means loaded
    assert not xt._entry_still_loading(ConfigEntryState.LOADED, "tuya", "t")


def test_cleanup_gate_waits_for_other_hub_background_load(load_done):
    me, other = FakeEntry("me"), FakeEntry("other")
    hass = SimpleNamespace(config_entries=SimpleNamespace(async_entries=lambda *a: [me, other]))
    assert not xt.are_all_domain_config_loaded(hass, DOMAIN, me)  # type: ignore[arg-type]
    load_done.add("other")
    assert xt.are_all_domain_config_loaded(hass, DOMAIN, me)  # type: ignore[arg-type]


def _unload_hass(results):
    it = iter(results)

    async def forward_unload(entry, platform):
        r = next(it)
        if isinstance(r, BaseException):
            raise r
        return r

    return SimpleNamespace(config_entries=SimpleNamespace(async_forward_entry_unload=forward_unload))


def _results(*special):
    """True for every platform, with the given results in front."""
    return list(special) + [True] * (len(PLATFORMS) - len(special))


async def test_unload_tolerates_platforms_never_forwarded(load_done):
    # EntityComponent raises ValueError("Config entry was never loaded!") for
    # platforms the (cancelled / unfinished) background load never forwarded.
    hass = _unload_hass(_results(ValueError("Config entry was never loaded!")))
    assert await xt.async_unload_entry(hass, FakeEntry())  # type: ignore[arg-type]


@pytest.mark.parametrize("bad", [False, RuntimeError("x")])
async def test_unload_fails_when_a_platform_refuses(load_done, bad):
    hass = _unload_hass(_results(bad))
    assert not await xt.async_unload_entry(hass, FakeEntry())  # type: ignore[arg-type]


async def test_unload_cancels_running_load_and_clears_done(monkeypatch, load_done):
    task = asyncio.get_running_loop().create_task(asyncio.sleep(3600))
    monkeypatch.setattr(xt, "_LOAD_TASKS", {"e1": task})
    load_done.add("e1")
    assert await xt.async_unload_entry(_unload_hass(_results()), FakeEntry())  # type: ignore[arg-type]
    await asyncio.sleep(0)
    assert task.cancelled()
    assert "e1" not in load_done
