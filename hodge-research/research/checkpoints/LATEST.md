# Checkpoint 596

Date: 17 November 2026 (America/Denver).

## Proved, and still in force from iteration 595

- Theorem A. The dihedral cycle acts on \(H^{2,0}\) by
  \(\mu=\zeta_{16}+\zeta_{16}^{-1}\).
- Theorem B. The minimal resolution is an elliptic K3 with fibers
  \(I_0^*+4I_2+8I_1+II\) and trivial lattice of rank 10. Picard rank 10 is
  not proved.
- Theorem C. The flop graph is not a Čech transition isomorphism.

## New computation

The resolved model of \(S_3\) was counted over \(\mathbb F_{7^k}\) for
\(k\le 7\) and over \(\mathbb F_{17^k}\) for \(k\le 5\). Blow-ups at nine good
primes reproduce the Kodaira exceptional-point formulas. At \(p=7\) the
complement of the predicted rank-10 Néron–Severi module is not a Weil
polynomial: its degree-6 polynomial in \(\lambda^2\) has real roots in
\((-51,-50)\) and \((-48,-47)\). No integer algebraic trace of corank
\(2,4,6,8,10,12\) repairs this. The count therefore does not prove that the
geometric Picard number is 10.

## Verifiers

```text
python3 research/scripts/verify_595.py
python3 research/scripts/verify_596_pointcount.py
```

## Conjecture

The unrestricted rational Hodge conjecture remains open.
