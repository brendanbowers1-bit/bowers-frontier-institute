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

## Computed in iteration 596, not a Picard-rank theorem

The resolved model of the specialization \(S_3\) was counted over
\(\mathbb F_{7^k}\) through \(k=7\). The exceptional-point corrections agree
with blow-ups at nine good primes. Subtracting the rank-10 Néron–Severi module
read off from the component orbits does not leave a weight-2 Weil polynomial,
and no integer algebraic trace of corank \(2\) through \(12\) does either.
Details and the trace table are in `research/audits/iteration_596.md`.

## Open, in the order that blocks further claims

1. Explain the Weil obstruction, or replace the trace sequence by one that
   comes from a K3 Frobenius. Until that happens, the point counts do not
   prove that the Mordell–Weil rank is zero.
2. Determine the minimal polynomial of the correspondence on the full
   transcendental lattice and check the Rosati adjoint.
3. Only after those two, compare the resulting Hodge classes with any
   synthetic fivefold whose class count is independently recomputed.
