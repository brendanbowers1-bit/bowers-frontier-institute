#!/usr/bin/env python3
"""Iteration 597: the corrected Frobenius polynomial of S_3 at p=7.

Iteration 596 recorded #X(F_{7^4}) = 5796137. Recounting the affine model and
applying the same exceptional-point correction gives 5796113. The quotient by
the rank-10 trivial lattice then has a unique Weil characteristic polynomial
of degree 12. Of the 22 eigenvalues, 14 are 7 times a root of unity.

This script does not claim that the Picard number over C is 10, and it does
not claim the Hodge conjecture.
"""

from __future__ import annotations

from math import gcd


# Monic irreducible used only to enumerate F_{7^4}: t^4 + t^3 + 1.
IRR = (1, 0, 0, 1)
Q4 = 7**4


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
    """Exact division, highest degree first."""
    f = f[:]
    degree = len(f) - len(g)
    if g[0] == 0:
        fail("bad divisor")
    quot = [0] * (degree + 1)
    for i in range(degree + 1):
        if f[i] % g[0] != 0:
            fail(f"division not integral at index {i}: {f[i]} / {g[0]}")
        quot[i] = f[i] // g[0]
        for j, coeff in enumerate(g):
            f[i + j] -= quot[i] * coeff
    if any(coeff != 0 for coeff in f[degree + 1 :]):
        fail(f"nonzero remainder {f[degree + 1 :]}")
    return quot


def eval_poly(coeffs, u):
    acc = 0
    for c in coeffs:
        acc = acc * u + c
    return acc


def irreducible_over_f7(low_to_high) -> None:
    coeffs = list(low_to_high) + [1]

    def ev(a):
        acc = 0
        for c in reversed(coeffs):
            acc = (acc * a + c) % 7
        return acc

    if any(ev(a) == 0 for a in range(7)):
        fail(f"{low_to_high} has a root in F_7")
    c0, c1, c2, c3 = low_to_high
    for a in range(7):
        for b in range(7):
            for c in range(7):
                for d in range(7):
                    if (
                        (b * d) % 7 == c0
                        and (a * d + b * c) % 7 == c1
                        and (b + d + a * c) % 7 == c2
                        and (a + c) % 7 == c3
                    ):
                        fail(f"{low_to_high} factors into quadratics over F_7")


