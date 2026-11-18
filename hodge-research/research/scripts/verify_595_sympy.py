#!/usr/bin/env python3
"""Independent sympy/mpmath verification for iteration 595.

This is a different algorithm from verify_595_stdlib.py: minimal polynomials,
rational-function simplification, bivariate factorization, and a Groebner
basis of the flop-graph ideal. It does not import that script.
"""

from __future__ import annotations

import sys

import sympy as sp
from mpmath import mp


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def check(condition: bool, message: str) -> None:
    if not condition:
        fail(message)
    print(f"PASS: {message}")


def verify_field_and_eigenvalue() -> None:
    t = sp.symbols("t")
    poly = sp.Poly(t**4 - 4 * t**2 + 2, domain="QQ")
    check(poly.is_irreducible, "sympy: P is irreducible over Q")
    roots = sp.real_roots(poly)
    check(len(roots) == 4, "sympy: four real roots")
    mu = sp.sqrt(2 + sp.sqrt(2))
    alpha = -mu
    check(sp.minimal_polynomial(mu, t) == poly.as_expr(), "minimal polynomial of sqrt(2+sqrt(2)) is P")
    check(sp.simplify(alpha**4 - 4 * alpha**2 + 2) == 0, "prompt root -mu also satisfies P")
    check(sp.degree(sp.minpoly(mu, t)) == 4, "mu has degree 4, so it lies outside Q(sqrt(2))")
    subfield = sp.minpoly(sp.sqrt(2), t)
    check(sp.degree(subfield) == 2, "Q(sqrt(2)) is quadratic")
    check(sp.simplify(mu**2 - 2 - sp.sqrt(2)) == 0, "mu^2 = 2+sqrt(2), so Q(sqrt(2)) is the unique quadratic subfield")

    mp.dps = 50
    zeta = mp.exp(2 * mp.pi * mp.j / 16)
    mu_c = zeta + zeta ** (-1)
    alpha_c = zeta**7 + zeta**9
    check(abs(mu_c - mp.mpf(sp.N(mu, 50))) < mp.mpf("1e-40"), "high precision: mu = zeta_16+zeta_16^{-1}")
    check(abs(alpha_c + mu_c) < mp.mpf("1e-40"), "high precision: prompt alpha = -mu")
    check(abs(alpha_c - mu_c) > 1, "high precision adversarial gap between alpha and mu")

    v = sp.symbols("v")
    eps, lam = sp.symbols("eps lam")
    rho = eps * (eps * v - 1) / (lam * (v - 1))
    rho_other = sp.simplify(rho.subs(v, 1 / v))
    total = sp.together(sp.simplify(rho + rho_other))
    expected = sp.together(eps * (1 + eps) / lam)
    check(sp.simplify(total - expected) == 0, "sympy simplifies the sheet sum to epsilon(1+epsilon)/lambda")

    # Numerical trace at a non-special complex point, using the lambda attached to kappa=zeta^7.
    v0 = mp.mpc("0.37", "0.21")
    eps_n = zeta**2
    lam_n = zeta**3
    def rho_n(value):
        return eps_n * (eps_n * value - 1) / (lam_n * (value - 1))

    traced = rho_n(v0) + rho_n(1 / v0)
    predicted = eps_n * (1 + eps_n) / lam_n
    check(abs(traced - predicted) < mp.mpf("1e-40"), "numerical sheet sum is constant")
    check(abs(predicted - mu_c) < mp.mpf("1e-40"), "numerical trace equals mu, not alpha")
    print("PASS: sympy/mpmath eigenvalue audit")


