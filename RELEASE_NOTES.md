# Aperiodic Life 3.6.3

Aperiodic Life is an offline browser laboratory for cellular automata on square, hexagonal, Einstein-hat, and Penrose tilings.

## Included features

- Four geometry backends with shared-edge and edge-or-corner contact graphs.
- Synchronous `B/S` rules with binary or refractory multistate evolution.
- A searchable catalogue of 69 reproducible configurations, with suitable playback speeds and automatic framing.
- Curated configurations at the top of the controls and an always-visible canvas Play/Pause button, including on mobile.
- Exact JSON state save/load, settings export, PNG export, painting, panning, and zooming.
- Localised Penrose oscillators of periods 822 and 14; Einstein-hat rotating waves of periods 39 and 219; and an eight-tile refractory clock.
- Finite Penrose travellers, exact regular-lattice spaceships, long transients, replicators, and collective fields.
- Twenty-eight hexagonal configurations, including a three-way spaceship gun, an oscillator-trail puffer, a self-repairing wall, a seven-copy replicator, rotating waves, wandering spaceships, and exact oscillator periods up to 4,104.
- Reproducible searches covering 6,630,400 deterministic seeds, a hexagonal phase atlas, published-pattern credits, and an independent unbounded reference simulator checking complete live and refractory states.
- A dependency-free core API, research tools, regression tests, deterministic source packaging, and optional GitHub Pages publishing.

## Scientific interpretation

A period is a return of the complete labelled state, including refractory cells. The clock has period `2C + 3` for every computationally checked total state count `C = 4…255`; the browser exposes counts up to 32. The ten-cell Einstein-hat directional transient becomes completely extinct at generation 83.

The Penrose travellers are observations over finite intervals. No indefinitely propagating Penrose or Einstein-hat glider, glider gun, logical gate, or universality result is claimed. Exact translated recurrence on a regular square or hexagonal lattice has a stronger implication because that substrate is translation invariant. See the [rule survey](docs/RULE_SURVEY.md) and [limitations](docs/LIMITATIONS.md).

## Use and verification

Open [aperiodic-life-standalone.html](aperiodic-life-standalone.html) in a WebGL2-capable browser. The [README](README.md) covers the quick start; the [testing guide](docs/TESTING.md) lists reproducible checks and browser prerequisites. Source and release files are described in [release operations](docs/OPERATIONS.md).

Project code uses the MIT licence. The Einstein-hat adaptation retains the BSD 3-Clause notice. See [third-party attribution](THIRD_PARTY_LICENSES.md).
