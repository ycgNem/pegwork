"""Rebuild every family sheet: each art/<family>/build_*.py exposes sprites() -> [(name, Sprite,
frame, pivot)]; their sprites are packed into src/art/<family>.png + .json (common.pack).
Usage: python art/build_all.py"""
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import pack  # noqa: E402

for fam in sorted(p for p in HERE.iterdir() if p.is_dir() and list(p.glob("build_*.py"))):
    entries = []
    for script in sorted(fam.glob("build_*.py")):
        spec = importlib.util.spec_from_file_location(f"{fam.name}.{script.stem}", script)
        mod = importlib.util.module_from_spec(spec)
        sys.path.insert(0, str(fam))
        spec.loader.exec_module(mod)
        entries += mod.sprites()
    pack(fam.name, entries)
