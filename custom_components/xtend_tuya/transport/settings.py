"""Per-hub transport settings (docs/architecture.md §3.1).

Only the quota handling depends on the Tuya plan. Dual write, resync and spec
merge reflect how the devices and the cloud behave, so they apply on every plan.
Missing options mean today's behaviour (Trial, 10 devices, mirror on), so
existing installs need no migration.

This module is the only reader of the `hub_settings` option.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal

OPTION_KEY = "hub_settings"

Plan = Literal["trial", "paid", "custom"]
PLANS: tuple[Plan, ...] = ("trial", "paid", "custom")
TRIAL_CONTROLLABLE_LIMIT = 10


@dataclass(frozen=True)
class HubSettings:
    plan: Plan = "trial"
    controllable_limit: int | None = TRIAL_CONTROLLABLE_LIMIT  # None = unlimited
    cloud_timer_mirror: bool = True

    @classmethod
    def from_options(cls, options: Mapping[str, Any] | None) -> HubSettings:
        raw = (options or {}).get(OPTION_KEY) or {}
        plan = raw.get("plan", "trial")
        if plan not in PLANS:
            plan = "trial"
        mirror = bool(raw.get("cloud_timer_mirror", True))
        if plan == "paid":
            return cls("paid", None, mirror)
        if plan == "custom":
            limit = raw.get("controllable_limit")
            if isinstance(limit, int) and limit >= 1:
                return cls("custom", limit, mirror)
            # A custom plan without a usable limit keeps the safe Trial cap.
            return cls("custom", TRIAL_CONTROLLABLE_LIMIT, mirror)
        return cls("trial", TRIAL_CONTROLLABLE_LIMIT, mirror)

    def to_option(self) -> dict[str, Any]:
        return {
            "plan": self.plan,
            "controllable_limit": self.controllable_limit if self.plan == "custom" else None,
            "cloud_timer_mirror": self.cloud_timer_mirror,
        }