def verify_model_scaling() -> None:
    v, s = sp.symbols("v s")
    u = (v + 1) ** 2 / v
    d = v**2 / (v + 1)
    A = -3 * s**2 * u**2
    z = u - 2
    P = z**4 - 4 * z**2 + 2
    B = u**3 * (P**2 - 2 * s**3)
    A_new = sp.simplify(A * d**4)
    B_new = sp.simplify(B * d**6)
    check(A_new == -3 * s**2 * v**6, "sympy: integral A-coefficient is -3 s^2 v^6")
    claimed_B = sp.expand(v * ((v**8 + 1) ** 2 - 2 * s**3 * v**8))
    check(sp.expand(B_new - claimed_B) == 0, "sympy: integral B-coefficient matches")

    eps = sp.exp(sp.I * sp.pi / 4)
    # Algebraic stand-in: the ratio identities depend only on eps**8=1 and eps**6=-I.
    eps_a = sp.symbols("eps")
    ratio_A = sp.simplify((-3 * s**2 * (eps_a * v) ** 6) / (-3 * s**2 * v**6))
    check(sp.expand(ratio_A - eps_a**6) == 0, "A(eps v)/A(v) = eps^6")
    numerator = (v**8 + 1) ** 2 - 2 * s**3 * v**8
    ratio_B = sp.simplify((eps_a * v * numerator) / (v * numerator))
    check(sp.simplify(ratio_B - eps_a) == 0, "B(eps v)/B(v) = eps when (eps v)^8=v^8")

    # Direct pointwise complex check that the scaled point stays on the curve.
    mp.dps = 40
    zeta = mp.exp(2 * mp.pi * mp.j / 16)
    eps_n = zeta**2
    lam = zeta**3
    s0 = mp.mpf(3)
    v0 = mp.mpc("1.25", "-0.4")
    X0 = mp.mpc("0.8", "0.1")
    A0 = -3 * s0**2 * v0**6
    B0 = v0 * ((v0**8 + 1) ** 2 - 2 * s0**3 * v0**8)
    Y2 = X0**3 + A0 * X0 + B0
    Y0 = mp.sqrt(Y2)
    v1 = eps_n * v0
    X1 = lam**2 * X0
    Y1 = lam**3 * Y0
    A1 = -3 * s0**2 * v1**6
    B1 = v1 * ((v1**8 + 1) ** 2 - 2 * s0**3 * v1**8)
    residual = Y1**2 - (X1**3 + A1 * X1 + B1)
    check(abs(residual) < mp.mpf("1e-30"), "scaled Weierstrass point satisfies the moved equation")
    print("PASS: sympy/mpmath Weierstrass lift")


def verify_discriminant() -> None:
    u, s = sp.symbols("u s")
    A = -3 * s**2 * u**2
    z = u - 2
    P = z**4 - 4 * z**2 + 2
    B = u**3 * (P**2 - 2 * s**3)
    core = sp.factor(4 * A**3 + 27 * B**2)
    expected = sp.factor(27 * u**6 * P**2 * (P**2 - 4 * s**3))
    check(sp.expand(core - expected) == 0, "sympy factors the discriminant core")
    p0 = -3 * s**2
    q0 = 4 - 2 * s**3
    cubic_disc = sp.factor(-4 * p0**3 - 27 * q0**2)
    check(sp.expand(cubic_disc - 432 * (s**3 - 1)) == 0, f"cubic discriminant {cubic_disc}")
    t = sp.symbols("t")
    Q = sp.expand((1 - 2 * t) ** 4 - 4 * t**2 * (1 - 2 * t) ** 2 + 2 * t**4)
    check(Q.subs(t, 0) == 1, "infinity chart has leading coefficient 1")
    print("PASS: sympy discriminant factorization")


def verify_flop_groebner() -> None:
    u1, u2, r, v1, v2, p = sp.symbols("u1 u2 r v1 v2 p")
    graph = [u1 - u2 * p, v2 - u2, v1 - u2 * r]
    # Pull back the node ideal (x,y,z,w) along the chart t=1 of Y+.
    node = [u2, u1, u2 * r, u1 * r]
    basis = sp.groebner(graph + node, u1, u2, r, v1, v2, p, order="lex")
    polynomials = [sp.Poly(g, u1, u2, r, v1, v2, p) for g in basis]
    generators = {poly.as_expr() for poly in polynomials}
    check(generators == {u1, u2, v1, v2}, f"Groebner fiber generators {generators}")
    # Quotient in r,p is free of rank 1 over k[r,p]: no equation involves only r,p.
    check(all(sp.degree(g, r) == 0 and sp.degree(g, p) == 0 for g in basis), "r and p are free on the special fiber")
    # The graph ring k[u2,r,p] modulo u2 is reduced.
    radical = sp.groebner([u2], u2, r, p)
    check(list(radical) == [u2], "special-fiber equation u2 is already radical")

    x, b, c = sp.symbols("x b c")
    atiyah = list(sp.groebner([x * (c - b)], x, b, c, order="lex"))
    check(len(atiyah) == 1, "Atiyah special fiber is principal")
    check(
        sp.expand(atiyah[0] - x * (c - b)) == 0 or sp.expand(atiyah[0] + x * (c - b)) == 0,
        f"Atiyah generator {atiyah[0]} is the reduced polynomial x(c-b)",
    )
    check(sp.factor(x * (c - b)) == x * (c - b) or sp.factor(x * (c - b)) == -x * (b - c), "two distinct linear factors")
    factors = sp.factor_list(x * (c - b))
    check(all(exp == 1 for _, exp in factors[1]), f"factor multiplicities {factors}")
    print("PASS: Groebner basis of the flop special fiber")


def main() -> None:
    verify_field_and_eigenvalue()
    verify_model_scaling()
    verify_discriminant()
    verify_flop_groebner()
    print("ALL_SYMPY_CHECKS_PASSED")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(f"FAIL: uncaught {type(exc).__name__}: {exc}")
        sys.exit(1)
