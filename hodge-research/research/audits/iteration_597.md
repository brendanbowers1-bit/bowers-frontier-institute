# Audit 597

Date: 24 November 2026 (America/Denver).

The iteration-596 Weil obstruction was an error of 24 in one point count.
After the correction, Frobenius on the minimal resolution of \(S_3\) over
\(\mathbb F_7\) has a uniquely determined characteristic polynomial on
\(H^2\). Exactly 14 of its 22 roots are \(7\) times a root of unity. The
geometric Picard number of this reduction is 14. The geometric Picard number
of \(S_3\) over \(\mathbb C\) is therefore at least 10 and at most 14.

This does not prove that the Picard number equals 10, and it does not prove
the Hodge conjecture.

## The corrected count

The resolved counts
\[
71,\ 2857,\ 119708,\ 282525671,\ 13841691256,\ 678225543479
\]
for \(\mathbb F_{7^k}\), \(k\in\{1,2,3,5,6,7\}\), were recomputed from
`ellap` on the smooth fibers and the Kodaira correction on the singular
fibers. They agree with audit 596. The same program gives
\[
\#X(\mathbb F_{7^4})=5796113
\]
instead of the recorded \(5796137\).

An independent character-sum enumeration of the affine model over
\(\mathbb F_{7^4}\) produced \(5779305\) points. With four rational \(A_1\)
singularities, no rational leg of the \(I_0^*\) fiber, the section point on
each finite fiber, and the type II fiber at infinity, the resolved count is
again \(5796113\). `research/scripts/verify_597_weil.py` repeats that
enumeration. Over \(\mathbb F_{49}\), blowing up all five rational double
points in charts, without the Kodaira formula, reproduces the resolved count
\(2857\), so the correction is confined to the \(k=4\) trace.

The corrected traces \(\tau_k=\#X(\mathbb F_{7^k})-1-7^{2k}\) are
\[
21,\ 455,\ 2058,\ 31311,\ 50421,\ 404054,\ 2470629.
\]

## The trivial lattice

Modulo \(7\), \(P(z)=z^4-4z^2+2=(z^2+1)(z^2+2)\). The four \(I_2\) fibers form
two Frobenius swap-orbits. The cubic \(T^3-27T-50\) of the \(I_0^*\) legs has
no root in \(\mathbb F_7\), so Frobenius cycles the three legs. The resulting
eigenvalues on the rank-10 trivial lattice are \(+7\) six times, \(-7\) twice,
and \(7\zeta_3\), \(7\zeta_3^2\). Their power sums are
\[
\nu_k=7^k\bigl(6+2(-1)^k+\delta_k\bigr),
\]
where \(\delta_k=2\) if \(3\mid k\) and \(\delta_k=-1\) otherwise.

For every odd \(k\le 7\), \(\tau_k=\nu_k\). The quotient power sums
\(\sigma_k=\tau_k-\nu_k\) are
\[
0,\ 112,\ 0,\ 14504,\ 0,\ -772436,\ 0.
\]

These are the power sums of Frobenius on a 12-dimensional quotient of
\(H^2\). The ten trivial-lattice classes are Frobenius-stable, and the
characteristic polynomial of an invariant subspace divides the characteristic
polynomial of \(H^2\).

## The unique Weil quotient

Let \(Q(T)=T^{12}+a_1T^{11}+\cdots+a_{12}\) be that quotient polynomial. Newton’s
identities and the odd power sums give
\[
a_1=a_3=a_5=a_7=0,\qquad a_2=-56,\qquad a_4=-2058,\qquad a_6=302526.
\]
Every eigenvalue of \(H^2\) has complex absolute value \(7\), so the same is
true of the quotient, and \(Q\) satisfies the functional equation of a weight-2
Weil polynomial. The sign of the constant term is \(\pm 7^{12}\). Either sign
determines the remaining coefficients:

- positive: \(a_8=7^4 a_4\), \(a_{10}=7^8 a_2\), \(a_{12}=7^{12}\), and
  \(a_9=a_{11}=0\);
- negative: \(a_6=0\), \(a_8=-7^4 a_4\), \(a_{10}=-7^8 a_2\), \(a_{12}=-7^{12}\).

The negative polynomial changes sign on the integers \(39\) and \(40\), so it
has a real root of absolute value strictly between \(39\) and \(40\). It is
not a Weil polynomial.

The positive polynomial is \(\psi(T^2)\), where
\[
\psi(U)=(U+49)^2(U^4-154U^3+10633U^2-369754U+5764801).
\]
The quartic is reciprocal of radius \(49^2\): its linear coefficient equals
\(-154\cdot 49^2\) and its constant term equals \(49^4\). The sums
\(\sigma=U+49^2/U\) are the roots of \(\sigma^2-154\sigma+5831=0\), namely
\(77\pm 7\sqrt2\). Both lie strictly inside \((-98,98)\), because
\(\sqrt2<3\). A root \(U\) with \(|U+49^2/U|<98\) has \(|U|=49\). Thus every
root of the positive polynomial has absolute value \(7\), and this is the
unique Weil polynomial with the quotient power sums.

A direct count over \(\mathbb F_{7^8}\), which was not used to choose the
coefficients, gives trace \(32593575\). The polynomial predicts the same
integer.

## Fourteen algebraic eigenvalues

The trivial lattice contributes ten eigenvalues \(7\zeta\). The factor
\((T^2+49)^2\) contributes \(7i\) and \(-7i\), each with multiplicity two.
These four are \(7\) times a fourth root of unity, and \(T^2+49\) shares no
root with the trivial-lattice factor.

The remaining degree-8 factor has roots \(\lambda\) with \(U=\lambda^2\) on the
circle of radius \(49\). The number \(y=U/49\) satisfies
\[
7y^4-22y^3+31y^2-22y+7=0.
\]
That polynomial is irreducible over \(\mathbb Z\): the only rational-root
candidates are \(\pm1,\pm7\), none of which is a root, and the factorization
type \((7y^2+ry+s)(y^2+ty+u)\) with \(su=7\) produces no integer solution.
Its leading coefficient is \(7\), so \(y\) is not an algebraic integer and
cannot be a root of unity. Those eight eigenvalues are not of the form
\(7\zeta\).

Exactly 14 eigenvalues are \(7\) times a root of unity.

## Picard numbers

The minimal resolution of \(S_3\) over \(\mathbb F_7\) is an elliptic K3
surface: the discriminant valuations are the characteristic-zero valuations,
\(p>3\), and the Euler number of the fibers is \(24\). The Tate conjecture for
K3 surfaces in odd characteristic identifies the geometric Picard number with
the number of Frobenius eigenvalues of the form \(7\zeta\). That number is
\(14\).

Specialization of Néron–Severi rank does not decrease under good reduction, and
these rational double points reduce to rational double points. The primitive
closure of the trivial lattice already has rank 10. Therefore the geometric
Picard number of \(S_3\) over \(\mathbb C\) is an integer between 10 and 14
inclusive.

The action of the dihedral correspondence on the whole transcendental lattice,
the Rosati identity off \(H^{2,0}\), and the unrestricted rational Hodge
conjecture remain open.

## Verifier

```text
python3 research/scripts/verify_597_weil.py
```
