# Audit 595 — dihedral eigenvalue and flop descent

Date: 17 November 2026 (America/Denver).

The unrestricted rational Hodge conjecture is not solved.

## Recovery

Iterations 526–594 are not in this checkout. A search of the workspace, of the
local filesystem, and of the GitHub repositories visible to this session found
no file named

- `hodge_iteration594_deck_equivariant_semistable_flop_graph_and_descent_cocycle_obstruction_audit.md`
- `hodge_iteration594_reproducible_package.zip`
- `hodge_iteration594_SHA256SUMS`

No ZIP integrity check was possible. The arguments below use only identities
that were rederived and executed here. Earlier AI write-ups were not treated
as proofs.

## Dependency graph

Published input, used as stated and not re-proved:

- Zarhin: the Hodge endomorphism algebra of a K3 transcendental lattice is a
  totally real field or a CM field.
- Bayer-Fluckiger, van Geemen, Schütt, arXiv:2401.04072: every totally real
  field \(E\) of degree \(d\), with an integer \(m\ge 3\) and \(md\le 21\),
  occurs for an \((m-2)\)-dimensional family of projective K3 surfaces.
- van Geemen–Schütt, Forum of Mathematics, Sigma 13 (2025), e2: dihedral
  covers and isogenies produce explicit real-multiplication families. The
  extracted theorem list in that paper's introduction does not include
  \(\mathbb Q(\zeta_{16}+\zeta_{16}^{-1})\). Their method is the method used
  in Theorem A. The \(n=16\) case of any earlier van Geemen–Schütt paper is
  not cited.
- Atiyah: the two small resolutions of the ordinary double point.
- Brieskorn and Artin: simultaneous resolution of rational double points
  exists as an algebraic space after the Weyl cover. This is not used as a
  source of transcendental cycles.
- Shioda–Tate and the Kodaira–Tate table: conversion of valuations into fiber
  types and the rank formula.

Computed here, by two programs that do not share code:

- `research/scripts/verify_595_stdlib.py`, integer arithmetic only.
- `research/scripts/verify_595_sympy.py`, minimal polynomials, exact
  expansion, and a Gröbner basis.

## Findings

1. **Eigenvalue correction.** For the stated normalization
   \(\kappa=\zeta_{16}^7\), the correspondence acts on \(H^{2,0}\) by
   \[
   \mu=\zeta_{16}+\zeta_{16}^{-1}=\sqrt{2+\sqrt2},
   \]
   not by the prompt value \(\alpha=\zeta_{16}^7+\zeta_{16}^9=-\mu\).
   The prompt value is the sum of \(\kappa\) and \(\kappa^{-1}\). That sum is
   a different root of the same polynomial. The cycle itself is algebraic:
   it is the push-forward of the graph of the lifted base automorphism
   \(v\mapsto\varepsilon v\). Status: internally proved. Proof:
   `research/proofs/iteration_595_dihedral_eigenvalue_and_flop_obstruction.md`,
   Theorem A.

2. **Kodaira configuration.** For \(s^3\notin\{0,1\}\) the minimal resolution
   is an elliptic K3 surface with fibers \(I_0^*+4I_2+8I_1+II\). The trivial
   lattice has rank 10. Picard rank exactly 10 is not proved. Status:
   internally proved for the configuration and the lower bound. Theorem B of
   the same proof note.

3. **Flop descent fails.** The flat special fiber of the graph of the Atiyah
   flop is the identity correspondence plus a reduced product
   \(\mathbb P^1\times\mathbb P^1\). The sum acts as the reflection in the
   exceptional \((-2)\)-curve. The projections are not isomorphisms. This
   correspondence cannot be a Čech transition map, and its specialization is
   not the identity, so it does not transport an identity cocycle. Status:
   internally proved, and the proposed gluing strategy is falsified.
   Theorem C of the same note.

## Nine obligations from the descent program

| # | Obligation | Status after 595 |
| --- | --- | --- |
| 1 | Local small resolutions exist | Established (Atiyah); equations rechecked |
| 2 | Chambers match by an isomorphism over the family | Falsified for the flop graph |
| 3 | Étale cocycle condition | Falsified for the flop graph |
| 4 | Global smooth proper algebraic space | Established for surface rational double points by Artin–Brieskorn; not constructed by flop gluing; not a transcendental cycle |
| 5 | Relative algebraic graph cycle | The flop graph exists and specializes to a reflection |
| 6 | Flat transport of the cohomological action | The flat limit of the identity is the reflection |
| 7 | Chow specialization without boundary terms | Falsified: the product component is a boundary term of multiplicity one |
| 8 | Exceptional multiplicities | Multiplicity one, computation verified |
| 9 | Rational polarized Hodge-isometry transport along the degeneration | Not obtained |

The direct cycle of Theorem A does not use this degeneration.

## Adversarial checks that were required to pass

- \(\alpha=\mu\) is asserted false.
- The inverse base map \(v\mapsto\varepsilon^{-1}v\) was computed separately.
  Its \(H^{2,0}\) eigenvalue is also \(\mu\), not \(\mu^{-1}\).
- Path-dependent limits along the exceptional curve were evaluated at two
  explicit directions.
- The Gröbner basis of the conifold graph fiber is exactly
  \(\{u_1,u_2,v_1,v_2\}\), with \(r\) and \(p\) free.
- Characteristic 2 and 3 are excluded: the Atiyah chart divides by 2, and
  \(A=-3s^2u^2\) vanishes in characteristic 3.

## Unresolved

- Mordell–Weil rank of \(S_s\). This is the obstruction to \(\rho=10\).
- The minimal polynomial of the correspondence on the whole transcendental
  lattice, and the Rosati identity off \(H^{2,0}\).
- Whether \(Z\) accounts for any specific missing class on a synthetic
  fivefold. The count \(\dim\operatorname{Hdg}^4=126\) was not recomputed.
- The reference surface \(y^2=x^3+u^{11}+u^3\) was not re-identified with a
  classified automorphism of order 48.
- The unrestricted conjecture.

## Next experiment

Compute, at one good prime of the fiber \(S_3\) and one other prime, the
Frobenius trace on the transcendental complement of the trivial lattice, with
the resolved singular fibers included. The goal is an upper bound
\(\rho\le 10\). A single trace is not enough; the experiment needs enough
extension degrees to constrain the multiplicity of the eigenvalue \(p\), and
it has to treat supersingular fibers as a separate case rather than as
evidence for rank 10.
