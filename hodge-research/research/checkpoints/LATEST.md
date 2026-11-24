# Checkpoint 598

Date: 24 November 2026 (America/Denver).

## Proved, and still in force from iteration 595

- Theorem A. The dihedral cycle acts on \(H^{2,0}\) by
  \(\mu=\zeta_{16}+\zeta_{16}^{-1}\).
- Theorem B. The minimal resolution is an elliptic K3 with fibers
  \(I_0^*+4I_2+8I_1+II\) and trivial lattice of rank 10. Picard rank 10 is
  not proved.
- Theorem C. The flop graph is not a Čech transition isomorphism.

## Corrected computation

The resolved count of \(S_3\) over \(\mathbb F_{7^4}\) is \(5796113\), not the
\(5796137\) recorded in checkpoint 596. The other counts through \(k=7\) stand.
The quotient by the rank-10 trivial lattice has characteristic polynomial
\[
(T^2+49)^2(T^8-154T^6+10633T^4-369754T^2+5764801).
\]
An independent count over \(\mathbb F_{7^8}\) matches this polynomial. Exactly
14 of the 22 Frobenius eigenvalues are \(7\) times a root of unity, so the
geometric Picard number of the reduction at \(p=7\) is 14.

At the good prime \(11\), the quotient by the same rank-10 lattice has
characteristic polynomial
\[
(T^4+11^4)(T^8+3993T^4+11^8).
\]
Exactly 14 eigenvalues are \(11\) times a root of unity, so the reduction at
\(11\) also has geometric Picard number 14. Over \(\mathbb C\) the geometric
Picard number of \(S_3\) is between 10 and 14.

## Verifiers

```text
python3 research/scripts/verify_595.py
python3 research/scripts/verify_596_pointcount.py
python3 research/scripts/verify_597_weil.py
python3 research/scripts/verify_598_weil.py
```

## Conjecture

The unrestricted rational Hodge conjecture remains open.
