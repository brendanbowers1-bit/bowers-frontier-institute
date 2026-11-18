#!/usr/bin/env python3
"""Resolve the Weierstrass singularities of S_3 and count exceptional points.

The affine model is y^2 = x^3 - 27 u^2 x + u^3 (P(u-2)^2 - 54),
P(z) = z^4 - 4 z^2 + 2.  Over a prime field this script blows up the
isolated singularities until the proper transform is smooth and counts
the F_p-points that replace each singular point.
"""

from __future__ import annotations

import itertools
import os
import sys


def poly_from_terms(terms):
    return {k: v for k, v in terms.items() if v % PRIME != 0}


def mul_poly(f, g, p):
    out = {}
    for (a, b, c), ca in f.items():
        for (d, e, h), cb in g.items():
            key = (a + d, b + e, c + h)
            out[key] = (out.get(key, 0) + ca * cb) % p
    return {k: v for k, v in out.items() if v}


def add_poly(f, g, p):
    out = dict(f)
    for k, v in g.items():
        out[k] = (out.get(k, 0) + v) % p
        if out[k] == 0:
            del out[k]
    return out


def scale_poly(f, c, p):
    c %= p
    if c == 0:
        return {}
    return {k: (v * c) % p for k, v in f.items()}


def eval_poly(f, x, y, u, p):
    acc = 0
    for (i, j, k), c in f.items():
        acc = (acc + c * pow(x, i, p) * pow(y, j, p) * pow(u, k, p)) % p
    return acc


def deriv(f, idx, p):
    out = {}
    for key, c in f.items():
        exp = key[idx]
        if exp == 0:
            continue
        new = list(key)
        new[idx] = exp - 1
        out[tuple(new)] = (out.get(tuple(new), 0) + c * exp) % p
    return {k: v for k, v in out.items() if v}


def translate(f, x0, y0, u0, p):
    """F(x+x0, y+y0, u+u0)."""
    # Expand by substituting x = X + x0, etc. Use incremental multiplication.
    # Represent as polynomial in three variables and shift one variable at a time.
    def shift_var(poly, index, a):
        # poly(vars with var_index += a) = sum binom
        result = {}
        for key, c in poly.items():
            exp = key[index]
            # (t + a)^exp * monomial rest
            # distribute a^{exp-m} * C(exp, m) * t^m
            for m in range(exp + 1):
                coeff = c * comb(exp, m, p) * pow(a, exp - m, p) % p
                if coeff == 0:
                    continue
                new = list(key)
                new[index] = m
                new = tuple(new)
                result[new] = (result.get(new, 0) + coeff) % p
        return {k: v for k, v in result.items() if v}

    g = shift_var(f, 0, x0)
    g = shift_var(g, 1, y0)
    g = shift_var(g, 2, u0)
    return g


def comb(n, k, p):
    if k < 0 or k > n:
        return 0
    r = 1
    for i in range(k):
        r = r * (n - i) // (i + 1)
    return r % p


def lowest_degree(f):
    return min(sum(k) for k in f)


def proper_transform_chart(f, chart, p):
    """Blow up the origin. chart in {0,1,2} is the affine chart where that coordinate is the free one.

    Returns (equation in new coords (x,y,u), power extracted).
    Coordinates: chart 0 uses (x, y1, u1) with y=x*y1, u=x*u1, stored as (x,y1,u1).
    """
    # Substitute and track minimal power of the chart variable.
    if chart == 0:
        # x=x, y=x*y, u=x*u
        substituted = {}
        for (i, j, k), c in f.items():
            # x^i * (x y)^j * (x u)^k = x^{i+j+k} y^j u^k
            key = (i + j + k, j, k)
            substituted[key] = (substituted.get(key, 0) + c) % p
    elif chart == 1:
        # x=y*x, y=y, u=y*u -> x^i y^j u^k becomes (y x)^i * y^j * (y u)^k = x^i y^{i+j+k} u^k
        substituted = {}
        for (i, j, k), c in f.items():
            key = (i, i + j + k, k)
            substituted[key] = (substituted.get(key, 0) + c) % p
    else:
        # x=u*x, y=u*y, u=u -> x^i y^j u^{i+j+k}
        substituted = {}
        for (i, j, k), c in f.items():
            key = (i, j, i + j + k)
            substituted[key] = (substituted.get(key, 0) + c) % p
    substituted = {k: v for k, v in substituted.items() if v}
    if not substituted:
        return {}, 0
    idx = chart
    m = min(key[idx] for key in substituted)
    out = {}
    for key, c in substituted.items():
        new = list(key)
        new[idx] -= m
        out[tuple(new)] = c
    return out, m


