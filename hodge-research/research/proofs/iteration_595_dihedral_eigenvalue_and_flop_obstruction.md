# Iteration 595 — two proved statements

The unrestricted rational Hodge conjecture is not claimed. Archive files for
Iterations 526–594 were not in this workspace, so nothing below depends on them.

## Theorem A — holomorphic eigenvalue of the dihedral correspondence

Let \(P(z)=z^4-4z^2+2\) and
\[
E=\mathbb Q[t]/(P(t)).
\]
For \(s^3\notin\{0,1\}\), let \(S_s\) be the minimal resolution of the Weierstrass model
\[
y^2=x^3-3s^2u^2x+u^3\bigl(P(u-2)^2-2s^3\bigr).
\]
Let
\[
\varepsilon=\zeta_{16}^2,\qquad \lambda=\zeta_{16}^3,\qquad \kappa=\zeta_{16}^7,
\]
and let \(\mu=\zeta_{16}+\zeta_{16}^{-1}\). Write \(\alpha=\zeta_{16}^7+\zeta_{16}^9\).

There is a codimension-2 algebraic cycle \(Z\) on \(S_s\times S_s\), defined over
\(\mathbb Q(s)(\zeta_{16})\), whose induced operator on \(H^{2,0}(S_s)\) is
multiplication by \(\mu\). In particular \(\alpha=-\mu\), so the normalization
\(\kappa=\zeta_{16}^7\) does not act by the prompt value \(\alpha\). Both
\(\mu\) and \(\alpha\) are primitive elements of \(E\), and neither lies in
\(\mathbb Q(\sqrt2)\).

### A1. The field

Eisenstein at 2 shows that \(P\) is irreducible. Evaluating signs,
\[
P(-2)=2,\; P(-1)=-1,\; P(0)=2,\; P(1)=-1,\; P(2)=2,
\]
gives four real roots. In \(E=\mathbb Q(\alpha_0)\) with \(\alpha_0^4-4\alpha_0^2+2=0\),
the element \(\beta=\alpha_0^3-3\alpha_0\) satisfies \(\beta^2=4-\alpha_0^2\). The
substitution \(\alpha_0\mapsto\beta\) preserves \(P\) and has order 4:
\[
\sigma(\alpha_0)=\beta,\quad \sigma^2(\alpha_0)=-\alpha_0,\quad \sigma^4=\mathrm{id}.
\]
Thus \(E/\mathbb Q\) is Galois of degree 4 with group \(C_4\), and it is totally
real. The unique quadratic subfield is \(\mathbb Q(\sqrt2)=\mathbb Q(\alpha_0^2-2)\).

The same minimal polynomial is satisfied by
\[
\mu=\sqrt{2+\sqrt2}=\zeta_{16}+\zeta_{16}^{-1}
\]
and by \(\alpha=-\mu\). If \(\mu\) lay in \(\mathbb Q(\sqrt2)\), then
\(\mu=a+b\sqrt2\) would force \(8w^2-8w+1=0\) for \(w=b^2\), whose discriminant
is 32, not a square. So \(\mu\notin\mathbb Q(\sqrt2)\).

### A2. The integral model of the double cover

Set \(z=u-2\) and \(z=v+v^{-1}\), so
\[
u=\frac{(v+1)^2}{v}.
\]
The deck involution is \(v\mapsto v^{-1}\). Clearing denominators by
\[
d(v)=\frac{v^2}{v+1},\qquad x=\frac{X}{d(v)^2},\qquad y=\frac{Y}{d(v)^3}
\]
produces the integral model
\begin{align*}
A_{\mathrm{new}}&=-3s^2v^6,\\
B_{\mathrm{new}}&=v\bigl((v^8+1)^2-2s^3v^8\bigr).
\end{align*}
The identity \(P(v+v^{-1})=(v^8+1)/v^4\) is the source of the second formula.
Both formulas are polynomial identities, checked by exact expansion.

### A3. The lift of \(v\mapsto\varepsilon v\)

