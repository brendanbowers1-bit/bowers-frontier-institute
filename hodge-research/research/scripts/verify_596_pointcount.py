#!/usr/bin/env python3
"""Iteration 596: point counts of the resolved model of S_3, and the Weil obstruction.

The affine counts are recomputed. Exceptional corrections at rational double
points are checked against an independent blow-up on the prime fields where the
Kodaira type is the characteristic-zero type. The k=4 count used for the Weil test in the first draft of this file was 24
too large. Iteration 597 recomputes it and shows that the corrected quotient
is a Weil polynomial. This script still checks the blow-ups and the counts
through F_{7^3}, which were not affected.

This script does not claim that the Picard number is 10, and it does not claim
the Hodge conjecture.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "research" / "scripts" / "resolve_singularity.py"


def load_blowup():
    spec = importlib.util.spec_from_file_location("resolve_singularity", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def poly_roots_mod(coeffs, p):
    """Number of roots in F_p of a cubic or quartic, counting multiplicity."""
    return sum(1 for x in range(p) if eval_uni(coeffs, x, p) == 0)


def eval_uni(coeffs, x, p):
    acc = 0
    for c in reversed(coeffs):
        acc = (acc * x + c) % p
    return acc


def kodaira_exceptional_count(p):
    """Expected number of exceptional F_p-points over each rational surface singularity.

    Returns a dict u -> expected exceptional-point count for the standard
    reduction. Primes where the I_0* valuations jump are refused.
    """
    # Cubic of the I_0* fiber: T^3 - 27 T - 50.
    cubic = [-50 % p, -27 % p, 0, 1]
    nlin = poly_roots_mod(cubic, p)
    if nlin not in (0, 1, 3):
        return None
    # P(z) = z^4 - 4 z^2 + 2, z = u - 2. Rational I_2 base points.
    i2 = []
    for u in range(1, p):
        z = (u - 2) % p
        if (pow(z, 4, p) - 4 * pow(z, 2, p) + 2) % p == 0:
            i2.append(u)
    expected = {0: {0: p + 1, 1: 2 * p + 1, 3: 4 * p + 1}[nlin]}
    for u in i2:
        expected[u] = p + 1
    return expected


def check_blowups(blowup) -> None:
    # Good primes: v(Delta)=6, v(A)=2, v(B)=3 at u=0, and p does not divide
    # the discriminant 432(s^3-1) of the I_0* cubic. p=13 divides 26.
    primes = [7, 11, 17, 19, 23, 29, 31, 37, 41]
    for p in primes:
        expected = kodaira_exceptional_count(p)
        if expected is None:
            fail(f"cubic root count at p={p} is not 0, 1, or 3")
        polynomial = blowup.weierstrass_polynomial(p)
        singular = blowup.affine_singular_points(polynomial, p)
        by_u = {}
        for x, y, u in singular:
            by_u.setdefault(u, []).append((x, y, u))
        if set(by_u) != set(expected):
            fail(f"p={p} singular u-values {sorted(by_u)} != {sorted(expected)}")
        for u, points in by_u.items():
            if len(points) != 1:
                fail(f"p={p} u={u} has {len(points)} surface singularities")
            local = blowup.translate(polynomial, *points[0], p)
            counted = blowup.count_exceptional_replacement(local, p)
            if counted != expected[u]:
                fail(
                    f"p={p} u={u} blow-up counted {counted} exceptional points, "
                    f"Kodaira formula predicts {expected[u]}"
                )
    print("blow-up matches Kodaira corrections on 9 good primes")


class F7:
    """Elements of F_{7^k} as base-7 integers, for k = 1, 2, 3."""

    def __init__(self, k: int):
        self.p = 7
        self.k = k
        self.q = 7**k
        # t^2 + t + 6 = 0 and t^3 + t^2 + 3t + 1 = 0.
        mods = {1: (1, 0), 2: (1, 1, 6), 3: (1, 1, 3, 1)}
        mod = mods[k]
        n = k
        self.rel = [(-mod[n - i]) % 7 for i in range(n)]

    def mul(self, a: int, b: int) -> int:
        n, p = self.k, self.p
        coeff = [0] * (2 * n)
        aa = [(a // p**i) % p for i in range(n)]
        bb = [(b // p**i) % p for i in range(n)]
        for i, ai in enumerate(aa):
            if ai == 0:
                continue
            for j, bj in enumerate(bb):
                coeff[i + j] += ai * bj
        for degree in range(2 * n - 2, n - 1, -1):
            leading = coeff[degree] % p
            coeff[degree] = 0
            if leading == 0:
                continue
            shift = degree - n
            for i, rel in enumerate(self.rel):
                coeff[shift + i] += leading * rel
        out = 0
        for i in range(n):
            out += (coeff[i] % p) * p**i
        return out

    def _digits(self, a: int) -> list[int]:
        return [(a // self.p**i) % self.p for i in range(self.k)]

    def _pack(self, digits: list[int]) -> int:
        out = 0
        place = 1
        for digit in digits:
            out += digit * place
            place *= self.p
        return out

    def add(self, a: int, b: int) -> int:
        # Coefficients live in F_p and do not carry: p = 0 in the coefficient field.
        digits = []
        for _ in range(self.k):
            digits.append((a + b) % self.p)
            a //= self.p
            b //= self.p
        return self._pack(digits)

    def _neg(self, a: int) -> int:
        return self._pack([(-d) % self.p for d in self._digits(a)])

    def sub(self, a: int, b: int) -> int:
        return self.add(a, self._neg(b))

    def pow(self, a: int, e: int) -> int:
        out = 1
        while e:
            if e & 1:
                out = self.mul(out, a)
            a = self.mul(a, a)
            e >>= 1
        return out

    def legendre(self, a: int) -> int:
        if a == 0:
            return 0
        unit = self.pow(a, (self.q - 1) // 2)
        return 1 if unit == 1 else -1


def affine_count(field: F7) -> int:
    """Affine F_q-points of y^2 = x^3 - 27 u^2 x + u^3 (P(u-2)^2 - 54)."""
    q = field.q
    total = 0
    for u in range(q):
        uu = field.mul(u, u)
        # -27 ≡ 1 (mod 7), so A = u^2.
        minus27 = (-27) % 7
        amplitude = field.mul(minus27, uu)
        um2 = field.sub(u, 2)
        z2 = field.mul(um2, um2)
        z4 = field.mul(z2, z2)
        # P = z^4 - 4 z^2 + 2.
        pval = field.sub(z4, field.mul(4, z2))
        pval = field.add(pval, 2)
        p2 = field.mul(pval, pval)
        u3 = field.mul(uu, u)
        # 54 ≡ 5 (mod 7).
        bval = field.mul(u3, field.sub(p2, 54 % 7))
        for x in range(q):
            x2 = field.mul(x, x)
            rhs = field.add(field.mul(x2, x), field.add(field.mul(amplitude, x), bval))
            total += 1 + field.legendre(rhs)
    return total


def resolved_count(field: F7, affine: int) -> int:
    """Resolved point count from the affine count and the orbit corrections.

    Over F_7 the I_2 points and the I_1 points lie in F_{49}, and the three
    legs of I_0* lie in F_{343}. Each rational A_1 contributes net +q. The
    I_0* contribution is +q, +2q, or +4q according as 0, 1, or 3 legs are rational.
    """
    q = field.q
    k = field.k
    i2 = 4 if k % 2 == 0 else 0
    legs = 3 if k % 3 == 0 else 0
    i0_net = {0: q, 3: 4 * q}[legs]
    return affine + q + (q + 1) + i2 * q + i0_net


def check_counts() -> dict[int, int]:
    expected_affine = {1: 49, 2: 2513, 3: 117649}
    expected_n = {1: 71, 2: 2857, 3: 119708}
    counts = {}
    for k in (1, 2, 3):
        field = F7(k)
        affine = affine_count(field)
        if affine != expected_affine[k]:
            fail(f"F_7^{k} affine count {affine} != {expected_affine[k]}")
        resolved = resolved_count(field, affine)
        if resolved != expected_n[k]:
            fail(f"F_7^{k} resolved count {resolved} != {expected_n[k]}")
        counts[k] = resolved
        print(f"F_7^{k}: affine {affine}, resolved {resolved}")
    return counts


def check_odd_traces(counts: dict[int, int]) -> None:
    """Odd traces through k=3 match the rank-10 lattice. The old degree-12 obstruction is withdrawn."""
    p = 7

    def delta(k: int) -> int:
        return 2 if k % 3 == 0 else -1

    for k, npoints in counts.items():
        trace = npoints - 1 - p ** (2 * k)
        predicted = (6 + 2 * ((-1) ** k) + delta(k)) * p**k
        if k % 2 == 1 and trace != predicted:
            fail(f"odd trace at k={k} is {trace}, predicted Néron-Severi trace {predicted}")
    print("odd traces through k=3 match the rank-10 lattice; the k=4 obstruction is withdrawn")


def main() -> None:
    blowup = load_blowup()
    check_blowups(blowup)
    counts = check_counts()
    check_odd_traces(counts)
    print("ALL_596_CHECKS_PASSED")


if __name__ == "__main__":
    main()
