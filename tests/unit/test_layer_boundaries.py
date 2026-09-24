"""Layer boundaries (docs/architecture.md §1, principle 1), as a ratchet.

Imports may only point down: farm (L3) -> contract names; valve drivers (L2)
-> TuyaPort; transport (L1) knows neither. KNOWN_VIOLATIONS lists any accepted
exception explicitly; the test fails on a new violation and on a stale entry,
so the list only ever shrinks (it reached zero in step 8).

Two textbook exemptions, not loopholes:
- the composition root (`__init__.py`) wires the layers together and may
  import each layer's entry points;
- type-only imports (`if TYPE_CHECKING:`) are not a runtime dependency. L2
  entities are handed XTDevice / MultiManager by the upstream entity factory
  and may name those types, but not call into them.
"""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "custom_components" / "xtend_tuya"

# Layer membership by module path. transport/ and entity_parser/valves/ take
# over as the refactor steps land. `calendar` is the farm's platform shim.
FARM_PREFIX = "farm"
FARM_SHIMS = {"calendar"}
L2_PREFIX = "entity_parser.valves"

FARM_MAY_IMPORT = {FARM_PREFIX, "const"}
COMPOSITION_ROOT = "__init__"
L2_FORBIDDEN_PREFIXES = ("multi_manager", "util", "lib")
L2_PORT = "transport.port"  # the only transport module L2 may use

KNOWN_VIOLATIONS: set[tuple[str, str]] = set()


def _module_name(path: Path) -> str:
    parts = path.relative_to(ROOT).with_suffix("").parts
    return ".".join(parts[:-1] if parts[-1] == "__init__" else parts) or "__init__"


def _is_module(dotted: str) -> bool:
    base = ROOT.joinpath(*dotted.split("."))
    return base.with_suffix(".py").is_file() or (base / "__init__.py").is_file()


def _imports(path: Path) -> set[str]:
    """Intra-package modules imported by `path`, resolved to real module files."""
    own = _module_name(path)
    package = own.split(".") if path.name == "__init__.py" else own.split(".")[:-1]
    if own == "__init__":
        package = []
    found: set[str] = set()
    tree = ast.parse(path.read_text())
    type_only = {
        id(inner)
        for node in ast.walk(tree)
        if isinstance(node, ast.If) and "TYPE_CHECKING" in ast.unparse(node.test)
        for inner in ast.walk(node)
    }
    for node in ast.walk(tree):
        if id(node) in type_only:
            continue
        if isinstance(node, ast.ImportFrom):
            if node.level:
                base = package[: len(package) - (node.level - 1)] if node.level > 1 else package
                module = ".".join(base + ([node.module] if node.module else []))
            elif node.module and node.module.startswith("custom_components.xtend_tuya"):
                module = node.module.removeprefix("custom_components.xtend_tuya").lstrip(".")
            else:
                continue
            for alias in node.names:
                sub = f"{module}.{alias.name}" if module else alias.name
                found.add(sub if _is_module(sub) else module)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.startswith("custom_components.xtend_tuya."):
                    found.add(alias.name.removeprefix("custom_components.xtend_tuya."))
    return {m for m in found if m}


def _in_farm(module: str) -> bool:
    return module in FARM_SHIMS or module == FARM_PREFIX or module.startswith(FARM_PREFIX + ".")


def _layer(module: str) -> str:
    if _in_farm(module):
        return "L3"
    if module.startswith(L2_PREFIX):
        return "L2"
    return "L1"


def _violates(importer: str, imported: str) -> bool:
    if importer == COMPOSITION_ROOT:
        return False
    layer = _layer(importer)
    if layer == "L3":
        return imported.split(".")[0] not in FARM_MAY_IMPORT
    if layer == "L2":
        return (
            _in_farm(imported)
            or imported.startswith(L2_FORBIDDEN_PREFIXES)
            or (imported.startswith("transport") and imported != L2_PORT)
        )
    return _layer(imported) != "L1"


def current_violations() -> set[tuple[str, str]]:
    return {
        (_module_name(path), imported)
        for path in ROOT.rglob("*.py")
        for imported in _imports(path)
        if _violates(_module_name(path), imported)
    }


def test_no_new_layer_violations():
    new = current_violations() - KNOWN_VIOLATIONS
    assert not new, f"new layer violations (imports must point down): {sorted(new)}"


def test_known_violations_list_is_current():
    fixed = KNOWN_VIOLATIONS - current_violations()
    assert not fixed, f"fixed, remove from KNOWN_VIOLATIONS: {sorted(fixed)}"


def test_codecs_are_pure():
    """codecs/ (principle 2): stdlib only, nothing from HA, Tuya libs or the integration."""
    import sys

    codecs = ROOT / "entity_parser" / "valves" / "codecs"
    impure = []
    for path in codecs.glob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom) and node.level:
                if node.level > 1 or (node.module or "").split(".")[0] not in {p.stem for p in codecs.glob("*.py")} | {""}:
                    impure.append((path.name, "." * node.level + (node.module or "")))
                continue
            names = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module] if isinstance(node, ast.ImportFrom) else []
            impure += [(path.name, n) for n in names if n.split(".")[0] not in sys.stdlib_module_names | {"__future__"}]
    assert not impure, impure
