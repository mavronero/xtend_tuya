"""mypy --strict stays green on the refactored packages (docs/architecture.md §1, principle 8).

The package list lives in mypy.ini. Skipped when mypy is not installed.
"""

from __future__ import annotations

from pathlib import Path

import pytest

mypy_api = pytest.importorskip("mypy.api")
REPO = Path(__file__).resolve().parents[2]


def test_strict_packages_type_check():
    out, err, status = mypy_api.run(["--config-file", str(REPO / "mypy.ini")])
    assert status == 0, out + err
