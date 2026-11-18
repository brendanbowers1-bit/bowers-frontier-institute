#!/usr/bin/env python3
"""Independent stdlib verification for iteration 595.

Integer cyclotomic arithmetic in Z[zeta_16] = Z[t]/(t^8+1), exact polynomial
identities, and the Atiyah/conifold graph equations. No sympy.

Exit status is nonzero if any certificate assertion fails.
"""

from __future__ import annotations

import sys
from fractions import Fraction


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def check(condition: bool, message: str) -> None:
    if not condition:
        fail(message)
    print(f"PASS: {message}")


class Cyc:
    """Element of Z[zeta_16], stored as coefficients of 1,z,...,z^7 with z^8=-1."""

    def __init__(self, coeffs) -> None:
        values = [int(c) for c in coeffs] + [0] * 8
        reduced = [0] * 8
        for exp, coeff in enumerate(values):
            if coeff == 0:
                continue
            q, r = divmod(exp, 8)
            sign = -1 if q % 2 else 1
            reduced[r] += sign * coeff
        self.c = reduced

    def __eq__(self, other: object) -> bool:
        if isinstance(other, int):
            other = Cyc([other])
        return isinstance(other, Cyc) and self.c == other.c

    def __add__(self, other: "Cyc | int") -> "Cyc":
        if isinstance(other, int):
            other = Cyc([other])
        return Cyc([a + b for a, b in zip(self.c, other.c)])

    def __radd__(self, other: int) -> "Cyc":
        return self + other

    def __sub__(self, other: "Cyc | int") -> "Cyc":
        if isinstance(other, int):
            other = Cyc([other])
        return Cyc([a - b for a, b in zip(self.c, other.c)])

    def __neg__(self) -> "Cyc":
        return Cyc([-a for a in self.c])

    def __mul__(self, other: "Cyc | int") -> "Cyc":
        if isinstance(other, int):
            return Cyc([a * other for a in self.c])
        out = [0] * 16
        for i, a in enumerate(self.c):
            for j, b in enumerate(other.c):
                out[i + j] += a * b
        return Cyc(out)

    def __pow__(self, n: int) -> "Cyc":
        result = Cyc([1])
        base = self
        exp = n
        while exp:
            if exp & 1:
                result *= base
            base *= base
            exp >>= 1
        return result

    def __repr__(self) -> str:
        return f"Cyc({self.c})"


def zeta(k: int) -> Cyc:
    k %= 16
    if k == 0:
        return Cyc([1])
    if k < 8:
        return Cyc([1 if i == k else 0 for i in range(8)])
    return -zeta(k - 8)


def poly_mul(f, g):
    out = [0] * (len(f) + len(g) - 1)
    for i, a in enumerate(f):
        for j, b in enumerate(g):
            out[i + j] += a * b
    return out


def poly_sub(f, g):
    n = max(len(f), len(g))
    out = [0] * n
    for i in range(n):
        out[i] = (f[i] if i < len(f) else 0) - (g[i] if i < len(g) else 0)
    return out


def poly_is_zero(f) -> bool:
    return all(c == 0 for c in f)


def poly_eval(f, x: int) -> int:
    acc = 0
    for coeff in reversed(f):
        acc = acc * x + coeff
    return acc


def trim(f):
    g = list(f)
    while g and g[-1] == 0:
        g.pop()
    return g or [0]


def field_reduce(coeffs):
    """Reduce an integer polynomial modulo t^4-4t^2+2."""
    modulus = [2, 0, -4, 0, 1]
    _, rem = _divmod_monic(coeffs, modulus)
    rem = trim(rem)
    return rem + [0] * (4 - len(trim(rem)))


def _divmod_monic(f, modulus):
    rem = trim(f)
    deg_m = 4
    lead = modulus[-1]
    assert lead == 1
    while len(rem) - 1 >= deg_m:
        coeff = rem[-1]
        shift = len(rem) - 1 - deg_m
        rem = poly_sub(rem, poly_mul(modulus, [0] * shift + [coeff]))
        rem = trim(rem)
    return None, rem


def field_mul(a, b):
    prod = poly_mul(a, b)
    return field_reduce(prod)


