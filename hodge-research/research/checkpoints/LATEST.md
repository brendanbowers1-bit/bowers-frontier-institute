# Checkpoint 595

Date: 17 November 2026 (America/Denver).

Iterations 526–594: files absent from this checkout. No checksums were verified
for those archives.

## Proved

- Theorem A. The dihedral cycle on \(S_s\) acts on \(H^{2,0}\) by
  \(\mu=\zeta_{16}+\zeta_{16}^{-1}=-\alpha\), with \(\alpha\) the previously
  stated root.
- Theorem B. For \(s^3\notin\{0,1\}\) the minimal resolution is an elliptic K3
  surface with fibers \(I_0^*+4I_2+8I_1+II\). Trivial lattice rank 10.
  Picard rank 10 is not proved.
- Theorem C. The Atiyah flop graph is flat, its special fiber is the identity
  graph plus a reduced exceptional product, and the action is the reflection
  in a \((-2)\)-curve. It is not a Čech transition isomorphism.

## Verifiers

```text
python3 research/scripts/verify_595_stdlib.py
python3 research/scripts/verify_595_sympy.py
python3 research/scripts/verify_595.py
```

Certificates: `research/certificates/iteration_595/`.

## Next experiment

A finite-field upper bound for the Picard rank of \(S_3\), with supersingular
reductions excluded rather than counted as rank-10 evidence.

## Conjecture

The unrestricted rational Hodge conjecture remains open.
