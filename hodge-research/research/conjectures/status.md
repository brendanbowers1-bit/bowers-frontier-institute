# Conjecture status

The rational Hodge conjecture for a smooth complex projective variety is open.
Nothing in this laboratory is a proof of the unrestricted statement.

## Proved in iteration 595

- The quartic \(E=\mathbb Q[t]/(t^4-4t^2+2)\) is totally real and cyclic.
- The displayed dihedral formulas define an algebraic correspondence on the
  Weierstrass K3 family \(S_s\). On \(H^{2,0}\) it acts by
  \(\zeta_{16}+\zeta_{16}^{-1}\), which is the negative of the previously
  stated eigenvalue.
- For \(s^3\notin\{0,1\}\) the minimal resolution of \(S_s\) is an elliptic K3
  surface with fibers \(I_0^*+4I_2+8I_1+II\), and its trivial lattice has
  rank 10.
- The flop graph of the base-changed \(A_1\) singularity specializes to a
  reflection and is not a Čech transition isomorphism.

## Corrected in iteration 597

The count \(\#X(\mathbb F_{7^4})=5796137\) in iteration 596 is 24 too large.
The corrected value is \(5796113\). The quotient of \(H^2\) by the rank-10
trivial lattice then has a unique weight-2 Weil polynomial,
\[
(T^2+49)^2(T^8-154T^6+10633T^4-369754T^2+5764801).
\]
Together with the trivial lattice, exactly 14 Frobenius eigenvalues are \(7\)
times a root of unity. The geometric Picard number of the reduction of \(S_3\)
at \(p=7\) is 14, so the geometric Picard number over \(\mathbb C\) lies
between 10 and 14. Details are in `research/audits/iteration_597.md`.

## Open, in the order that blocks further claims

1. Decide which integer from 10 through 14 is the geometric Picard number of
   \(S_3\) over \(\mathbb C\). The reduction at 7 only supplies the upper bound.
2. Determine the minimal polynomial of the correspondence on the full
   transcendental lattice and check the Rosati adjoint.
3. Only after those two, compare the resulting Hodge classes with any
   synthetic fivefold whose class count is independently recomputed.
