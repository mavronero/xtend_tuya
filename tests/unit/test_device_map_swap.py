"""Swap-on-success IOT device-map refresh (audit C2), against the real
XTIOTHomeManager.fetch_is_usable / async_update_device_cache.

The map used to be cleared BEFORE the fetch and a failed fetch was swallowed
upstream, so one denied device-list call (1106, expired token, hung socket)
left the whole fleet on the 2-DP sharing descriptors until someone reloaded
the entry: the Aug 2026 "DP collapse" incident series. Now the fetch fills a
fresh map and the live map is only replaced when the result is usable;
otherwise the old map stays and the load fails (and retries in 120 s).
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from homeassistant.exceptions import ConfigEntryNotReady

from custom_components.xtend_tuya.lib.tuya_iot.tuya_enums import AuthType
from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_home_manager import (
    XTIOTHomeManager,
)
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDeviceMap

usable = XTIOTHomeManager.fetch_is_usable


def test_fetch_is_usable_thresholds():
    assert usable(0, 108)  # first load: any non-empty list
    assert not usable(0, 0)  # empty is never usable, even cold
    assert usable(108, 108)
    assert usable(108, 100)  # a few genuinely removed in SmartLife
    assert usable(108, 54)  # exactly at the threshold
    assert not usable(256, 100)  # lost paging page (C17 belt-and-braces)


class Home:
    """Stub self: SMART_HOME auth, fetch writes n devices into whatever map is current."""

    async_update_device_cache = XTIOTHomeManager.async_update_device_cache
    fetch_is_usable = staticmethod(XTIOTHomeManager.fetch_is_usable)

    def __init__(self, live, n_fetched):
        async def fetch():
            for i in range(n_fetched):
                self.device_manager.device_map[f"d{i}"] = SimpleNamespace()

        self.api = SimpleNamespace(auth_type=AuthType.SMART_HOME)
        self.device_manager = SimpleNamespace(device_map=live, async_update_device_list_in_smart_home=fetch)


def live_map(n):
    m = XTDeviceMap({})
    m.update({f"d{i}": SimpleNamespace() for i in range(n)})
    return m


async def test_failed_fetch_keeps_the_live_map_and_fails_the_load():
    live = live_map(108)
    home = Home(live, 0)
    with pytest.raises(ConfigEntryNotReady):
        await home.async_update_device_cache()
    assert len(live) == 108, "previous device map must be kept on failure"
    assert home.device_manager.device_map is live


async def test_good_fetch_swaps_in_place():
    """Same object after the swap: the master map registry holds a reference."""
    live = live_map(108)
    home = Home(live, 110)
    await home.async_update_device_cache()
    assert home.device_manager.device_map is live
    assert len(live) == 110
