# Hodge research lab

Exact notes and verifiers on one elliptic K3 family and on one descent
obstruction. This directory does not modify the finance dashboard in the
rest of the repository.

The unrestricted rational Hodge conjecture is open. Iteration 595 proves three
narrow statements:

- The dihedral correspondence on
  \(y^2=x^3-3s^2u^2x+u^3(P(u-2)^2-2s^3)\),
  \(P(z)=z^4-4z^2+2\), acts on \(H^{2,0}\) by
  \(\zeta_{16}+\zeta_{16}^{-1}\), not by the opposite root
  \(\zeta_{16}^7+\zeta_{16}^9\).
- For \(s^3\notin\{0,1\}\) the minimal resolution is an elliptic K3 surface
  with fibers \(I_0^*+4I_2+8I_1+II\). The trivial lattice has rank 10.
- The graph of the Atiyah flop specializes to a reflection in a
  \((-2)\)-curve and is not a Čech gluing map.

The proof is `research/proofs/iteration_595_dihedral_eigenvalue_and_flop_obstruction.md`.
The audit is `research/audits/iteration_595.md`.

## Run the checks

```bash
python3 -m pip install sympy
python3 research/scripts/verify_595.py
python3 tests/test_iteration_595.py
```

`verify_595_stdlib.py` uses only the Python standard library.
`verify_595_sympy.py` repeats the identities with minimal polynomials,
exact expansion, and a Gröbner basis. Either failure exits nonzero.

Iterations 526–594 were not present in this checkout. Their filenames are
recorded as absent in the audit; they were not reconstructed from memory.
