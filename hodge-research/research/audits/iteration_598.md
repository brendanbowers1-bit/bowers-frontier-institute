# Audit 598

Date: 24 November 2026 (America/Denver).

At the good prime \(11\), Frobenius on the minimal resolution of \(S_3\) has a
uniquely determined characteristic polynomial on \(H^2\). Exactly 14 of its 22
roots are \(11\) times a root of unity. The geometric Picard number of this
reduction is 14. The geometric Picard number of \(S_3\) over \(\mathbb C\)
remains an integer between 10 and 14.

This is the same upper bound already obtained at \(p=7\). It does not decide
which integer occurs over \(\mathbb C\), and it does not prove the Hodge
conjecture.

## Good reduction

For \(s=3\), one has \(s^3=27\equiv 5\pmod{11}\), so \(s^3\notin\{0,1\}\).
The discriminant identity
\[
4A^3+27B^2=27u^6 P(u-2)^2\bigl(P(u-2)^2-108\bigr)
\]
has the same valuations as in characteristic zero: \(P\) is separable because
\(P(0)=2\) and \(P=-2\) wherever \(P'=0\), the eight roots of \(P^2=108\) are
simple because \(108\not\equiv 4\pmod{11}\), and the auxiliary cubic
\(T^3-27T-50\) has discriminant \(432\cdot 26\), not divisible by \(11\). In
the chart at infinity, \(Q(0)=1\), so the integral model still has
\(v(B)=1\) and a fiber of type \(II\). The Euler number of the fibers remains
\(24\). The minimal resolution is an elliptic K3 surface in characteristic
\(11\), and the rational double points reduce to rational double points.

## The trivial lattice

Modulo \(11\), \(P\) is irreducible: it has no root in \(\mathbb F_{11}\),
\(\mathbb F_{11^2}\), or \(\mathbb F_{11^3}\), and all four roots lie in
\(\mathbb F_{11^4}\). Frobenius therefore acts on the four \(I_2\) components
as a 4-cycle. The cubic of the \(I_0^*\) legs is likewise irreducible, with
all three roots in \(\mathbb F_{11^3}\). The eigenvalues on the rank-10
trivial lattice are \(+11\) five times, \(-11\) once, \(\pm 11i\), and
\(11\zeta_3\), \(11\zeta_3^2\). Their power sums are
\[
\nu_k=11^k\bigl(5+(-1)^k+\varepsilon_k+\delta_k\bigr),
\]
where \(\varepsilon_k\) is \(2,0,-2,0\) according as \(k\bmod 4\) is
\(0,1,2,3\), and \(\delta_k=2\) if \(3\mid k\) and \(\delta_k=-1\) otherwise.
The same integers are \(11^k(3+n_{\mathrm{legs}}(k)+n_{I_2}(k))\).

## Point counts

The resolved counts of \(S_3(\mathbb F_{11^k})\) for \(k=1,\ldots,6\) are
\[
\begin{align*}
155,&\quad 15005,\quad 1779548,\\
214386833,&\quad 25937907755,\quad 3138439006088.
\end{align*}
\]
The value at \(k=1\) is the character-sum count in
`research/scripts/verify_598_weil.py`, and it agrees with the blow-up of the
unique rational double point. The values at \(k=2,3,4,5\) were computed twice,
once by `ellap` on the smooth fibers and once by a baby-step/giant-step count;
the two programs agree. The value at \(k=6\) is the baby-step count on four
blocks of the base, with \(9\) singular places in all, which is the place
\(u=0\) together with the eight \(I_1\) fibers rational over \(\mathbb F_{11^2}\).

The resulting quotient power sums \(\sigma_k=\tau_k-\nu_k\) are
\[
0,\ 0,\ 0,\ -74536,\ 0,\ 0.
\]

## The unique Weil quotient

Newton's identities give coefficients
\[
a_1=a_2=a_3=a_5=a_6=0,\qquad a_4=18634
\]
of the monic degree-12 quotient. The two functional equations of a weight-2
Weil polynomial are then

- positive: \(T^{12}+18634\,T^8+18634\cdot 11^4\,T^4+11^{12}\),
- negative: \(T^{12}+18634\,T^8-18634\cdot 11^4\,T^4-11^{12}\).

In the variable \(W=T^4\), with \(R=11^4\), these are
\[
(W+R)(W^2+3993W+R^2)
\qquad\text{and}\qquad
(W-R)(W^2+33275W+R^2).
\]
Here \(3993=3\cdot 11^3\) and \(33275=18634+R\). The first quadratic has
discriminant \(3993^2-4R^2<0\), so its roots are conjugates of product \(R^2\)
and each has absolute value \(R\). Every fourth root therefore has absolute
value \(11\), and the factor \(W+R\) contributes the same absolute value. The
positive polynomial is a Weil polynomial.

The second quadratic has positive discriminant, and the absolute values of its
two real roots sum to \(33275>2R\). They are not equal, so one of them has
absolute value strictly larger than \(R\). The negative polynomial is not a
Weil polynomial. The positive polynomial is the only Weil polynomial with
these power sums.

## Fourteen algebraic eigenvalues

The trivial lattice contributes ten eigenvalues \(11\zeta\). The factor
\(T^4+11^4=11^4\Phi_8(T/11)\) contributes the four numbers \(11\zeta_8^{2j+1}\).
It shares no root with \((T\pm 11)\), \(T^2+121\), or \(T^2+11T+121\).

The other factor is \(T^8+3993T^4+11^8\). For a root, the number
\(y=T^4/11^4\) satisfies
\[
11y^2+3y+11=0.
\]
The discriminant is \(-475\), which lies strictly between \(-22^2\) and
\(-21^2\) and is not a square, so the quadratic is irreducible. Its leading
coefficient is \(11\), so \(y\) is not an algebraic integer and cannot be a
root of unity. Those eight eigenvalues are not of the form \(11\zeta\).

Exactly 14 eigenvalues are \(11\) times a root of unity.

## Picard numbers

The Tate conjecture for K3 surfaces in odd characteristic identifies the
geometric Picard number of the reduction with that count. The number is 14.
Specialization does not decrease Néron–Severi rank under this good reduction,
and the trivial lattice already has rank 10. The geometric Picard number of
\(S_3\) over \(\mathbb C\) is an integer between 10 and 14 inclusive, as it
was after the computation at \(p=7\).

The action of the dihedral correspondence on the whole transcendental lattice,
the Rosati identity off \(H^{2,0}\), and the unrestricted rational Hodge
conjecture remain open.

## Verifier

```text
python3 research/scripts/verify_598_weil.py
```