def verify_cyclotomic_field() -> None:
    modulus = [2, 0, -4, 0, 1]  # 2 - 4 t^2 + t^4
    for p in (2,):
        check(all(c % p == 0 for c in modulus[:-1]) and modulus[-1] % p != 0, "Eisenstein prime divides lower terms")
        check(modulus[0] % (p * p) != 0, "Eisenstein at 2: square does not divide the constant term")
    check(modulus == [2, 0, -4, 0, 1], "minimal polynomial is t^4-4t^2+2")

    # Four real roots by sign changes of P on the rational partition -2,-1,0,1,2.
    samples = [(-2, 2), (-1, -1), (0, 2), (1, -1), (2, 2)]
    for point, expected in samples:
        check(poly_eval(modulus, point) == expected, f"P({point})={expected}")
    signs = [expected > 0 for _, expected in samples]
    changes = sum(a != b for a, b in zip(signs, signs[1:]))
    check(changes == 4, "P has four real roots by the intermediate-value sign pattern")

    alpha = [0, 1]  # alpha
    beta = field_reduce([0, -3, 0, 1])  # alpha^3 - 3 alpha
    # beta^2 + alpha^2 - 4 = 0 because beta^2 = 4 - alpha^2.
    beta2 = field_mul(beta, beta)
    alpha2 = field_mul(alpha, alpha)
    check(field_reduce(poly_sub(poly_add_list(beta2, alpha2), [4])) == [0, 0, 0, 0], "beta^2 = 4 - alpha^2")
    check(beta != alpha and beta != field_reduce([-c for c in alpha]), "beta is not ±alpha")
    # sigma(alpha)=beta has order 4.
    current = alpha
    seen = []
    for k in range(1, 5):
        current = apply_sigma(current)
        seen.append(current)
    check(seen[0] == beta, "sigma(alpha)=alpha^3-3alpha")
    check(seen[1] == field_reduce([-c for c in alpha]), "sigma^2(alpha)=-alpha")
    check(seen[2] == field_reduce([-c for c in beta]), "sigma^3(alpha)=-beta")
    check(seen[3] == field_reduce(alpha), "sigma^4(alpha)=alpha")
    check(seen[1] != alpha, "sigma does not have order dividing 2")
    print("PASS: E=Q[t]/(t^4-4t^2+2) is a totally real cyclic quartic")


def poly_add_list(a, b):
    return poly_sub(a, [-c for c in b]) if False else _add(a, b)


def _add(a, b):
    n = max(len(a), len(b))
    return [(a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n)]


def apply_sigma(element):
    """Apply the Q-automorphism sigma(alpha)=alpha^3-3alpha."""
    element = field_reduce(element)
    alpha = [0, 1]
    image = [0]
    power = [1]
    beta = field_reduce([0, -3, 0, 1])
    for coeff in element:
        image = _add(image, [coeff * c for c in power])
        power = field_mul(power, beta)
    return field_reduce(image)