Substitute \(v\mapsto\varepsilon v\). Since \(\varepsilon^8=1\),
\[
\frac{A_{\mathrm{new}}(\varepsilon v)}{A_{\mathrm{new}}(v)}=\varepsilon^6=-i,
\qquad
\frac{B_{\mathrm{new}}(\varepsilon v)}{B_{\mathrm{new}}(v)}=\varepsilon.
\]
The constant \(\lambda=\zeta_{16}^3\) satisfies \(\lambda^4=-i\) and \(\lambda^6=\varepsilon\).
Therefore
\[
\Psi:(X,Y,v)\longmapsto(\lambda^2 X,\,\lambda^3 Y,\,\varepsilon v)
\]
is an automorphism of this Weierstrass model over \(\mathbb Q(\zeta_{16})\).
In the normalized coordinates \(X_p=X/v^3\) and \(V=Y(v+1)/(cv)\), the same map is
\[
X_p'=X_p,\qquad
V'=\kappa\frac{1+\varepsilon v}{1+v}V,
\]
because \(\kappa=\lambda^3/\varepsilon=\zeta_{16}^7\). This is the prompt normalization.
It is the graph of a morphism of the model, not a formal polynomial identity
detached from a cycle.

### A4. The holomorphic form

On the original surface the meromorphic form \(dx\wedge du/y\) transforms, under
the coordinate change above, by the identity
\[
\frac{dx\wedge du}{y}=(v-1)\,\frac{dX\wedge dv}{Y}
\]
on the locus \(v\neq -1\) and \(Y\neq 0\). The coefficient identity
\(d(v)\,du/dv=v-1\) is polynomial. Pulling back by \(\Psi\) multiplies this form by
the rational function
\[
\rho(v)=\frac{\varepsilon(\varepsilon v-1)}{\lambda(v-1)}.
\]
The deck involution \(v\mapsto 1/v\) preserves the form: the two sign changes,
one from \(d(1/v)\) and one from \(v\circ\sigma-1\), cancel, and the weights of
\(X\) and \(Y\) contribute \(v^{-8}\cdot v^{9}=v\). Thus the form descends to \(S_s\).

Summing the two sheets,
\begin{align*}
\rho(v)+\rho(1/v)
&=\frac{\varepsilon}{\lambda(v-1)}\bigl((\varepsilon v-1)+(v-\varepsilon)\bigr)\\
&=\frac{\varepsilon(1+\varepsilon)}{\lambda}.
\end{align*}
The numerator identity is an equality in \(\mathbb Z[\zeta_{16}][v]\) before
cancelling \(v-1\). The constant equals \(\mu\), not \(\alpha\). Therefore the
correspondence
\[
Z=(\pi,\pi\circ\Psi)_*[S^\sim]
\]
acts on \(H^{2,0}(S_s)\) by
\[
\pi_*\circ\Psi^*\circ\pi^*\;=\;\text{multiplication by }\mu.
\]
The same computation with \(\varepsilon^{-1}\) and \(\lambda^{-1}=\zeta_{16}^{13}\)
gives the same constant \(\mu\). The inverse correspondence has the same
eigenvalue on the one-dimensional space \(H^{2,0}\). That is the necessary
condition for Rosati self-adjointness on this line. It is not yet a proof that
the operators are adjoint on all of \(H^2\).

Since \(\mu\notin\mathbb Q(\sqrt2)\) and correspondences coming from
Néron–Severi classes act by \(0\) on \(H^{2,0}\), the Betti class of \(Z\) is not
a rational linear combination of Néron–Severi correspondences and of
correspondences acting on \(H^{2,0}\) through \(\mathbb Q(\sqrt2)\).

### A5. What Theorem A does not say

- It does not prove that the minimal polynomial of the operator on the
  transcendental lattice is \(P\). It proves that \(P\) divides the minimal
  polynomial, because \(\mu\) is an eigenvalue and \(P\) is irreducible.
- It does not prove that the Mordell–Weil rank vanishes, so the Picard rank
  may exceed the trivial-lattice rank 10 computed in Theorem B.
- It does not identify \(Z\) with a rational Hodge class on the synthetic
  fivefold of the missing iteration archives. The dimension count 126 is not
  recomputed here.
- Abstract existence of some projective K3 surface with real multiplication by
  a degree-4 totally real field is already contained in Bayer-Fluckiger–van
  Geemen–Schütt, arXiv:2401.04072, for \(md\le 21\). The dihedral-cover method
  is the method of van Geemen–Schütt, Forum of Mathematics, Sigma 13 (2025),
  e2. Theorem A is an explicit cycle on this Weierstrass model, together with
  the corrected eigenvalue. It is not an existence theorem beyond that
  literature, and it is not a proof of the Hodge conjecture.

