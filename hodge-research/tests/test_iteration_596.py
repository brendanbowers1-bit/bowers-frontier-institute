#!/usr/bin/env python3
"""Fail if the iteration-596 point-count verifier fails."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    script = ROOT / "research" / "scripts" / "verify_596_pointcount.py"
    completed = subprocess.run(
        [sys.executable, str(script)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    sys.stdout.write(completed.stdout)
    if completed.returncode != 0 or "ALL_596_CHECKS_PASSED" not in completed.stdout:
        sys.stderr.write(completed.stderr)
        raise SystemExit("verify_596_pointcount.py failed")


if __name__ == "__main__":
    main()
