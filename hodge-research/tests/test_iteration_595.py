#!/usr/bin/env python3
"""Fail if either independent iteration-595 verifier fails."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run(name: str) -> None:
    script = ROOT / "research" / "scripts" / name
    completed = subprocess.run(
        [sys.executable, str(script)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0 or "FAIL:" in completed.stdout:
        sys.stderr.write(completed.stdout)
        sys.stderr.write(completed.stderr)
        raise SystemExit(f"{name} failed")
    print(completed.stdout.splitlines()[-1])


def main() -> None:
    run("verify_595_stdlib.py")
    run("verify_595_sympy.py")
    print("TESTS_PASSED")


if __name__ == "__main__":
    main()
