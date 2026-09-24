"""Per-hub circuit breaker for Tuya's controllable-device quota (error 60001001).

Once a hub's OpenAPI project answers 60001001 ("controllable device pool quota
insufficient"), further cloud writes on that project fail too, and each one
burns an API call. The breaker stops cloud writes for LOCKOUT_SECONDS instead.
DP writes keep running, so timers still fire on the device.

One breaker per hub: every OpenAPI project has its own quota. The previous
module-global lockout let one hub's quota error block the other hub.
"""

from __future__ import annotations

import time
from collections.abc import Callable

QUOTA_EXCEEDED_CODE = 60001001
LOCKOUT_SECONDS = 6 * 3600


class QuotaBreaker:
    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        self._clock = clock
        self._open_until = 0.0

    @property
    def is_open(self) -> bool:
        return self._open_until > self._clock()

    def trip(self) -> None:
        self._open_until = self._clock() + LOCKOUT_SECONDS

    def clear(self) -> None:
        self._open_until = 0.0
