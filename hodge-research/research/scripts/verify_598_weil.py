#!/usr/bin/env python3
"""Iteration 598: Frobenius of S_3 at the good prime 11.

The quotient of H^2 by the rank-10 trivial lattice has a unique weight-2
Weil polynomial of degree 12. Exactly four of its roots are 11 times a root
of unity, so the geometric Picard number of the reduction is 14.

This script does not claim that the Picard number over C is 10, and it does
not claim the Hodge conjecture.
"""

from __future__ import annotations

from math import gcd


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def poly_mul(f, g):
    out = [0] * (len(f) + len(g) - 1)
    for i, a in enumerate(f):
        for j, b in enumerate(g):
            out[i + j] += a * b
    return out


def poly_pow(f, n):
    out = [1]
    for _ in range(n):
        out = poly_mul(out, f)
    return out


def poly_divmod(f, g):
    f = f[:]
    if not g or g[0] == 0:
        fail("bad divisor")
    degree = len(f) - len(g)
    if degree < 0:
        fail("divisor degree too high")
    quot = [0] * (degree + 1)
    for i in range(degree + 1):
        if f[i] % g[0] != 0:
            fail(f"division not integral at {i}")
        quot[i] = f[i] // g[0]
        for j, coeff in enumerate(g):
            f[i + j] -= quot[i] * coeff
    if any(coeff != 0 for coeff in f[degree + 1 :]):
        fail(f"nonzero remainder {f[degree + 1 :]}")
    return quot


def eval_poly(coeffs, x):
    acc = 0
    for c in coeffs:
        acc = acc * x + c
    return acc


def pow_sums(coeffs, nterms):
    degree = len(coeffs) - 1
    powers = []
    for k in range(1, nterms + 1):
        if k <= degree:
            acc = k * coeffs[k]
            for i in range(1, k):
                acc += coeffs[i] * powers[k - 1 - i]
            powers.append(-acc)
        else:
            acc = 0
            for i in range(1, degree + 1):
                acc += coeffs[i] * powers[k - 1 - i]
            powers.append(-acc)
    return powers


def newton(power):
    degree = len(power)
    coeffs = [0] * (degree + 1)
    coeffs[0] = 1
    for k in range(1, degree + 1):
        acc = power[k - 1]
        for i in range(1, k):
            acc += coeffs[i] * power[k - 1 - i]
        if acc % k != 0:
            fail(f"Newton division at k={k}: {acc}")
        coeffs[k] = -acc // k
    return coeffs