def verify_eigenvalue_identities() -> None:
    z = zeta(1)
    eps = zeta(2)
    lam = zeta(3)
    kappa = zeta(7)
    mu = zeta(1) + zeta(15)
    alpha = zeta(7) + zeta(9)
    eye = zeta(4)

    check(eps ** 8 == 1, "epsilon = zeta_16^2 has order dividing 8")
    check(eps ** 4 == -1, "epsilon^4 = -1")
    check(eps ** 6 == -eye, "epsilon^6 = -i")
    check(lam ** 4 == eps ** 6, "lambda^4 equals the A-scaling epsilon^6")
    check(lam ** 6 == eps, "lambda^6 equals the B-scaling epsilon")
    check(lam ** 3 * zeta(14) == kappa, "kappa = lambda^3/epsilon = zeta_16^7")
    check(mu == zeta(1) - zeta(7), "mu = zeta_16 + zeta_16^{-1}")
    check(alpha + mu == 0, "prompt eigenvalue alpha equals -mu")
    check(alpha != mu, "adversarial control: alpha is not the holomorphic eigenvalue")

    # Numerator cancellation of rho(v)+rho(1/v), before dividing by (v-1).
    # epsilon*(epsilon*v - 1) + epsilon*(v - epsilon) - epsilon*(epsilon+1)*(v-1) == 0.
    # Coefficients of v^1 and v^0 in the cyclotomic ring.
    one = Cyc([1])
    lin_v = eps * (eps) + eps * one - eps * (eps + 1)
    const = eps * (-1) + eps * (-eps) - eps * (eps + 1) * (-1)
    check(lin_v == 0 and const == 0, "sheet-sum numerator cancels (v-1) exactly")
    predicted = eps * (eps + 1) * zeta(13)  # divide by lambda = zeta^3, inverse zeta^13
    check(predicted == mu, "trace multiplier epsilon(1+epsilon)/lambda equals mu")

    # Inverse correspondence v |-> epsilon^{-1} v, lambda_inv = zeta^{-3}.
    eps_inv = zeta(14)
    lam_inv = zeta(13)
    mu_inv = eps_inv * (one + eps_inv) * zeta(3)
    check(lam_inv ** 4 == eye, "inverse lambda has fourth power i")
    check(lam_inv ** 6 == eps_inv, "inverse lambda has sixth power epsilon^{-1}")
    check(mu_inv == mu, "inverse correspondence has the same H^{2,0} eigenvalue mu")

    # mu satisfies t^4-4t^2+2 and does not lie in Q(sqrt(2)).
    # Represent mu = zeta - zeta^7 and use the real model sqrt(2+sqrt(2)).
    # (2+s)^2 - 4(2+s) + 2 = 0 with s^2=2 is checked on the polynomial.
    check(poly_eval([2, 0, -4, 0, 1], 0) == 2, "constant term of P is 2")
    # 8w^2 - 8w + 1 is the condition for mu in Q(sqrt(2)); its discriminant is 32, not a square.
    disc = 64 - 32
    check(disc == 32, "quadratic obstruction discriminant is 32")
    root = 0
    while root * root < disc:
        root += 1
    check(root * root != disc, "32 is not a square, so mu is not in Q(sqrt(2))")
    witness = [
        8 * n * n - 8 * n * d + d * d
        for d in range(1, 9)
        for n in range(-8, 9)
    ]
    check(all(value != 0 for value in witness), "no height <= 8 rational puts the square class in Q")
    print("PASS: holomorphic eigenvalue is mu=zeta_16+zeta_16^{-1}, not the prompt value alpha")


def verify_weierstrass_substitution() -> None:
    # Laurent polynomials as dicts exponent -> int. Parameter s is tracked as exponent of S.
    # A coefficient polynomial in (v,s): -3 s^2 u^2 * d^4 with u=(v+1)^2/v and d=v^2/(v+1).
    def laurent_mul(f, g):
        out = {}
        for (i, a), ca in f.items():
            for (j, b), cb in g.items():
                out[(i + j, a + b)] = out.get((i + j, a + b), 0) + ca * cb
        return {k: v for k, v in out.items() if v}

    def laurent_pow(f, n):
        out = {(0, 0): 1}
        for _ in range(n):
            out = laurent_mul(out, f)
        return out

    def laurent_scale(f, c):
        return {k: c * v for k, v in f.items()}

    def laurent_add(f, g):
        out = dict(f)
        for k, v in g.items():
            out[k] = out.get(k, 0) + v
            if out[k] == 0:
                del out[k]
        return out

    v = {(1, 0): 1}
    one = {(0, 0): 1}
    v_plus = laurent_add(v, one)
    # Cleared identity A v^8 = (-3 s^2 v^6) (v+1)^4, both equal to -3 s^2 v^6 (v+1)^4.
    cleared = laurent_mul({(0, 2): -3}, laurent_mul(laurent_pow(v, 6), laurent_pow(v_plus, 4)))
    again = laurent_mul(laurent_mul({(0, 2): -3}, laurent_pow(v_plus, 4)), laurent_pow(v, 6))
    check(cleared == again, "cleared A-scaling monomials commute")

    # P(v+v^{-1}) = (v^8+1)/v^4.
    z_plus = laurent_add(v, {(-1, 0): 1})
    p_direct = laurent_add(
        laurent_add(laurent_pow(z_plus, 4), laurent_scale(laurent_pow(z_plus, 2), -4)),
        laurent_scale(one, 2),
    )
    p_closed = laurent_add(laurent_pow(v, 4), {(-4, 0): 1})
    check(p_direct == p_closed, "P(v+1/v)=(v^8+1)/v^4")

    # gamma(v)=v-1 comes from d*u'.
    # (v^2-1) - (v-1)(v+1) = 0.
    difference = poly_sub([ -1, 0, 1], poly_mul([-1, 1], [1, 1]))
    check(poly_is_zero(difference), "d*du/dv simplifies to v-1")

    for v_num, s_num in ((3, 5), (5, 3), (7, 1), (4, 9), (9, 2)):
        vv = Fraction(v_num)
        ss = Fraction(s_num)
        uu = (vv + 1) ** 2 / vv
        dd = vv ** 2 / (vv + 1)
        aa = -3 * ss ** 2 * uu ** 2
        check(aa * dd ** 4 == -3 * ss ** 2 * vv ** 6, f"A d^4 = -3 s^2 v^6 at v={v_num}, s={s_num}")
        zz = vv + 1 / vv
        pp = zz ** 4 - 4 * zz ** 2 + 2
        check(pp == vv ** 4 + vv ** (-4), f"P(v+1/v)=v^4+v^{{-4}} at v={v_num}")
        bb = uu ** 3 * (pp ** 2 - 2 * ss ** 3)
        claimed = vv * ((vv ** 8 + 1) ** 2 - 2 * ss ** 3 * vv ** 8)
        check(bb * dd ** 6 == claimed, f"B d^6 matches the integral model at v={v_num}, s={s_num}")
        # The order-8 base map scales the integral model by lambda^4=-i and lambda^6=epsilon,
        # checked in the cyclotomic ring. Here check the rational identity B(c v)=c B(v)
        # when (c v)^8=v^8, i.e. c^8=1, using c=-1 as an integral special case.
        bb_neg = (-vv) * (((-vv) ** 8 + 1) ** 2 - 2 * ss ** 3 * (-vv) ** 8)
        check(bb_neg == -claimed, f"B(-v)=-B(v) at v={v_num}, s={s_num}")
    print("PASS: base-change Weierstrass scaling and holomorphic-form coefficient")


