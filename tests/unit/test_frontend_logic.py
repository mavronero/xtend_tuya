"""Run the node self-tests of the pure frontend modules (tests/*.mjs)."""

from __future__ import annotations

import pathlib
import shutil
import subprocess

import pytest

TESTS = sorted(pathlib.Path(__file__).parent.parent.glob("*.mjs"))


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
@pytest.mark.parametrize("script", TESTS, ids=lambda p: p.name)
def test_node_self_test(script: pathlib.Path) -> None:
    result = subprocess.run(
        ["node", "--experimental-strip-types", "--no-warnings", str(script)],
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stderr or result.stdout
