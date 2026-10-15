# Aperiodic Life 3.7.6

Release date: **15 October 2026**.

Aperiodic Life is an offline browser laboratory for cellular automata on square, hexagonal, Einstein-hat, and Penrose tilings.

## Changes in 3.7.6

- Fixed a source-hosting upgrade hazard: `index.html` now requests every runtime script and stylesheet with the application version in its URL. This avoids reusing older cached JavaScript after an interface change.
- The standalone builder checks those references against `VERSION` and refuses missing or mismatched asset references. The generated standalone and curated Pages payload remain fully inline.
- Added a dependency-free interface regression that executes the actual production element collector against the supplied HTML, including the embedded standalone script. It checks every required element and versioned asset URL.
- The reported `#newSeedButton` error is reproduced when older JavaScript is combined with the updated interface. The previously delivered 3.7.5 archive itself contains matching scripts and HTML; the user’s exact browser/cache/deployment state was not accessible for confirmation.

## Changes in 3.7.5

- Fixed **Randomise** and the `R` shortcut reusing the same seed on every action. Each action now generates and displays a fresh seed before filling the board.
- Replaced the seed-only **New** button with **Apply seed**. This applies the displayed or typed seed deterministically; Enter in the seed field does the same. Startup, geometry rebuilds and curated examples retain deterministic seeding.
- Added canvas keyboard navigation: focus the canvas with a click or Tab, then use the arrow keys to pan; Shift pans farther. Focus is visibly indicated and form controls retain their arrow-key behaviour.
- Added regression coverage for canvas keyboard navigation, fresh randomisation, explicit seed replay, keyboard use and busy-state handling.
- Separated the application version from the retained catalogue version in handover metadata, catalogue download names and catalogue rebuild validation. The reviewed 3.7.4 catalogue, revision 2, and its scientific data remain unchanged.
- Added handover build/integrity regressions and corrected malformed manifest-path handling.

See [the verification record](docs/handover/VERIFICATION.md) for the checks actually executed and remaining browser-test limitations.

## Included features

- A [full illustrated PDF catalogue](docs/catalogue/aperiodic-life-catalogue.pdf) of all 89 curated configurations and all 12 named rule templates, with complete rule definitions, uniquely labelled rule-sets, reproducible seeds, verification limits, and individual provenance.
- Catalogue documentation revision 2 adds the authorship statement “AI generated following prompts by Murdoch J. Gabbay”, named parent works for adaptations, precise linked citations, and dated originality statements. The catalogue retains its 3.7.4 version independently of the application patch release.
- Editable [catalogue source and rebuild instructions](docs/catalogue/README.md), included with the Python PDF builder, structured data, and figures.
- An **About** button at the bottom of the controls with author credit, release date, version, and links to the catalogue and its editable source. Both branch-based Pages hosting and the curated Pages build include the catalogue.

- Four geometry backends with shared-edge and edge-or-corner contact graphs.
- Synchronous `B/S` rules with binary or refractory multistate evolution, plus named priority tables whose higher states influence neighbours.
- A searchable catalogue of 89 reproducible configurations, with automatic framing and slower playback for selected Hat, Penrose and hexagonal glider and launcher highlights (3–6 steps per second).
- Individual credits and source links for every example, searchable by credited author, with a complete [provenance audit](docs/CATALOGUE_CREDITS.md). Published patterns and adaptations are distinguished from package-found configurations whose historical priority is unestablished.
- Curated configurations at the top of the controls and an always-visible canvas Play/Pause button, including on mobile.
- Exact JSON state save/load, settings export, PNG export, painting, panning, and zooming.
- Mobile pinch-to-zoom and two-finger panning in either tool, with single-finger painting protected from accidental edits when starting a pinch.
- Localised Penrose oscillators of periods 822 and 14; Einstein-hat rotating waves of periods 39 and 219; and an eight-tile refractory clock.
- Independent reproductions of James Edmond’s published Hat A/B/C gliders and Hat C triple behaviour, with a derived three-state variant. His [paper](https://arxiv.org/abs/2609.22579) and [interactive project](https://offlattice.org/monotile/) receive explicit credit.
- An independently evolved four-state Hat wake traveller, with a verified 1,000-generation interior flight on a larger patch, plus a correctly credited two-row Spectre adaptation.
- A six-way Hat A launcher and a Hat B recurring emitter with finite verification; no perpetual-emission proof is asserted.
- Three-cell Penrose seeds emitting five, six and twelve independent compact travellers.
- Tiny hexagonal glider seeds, two knightship launchers, a period-48 spaceship and a period-6 puffer with a three-cell twin launch. The new puffer has an exact unbounded separation certificate.
- Finite Penrose travellers, exact regular-lattice spaceships, long transients, replicators, and collective fields.
- Thirty-six hexagonal configurations, including a three-way spaceship gun, an oscillator-trail puffer, a self-repairing wall, a seven-copy replicator, rotating waves, wandering spaceships, and exact oscillator periods up to 4,104.
- Reproducible intensive searches, including 4,751,360 exhaustive small hexagonal combinations and the 6,630,400-trial hexagonal campaign, a hexagonal phase atlas, published-pattern credits, and an independent unbounded reference simulator checking complete live and refractory states.
- Complementary searches totalling 8,034,400 additional evaluations, with [reproducible records and bounded claims](docs/CONTINUED_SEARCH.md).
- A dependency-free core API, research tools, regression tests, deterministic source packaging, and optional GitHub Pages publishing.

## Scientific interpretation

A period is a return of the complete labelled state, including refractory cells. The clock has period `2C + 3` for every computationally checked total state count `C = 4…255`; the browser exposes counts up to 32. The ten-cell Einstein-hat directional transient becomes completely extinct at generation 83.

Hat and Penrose replays are observations over finite intervals. Edmond’s September 2026 Hat glider rules are reproduced and attributed; the first Hat glider is not claimed here. A larger Hat B replay remains compact for 1,129 generations with a dead boundary buffer. The three-state derivative agrees on every tested eligible two-cell edge launch, but has dense-input counterexamples. See the [search report](docs/GLIDER_SEARCH.md) for precise coverage and evidence. No proof of infinite Hat or Penrose travel or perpetual aperiodic emission is supplied. No logical gate or universality result is claimed. Exact translated recurrence on a regular square or hexagonal lattice has a stronger implication because that substrate is translation invariant. See the [rule survey](docs/RULE_SURVEY.md) and [limitations](docs/LIMITATIONS.md).

## Use and verification

Open [aperiodic-life-standalone.html](aperiodic-life-standalone.html) in a WebGL2-capable browser. The [README](README.md) covers the quick start; the [testing guide](docs/TESTING.md) lists reproducible checks and browser prerequisites. Source and release files are described in [release operations](docs/OPERATIONS.md).

Project code uses the MIT licence. The Einstein-hat adaptation retains the BSD 3-Clause notice. See [third-party attribution](THIRD_PARTY_LICENSES.md).