def field_tables():
    irreducible_over_f7(IRR)
    rel = [(-c) % 7 for c in IRR]

    def mul(a, b):
        coeff = [0] * 8
        for i in range(4):
            ai = (a // 7**i) % 7
            if ai == 0:
                continue
            for j in range(4):
                coeff[i + j] += ai * ((b // 7**j) % 7)
        for degree in range(6, 3, -1):
            leading = coeff[degree] % 7
            coeff[degree] = 0
            if leading:
                for i, r in enumerate(rel):
                    coeff[degree - 4 + i] += leading * r
        out = 0
        for i in range(4):
            out += (coeff[i] % 7) * 7**i
        return out

    def powu(a, e):
        result = 1
        while e:
            if e & 1:
                result = mul(result, a)
            a = mul(a, a)
            e >>= 1
        return result

    q = Q4
    gen = 13
    if powu(gen, q - 1) != 1:
        fail("generator power")
    # 7^4 - 1 = 2^5 * 3 * 5^2. These three checks show that 13 is primitive.
    for divisor in (2, 3, 5):
        if powu(gen, (q - 1) // divisor) == 1:
            fail("generator is not primitive")
    log = [-1] * q
    x = 1
    for i in range(q - 1):
        log[x] = i
        x = mul(x, gen)
    if x != 1 or any(v < 0 for v in log[1:]):
        fail("log table is not bijective")
    return mul, log


def digits(a):
    return [(a // 7**i) % 7 for i in range(4)]


def pack(values):
    out = 0
    weight = 1
    for d in values:
        out += d * weight
        weight *= 7
    return out


def add(a, b):
    return pack((x + y) % 7 for x, y in zip(digits(a), digits(b)))


def sub(a, b):
    return pack((x - y) % 7 for x, y in zip(digits(a), digits(b)))


def count_f74(mul, log):
    q = Q4
    square = [mul(i, i) for i in range(q)]
    cube = [mul(square[i], i) for i in range(q)]
    affine = 0
    n_i2 = n_i1 = n_origin = 0
    for u in range(q):
        # -27 ≡ 1 (mod 7), so the Weierstrass coefficient A equals u^2.
        aa = square[u]
        z2 = square[sub(u, 2)]
        z4 = square[z2]
        pval = add(sub(z4, mul(4, z2)), 2)
        bb = mul(cube[u], sub(square[pval], 54 % 7))
        disc = add(mul(4, cube[aa]), mul(27 % 7, square[bb]))
        if disc == 0:
            if u == 0:
                n_origin += 1
            elif pval == 0:
                n_i2 += 1
            else:
                n_i1 += 1
        points = 0
        for x in range(q):
            rhs = add(cube[x], add(mul(aa, x), bb))
            if rhs == 0:
                points += 1
            else:
                points += 2 if (log[rhs] & 1) == 0 else 0
        affine += points
    if (n_origin, n_i2, n_i1) != (1, 4, 8):
        fail(f"singular fibers origin={n_origin} I2={n_i2} I1={n_i1}")
    # T^3 - 27 T - 50 ≡ T^3 + T + 6 (mod 7).
    if (-50) % 7 != 6 or (-27) % 7 != 1:
        fail("cubic reduction")
    nlin = sum(1 for t in range(q) if add(cube[t], add(t, 6)) == 0)
    if nlin != 0:
        fail(f"I_0* cubic has {nlin} roots over F_7^4")
    # Four rational A_1 singularities contribute net +q each. With no rational
    # leg, the I_0* singularity contributes net +q. Every finite fiber also
    # contributes its point at infinity, and the type II fiber contributes q+1.
    resolved = affine + q + (q + 1) + n_i2 * q + q
    return affine, resolved


def ns_trace(k: int) -> int:
    """Trace of Frob^k on the rank-10 trivial lattice at p=7.

    Six eigenvalues +7, two eigenvalues -7, and the pair 7ζ_3, 7ζ_3^2.
    """
    delta = 2 if k % 3 == 0 else -1
    return 7**k * (6 + 2 * ((-1) ** k) + delta)


def prove_quartic_on_the_circle(quotient) -> None:
    """Roots of a reciprocal quartic lie on |U|=49 when |U + 49^2/U| < 98."""
    one, a, b, c, d = quotient
    if one != 1:
        fail("quotient is not monic")
    radius_sq = 49**2
    if c != a * radius_sq or d != radius_sq**2:
        fail(f"quotient is not reciprocal: {quotient}")
    # σ = U + 49^2/U satisfies σ^2 + a σ + (b - 2*49^2) = 0.
    disc = a * a - 4 * (b - 2 * radius_sq)
    if disc != 392 or a != -154:
        fail(f"unexpected sigma equation a={a} disc={disc}")
    # Roots are 77 ± 7√2. Both are real and strictly inside (-98, 98):
    # 77 + 7√2 < 98  iff  √2 < 3, and 77 - 7√2 > -98 because it is positive.
    if not (2 < 9 and 121 > 2):
        fail("sqrt(2) comparison failed")
    # |σ| < 2*49 forces the quadratic U^2 - σ U + 49^2 = 0 to have
    # negative discriminant and roots of squared modulus 49^2.


def prove_not_root_of_unity(quotient) -> None:
    """U/49 is not an algebraic integer, so U is not 49 times a root of unity."""
    _one, a, b, c, d = quotient
    scaled = [49**4, a * 49**3, b * 49**2, c * 49, d]
    content = 0
    for coeff in scaled:
        content = gcd(content, coeff)
    primitive = [coeff // content for coeff in scaled]
    if primitive != [7, -22, 31, -22, 7]:
        fail(f"normalized polynomial {primitive}")
    # Rational roots of 7y^4 - 22y^3 + 31y^2 - 22y + 7 would be ±1, ±7.
    for y in (1, -1, 7, -7):
        if eval_poly(primitive, y) == 0:
            fail(f"rational root {y}")
    # Leading coefficient 7 is prime, so a nontrivial factorization has the
    # shape (7y^2 + r y + s)(y^2 + t y + u) with s u = 7.
    for s, u in ((1, 7), (-1, -7), (7, 1), (-7, -1)):
        # r = -22 - 7t, and t (s - 7u) = 22(u - 1).
        slope = s - 7 * u
        rhs = 22 * (u - 1)
        if slope == 0:
            if rhs != 0:
                continue
            # (s, u) = (7, 1): every integer t satisfies the linear conditions,
            # and the quadratic coefficient becomes 7t^2 + 22t + 17.
            if (s, u) != (7, 1):
                fail(f"unexpected slope-zero pair {(s, u)}")
            if 22 * 22 - 4 * 7 * 17 != 8:
                fail("discriminant of 7t^2 + 22t + 17 changed")
            # 8 lies strictly between 2^2 and 3^2, so it is not a square.
            if 2 * 2 < 8 < 3 * 3:
                continue
            fail("discriminant 8 is a square")
        if rhs % slope != 0:
            continue
        t = rhs // slope
        r = -22 - 7 * t
        if 7 * u + r * t + s == 31:
            fail(f"quadratic factor with r={r}, s={s}, t={t}, u={u}")


def prove_negative_sign_off_circle(coeffs) -> None:
    left, right = eval_poly(coeffs, 39), eval_poly(coeffs, 40)
    if left >= 0 or right <= 0:
        fail(f"expected a sign change on (39, 40), got {left}, {right}")


def substitute_square(quotient):
    """q(T^2) from a degree-4 polynomial, highest degree first."""
    out = [0] * 9
    for i, coeff in enumerate(quotient):
        degree_in_u = 4 - i
        out[8 - 2 * degree_in_u] = coeff
    return out


def candidate_power_sums(psi, quotient):
    tr = poly_mul(poly_pow([1, 0, 49], 2), substitute_square(quotient))
    ns = poly_mul(poly_pow([1, -7], 6), poly_pow([1, 7], 2))
    ns = poly_mul(ns, [1, 7, 49])
    full = poly_mul(ns, tr)
    if len(full) != 23 or full[0] != 1:
        fail(f"full degree {len(full) - 1}")
    # (T^2+49) and the trivial-lattice factor are coprime: neither ±7 is a root
    # of T^2+49, and T^2+7T+49 does not vanish at a root of T^2+49.
    if eval_poly([1, 0, 49], 7) == 0 or eval_poly([1, 0, 49], -7) == 0:
        fail("T^2+49 meets ±7")
    powers = []
    for k in range(1, 9):
        acc = k * full[k]
        for i in range(1, k):
            acc += full[i] * powers[k - 1 - i]
        powers.append(-acc)
    return powers


def main() -> None:
    mul, log = field_tables()
    affine, resolved = count_f74(mul, log)
    if (affine, resolved) != (5779305, 5796113):
        fail(f"F_7^4 affine {affine} resolved {resolved}")
    print(f"F_7^4: affine {affine}, resolved {resolved}")

    recorded = {
        1: 71,
        2: 2857,
        3: 119708,
        4: resolved,
        5: 282525671,
        6: 13841691256,
        7: 678225543479,
    }
    traces = []
    gaps = []
    for k in range(1, 8):
        trace = recorded[k] - 1 - 7 ** (2 * k)
        gap = trace - ns_trace(k)
        traces.append(trace)
        gaps.append(gap)
        if k % 2 == 1 and gap != 0:
            fail(f"odd gap at k={k} is {gap}")
    if gaps != [0, 112, 0, 14504, 0, -772436, 0]:
        fail(f"gaps {gaps}")

    e2 = -112 // 2
    e4 = -(14504 + e2 * 112) // 4
    e6 = -(-772436 + e2 * 14504 + e4 * 112) // 6
    if (e2, e4, e6) != (-56, -2058, 302526):
        fail(f"Newton {(e2, e4, e6)}")
    if (-772436 + e2 * 14504 + e4 * 112) % 6 != 0:
        fail("e6 division")

    positive = [1, e2, e4, e6, 7**4 * e4, 7**8 * e2, 7**12]
    negative = [1, e2, e4, 0, -(7**4) * e4, -(7**8) * e2, -(7**12)]
    if eval_poly(positive, -49) != 0:
        fail("positive polynomial does not vanish at -49")
    quotient = poly_divmod(positive, poly_mul([1, 49], [1, 49]))
    if eval_poly(quotient, -49) == 0:
        fail("multiplicity of U+49 is not exactly 2")
    prove_quartic_on_the_circle(quotient)
    prove_not_root_of_unity(quotient)
    prove_negative_sign_off_circle(negative)

    powers = candidate_power_sums(positive, quotient)
    if powers[:7] != traces:
        fail(f"power sums {powers[:7]} != {traces}")
    # Census of X(F_{7^8}) by ellap on the smooth fibers, in four index blocks
    # of a primitive-element enumeration, plus the 13 singular fibers. This
    # trace was not used to determine the polynomial.
    q8 = 7**8
    smooth = 8308221290779 + 8308219192329 + 8308200803468 + 8308212345380
    singular = 103766419
    trace8 = smooth + singular + (q8 + 1) - 1 - q8**2
    if trace8 != powers[7]:
        fail(f"k=8 trace {trace8} != predicted {powers[7]}")
    print(f"traces k=1..7: {traces}")
    print(f"k=8 trace {trace8} matches the predicted Weil polynomial")
    print("unique Weil complement of degree 12; 14 roots are 7 times a root of unity")
    print("ALL_597_CHECKS_PASSED")


if __name__ == "__main__":
    main()
