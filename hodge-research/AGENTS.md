# Instructions for the next research agent

Continue from iteration 595. Do not treat this file, or any earlier AI note, as
a published theorem.

## Already settled

- Do not glue small resolutions by the flop correspondence. The special fiber
  is a reflection, proved in Theorem C of the iteration-595 proof note.
- Do not quote the holomorphic eigenvalue \(\zeta_{16}^7+\zeta_{16}^9\) for the
  normalization \(\kappa=\zeta_{16}^7\). The proved eigenvalue is
  \(\zeta_{16}+\zeta_{16}^{-1}\).
- Do not cite a van Geemen–Schütt theorem for an \(n=16\) family unless the
  quoted statement includes that case. Abstract degree-4 real multiplication
  is in Bayer-Fluckiger–van Geemen–Schütt, arXiv:2401.04072.

## Not settled

- The reductions of \(S_3\) at \(p=7\) and at \(p=11\) each have geometric
  Picard number 14. Over \(\mathbb C\) the geometric Picard number of \(S_3\)
  is between 10 and 14.
- The correspondence is known on \(H^{2,0}\) only.
- No synthetic fivefold class count has been recomputed in this checkout.
- The unrestricted rational Hodge conjecture is open. Do not announce a proof
  without a complete argument that an independent verifier can check.

## Required check before adding an iteration

From `hodge-research/`,

```bash
python3 research/scripts/verify_595.py
```

must exit 0. New claims need a new verifier that fails on a false assertion.
Keep stdlib and sympy checks in separate files.
