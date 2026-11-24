# Audit 596

Date: 17 November 2026 (America/Denver).

Correction, 24 November 2026: the count `#X(F_{7^4}) = 5796137` below is 24 too
large. The corrected count is 5796113, and the degree-12 quotient is a Weil
polynomial. See `research/audits/iteration_597.md`. The counts for `k ≠ 4` in
the table below were recomputed and still stand.

The iteration-595 verifiers were rerun and still pass. This iteration attacks the
open Picard-rank claim for the specialized K3 surface \(S_3\), the fiber
\(s=3\) of the Weierstrass family. It does not prove that the Picard number is
10, and it does not prove the Hodge conjecture.

## What was checked two ways

The minimal resolution of the affine model has rational double points exactly
at the \(I_2\) fibers and at the \(I_0^*\) fiber. On every good prime
\(p\in\{7,11,17,19,23,29,31,37,41\}\) an explicit blow-up of those points
produces the same number of exceptional \(\mathbb F_p\)-points as the Kodaira
component count:

| rational legs of \(I_0^*\) | exceptional points |
| --- | --- |
| 0 | \(p+1\) |
| 1 | \(2p+1\) |
| 3 | \(4p+1\) |

Each rational \(I_2\) fiber contributes one exceptional \(\mathbb P^1\), hence
\(p+1\) points. Primes \(5\) and \(13\) change the valuations at \(u=0\) and are
excluded. The type II fiber at infinity is smooth as a surface point: in the
chart \(u=1/t\) the equation is \(Y^2=X^3-t+\cdots\) with a nonzero linear term.

Over \(\mathbb F_{7^3}\) the first blow-up of the origin is a rational
\(\mathbb P^1\) carrying exactly three residual singularities, the geometric
legs of \(I_0^*\). That is the \(D_4\) configuration, seen from the other side
of the same count.

## Point counts at \(p=7\)

Affine points were enumerated directly. The resolved counts use the corrections
above.

| \(k\) | \(\#X(\mathbb F_{7^k})\) | trace \(N-1-7^{2k}\) |
| --- | --- | --- |
| 1 | 71 | 21 |
| 2 | 2857 | 455 |
| 3 | 119708 | 2058 |
| 4 | 5796137 | 31335 |
| 5 | 282525671 | 50421 |
| 6 | 13841691256 | 404054 |
| 7 | 678225543479 | 2470629 |

Rows \(k\le 3\) are recomputed by `verify_596_pointcount.py`. Rows \(k=4,\ldots,7\)
were computed with PARI `ellcard` on the smooth fibers and the same correction
on the singular fibers; \(k=1,2,3\) of that computation agree with the Python
enumeration. The same program gives, at \(p=17\),

\[
454,\ 86608,\ 24211270,\ 6976621104,\ 2016012436614
\]

for \(k=1,\ldots,5\). The \(k=1\) value agrees with the blow-up count.

## The Weil obstruction

Over \(\mathbb F_7\) the component orbits of the trivial lattice are: the zero
section, the fiber, the central component of \(I_0^*\), the trivial character
of the 3-cycle of legs, and one \(+1\) from each of the two \(I_2\)
swap-orbits, together six eigenvalues \(+7\); two eigenvalues \(-7\) from the
swap-orbits; and \(7\zeta_3\), \(7\zeta_3^2\) from the 3-cycle. Rank 10.

For every odd \(k\le 7\) the trace above equals this Néron–Severi trace exactly,
so the complementary power sums vanish in odd degree. Newton’s identities
produce the even polynomial whose roots would be the squares of the twelve
complementary eigenvalues,

\[
U^6-56U^5-2064U^4+302862U^3-4955664U^2-322828856U+13841287201.
\]

It changes sign on \((-51,-50)\) and on \((-48,-47)\). Those real roots are not
\(\pm 49\), so they do not have absolute value \(7^2\). The complementary
factor is not a weight-2 Weil polynomial.

A search over every integer algebraic trace of rank \(22-m\) for even
\(m\in\{2,4,6,8,10,12\}\), using the same seven power sums and both signs of
the functional equation, found no complementary Weil polynomial. The same
negative search, with five power sums, found none at \(p=17\).

## What this does not say

The obstruction says that these traces, paired with a Néron–Severi module of
eigenvalues \(\zeta p\), are not the Frobenius traces of a K3. It does not
identify a wrong fiber correction: the blow-ups match the corrections that
were used. It does not prove that the geometric Picard number is larger than
10, because a Weil polynomial of degree 22 is not determined by seven power
sums. Supersingular reduction is ruled out at \(p=7\), since the trace is not
a sum of 22 roots of unity times \(7^k\).

Picard rank 10, the minimal polynomial of the dihedral correspondence on the
whole transcendental lattice, and the Rosati identity off \(H^{2,0}\) stay open.
The unrestricted rational Hodge conjecture stays open.

## Verifier

```text
python3 research/scripts/verify_596_pointcount.py
```