## Theorem B — singular fibers of \(S_s\)

For every \(s\) with \(s^3\notin\{0,1\}\), in characteristic zero, the
Weierstrass model is relatively minimal of discriminant degree 24, with Kodaira
fibers
\[
I_0^*+4I_2+8I_1+II.
\]
Its minimal resolution is an elliptic K3 surface. The trivial lattice coming
from the zero section, the fiber, and the reducible-fiber components has rank
10, and
\[
U\oplus D_4(-1)\oplus A_1(-1)^4
\]
injects into \(\mathrm{NS}(S_s)\) up to the usual finite-index ambiguity coming
from torsion sections. In particular the Picard rank is at least 10. Equality
is not proved.

### B1. Discriminant

With \(A=-3s^2u^2\) and \(B=u^3(P(u-2)^2-2s^3)\),
\[
4A^3+27B^2=27u^6\,P(u-2)^2\bigl(P(u-2)^2-4s^3\bigr).
\]
This is an identity of polynomials in \(\mathbb Z[s,u]\). Thus
\[
\Delta=-16(4A^3+27B^2)
\]
has \(v_u(\Delta)=6\) at \(u=0\), valuation 2 at each of the four simple roots of
\(P(u-2)\), and valuation 1 at each of the eight roots of \(P(u-2)^2=4s^3\).