def is_singular_origin(f, p):
    if eval_poly(f, 0, 0, 0, p) != 0:
        return False
    return all(eval_poly(deriv(f, i, p), 0, 0, 0, p) == 0 for i in range(3))


def all_singular_points(f, p):
    fx, fy, fu = deriv(f, 0, p), deriv(f, 1, p), deriv(f, 2, p)
    pts = []
    for x, y, u in itertools.product(range(p), repeat=3):
        if eval_poly(f, x, y, u, p) != 0:
            continue
        if any(eval_poly(d, x, y, u, p) != 0 for d in (fx, fy, fu)):
            continue
        pts.append((x, y, u))
    return pts


def singular_points_on_exceptional(f_chart, chart, p):
    """Singular points of the proper transform that lie on the exceptional divisor (chart coord = 0)."""
    fx = deriv(f_chart, 0, p)
    fy = deriv(f_chart, 1, p)
    fu = deriv(f_chart, 2, p)
    pts = []
    # exceptional: coordinate `chart` is 0. Loop the other two coordinates.
    ranges = [range(p), range(p), range(p)]
    ranges[chart] = [0]
    for x, y, u in itertools.product(*ranges):
        if eval_poly(f_chart, x, y, u, p) != 0:
            continue
        if eval_poly(fx, x, y, u, p) != 0:
            continue
        if eval_poly(fy, x, y, u, p) != 0:
            continue
        if eval_poly(fu, x, y, u, p) != 0:
            continue
        pts.append((x, y, u))
    return pts


def exceptional_points(f_chart, chart, p):
    ranges = [range(p), range(p), range(p)]
    ranges[chart] = [0]
    pts = []
    for x, y, u in itertools.product(*ranges):
        if eval_poly(f_chart, x, y, u, p) == 0:
            pts.append((chart, x, y, u))
    return pts


def direction_key(chart, x, y, u):
    """Projective direction [X:Y:U] represented by the chart point on the exceptional divisor."""
    if chart == 0:
        # point (0, y1, u1) is direction [1 : y1 : u1]
        return (1, y, u)
    if chart == 1:
        # (x1, 0, u1) is [x1 : 1 : u1]
        return (x, 1, u)
    return (x, y, 1)


def normalize_direction(triple, p):
    vals = [v % p for v in triple]
    for v in vals:
        if v != 0:
            inv = pow(v, p - 2, p)
            return tuple((x * inv) % p for x in vals)
    raise ValueError("zero direction")


def count_exceptional_replacement(f_local, p, depth=0, seen=None):
    """Return the number of smooth exceptional F_p-points over the origin, assuming f_local(0)=0 is an isolated singularity."""
    if depth > 8:
        raise RuntimeError("blow-up did not terminate")
    if seen is None:
        seen = set()
    # Collect exceptional points across charts, keyed by projective direction, and singular ones.
    smooth = {}
    singular_dirs = []
    for chart in range(3):
        g, m = proper_transform_chart(f_local, chart, p)
        if m <= 0 and g == f_local:
            continue
        for chart_id, x, y, u in exceptional_points(g, chart, p):
            key = normalize_direction(direction_key(chart, x, y, u), p)
            coords = (x, y, u)
            # singularity test at this chart point: translate g and test origin
            gt = translate(g, x, y, u, p)
            sing = is_singular_origin(gt, p)
            if sing:
                singular_dirs.append((key, gt, chart, coords))
            else:
                smooth[key] = True
    # A point may be recorded smooth in one chart and singular in another; singular wins.
    singular_keys = {}
    for key, gt, chart, coords in singular_dirs:
        singular_keys[key] = gt
        smooth.pop(key, None)
    total = len(smooth)
    if os.environ.get("BLOWUP_DEBUG"):
        print(f"    depth {depth}: smooth {len(smooth)} singular {len(singular_keys)} lowdeg {lowest_degree(f_local)}")
    # Recurse at each singular point. The same geometric point can appear in two charts; deduplicate by direction.
    for key, gt in singular_keys.items():
        marker = (depth, key)
        if marker in seen:
            continue
        seen.add(marker)
        total += count_exceptional_replacement(gt, p, depth + 1, seen)
    return total