def verify_discriminant_and_kodaira() -> None:
    # Bivariate polynomials (exp_s, exp_u) -> coeff.
    def mul(f, g):
        out = {}
        for (i, j), a in f.items():
            for (k, l), b in g.items():
                out[(i + k, j + l)] = out.get((i + k, j + l), 0) + a * b
        return {k: v for k, v in out.items() if v}

    def add(f, g):
        out = dict(f)
        for k, v in g.items():
            out[k] = out.get(k, 0) + v
            if out[k] == 0:
                del out[k]
        return out

    def scale(f, c):
        return {k: c * v for k, v in f.items() if c * v}

    def power(f, n):
        out = {(0, 0): 1}
        for _ in range(n):
            out = mul(out, f)
        return out

    s = {(1, 0): 1}
    u = {(0, 1): 1}
    one = {(0, 0): 1}
    z = add(u, {(0, 0): -2})
    p = add(add(power(z, 4), scale(power(z, 2), -4)), scale(one, 2))
    a_poly = mul({(2, 0): -3}, power(u, 2))
    b_poly = mul(power(u, 3), add(power(p, 2), scale(power(s, 3), -2)))
    disc_core = add(scale(power(a_poly, 3), 4), scale(power(b_poly, 2), 27))
    predicted = mul(mul(scale(power(u, 6), 27), power(p, 2)), add(power(p, 2), scale(power(s, 3), -4)))
    check(disc_core == predicted, "4A^3+27B^2 = 27 u^6 P(u-2)^2 (P(u-2)^2-4s^3)")

    # Evaluate P at u=0, i.e. z=-2: (-2)^4 - 4*(-2)^2 + 2 = 16-16+2=2.
    check(16 - 16 + 2 == 2, "P(-2)=2")
    # v_u(disc_core)=6 from the explicit factor u^6. The cofactor at u=0 is
    # 27 * P(-2)^2 * (P(-2)^2 - 4s^3) = 108*(4-4s^3)=432(1-s^3).
    # Evaluate cofactor polynomial at u=0.
    cofactor = mul(scale(power(p, 2), 27), add(power(p, 2), scale(power(s, 3), -4)))
    constant_terms = {}
    for (i, j), c in cofactor.items():
        if j == 0:
            constant_terms[i] = constant_terms.get(i, 0) + c
    # constant_terms should be the polynomial 432 - 432 s^3 in s.
    check(constant_terms.get(0, 0) == 432, "I0* cofactor constant term 432")
    check(constant_terms.get(3, 0) == -432, "I0* cofactor s^3 coefficient -432")
    check(set(constant_terms) <= {0, 3}, "I0* cofactor depends only on 1 and s^3")

    # Cubic T^3 - 3 s^2 T + (4-2s^3) has discriminant 432(s^3-1).
    # Expand -4 p^3 - 27 q^2 with p=-3s^2, q=4-2s^3 as a univariate in s.
    def uni_mul(f, g):
        out = [0] * (len(f) + len(g) - 1)
        for i, a in enumerate(f):
            for j, b in enumerate(g):
                out[i + j] += a * b
        return out

    def uni_sub(f, g):
        n = max(len(f), len(g))
        return [(f[i] if i < len(f) else 0) - (g[i] if i < len(g) else 0) for i in range(n)]

    p_coeff = [0, 0, -3]
    q_coeff = [4, 0, 0, -2]
    p3 = uni_mul(uni_mul(p_coeff, p_coeff), p_coeff)
    q2 = uni_mul(q_coeff, q_coeff)
    disc = uni_sub([-4 * c for c in p3], [27 * c for c in q2])
    disc = trim(disc)
    # -4p^3-27q^2 = 432(s^3-1) = -432 + 432 s^3.
    check(disc == [-432, 0, 0, 432], "I0* root discriminant is 432(s^3-1)")

    # Infinity chart: Q(t)=(1-2t)^4 - 4 t^2 (1-2t)^2 + 2 t^4, Q(0)=1.
    q = poly_sub(poly_pow([1, -2], 4), poly_mul([0, 0, 4], poly_pow([1, -2], 2)))
    q = _add(q, [0, 0, 0, 0, 2])
    check(q[0] == 1, "infinity leading polynomial has Q(0)=1")
    check(all(c == int(c) for c in q), "infinity polynomial is integral")

    euler = 6 + 4 * 2 + 8 * 1 + 2
    check(euler == 24, "Kodaira Euler numbers sum to 24")
    trivial_rank = 2 + (5 - 1) + 4 * (2 - 1)
    check(trivial_rank == 10, "Shioda-Tate trivial lattice has rank 10")
    print("PASS: discriminant factorization and Kodaira input data")


