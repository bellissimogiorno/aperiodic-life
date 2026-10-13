# Limitations and interpretation

## Finite boards

All boards are finite. Outside cells are absent: this is equivalent to a dead exterior for B/S rules, but an absent neighbour does not contribute to a priority table's count of state-0 neighbours. Dead-border rings lock existing cells near the boundary; they do not emulate an infinite plane indefinitely. None of the four tilings uses toroidal wrap.

`B3/S23` is ordinary Conway Life only on the square Moore graph. On square shared-edge, hexagonal, hat, and Penrose graphs it is a graph-totalistic generalisation with different degree and local geometry. A pattern that works on one graph need not work on another.

In a regular honeycomb, hexagons meeting at a vertex also share an edge. Its `edge` and `touch` options therefore give the same six-neighbour graph.

## Oscillators and rotating waves

An exact oscillator returns the complete state, including all refractory cells. Localised oscillator checks include boundary clearance and the surrounding dead halo. A rotating state pattern does not imply rotational symmetry of the whole tiling.

The eight-tile hat clock has exact period `2C + 3` for each computationally checked state count `C = 4…255`. This is not a symbolic theorem for larger counts. Browser controls stop at 32 states.

The ten-cell Einstein-hat directional transient loses its last live cell at generation 75 and its last refractory cell at generation 83. It is not a glider and is not connected throughout.

## Penrose travellers

The four-, five-, and six-state `B2/S` catalogue phases are verified for 220 generations. The `B24/S`, `B2/S4`, `B26/S`, and `B27/S4` launchers are verified for 200 generations. Checks cover complete states, compactness, directionality, boundary distance, and exact translated phases with a radius-3 contact-graph match.

These are finite observations. A local translated return on a Penrose tiling does not establish indefinite motion, because the substrate has no global translation symmetry. A changing environment may stop or alter the pattern beyond the measured interval. Launch-dependent rule clauses also do not establish a different perpetual propagation mechanism.

The two depth-11 Penrose launchers are checked for 240 generations (five-state, five travellers) and 200 generations (six-state, six travellers). Their separated objects are a finite launch result, not periodic emission from a gun.

## Einstein-hat priority rules

The Hat A, Hat B, Hat C and derived three-state single travellers have complete-state catalogue replays through 307, 307, 311 and 307 generations respectively. The Hat C triple launcher is checked through generation 160. These examples extend the rule model: neighbours can see signal states above 1. They do not demonstrate a glider under the original B/S Generations semantics.

James Edmond's [2026 preprint](https://arxiv.org/abs/2609.22579) predates these reproductions and reports much longer finite flights on hat and Spectre tilings. It explicitly leaves an indefinite-propagation proof open. The project makes no first-Einstein-glider claim. SIMPLE is a derived rule which matches tested flights, not an equivalent rewriting on all possible configurations.

A local translated phase or a finite collection of observed surrounding patches cannot certify indefinite motion on an aperiodic tiling. Such a proof must cover every future legal neighbourhood and establish continuing escape as well as bounded survival. The project supplies no such proof for its aperiodic catalogue, nor a glider gun, stable collision system, logical gate or universality construction on an aperiodic substrate.

## Regular-lattice spaceships

On the unbounded regular square or hexagonal lattice, an exact complete-state return under a nonzero lattice translation implies continued periodic translation: both the rule and substrate commute with that translation. Finite-board replays still need enough clearance to avoid their artificial boundary.

A multistate launcher may use clauses that are dormant in its eventual periodic orbit. The launch rule and recurring behaviour must be distinguished. The [rule survey](RULE_SURVEY.md) gives the catalogue's exact returns.

## Bounded detection and search

Browser cycle detection compares complete state bytes within a finite history window under an approximate 16 MiB snapshot budget, capped at 1,024 states. Hashes narrow recurrence candidates; they do not prove equality. The browser detector does not recognise translation, rotation, reflection, or local recurrence against a changing background.

Active fields and long transients are checked only through their stated horizons. They may later cycle, freeze, die, or reach the boundary. Search failure applies only to the recorded rules, seeds, horizons, and bounds; it is not a nonexistence proof.

Coarse search fingerprints do not count distinct mathematical structures. Evolutionary candidates are correlated, and candidate totals are not statistical confidence levels. The 81 curated catalogue entries have individual verification contracts; raw search output does not automatically qualify for the catalogue.

## Expressiveness

B/S rules inspect the cell's current state and the total number of state-1 neighbours. Named priority tables instead count neighbours in each state separately. Neither family inspects tile orientation, Penrose thin/thick type, hat chirality, hierarchy, edge direction, or ribbon labels. Adding those distinctions would change the model further.

Goucher's published Penrose glider uses uniform neighbour-state counts; it does not read ribbon information. Ribbons explain its propagation geometrically. The programmatic `TABLE:PENROSE-GOUCHER` rule reproduces its corrected mathematical table. `TABLE:SPECTRE` is another programmatic rule name: the package has no Spectre geometry backend, and its Einstein option continues to mean the hat tiling.

## Reproducibility and browser limits

Aperiodic catalogue IDs and saved state indices depend on deterministic geometry ordering. A backend change must preserve this ordering or explicitly migrate the data. Graph fingerprints detect accidental incompatibility, not authenticity.

WebGL2 is required. Large boards and cycle histories consume substantial memory and may pause the browser's main thread. Menu sizes target interactive use. Rendered pixels and timings can differ between GPUs, browsers, and machines.

Source tests do not replace direct browser acceptance. The browser harness identifies whether it used HTTP and direct standalone navigation or document injection; the latter does not verify that a target browser permits local file loading. See [testing](TESTING.md).
