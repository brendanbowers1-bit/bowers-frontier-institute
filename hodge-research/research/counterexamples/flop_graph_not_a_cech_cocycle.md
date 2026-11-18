# Counterexample: flop graph as a descent isomorphism

## Claim that fails

The closure of the graph of the Atiyah flop can be used as the transition
isomorphism that glues the two small resolutions into an algebraic space, and
the resulting correspondence specializes to the identity.

## Counterexample

On \(xy=(z-t)(z+t)\), the graph closure is flat over the \(t\)-line and its
special fiber is
\[
[\Gamma_{\mathrm{id}}]+[E\times E],
\]
each with multiplicity one. This acts on the Néron–Severi group of the
resolved surface singularity by the reflection
\[
s_E(x)=x+(x\cdot E)E,
\]
which sends the exceptional curve to its negative. A reflection is not the
identity, and \(E\times E\to E\) is not an isomorphism.

On the conifold chart \(u_1=u_2 p\), \(v_2=u_2\), \(v_1=u_2 r\), the points
\((r,p)=(1,0)\) and \((1,1)\) lie over the same exceptional point of the first
resolution and over different exceptional points of the second.

## Scope

This kills Čech gluing by the flop correspondence. It does not kill Artin's
algebraic-space simultaneous resolution of surface rational double points.
That resolution contributes exceptional \((-2)\)-curves, which are algebraic
classes, not a real-multiplication operator on transcendental cohomology.

The equations and the multiplicity check are Theorem C of
`research/proofs/iteration_595_dihedral_eigenvalue_and_flop_obstruction.md`,
executed in `research/scripts/verify_595_stdlib.py` and
`research/scripts/verify_595_sympy.py`.
