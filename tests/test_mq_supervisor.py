"""Self-check for the IOT MQ supervisor (audit C5).

Standalone (no Home Assistant import) — mirrors the _check callback in
XTTuyaIOTDeviceManagerInterface._register_mq_supervisor
(multi_manager/managers/tuya_iot/init.py).

lib/tuya_iot/openmq.py's run loop calls self.stop() on itself after 10
consecutive failures, and the interface's refresh_mq() and unload() were both
`pass`: a 10-minute cloud outage killed this hub's IOT message stream until
somebody reloaded the entry. DP counts and the cloud `online` flag are
unchanged, so nothing looked broken — the devices just froze.

Run: `python tests/test_mq_supervisor.py`
"""


class FakeMQ:
    def __init__(self, alive=True):
        self.alive = alive

    def is_alive(self):
        return self.alive


class Supervisor:
    """Mirror of the _check callback, with its restart/log side effects."""

    def __init__(self, mq):
        self.mq = mq
        self.reported = False
        self.restarts = 0
        self.logs = 0

    def check(self):
        if self.mq is not None and self.mq.is_alive():
            self.reported = False
            return
        if not self.reported:
            self.logs += 1
            self.reported = True
        self.restarts += 1
        self.mq = FakeMQ(alive=True)  # refresh_mq builds and starts a new one


def demo():
    sup = Supervisor(FakeMQ(alive=True))
    for _ in range(5):
        sup.check()
    assert (sup.restarts, sup.logs) == (0, 0), "a healthy MQ is left alone"

    # The 10-failures-then-stop() case: the thread has exited for good.
    sup.mq.alive = False
    sup.check()
    assert sup.restarts == 1 and sup.logs == 1
    # The replacement is alive, so the next tick is quiet again.
    sup.check()
    assert sup.restarts == 1 and sup.logs == 1

    # A hub that keeps dying restarts every tick but only logs once per spell.
    dead = Supervisor(FakeMQ(alive=False))
    dead.check()
    dead.mq.alive = False
    dead.check()
    dead.mq.alive = False
    dead.check()
    assert dead.restarts == 3 and dead.logs == 1

    # No MQ at all (account torn down mid-tick) is treated as dead, not a crash.
    none = Supervisor(None)
    none.check()
    assert none.restarts == 1
    print("ok")


if __name__ == "__main__":
    demo()