def weierstrass_polynomial(p, s=3):
    """y^2 - x^3 + 27 u^2 x - u^3 ((u-2)^4 - 4(u-2)^2 + 2)^2 + 54 u^3, reduced mod p.
    Equation is y^2 = x^3 - 27 u^2 x + u^3 (P^2 - 54), so
    F = y^2 - x^3 + 27 u^2 x - u^3 P^2 + 54 u^3.
    """
    # Build P(u-2) as a polynomial in u, then square, then multiply by u^3.
    # P(z)=z^4-4z^2+2, z=u-2.
    # Use integer arithmetic then reduce.
    def mul_uni(f, g):
        out = [0] * (len(f) + len(g) - 1)
        for i, a in enumerate(f):
            for j, b in enumerate(g):
                out[i + j] += a * b
        return out

    def pow_uni(f, n):
        out = [1]
        for _ in range(n):
            out = mul_uni(out, f)
        return out

    z = [-2, 1]  # -2 + u
    P = pow_uni(z, 4)
    # subtract 4 z^2
    z2 = pow_uni(z, 2)
    P = [P[i] if i < len(P) else 0 for i in range(max(len(P), len(z2)))]
    for i, c in enumerate(z2):
        P[i] -= 4 * c
    P[0] += 2
    P2 = mul_uni(P, P)
    # F coefficients as dict (i,j,k) for x^i y^j u^k
    f = {}
    f[(0, 2, 0)] = 1  # y^2
    f[(3, 0, 0)] = -1  # -x^3
    f[(1, 0, 2)] = 27  # +27 u^2 x
    f[(0, 0, 3)] = 54  # +54 u^3
    # -u^3 P(u-2)^2
    for i, c in enumerate(P2):
        key = (0, 0, 3 + i)
        f[key] = f.get(key, 0) - c
    return {k: v % p for k, v in f.items() if v % p}


def affine_singular_points(f, p):
    fx, fy, fu = deriv(f, 0, p), deriv(f, 1, p), deriv(f, 2, p)
    pts = []
    for x, y, u in itertools.product(range(p), repeat=3):
        if eval_poly(f, x, y, u, p) != 0:
            continue
        if eval_poly(fx, x, y, u, p) != 0:
            continue
        if eval_poly(fy, x, y, u, p) != 0:
            continue
        if eval_poly(fu, x, y, u, p) != 0:
            continue
        pts.append((x, y, u))
    return pts


def naive_point_count(f, p):
    affine = sum(
        1
        for x, y, u in itertools.product(range(p), repeat=3)
        if eval_poly(f, x, y, u, p) == 0
    )
    # One smooth section point at infinity on each finite fiber, plus the
    # type II fiber at u = infinity: Y^2 = X^3 has p affine points and one
    # point at infinity.
    return affine, affine + p + (p + 1)


def main():
    global PRIME
    primes = [int(arg) for arg in sys.argv[1:]] or [5, 7, 11, 13, 17]
    for p in primes:
        PRIME = p
        if p <= 3:
            print("skip", p)
            continue
        f = weierstrass_polynomial(p)
        sings = affine_singular_points(f, p)
        affine, model = naive_point_count(f, p)
        print(f"p={p} affine={affine} model_with_sections={model} singular={sings}")
        if os.environ.get("BLOWUP_DEBUG") and p <= 7 and sings:
            local = translate(f, *sings[0], p)
            for chart in range(3):
                g, m = proper_transform_chart(local, chart, p)
                pts = all_singular_points(g, p)
                exc = [pt for pt in pts if pt[chart] == 0]
                print(f"  chart {chart} power {m} all-singular {pts} on-exceptional {exc}")
        for pt in sings:
            local = translate(f, pt[0], pt[1], pt[2], p)
            if not is_singular_origin(local, p):
                print("  not singular after translate", pt)
                continue
            replaced = count_exceptional_replacement(local, p)
            print(f"  blowup {pt}: exceptional smooth points {replaced}, net {(replaced - 1)}")


if __name__ == "__main__":
    main()