def chi(a, p):
    a %= p
    if a == 0:
        return 0
    return 1 if pow(a, (p - 1) // 2, p) == 1 else -1


def count_f11():
    """Resolved count over F_11 by character sums, with the node formula."""
    p = 11
    q = p
    total = 0
    nsing = 0
    for u in range(p):
        z = (u - 2) % p
        poly = (pow(z, 4, p) - 4 * z * z + 2) % p
        A = (-27 * u * u) % p
        B = (pow(u, 3, p) * (poly * poly - 54)) % p
        disc = (4 * pow(A, 3, p) + 27 * B * B) % p
        if disc != 0:
            acc = 0
            for x in range(p):
                rhs = (pow(x, 3, p) + A * x + B) % p
                acc += 1 + chi(rhs, p)
            total += acc + 1
            continue
        nsing += 1
        acc = 0
        for x in range(p):
            rhs = (pow(x, 3, p) + A * x + B) % p
            acc += 1 + chi(rhs, p)
        if A == 0 and B == 0:
            s = q
        else:
            r = (-3 * B * pow((2 * A) % p, -1, p)) % p
            s = q - chi((3 * r) % p, p)
        if acc != s:
            fail(f"singular formula at u={u}: {acc} != {s}")
        if u == 0:
            nlin = sum(1 for t in range(p) if (pow(t, 3, p) - 27 * t - 50) % p == 0)
            exc = {0: q + 1, 1: 2 * q + 1, 3: 4 * q + 1}[nlin]
            total += s + exc
        elif poly == 0:
            total += s + q + 1
        else:
            total += s + 1
    return total + q + 1, nsing


def ns_trace(k: int) -> int:
    """Trace of Frob^k on the rank-10 trivial lattice at p=11.

    Five eigenvalues +11, one eigenvalue -11, the pair ±11i, and 11ζ_3, 11ζ_3^2.
    """
    p = 11
    eps = (2, 0, -2, 0)[k % 4]
    delta = 2 if k % 3 == 0 else -1
    return p**k * (5 + (-1) ** k + eps + delta)


def component_trace(k: int) -> int:
    """Same trace from rational components: section, fiber, central, legs, I_2."""
    nlin = 3 if k % 3 == 0 else 0
    n_i2 = 4 if k % 4 == 0 else 0
    return 11**k * (3 + nlin + n_i2)


def cyclotomic_up_to(n):
    built = {}
    for m in range(1, n + 1):
        num = [1] + [0] * (m - 1) + [-1]
        d = 1
        while d * d <= m:
            if m % d == 0:
                for div in {d, m // d}:
                    if div != m:
                        num = poly_divmod(num, built[div])
            d += 1
        built[m] = num
    return built


def scaled_cyclotomic(phi, p):
    deg = len(phi) - 1
    out = []
    for i, coeff in enumerate(phi):
        power = deg - i
        out.append(coeff * p ** (deg - power))
    return out


def count_p_zeta(poly, p, phis):
    remaining = poly[:]
    total = 0
    details = []
    for n, phi in phis.items():
        if len(phi) - 1 > len(remaining) - 1:
            continue
        factor = scaled_cyclotomic(phi, p)
        mult = 0
        while True:
            quot = None
            try:
                quot = poly_divmod(remaining, factor)
            except SystemExit:
                quot = None
            if quot is None:
                break
            remaining = quot
            mult += 1
        if mult:
            total += mult * (len(phi) - 1)
            details.append((n, mult))
    return total, details, remaining


def good_reduction():
    p = 11
    if pow(3, 3, p) in (0, 1):
        fail("s^3 meets 0 or 1")
    # P and P' share no root: P'(z)=4z(z^2-2), and P(0)=2, P= -2 when z^2=2.
    if 2 % p == 0 or (-2) % p == 0:
        fail("P is inseparable")
    # P^2 - 4 s^3 = P^2 - 108 is separable: a common root with the derivative
    # forces P=0 or P'=0, and neither makes P^2 = 108.
    if (108 % p) == 0 or (4 - 108) % p == 0:
        fail("I_1 roots are not simple")
    disc = 432 * (27 - 1)
    if disc % p == 0:
        fail("I_0* cubic discriminant vanishes")
    # Infinity: Q(0)=1, so the integral model still has v(B)=1 and type II.
    if 1 % p == 0:
        fail("type II coefficient vanished")


def main() -> None:
    good_reduction()
    resolved, nsing = count_f11()
    if (resolved, nsing) != (155, 3):
        fail(f"F_11 count {resolved}, singular places {nsing}")

    # k=2..5 were reproduced by ellap and by an independent baby-step count.
    # k=6 is the sum of four index blocks of that same baby-step count.
    shards = (784615253189, 784605630808, 784607351097, 784608999432)
    recorded = {
        1: resolved,
        2: 15005,
        3: 1779548,
        4: 214386833,
        5: 25937907755,
        6: sum(shards) + 11**6 + 1,
    }
    if recorded[6] != 3138439006088:
        fail(f"k=6 assembly {recorded[6]}")

    gaps = []
    traces = []
    for k in range(1, 7):
        if ns_trace(k) != component_trace(k):
            fail(f"lattice formulas differ at k={k}")
        trace = recorded[k] - 1 - 11 ** (2 * k)
        gap = trace - ns_trace(k)
        traces.append(trace)
        gaps.append(gap)
    if gaps != [0, 0, 0, -74536, 0, 0]:
        fail(f"gaps {gaps}")

    half = newton(gaps)
    if half != [1, 0, 0, 0, 18634, 0, 0]:
        fail(f"Newton {half}")

    p = 11
    positive = [0] * 13
    negative = [0] * 13
    positive[0] = negative[0] = 1
    for m in range(1, 7):
        positive[m] = half[m]
        negative[m] = 0 if m == 6 else half[m]
    for m in range(6):
        positive[12 - m] = p ** (2 * (6 - m)) * positive[m]
        negative[12 - m] = -(p ** (2 * (6 - m))) * negative[m]

    # W = T^4. Positive cubic: (W + 11^4)(W^2 + 3993 W + 11^8).
    radius = p**4
    if 18634 - radius != 3993:
        fail("3993 identity")
    if 3993 != 3 * p**3:
        fail("3993 factorization")
    quadratic = [1, 3993, radius**2]
    cubic = poly_mul([1, radius], quadratic)
    # Expand cubic in W back to a polynomial in T.
    expanded = [0] * 13
    for i, coeff in enumerate(cubic):
        expanded[4 * i] = coeff
    if expanded != positive:
        fail("positive polynomial is not (T^4+11^4)(T^8+3993 T^4+11^8)")

    disc = 3993 * 3993 - 4 * radius * radius
    if not disc < 0:
        fail("positive quadratic discriminant is not negative")
    # Complex conjugate roots of W^2 + 3993 W + 11^8 have product 11^8,
    # so each has absolute value 11^4. Every fourth root then has absolute
    # value 11. The factor W+11^4 contributes the same absolute value.

    # Negative sign: (W - 11^4)(W^2 + 33275 W + 11^8), two real W-roots.
    if 18634 + radius != 33275:
        fail("33275 identity")
    neg_quad = [1, 33275, radius**2]
    neg_cubic = poly_mul([1, -radius], neg_quad)
    neg_expanded = [0] * 13
    for i, coeff in enumerate(neg_cubic):
        neg_expanded[4 * i] = coeff
    if neg_expanded != negative:
        fail("negative polynomial factorization")
    neg_disc = 33275 * 33275 - 4 * radius * radius
    if neg_disc <= 0:
        fail("negative quadratic is not real")
    # Absolute values of the two real roots sum to 33275 and multiply to 11^8.
    # Their sum exceeds 2*11^4, so they are not equal and one exceeds 11^4.
    if 33275 <= 2 * radius:
        fail("real roots could still lie on the circle")

    # y = W/11^4 on the positive quadratic satisfies 11 y^2 + 3 y + 11 = 0.
    # Content 1, leading coefficient 11, discriminant not a square.
    if gcd(11, 3) != 1:
        fail("content")
    ydisc = 3 * 3 - 4 * 11 * 11
    if ydisc != -475:
        fail(f"y discriminant {ydisc}")
    # -475 lies strictly between -22^2 and -21^2, so it is not a square.
    if not (-(22 * 22) < ydisc < -(21 * 21)):
        fail("discriminant comparison")

    eighth = [1, 0, 0, 0, radius]  # T^4 + 11^4 = 11^4 Phi_8(T/11)
    phis = cyclotomic_up_to(16)
    if scaled_cyclotomic(phis[8], p) != eighth:
        fail("Phi_8 scaling")
    alg, details, rest = count_p_zeta(positive, p, phis)
    if alg != 4 or details != [(8, 1)]:
        fail(f"algebraic roots in the quotient: {alg} {details}")
    if len(rest) != 9:
        fail(f"remaining degree {len(rest) - 1}")

    trivial = poly_mul(poly_pow([1, -p], 5), [1, p])
    trivial = poly_mul(trivial, [1, 0, p * p])
    trivial = poly_mul(trivial, [1, p, p * p])
    # The new factor shares no root with the trivial lattice.
    for factor in ([1, -p], [1, p], [1, 0, p * p], [1, p, p * p]):
        try:
            poly_divmod(eighth, factor)
        except SystemExit:
            continue
        fail(f"{factor} divides T^4+11^4")
    full = poly_mul(trivial, positive)
    if len(full) != 23 or full[0] != 1 or full[-1] != -(p**22):
        fail(f"full polynomial lead/constant {full[0]} {full[-1]}")
    if pow_sums(full, 6) != traces:
        fail(f"power sums {pow_sums(full, 6)}")

    print(f"F_11 resolved count {resolved}")
    print(f"traces k=1..6: {traces}")
    print("unique Weil complement; 14 roots are 11 times a root of unity")
    print("ALL_598_CHECKS_PASSED")


if __name__ == "__main__":
    main()