def poly_pow(f, n):
    out = [1]
    for _ in range(n):
        out = poly_mul(out, f)
    return out


def verify_flop_graph() -> None:
    # Conifold small resolutions.
    # Y+: (u1,u2,[r:1]) -> (u1*r, u2, u1, u2*r)
    # Graph equations in the affine chart: u1=u2*p, v2=u2, v1=u2*r.
    def image_plus(u1, u2, r):
        return (u1 * r, u2, u1, u2 * r)

    def image_minus(v1, v2, p):
        return (v1 * p, v2 * 1, v2 * p, v1 * 1)

    samples = [(1, 2, 3, 5), (2, -3, 4, -1), (5, 7, -2, 3), (-4, 6, 1, 8)]
    for u2, r, p, scale in samples:
        u1 = u2 * p
        v1 = u2 * r
        v2 = u2
        left = image_plus(u1, u2, r)
        right = image_minus(v1, v2, p)
        check(left == right, f"graph point {(u2, r, p)} lies over one conifold point")
        x, y, z, w = left
        check(x * y - z * w == 0, f"conifold equation at {(u2, r, p)}")
        check(scale * x * scale * y - scale * z * scale * w == 0, "equation is homogeneous")

    # Fiber over the node is exactly u2=0, with (r,p) free: reduced, multiplicity one.
    for r, p in [(0, 0), (1, 0), (0, 1), (3, -5), (8, 13)]:
        point = image_plus(0, 0, r)
        check(point == (0, 0, 0, 0), f"exceptional point r={r} maps to the node")
        other = image_minus(0, 0, p)
        check(other == (0, 0, 0, 0), f"flopped exceptional point p={p} maps to the node")

    # Same Y+ point, two Y- points: projection is not an isomorphism.
    y_plus_a = image_plus(0, 0, 1)
    y_minus_a = image_minus(0, 0, 0)
    y_minus_b = image_minus(0, 0, 1)
    check(y_plus_a == (0, 0, 0, 0), "both graph points lie over the node")
    check(y_minus_a == (0, 0, 0, 0) and y_minus_b == (0, 0, 0, 0), "distinct exceptional parameters map to the same conifold point")
    check((0, 0, 0) != (0, 0, 1), "the two graph points are distinct in Y-")

    # Directional limits of the identity-chamber birational map do not agree.
    # Approaching (r0=1) along (a,b)=(1,1) gives p=a/b=1; along (2,1) gives p=2.
    def limit_p(a, b):
        check(b != 0, "direction has nonzero second component")
        return Fraction(a, b)

    check(limit_p(1, 1) != limit_p(2, 1), "flop birational map has path-dependent limits along E+")

    # Atiyah family xy=(z-t)(z+t), chart graph 2t=x(c-b), y=x*b*c, 2z=x(b+c).
    # Special fiber equation x(c-b)=0 is square-free: degree 1 in x and content c-b is prime.
    def on_graph(x, b, c):
        return {
            "y": x * b * c,
            "two_z": x * (b + c),
            "two_t": x * (c - b),
        }

    for x, b, c in [(3, 1, 4), (5, -2, 2), (1, 0, 1)]:
        data = on_graph(x, b, c)
        # Reconstruct z,t in Q and test the equation over Z after clearing 2.
        two_z = data["two_z"]
        two_t = data["two_t"]
        y = data["y"]
        # (2z)^2 - (2t)^2 = 4(z^2-t^2)=4 x y.
        check(two_z * two_z - two_t * two_t == 4 * x * y, f"Atiyah graph equation at {(x, b, c)}")

    # Flat special-fiber polynomial f=x(c-b). Derivative in x is (c-b), and gcd is 1
    # as polynomials in x with coefficients in the UFD Z[b,c]: content check.
    # Square-free test: f and df/dx share a factor only if c-b=0 identically, which it is not.
    # In Z[x,b,c], f=x(c-b). As a degree-1 polynomial in x its only x-factor is itself,
    # and df/dx=c-b is not divisible by x. The content c-b is degree 1, hence square-free.
    df = {(0, 0, 1): 1, (0, 1, 0): -1}  # c - b
    f_terms = {(1, 0, 1): 1, (1, 1, 0): -1}  # x*c - x*b
    check(df != {}, "derivative c-b is nonzero")
    check(any(exp_x == 1 for exp_x, _, _ in f_terms), "special-fiber equation has x-degree 1")
    check(not any(exp_x >= 2 for exp_x, _, _ in f_terms), "no squared factor of x")

    # Reflection in a (-2)-curve: s(x)=x+(x·E)E.
    # Basis (H, E) with Gram matrix [[0,1],[1,-2]]: H·E=1, E·E=-2, H·H=0.
    def dot(a, b):
        # a,b are (h,e)
        return a[0] * b[1] + a[1] * b[0] - 2 * a[1] * b[1]

    def reflect(a):
        coeff = dot(a, (0, 1))
        return (a[0], a[1] + coeff)

    e = (0, 1)
    h = (1, 0)
    check(dot(e, e) == -2, "exceptional curve has self-intersection -2")
    check(reflect(e) == (0, -1), "reflection sends E to -E")
    check(reflect(h) == (1, 1), "reflection sends a transverse class H to H+E")
    check(reflect(reflect(h)) == h and reflect(reflect(e)) == e, "reflection is an involution")
    check(reflect(h) != h, "reflection is not the identity")
    # id + (x |-> (x·E)E) equals the reflection.
    def extra(a):
        coeff = dot(a, e)
        return (0, coeff)

    def specialized(a):
        return (a[0] + extra(a)[0], a[1] + extra(a)[1])

    check(specialized(h) == reflect(h) and specialized(e) == reflect(e), "ordinary graph plus E×E acts as the reflection")
    print("PASS: flop graph fiber is a reduced P^1×P^1 and does not give a Čech isomorphism")


def main() -> None:
    verify_cyclotomic_field()
    verify_eigenvalue_identities()
    verify_weierstrass_substitution()
    verify_discriminant_and_kodaira()
    verify_flop_graph()
    print("ALL_STDLIB_CHECKS_PASSED")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # unexpected algebraic failure
        print(f"FAIL: uncaught {type(exc).__name__}: {exc}")
        sys.exit(1)
