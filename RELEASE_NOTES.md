# Aperiodic Life 3.7.1

Aperiodic Life is an offline browser laboratory for cellular automata on square, hexagonal, Einstein-hat, and Penrose tilings.

## Included features

- Four geometry backends with shared-edge and edge-or-corner contact graphs.
- Synchronous `B/S` rules with binary or refractory multistate evolution, plus named priority tables whose higher states influence neighbours.
- A searchable catalogue of 81 reproducible configurations, with automatic framing and slower playback for the twelve Hat, Penrose and hexagonal glider and launcher highlights (3–6 steps per second).
- Curated configurations at the top of the controls and an always-visible canvas Play/Pause button, including on mobile.
- Exact JSON state save/load, settings export, PNG export, painting, panning, and zooming.
- Mobile pinch-to-zoom and two-finger panning in either tool, with single-finger painting protected from accidental edits when starting a pinch.
- Localised Penrose oscillators of periods 822 and 14; Einstein-hat rotating waves of periods 39 and 219; and an eight-tile refractory clock.
- Independent reproductions of Edmond’s published Hat A/B/C gliders, a derived three-state variant, and a two-cell Hat triple launcher.
- Three-cell Penrose seeds emitting five and six independent compact travellers.
- Tiny hexagonal glider seeds and two knightship launchers with exact complete-state translated recurrence.
- Finite Penrose travellers, exact regular-lattice spaceships, long transients, replicators, and collective fields.
- Thirty-three hexagonal configurations, including a three-way spaceship gun, an oscillator-trail puffer, a self-repairing wall, a seven-copy replicator, rotating waves, wandering spaceships, and exact oscillator periods up to 4,104.
- Reproducible intensive searches, including 4,751,360 exhaustive small hexagonal combinations and the 6,630,400-trial hexagonal campaign, a hexagonal phase atlas, published-pattern credits, and an independent unbounded reference simulator checking complete live and refractory states.
- A dependency-free core API, research tools, regression tests, deterministic source packaging, and optional GitHub Pages publishing.

## Scientific interpretation

A period is a return of the complete labelled state, including refractory cells. The clock has period `2C + 3` for every computationally checked total state count `C = 4…255`; the browser exposes counts up to 32. The ten-cell Einstein-hat directional transient becomes completely extinct at generation 83.

Hat and Penrose replays are observations over finite intervals. Edmond’s September 2026 Hat glider rules are reproduced and attributed; the first Hat glider is not claimed here. A larger Hat B replay remains compact for 1,129 generations with a dead boundary buffer. The three-state derivative agrees on every tested eligible two-cell edge launch, but has dense-input counterexamples. See the [search report](docs/GLIDER_SEARCH.md) for precise coverage and evidence. No indefinitely propagating Penrose or Einstein-hat glider, glider gun, logical gate, or universality result is claimed. Exact translated recurrence on a regular square or hexagonal lattice has a stronger implication because that substrate is translation invariant. See the [rule survey](docs/RULE_SURVEY.md) and [limitations](docs/LIMITATIONS.md).

## Use and verification

Open [aperiodic-life-standalone.html](aperiodic-life-standalone.html) in a WebGL2-capable browser. The [README](README.md) covers the quick start; the [testing guide](docs/TESTING.md) lists reproducible checks and browser prerequisites. Source and release files are described in [release operations](docs/OPERATIONS.md).

Project code uses the MIT licence. The Einstein-hat adaptation retains the BSD 3-Clause notice. See [third-party attribution](THIRD_PARTY_LICENSES.md).