Those eight roots are simple whenever \(s^3\notin\{0,1\}\). A common root with
the derivative would require \(P=0\) or \(P'=0\). The first forces \(s=0\). The
second occurs at \(z\in\{0,\pm\sqrt2\}\), where \(P(z)^2=4\), hence \(s^3=1\).
They are distinct from \(u=0\) for the same reason: \(P(-2)^2=4\).

### B2. Kodaira types

At \(u=0\), \(v(A)=2\) and \(v(B)=3\) unless \(s^3=2\), in which case \(v(B)\ge 4\)
but the auxiliary cubic
\[
T^3-3s^2T+(4-2s^3)
\]
still has nonzero discriminant \(432(s^3-1)\). The distinct-root case of Tate's
table is \(I_0^*\). At the four roots of \(P\), \(v(\Delta)=2\) and \(v(A)=0\),
so the fibers are \(I_2\). At the eight simple roots of \(P^2-4s^3\),
\(v(\Delta)=1\) and \(v(A)=0\), so the fibers are \(I_1\).

In the chart \(u=1/t\), \(x=X/t^4\), \(y=Y/t^6\), the transformed coefficients
satisfy \(v_t(A_{\infty})=6\) and \(v_t(B_{\infty})=1\), because
\[
P(t^{-1}-2)=t^{-4}Q(t),\qquad Q(0)=1.
\]
Hence \(v_t(\Delta)=2\), which is a fiber of type \(II\). The Euler numbers
\[
6+4\cdot 2+8\cdot 1+2=24
\]
match \(c_2\) of a K3 surface. A relatively minimal elliptic surface over
\(\mathbb P^1\) with a section and \(c_2=24\) is a K3 surface. The listed Kodaira
types are the minimal ones for these valuations, so the Weierstrass model is
already relatively minimal.

### B3. Rank

Shioda–Tate gives
\[
\rho=2+\operatorname{rank}\mathrm{MW}+\sum_v(m_v-1).
\]
Here \(m(I_0^*)=5\) and each \(I_2\) has \(m=2\), so \(\sum(m_v-1)=8\) and the
trivial lattice has rank 10. Components contribute \(D_4(-1)\) and four copies
of \(A_1(-1)\), together with the hyperbolic plane of section and fiber. Extra
Mordell–Weil rank, or torsion that creates a proper overlattice, is not ruled
out. No finite-field point count is claimed in this iteration.

## Theorem C — the flop graph is not a Čech cocycle

Let \(xy=(z-t)(z+t)\). The two small resolutions \(Y_\pm\) are the blow-ups of
the ideals \((x,z-t)\) and \((x,z+t)\). In the affine charts with exceptional
coordinates \(b\) and \(c\), the closure \(\Gamma\) of the graph of the
isomorphism over \(t\neq 0\) is parametrized by \((x,b,c)\) through
\[
y=xbc,\qquad 2z=x(b+c),\qquad 2t=x(c-b).
\]
Thus \(\Gamma\cong\mathbb A^3\). Over the DVR of the \(t-line\), \(t\) is a
nonzerodivisor and the coordinate ring is torsion-free, so \(\Gamma\to\mathbb A^1_t\)
is flat. The special-fiber equation \(x(c-b)=0\) is square-free. Its cycle is
\[
[\Gamma_0]=[\Gamma_{\mathrm{id}}]+[E_+\times E_-],
\]
each component of multiplicity one.

The component \(c=b\) is the graph of the identity between the two copies of the
minimal resolution of the surface singularity \(xy=z^2\). The component \(x=0\)
is the product of the exceptional lines. On a smooth surface, the correspondence
\(E\times E\) acts by \(x\mapsto (x\cdot E)E\). Therefore \(\Gamma_0\) acts by
\[
s_E(x)=x+(x\cdot E)E.
\]
The exceptional curve of the \(A_1\) resolution has normal bundle
\(\mathcal O_{\mathbb P^1}(-2)\): in the standard charts
\((x,b)\mapsto(x,xb^2,xb)\) and \((y,c)\mapsto(yc^2,y,yc)\), the local equation
of \(E\) transforms by \(x=yc^2\). Hence \(E^2=-2\), \(s_E(E)=-E\), and \(s_E\)
is the reflection in \(E\). In particular \(s_E\neq\mathrm{id}\).

The same non-isomorphism is visible on the integral conifold \(UV=WZ\). In the
chart of the first small resolution, the graph closure is
\[
u_1=u_2p,\qquad v_2=u_2,\qquad v_1=u_2r,
\]
isomorphic to \(\mathbb A^3_{u_2,r,p}\). The scheme-theoretic fiber over the
node is the reduced plane \(u_2=0\), with free coordinates \((r,p)\), so it is
\(\mathbb P^1\times\mathbb P^1\) in this chart and the complementary charts.
The two points \((r,p)=(1,0)\) and \((1,1)\) project to the same point of the
first exceptional curve and to different points of the second. Limits along
different normal directions to a fixed point of \(E_+\) are different points of
\(E_-\), so the birational map does not extend to a morphism along \(E_+\).

A Čech descent datum on an étale cover takes values in isomorphisms and
satisfies the cocycle identity on triple overlaps. A correspondence whose
projections contract rulings, and whose flat specialization is a reflection, is
not such an isomorphism. Gluing the two small resolutions by the flop graph
therefore does not define an algebraic space, a scheme, or a flat transport of
the identity correspondence.

### C1. What remains true

Brieskorn's simultaneous resolution, algebraized by Artin, still supplies a
smooth algebraic space of simultaneous resolutions for a family of rational
double points after the Weyl-group base change. That space is not obtained by
declaring the flop graph to be the transition map. Its exceptional curves are
the \((-2)\)-curves of the resolved surface fibers, so they land in the
Néron–Severi group of those fibers. They do not manufacture a transcendental
real-multiplication operator.

A smoothing \(xy-zw=t\) is a different local model: its total space is already
smooth. There is no simultaneous small resolution whose special fiber is a
small resolution of the node and whose general fiber is the smooth Milnor
fiber, because those fibers are not diffeomorphic (a 2-sphere versus a
3-sphere). Theorem C is about the base-changed \(A_1\) total space, which is
singular, and about the conifold graph.

## Status labels

| Statement | Status |
| --- | --- |
| \(E/\mathbb Q\) totally real cyclic quartic | Internally proved |
| Theorem A, eigenvalue \(\mu=-\alpha\) | Internally proved |
| Inverse correspondence has the same \(H^{2,0}\) eigenvalue | Computation verified |
| Full Rosati identity on \(H^2\) | Conditional |
| Theorem B, Kodaira configuration and K3 conclusion | Internally proved |
| Picard rank equal to 10 | Open; only the lower bound 10 is proved |
| Theorem C, flop graph is not a descent isomorphism | Internally proved |
| Specialization of that graph is the reflection \(s_E\) | Internally proved |
| Artin–Brieskorn algebraic-space resolution of surface RDPs | Established by the published theorems; not a transcendental cycle |
| Unrestricted rational Hodge conjecture | Open |
