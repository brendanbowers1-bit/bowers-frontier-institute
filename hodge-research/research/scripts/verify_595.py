#!/usr/bin/env python3
"""Run both iteration-595 verifiers and write a certificate.

The two verifiers are separate programs. This runner only executes them and
records their output. A nonzero status from either verifier fails the run.
"""

from __future__ import annotations

import json
import platform
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
CERT_DIR = ROOT / "research" / "certificates" / "iteration_595"


def run(script: Path) -> str:
    completed = subprocess.run(
        [sys.executable, str(script)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    output = completed.stdout
    if completed.stderr:
        output += "\n--- stderr ---\n" + completed.stderr
    if completed.returncode != 0:
        sys.stdout.write(output)
        raise SystemExit(f"verifier failed: {script.name} (exit {completed.returncode})")
    if "FAIL:" in completed.stdout:
        sys.stdout.write(output)
        raise SystemExit(f"verifier printed FAIL: {script.name}")
    return output


def main() -> None:
    CERT_DIR.mkdir(parents=True, exist_ok=True)
    stdlib_log = run(SCRIPT_DIR / "verify_595_stdlib.py")
    sympy_log = run(SCRIPT_DIR / "verify_595_sympy.py")
    (CERT_DIR / "stdlib.log").write_text(stdlib_log, encoding="utf-8")
    (CERT_DIR / "sympy.log").write_text(sympy_log, encoding="utf-8")
    summary = {
        "iteration": 595,
        "status": "passed",
        "python": sys.version.split()[0],
        "implementation": platform.python_implementation(),
        "verifiers": [
            "research/scripts/verify_595_stdlib.py",
            "research/scripts/verify_595_sympy.py",
        ],
        "theorems": {
            "field": "E=Q[t]/(t^4-4t^2+2) is a totally real cyclic quartic",
            "eigenvalue": "pi_* Psi^* pi^* acts on H^{2,0} by mu=zeta_16+zeta_16^{-1}",
            "prompt_eigenvalue_alpha": "zeta_16^7+zeta_16^9 = -mu",
            "kodaira": "I0*+4 I2+8 I1+II for s^3 not in {0,1}",
            "trivial_lattice_rank": 10,
            "flop": "special fiber of the Atiyah graph is the identity graph plus a reduced P^1 x P^1",
        },
        "not_proved": [
            "Mordell-Weil rank zero",
            "Picard rank exactly 10",
            "full Rosati self-adjointness on H^2",
            "unrestricted rational Hodge conjecture",
        ],
    }
    (CERT_DIR / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    software = (
        f"python {sys.version}\n"
        f"platform {platform.platform()}\n"
    )
    try:
        import sympy

        software += f"sympy {sympy.__version__}\n"
    except ImportError:
        software += "sympy missing\n"
    (CERT_DIR / "software.txt").write_text(software, encoding="utf-8")
    print("CERTIFICATE_WRITTEN", CERT_DIR)
    print(stdlib_log.splitlines()[-1])
    print(sympy_log.splitlines()[-1])


if __name__ == "__main__":
    main()
