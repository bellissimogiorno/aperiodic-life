# Complementary searches and independent checks

These experiments extend the catalogue search with mixed-state small seeds,
larger hexagonal seeds, evolutionary Hat rules and interacting aperiodic
launch seeds. See the [findings report](../../docs/CONTINUED_SEARCH.md) for
interpretation and the [catalogue credits](../../docs/CATALOGUE_CREDITS.md)
for per-example attribution. No historical first-discovery claim is made.

| Directory | Work |
| --- | --- |
| [hat-relay](hat-relay/README.md) | Random and planted-parent priority-table evolution; four-row wake traveller; credited Spectre adaptation. |
| [hat-bs](hat-bs/README.md) | Compactness-constrained B/S and Generations evolution; rejected travelling candidates. |
| [hat-background](hat-background/README.md) | Finite defects in alternating uniform backgrounds; bounded negative result. |
| [hat-emitters](hat-emitters/README.md) | Interacting finite launchers and checks for periodically emitting sources. |
| [penrose](penrose/README.md) | Twelve-body finite launcher, subset checks, higher neighbour counts and transplant limits. |
| [hex](hex/README.md) | Mixed-state and larger seeds; exact unbounded-lattice certificates. |
| [verification](verification/README.md) | Independent complete-state replays, state-map comparisons and emission checks. |

Each campaign record gives its own PRNG, rules, horizons and stopping
conditions. Replays, ablations and deterministic recovery runs are separate
from discovery trial totals. A trial count is not a count of distinct
mathematical structures, and no confidence percentage follows from it.

Node.js runs the independent checks; C++17 is needed only to repeat the bulk
miners. The browser application remains self-contained and offline.
Generate large graph files and executables outside the repository using the
commands in each directory. Generated graphs, executables and temporary logs
are deliberately omitted from the source release.

## Attribution review

The primary references checked include James Edmond's
[paper](https://arxiv.org/html/2609.22579v1),
[Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md)
and [interactive project](https://offlattice.org/monotile/), and the original
[Hexagonal Generations discussion](https://conwaylife.com/forums/viewtopic.php?f=11&t=1319).
Searches also checked indexed hexagonal-pattern discussions and exact rule
spellings. Direct forum access was incomplete, and the historical hexagonal
pattern databases were not exhaustively compared. No indexed exact hit is a
weak negative finding, not a novelty certificate.

For the Hat wake trajectory, state projection tests check whether any of the
included published tables reproduces the observed transitions after merging
or relabelling states. The two-row relay matches Spectre and is credited
accordingly. The four-row wake trajectory has no such match in the tested
set. This finite comparison does not exclude a more general relation to
published mechanisms or an earlier unexamined discovery.

All claims on Penrose and Hat substrates stop before finite-boundary effects.
A local translated state and finite surrounding halo do not imply that the
unseen aperiodic environment continues to support the pattern. Infinite
regular-lattice certificates state the additional separation argument that
makes their conclusions stronger.
