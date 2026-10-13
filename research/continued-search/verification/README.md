# Independent verification of the continued search

From the repository root:

```sh
node research/continued-search/verification/verify.js
node research/continued-search/verification/verify.js --long
```

The default command checks two finite depth-5 Hat wake launches, the related
Spectre-equivalent reduction as an identity-test control, an isolated hexagonal
puffer, its three-cell twin launcher, the period-48 hexagonal spaceship, and
the Hat A six-traveller launcher and the finite Hat B recurring emitter.
It also checks that all eight added catalogue examples use their verified
rules and complete seeds (or, for the p48 spaceship, a translated orbit phase).
`--long` also replays the complete 1,000-generation depth-6 Hat flight and its
polygon-preserving seed transplant. No generated graph, external dependency,
or saved list of every phase is required.

`hat-relay-evidence.json` retains the original seven-row evolved table, its
four-row reduction, complete seeds, miner checkpoints, final states and
trajectory hashes. Every cell state is compared with the production sparse
engine; a separate direct-neighbour evaluator includes zero-neighbour counts.
The full seven-row and reduced tables agree at every recorded generation.
The long case travels 1,071.983213 tile-coordinate units in 1,000 generations,
has at most nine nonzero cells, and retains at least eight boundary rings.
Full labelled polygons, degrees, adjacency and three rings of dead cells match
at the recorded local return and transplant.

The mature four-state wake dynamics have no exact projection onto the six
stored comparison tables under any of 341 nontrivial state maps preserving
zero. Merging states and dropping a state into zero are included. This checks
observed contexts, not arbitrary configurations or every possible model of
mechanism equivalence. The nearby two-row reduction is a useful positive
control: its mature trajectory **does** match Edmond's Spectre rule after
state relabelling. It is retained as an adaptation, not a new mechanism.

`verify-puffer.js` supplies a separate integer-coordinate implementation which
does not import the miner, production engine or existing hexagonal reference.
It checks exact six-step core-plus-deposit recurrences. Cube-coordinate
projection gaps of at least four keep radius-one dependency neighbourhoods
disjoint, with gaps nondecreasing under subsequent emissions. At generation
30, the three-cell launch consists of two opposite puffer heads and four
stationary cells. Every new deposit lies within its own outward-moving
head's envelope, so the finite certificates extend by induction to indefinite
propagation on the unbounded hexagonal lattice. This is a finite launch of
two puffers, not a stationary gun.

`verify-new-hex-ship.js` checks the entire period-48 state cycle and rules out
any smaller translated period. Its seven-live-cell seed reaches that orbit
after 16 generations. The orbit shifts by axial (-32,16), and birth clause B5
is inactive once the orbit is reached. Eighteen phases admit a spatial split;
independent replay shows that each contains one persistent body plus sparks
which die within four generations, rather than multiple surviving convoy
members. This is a specific decomposition check, not a general theorem of
indecomposability.

Exact recurrence on a regular infinite hexagonal lattice proves the specified
unbounded motion. A finite local return on an aperiodic Hat graph does not:
the future substrate can differ. None of these verifications establishes
historical discovery priority or a proof of immortal Hat propagation.

The six-traveller Hat A launch uses Edmond's published table. Six connected
bodies evolve independently from generation 60 through 180, reproducing the
complete configuration at every step. Every body has a certified local return
including all state labels, complete polygons and three empty neighbour rings.
Each has at most eight nonzero cells and radius below 3.255; the complete
trajectory retains at least seven boundary rings. The seed is a package search
result, not authorship of the parent glider rule or a periodically emitting gun.

The independent Hat emitter check, also included in the default command, is
`node research/continued-search/verification/verify-hat-emitter.js`. It checks
the native source identity, every intermediate cohort union, four independently
evolving packets and production/direct-reference parity. The entire parent
state becomes the source at generation 30; it is not maintained by external
feed. The recorded finite operation does not establish an indefinitely
operating gun or a least source period.
