"""Irrigation location history must follow the place, not the valve.

Standalone: python3 tests/test_location_model.py
Loads custom_components/xtend_tuya/location_model.py by path — no HA needed.
"""

import importlib.util
import os

_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "custom_components",
    "xtend_tuya",
    "location_model.py",
)
_spec = importlib.util.spec_from_file_location("location_model", _PATH)
assert _spec and _spec.loader
lm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(lm)

T1 = "2026-06-01T08:00:00+02:00"
T2 = "2026-07-01T08:00:00+02:00"
T3 = "2026-08-01T08:00:00+02:00"
T4 = "2026-11-01T08:00:00+01:00"  # after DST switch


def run(end, liters=10.0):
    return {"start": end, "end": end, "duration_seconds": 60.0, "total_l": liters}


def open_of(data, dev):
    return [a for a in data["assignments"] if a["device_id"] == dev and a["end"] is None]


def no_runs(_dev):
    return None


def demo():
    # --- parsing -------------------------------------------------------
    p = lm.parse_valve_name
    assert p("HM Verbs (701)") == ("HM Verbs", "701")
    assert p("  FF  East   verbs 06 (751) ") == ("FF East verbs 06", "751")
    assert p("West 08 defect") is None
    assert p("965") is None
    assert p("(927)") is None
    assert p("  (927)") is None
    assert p(None) is None
    assert lm.normalize("FF East  Verbs 06") == lm.normalize("ff east verbs 06")

    # --- swap 835 -> 751, casing/spacing merge, backfill ---------------
    d = lm.empty()
    firsts = {"dev835": "2026-05-01T07:00:00+02:00", "dev751": T2}
    assert lm.sync(d, [("dev835", "FF East Verbs 06 (835)")], T1, firsts.get)
    assert len(d["locations"]) == 1
    a835 = d["assignments"][0]
    assert a835["begin"] == firsts["dev835"] and a835["source"] == "auto"
    assert lm.sync(d, [("dev835", "FF East Verbs 06 (835)"), ("dev751", "FF East verbs 06 (751)")], T3, firsts.get)
    assert len(d["locations"]) == 1, "casing variant must merge"
    assert len(open_of(d, "dev835")) == 1 and len(open_of(d, "dev751")) == 1
    (loc_id,) = d["locations"]
    runs = {
        "dev835": [run("2026-05-15T07:00:00+02:00"), run("2026-06-20T07:00:00+02:00")],
        "dev751": [run("2026-07-10T07:00:00+02:00", 20.0)],
    }
    got = lm.location_runs(d, loc_id, runs)
    assert [r["end"] for r in got] == [
        "2026-05-15T07:00:00+02:00",
        "2026-06-20T07:00:00+02:00",
        "2026-07-10T07:00:00+02:00",
    ]
    # idempotent, and an offline/missing valve is never auto-closed
    assert not lm.sync(d, [("dev751", "FF East verbs 06 (751)")], T4, firsts.get)
    assert len(open_of(d, "dev835")) == 1

    # --- same number, different places: keyed by device id -------------
    d = lm.empty()
    lm.sync(d, [("a", "HM verbs (701)"), ("b", "FG Herbs bed (701)")], T1, no_runs)
    assert len(d["locations"]) == 2 and len(d["assignments"]) == 2

    # --- SmartLife rename moves an auto assignment ----------------------
    d = lm.empty()
    lm.sync(d, [("x", "Old Bed (900)")], T1, no_runs)
    assert d["assignments"][0]["begin"] == T1  # no runs -> begin now
    assert lm.sync(d, [("x", "New Bed (900)")], T2, no_runs)
    old, new = d["assignments"]
    assert old["end"] == T2 and new["begin"] == T2 and new["end"] is None
    assert d["locations"][new["location_id"]]["name"] == "New Bed"

    # --- manual assignment survives sync --------------------------------
    target = lm.create_location(d, "Greenhouse", T2)
    try:
        lm.create_location(d, "  greenhouse ", T2)
        raise AssertionError("duplicate name accepted")
    except ValueError:
        pass
    lm.assign_device(d, "x", target["id"], T3)
    assert not lm.sync(d, [("x", "New Bed (900)")], T4, no_runs)
    (cur,) = open_of(d, "x")
    assert cur["location_id"] == target["id"] and cur["source"] == "manual"
    # re-assigning to the same place is a no-op
    n = len(d["assignments"])
    lm.assign_device(d, "x", target["id"], T4)
    assert len(d["assignments"]) == n

    # --- manually ended assignment is not reopened ----------------------
    d = lm.empty()
    lm.sync(d, [("y", "Plot A (1)")], T1, no_runs)
    loc_a = d["assignments"][0]["location_id"]
    lm.end_assignment(d, "y", loc_a, T2)
    assert not lm.sync(d, [("y", "Plot A (1)")], T3, no_runs)
    assert not open_of(d, "y")
    try:
        lm.end_assignment(d, "y", loc_a, T3)
        raise AssertionError("ended twice")
    except ValueError:
        pass

    # --- rename keeps matching the old SmartLife name -------------------
    d = lm.empty()
    lm.sync(d, [("z", "HM Verbs (701)")], T1, no_runs)
    (loc,) = d["locations"].values()
    lm.update_location(d, loc["id"], name="Herb Garden North", expected_lpm=4.5, lat=48.1, lon=11.5)
    assert loc["name"] == "Herb Garden North" and loc["expected_lpm"] == 4.5
    assert lm.sync(d, [("z", "HM Verbs (701)"), ("w", "hm verbs (903)")], T2, no_runs)  # w is new
    assert len(d["locations"]) == 1 and open_of(d, "w")[0]["location_id"] == loc["id"]
    assert lm.sync(d, [("v", "Herb Garden North (904)")], T2, no_runs) and len(d["locations"]) == 1
    for bad in ({"lat": 91}, {"lon": -181}, {"expected_lpm": -1}, {"name": " "}, {"lat": True}, {"color": "red"}):
        try:
            lm.update_location(d, loc["id"], **bad)
            raise AssertionError(f"accepted {bad}")
        except ValueError:
            pass
    try:
        lm.update_location(d, "nope", name="x")
        raise AssertionError("unknown id accepted")
    except ValueError:
        pass
    lm.update_location(d, loc["id"], expected_lpm=None)
    assert loc["expected_lpm"] is None

    # --- location_for_run window edges (DST offsets compared as datetimes)
    d = lm.empty()
    L1 = lm.create_location(d, "One", T1)
    L2 = lm.create_location(d, "Two", T1)
    d["assignments"] = [
        {"location_id": L1["id"], "device_id": "q", "begin": None, "end": T2, "source": "auto"},
        {"location_id": L2["id"], "device_id": "q", "begin": T2, "end": None, "source": "manual"},
    ]
    f = lm.location_for_run
    assert f(d, "q", "2020-01-01T00:00:00+00:00")["id"] == L1["id"]
    assert f(d, "q", T2)["id"] == L2["id"]  # boundary belongs to the new one
    assert f(d, "q", "2026-07-01T05:59:59+00:00")["id"] == L1["id"]  # 1 s before T2
    assert f(d, "q", "2026-07-01T06:00:00+00:00")["id"] == L2["id"]  # T2 in UTC
    assert f(d, "q", T4)["id"] == L2["id"]
    assert f(d, "other", T4) is None

    print("ok")


if __name__ == "__main__":
    demo()
