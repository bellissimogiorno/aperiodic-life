# Catalogue credits and provenance

Every curated example has an individual record below. This audit distinguishes a published rule or behaviour from a seed selected on this package’s own board. Reproducing a known pattern, changing its orientation or phase, or finding another placement does not establish a new discovery.

**“Found by this package” records where a configuration came from, not worldwide originality.** Earlier priority remains unestablished unless a published source is identified. “Constructed” describes a demonstration assembled for this package; it does not claim invention of its rule or mechanism. An unsuccessful literature search is not evidence of novelty.

James Edmond’s [interactive project](https://offlattice.org/monotile/) and [Gliders on Aperiodic Monotilings: Cellular Automata on the Hat and Spectre](https://arxiv.org/abs/2609.22579) are the source of the Hat A/B/C rules, their gliders and the Hat C triple behaviour. The three-state SIMPLE example is a derivative of Hat B. See the individual records for the distinction between these published behaviours and the package’s selected launch positions.

The review used published papers, author-maintained repositories and pattern collections, original forum posts and the retained search records. Matching rules or periods alone was not treated as identity of patterns. Coverage is limited to the sources recorded here; undocumented independent discoveries and inaccessible material may predate these examples. Please submit earlier sources or attribution corrections with enough information to compare the complete pattern.

Audit date: 13 October 2026. Generated from [catalogue-provenance.json](../research/fixtures/catalogue-provenance.json) by `node tools/build_catalogue_credits.js`. Source links document credit; local evidence links document the supplied configuration and its verification. Software licences are recorded separately in [third-party notices](../THIRD_PARTY_LICENSES.md).

| Classification | Examples |
| --- | ---: |
| Published example | 25 |
| Adapted example | 3 |
| Found by this package; priority unestablished | 49 |
| Constructed for this package | 4 |

## Einstein-hat examples

### Hat glider B — Edmond rule

`hat-edmond-b-glider` · `TABLE:HAT-B` · 4 states · edge-or-corner neighbourhood

**Published example.** James Edmond — Hat B; seed placement found for Aperiodic Life

Uses Edmond’s published Hat B transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.

Sources: [James Edmond’s interactive project](https://offlattice.org/monotile/); [Edmond’s paper: Gliders on Aperiodic Monotilings](https://arxiv.org/abs/2609.22579); [Edmond’s Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md).

Local evidence: [research/fixtures/published-priority-rules.json](../research/fixtures/published-priority-rules.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [research/exhaustive-search/hat-targeted/selected.json](../research/exhaustive-search/hat-targeted/selected.json); [test-priority-rules.js](../test-priority-rules.js).

### Hat glider A — Edmond rule

`hat-edmond-a-glider` · `TABLE:HAT-A` · 4 states · edge-or-corner neighbourhood

**Published example.** James Edmond — Hat A; seed placement found for Aperiodic Life

Uses Edmond’s published Hat A transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.

Sources: [James Edmond’s interactive project](https://offlattice.org/monotile/); [Edmond’s paper: Gliders on Aperiodic Monotilings](https://arxiv.org/abs/2609.22579); [Edmond’s Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md).

Local evidence: [research/fixtures/published-priority-rules.json](../research/fixtures/published-priority-rules.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [research/exhaustive-search/hat-targeted/selected.json](../research/exhaustive-search/hat-targeted/selected.json); [test-priority-rules.js](../test-priority-rules.js).

### Hat glider C — Edmond rule

`hat-edmond-c-glider` · `TABLE:HAT-C` · 4 states · edge-or-corner neighbourhood

**Published example.** James Edmond — Hat C; seed placement found for Aperiodic Life

Uses Edmond’s published Hat C transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.

Sources: [James Edmond’s interactive project](https://offlattice.org/monotile/); [Edmond’s paper: Gliders on Aperiodic Monotilings](https://arxiv.org/abs/2609.22579); [Edmond’s Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md).

Local evidence: [research/fixtures/published-priority-rules.json](../research/fixtures/published-priority-rules.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [research/exhaustive-search/hat-targeted/selected.json](../research/exhaustive-search/hat-targeted/selected.json); [test-priority-rules.js](../test-priority-rules.js).

### Hat glider — three-state variant

`hat-simple-glider` · `TABLE:HAT-SIMPLE` · 3 states · edge-or-corner neighbourhood

**Adapted example.** Aperiodic Life variant of James Edmond’s Hat B rule

Derived from Edmond’s Hat B: remove its unreachable state from the two-cell launch, relabel state 3 as 2, and drop the empty-neighbour birth requirement. The resulting three-state rule matches the checked launches but differs on other inputs. Credit for the parent rule and travelling mechanism belongs to Edmond; no claim of historical priority is made for the simplification.

Sources: [James Edmond’s interactive project](https://offlattice.org/monotile/); [Edmond’s paper: Gliders on Aperiodic Monotilings](https://arxiv.org/abs/2609.22579); [Edmond’s Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md).

Local evidence: [research/fixtures/published-priority-rules.json](../research/fixtures/published-priority-rules.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [research/exhaustive-search/hat-targeted/selected.json](../research/exhaustive-search/hat-targeted/selected.json); [test-priority-rules.js](../test-priority-rules.js); [research/exhaustive-search/hat-targeted/priority-simplification.json](../research/exhaustive-search/hat-targeted/priority-simplification.json); [research/exhaustive-search/hat-targeted/simplification-counterexample.json](../research/exhaustive-search/hat-targeted/simplification-counterexample.json).

### Hat triple launcher — two-cell seed

`hat-edmond-c-triple-launcher` · `TABLE:HAT-C` · 4 states · edge-or-corner neighbourhood

**Published example.** James Edmond — Hat C triple launch; seed placement found for Aperiodic Life

Edmond’s compendium already demonstrates a two-cell Hat C seed producing three gliders. This catalogue entry uses the same published rule with a placement independently selected on Aperiodic Life’s patch. Its three separated travellers are verified through the stated finite horizon. It is a reproduction of published launch behaviour, not a claim to the first triple launcher or a repeating gun.

Sources: [James Edmond’s interactive project](https://offlattice.org/monotile/); [Edmond’s paper: Gliders on Aperiodic Monotilings](https://arxiv.org/abs/2609.22579); [Edmond’s Glider Compendium](https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md).

Local evidence: [research/fixtures/published-priority-rules.json](../research/fixtures/published-priority-rules.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [research/exhaustive-search/hat-targeted/selected.json](../research/exhaustive-search/hat-targeted/selected.json); [test-priority-rules.js](../test-priority-rules.js); [research/exhaustive-search/hat-targeted/selected-launchers.json](../research/exhaustive-search/hat-targeted/selected-launchers.json); [research/exhaustive-search/hat-targeted/priority-launchers.js](../research/exhaustive-search/hat-targeted/priority-launchers.js).

### Hat rotating wave — period 39

`hat-b2s1-c3-rotor-p39` · `B2/S1` · 3 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Found by the package’s compact-seed oscillator search under three-state B2/S1 on the shared-edge graph. The retained phase is an exact period-39 rotating wave. Its original search record identifies trial 44 of the B2/S1 edge-orbit follow-up. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [test-structures.js](../test-structures.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Hat rotating wave — period 219

`hat-b2s23-c6-rotor-p219` · `B2/S23` · 6 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Found by the package’s compact-seed oscillator search under six-state B2/S23 on the shared-edge graph. The retained phase is an exact period-219 rotating wave. Its original pilot record identifies trial 122 for that rule and state count. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [test-structures.js](../test-structures.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Hat eight-tile refractory clock — period 11

`hat-b2s13-c4-clock-p11` · `B2/S13` · 4 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Developed from an eight-tile clock found by the package’s B2/S13 search at ten states (trial 1730). The catalogue keeps the same two-live-cell phase and changes the state count to four, giving period 11. The relation period = 2C + 3 was then checked for C = 4 through 255. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [test-structures.js](../test-structures.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Hat directional transient — extinction 83

`hat-directional-transient-83` · `B2/S1` · 10 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Selected from the package’s Hat B/S motion search and reduced to a ten-cell complete phase, including one refractory cell. The reduction preserves the retained parent state at generation 40. All activity ends at generation 83; the example is a directional transient, not a glider. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [test-structures.js](../test-structures.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js).

### Hat Conway p6

`hat-conway-p6` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-touch-B3/S23-2-osc-v3-2285, density 0.35. The isolated component has period 6. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat Conway p9

`hat-conway-p9` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from the package’s deterministic Conway-rule soup hat-touch-osc-61 at density 0.30. The whole soup has period 18; the isolated catalogue component has period 9. The name credits Conway’s B3/S23 rule, not authorship of this hat configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat Conway p26

`hat-conway-p26` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from the package’s deterministic Conway-rule soup hat-touch-osc-27 at density 0.35. The isolated catalogue component has period 26. The name credits Conway’s B3/S23 rule, not authorship of this hat configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat edge-graph p15

`hat-edge-conway-p15` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B3/S23-2-osc-v3-467, density 0.35. This is an exact period-15 component on the shared-edge hat graph, using Conway’s B3/S23 counts. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat Seeds p8

`hat-seeds-p8` · `B2/S` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B2/S-2-osc-v3-97, density 0.04. The four-live-cell catalogue phase has period 8 on the shared-edge hat graph. Seeds names the B2/S rule family; it does not identify a published source for this particular configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat B23/S p20

`hat-b23-p20` · `B23/S` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-333, density 0.12. The whole soup has period 60; the isolated catalogue component has period 20. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat B23/S p24

`hat-b23-p24` · `B23/S` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-748, density 0.10. The eight-live-cell catalogue phase has period 24. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat B23/S p28

`hat-b23-p28` · `B23/S` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found in Aperiodic Life searches; earlier priority unestablished

Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-694, density 0.16. The whole soup has period 56; the isolated catalogue component has period 28. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/mine-oscillators.js](../research/mine-oscillators.js).

### Hat B1 wave field

`hat-b1-field` · `B1/S` · 2 states · edge-or-corner neighbourhood

**Constructed for this package.** Aperiodic Life seeded-field demonstration

A reproducible pseudorandom field constructed for the package’s rule survey, using seed hat-touch-B1/S-2, density 0.12 and an eight-ring dead border. It was selected because it remains active through 3,000 generations. This is a finite-board demonstration of collective dynamics, not an attributed compact pattern or a claim of a newly discovered rule.

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/verify-catalog.js](../research/verify-catalog.js); [research/survey-fields.js](../research/survey-fields.js).

## Penrose examples

### Penrose five-traveller launcher

`penrose-b2-c5-five-launcher` · `B2/S` · 5 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

This three-live-cell launch and its depth-11 placement were located by the package's connected-seed search and polygon-matched transplants. Its five emitted bodies use the existing B2/S travelling family, with finite verification through generation 240. This identifies the origin of this recorded launch, not a first-discovery claim for the rule or propagating mechanism. Earlier published Penrose gliders use a different rule.

Sources: [Goucher (2012): earlier Penrose glider under a different rule](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).

Local evidence: [research/exhaustive-search/penrose/campaigns.json](../research/exhaustive-search/penrose/campaigns.json); [research/exhaustive-search/penrose/selected-launcher-evidence.json](../research/exhaustive-search/penrose/selected-launcher-evidence.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [docs/GLIDER_SEARCH.md](../docs/GLIDER_SEARCH.md).

### Penrose six-traveller launcher

`penrose-b2-c6-six-launcher` · `B2/S` · 6 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

This three-live-cell launch and its depth-11 placement were located by the package's connected-seed search and polygon-matched transplants. Its six emitted bodies use the existing B2/S travelling family, with finite verification through generation 200. This identifies the origin of this recorded launch, not a first-discovery claim for the rule or propagating mechanism. Earlier published Penrose gliders use a different rule.

Sources: [Goucher (2012): earlier Penrose glider under a different rule](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).

Local evidence: [research/exhaustive-search/penrose/campaigns.json](../research/exhaustive-search/penrose/campaigns.json); [research/exhaustive-search/penrose/selected-launcher-evidence.json](../research/exhaustive-search/penrose/selected-launcher-evidence.json); [research/fixtures/aperiodic-evidence.json](../research/fixtures/aperiodic-evidence.json); [docs/GLIDER_SEARCH.md](../docs/GLIDER_SEARCH.md).

### Penrose compact oscillator — period 822

`penrose-edge-b23s23-p822` · `B23/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by package search; priority unestablished

Recovered in the package's focused B23/S23 edge search, then transplanted from depth 7 to depth 8. The recorded full period is 822 and 39 individual sites have that period. Owens–Stepney is earlier work on Penrose oscillators, but its Conway touch-graph catalogue does not establish authorship of this different-rule edge-graph pattern. No external exact-pattern attribution was established.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md); [research/render-oscillator-atlas.js](../research/render-oscillator-atlas.js).

### Penrose three-state oscillator — period 14

`penrose-conway-c3-p14` · `B3/S23` · 3 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found by package search; priority unestablished

Recovered in the package's multistate oscillator survey and transplanted from depth 7 to depth 8. This is a three-state B3/S23 Generations oscillator; it must not be identified with a published binary Penrose oscillator merely by period. External first-discovery priority of this exact configuration is unestablished.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md); [research/render-oscillator-atlas.js](../research/render-oscillator-atlas.js).

### Penrose Conway p4

`penrose-conway-p4` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Independently found here; published-pattern identity unresolved

The package record recovers this exact phase from deterministic soup penrose-touch-B3/S23-2-osc-v3-6566, density 0.16. It has 12 support tiles and minimum population 9. Penrose Conway oscillators were catalogued by Owens and Stepney, but an exact identification with their illustrated patterns has not been established; this is a package search attribution, not a worldwide originality claim.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/mine-oscillators.js](../research/mine-oscillators.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose Conway p5

`penrose-conway-p5` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Independently found here; published-pattern identity unresolved

The exact phase is recorded under soup penrose-touch-B3/S23-2-osc-v3-1151, density 0.35. It has 18 support tiles and minimum population 8. It is not identified with the published r-p5-14-7 juggler: those support/population invariants differ. Other possible earlier matches remain unestablished.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/mine-oscillators.js](../research/mine-oscillators.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose Conway p7

`penrose-conway-p7` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Independently found here; published-pattern identity unresolved

The package soup replay records seed penrose-touch-osc-149, density 0.16, and this exact isolated period-7 phase. It has 20 support tiles and minimum population 7. Prior Penrose Conway oscillator catalogues are relevant background, but an exact earlier-pattern identification remains unestablished.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/mine-oscillators.js](../research/mine-oscillators.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose Conway p12

`penrose-conway-p12` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Package search; possible Owens–Stepney fireworks match, exact identity unverified

Found from the package’s deterministic soup penrose-touch-osc-98 at density 0.08. The published fireworks oscillator r-p12-33-6 in Stepney’s 2016 Fig. 6, reproduced from Owens–Stepney 2010 Fig. 18.96, has matching period 12, cycle support 33 and minimum population 6. These invariants do not establish identity: the primary phase geometry has not been independently compared. The earlier oscillator is therefore credited as a possible antecedent, without claiming that this is either a confirmed reproduction or a new pattern. Historical priority remains unestablished.

Sources: [Stepney (2016), Fig. 6: published fireworks oscillator](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/AAGoL2016.pdf); [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/mine-oscillators.js](../research/mine-oscillators.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose edge-graph p4

`penrose-edge-conway-p4` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by package search; priority unestablished

The exact phase is recorded under soup penrose-edge-B3/S23-2-osc-v3-4732, density 0.30. This example uses edge adjacency, unlike the generalised Moore contact graph in the cited Penrose Conway catalogue. Same rule name or period alone does not identify an earlier exact pattern; external priority remains unestablished.

Sources: [Owens & Stepney (2010): Penrose Life catalogue and classification](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/mine-oscillators.js](../research/mine-oscillators.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose compact traveller

`penrose-b2-c4-compact-traveller` · `B2/S` · 4 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Traveller phase found here; priority unestablished

The package retains an explicit source phase and a polygon-preserving transplant verifier. It is a 4-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.

Sources: [Goucher (2012): earlier Penrose glider under a different rule](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md); [research/verify-penrose-traveller.js](../research/verify-penrose-traveller.js).

### Penrose five-state traveller

`penrose-b2-c5-compact-traveller` · `B2/S` · 5 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Traveller phase found here; priority unestablished

The recorded depth-10 phase is taken from the package's five-state traveller campaign. It is a 5-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.

Sources: [Goucher (2012): earlier Penrose glider under a different rule](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose six-state traveller

`penrose-b2-c6-compact-traveller` · `B2/S` · 6 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Traveller phase found here; priority unestablished

The recorded depth-10 phase is taken from the package's six-state traveller campaign. It is a 6-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.

Sources: [Goucher (2012): earlier Penrose glider under a different rule](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose B24 launcher traveller

`penrose-b24-c4-launcher-traveller` · `B24/S` · 4 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

The package's altered-rule search supplied this 27-cell phased launcher. Eight B4 births affect its launch; its mature travelling core belongs to the package's B2/S family. This attributes the recorded seed and launch mechanism, not a new recurrent glider core or a proved immortal Penrose glider. No external exact-pattern source has been established.

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose B2/S4 survival launcher

`penrose-b2s4-c5-survival-launcher` · `B2/S4` · 5 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

This seven-live-cell seed comes from the package's Penrose traveller search. Two S4 survivals distinguish its launch before it settles into the established B2/S-type wave. The exact seed, clause ablation and finite traversal are documented; prior worldwide identity of this launch is unestablished.

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose B26/S birth launcher

`penrose-b26s-c4-birth-launcher` · `B26/S` · 4 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

The package search supplied this eighteen-cell phased seed. One B6 birth genuinely affects the launch; its eventual recurrent wave uses the established B2/S mechanism. It is a separately recorded launcher rather than evidence of a new recurrent rule mechanism. No external exact-pattern attribution was established.

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose B27/S4 dual-clause launcher

`penrose-b27s4-c4-dual-clause-launcher` · `B27/S4` · 4 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Launcher found by package search; priority unestablished

The recorded 26-live-cell launch comes from the package's altered-rule campaign. Both added clauses fire during launch: B7 births and S4 survivals. The mature core belongs to the B2/S travelling family. This is package provenance for the seed, with external first-discovery priority unestablished.

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/search-mobile-patterns.js](../research/search-mobile-patterns.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose Conway diehard — 293

`penrose-conway-diehard-293` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found by package search; priority unestablished

This exact fourteen-cell seed is the retained extinction-at-293 result of the package's 5,000-candidate transient campaign, deterministic seed penrose-touch-B3/S23-2-transient-v1. Earlier Penrose Life lifetime studies provide context, but do not identify this exact initial state. No world-record or original-discovery claim is made.

Sources: [Owens & Stepney (2010): Penrose Life statistics](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/jca10.pdf).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/search-transients.js](../research/search-transients.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose Conway methuselah — 289

`penrose-conway-methuselah-289` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Found by this package; priority unestablished.** Found by package search; priority unestablished

The exact 22-live-cell seed is the retained result of the package's 35,000-candidate campaign penrose-touch-b3s23-transient-v2. Its transient is 289 generations before a fixed point. This is a locally documented search result, not an attribution of the underlying Conway rule or a claim to the longest known Penrose transient.

Sources: [Owens & Stepney (2010): Penrose Life statistics](https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/jca10.pdf).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/search-transients.js](../research/search-transients.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose B12/S p840 field

`penrose-b12-p840-field` · `B12/S` · 2 states · shared-edge neighbourhood

**Constructed for this package.** Deterministic field generated for this package

The initial field is generated by the package from seed penrose-edge-B12/S-2, density 0.12 and eight dead border rings. The finite field has transient 51 and period 840. This is a reproducible seeded demonstration, not a claim to an independently indivisible period-840 oscillator or an original cellular-automaton rule.

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/survey-fields.js](../research/survey-fields.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

### Penrose excitable field

`penrose-brain-field` · `B2/S` · 3 states · edge-or-corner neighbourhood

**Constructed for this package.** Package-seeded field; Brian Silverman's Brain rule

The B2/S three-state transition is Brian Silverman's established Brain rule, here applied to the Penrose touch graph instead of its usual square neighbourhood. The exact random field is package-generated from seed penrose-touch-B2/S-3 at density 0.12 with eight border rings. Its 3,000-generation observation is a finite demonstration, not a published fixed pattern or a first-discovery claim.

Sources: [CelLab documentation: Brian Silverman's Brain rule](https://www.fourmilab.ch/cellab/manual/chap4.html).

Local evidence: [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [research/survey-fields.js](../research/survey-fields.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md).

## Hexagonal examples

### Hexagonal three-cell glider

`hex-b2s0-c3-three-cell-glider` · `B2/S0` · 3 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s bounded exhaustive search; discovery priority has not been established.

Campaign small, enumerated seed 3, recorded trial 101391. Three live cells already form a period-2 spaceship in B2/S0 with three states; complete-state translation is (0,-1). The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hex-exhaustive-evidence.json](../research/fixtures/hex-exhaustive-evidence.json); [research/exhaustive-search/hex/campaigns.json](../research/exhaustive-search/hex/campaigns.json); [research/exhaustive-search/hex/search.cpp](../research/exhaustive-search/hex/search.cpp); [test-hex-exhaustive-evidence.js](../test-hex-exhaustive-evidence.js).

### Hexagonal four-cell diagonal launcher

`hex-b234s1346-c3-four-cell-launcher` · `B234/S1346` · 3 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s bounded exhaustive search; discovery priority has not been established.

Campaign small, enumerated seed 6, recorded trial 120894. Four live cells settle after nine generations into a period-8 spaceship translating (1,1). This is a finite launch, not a periodically emitting gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hex-exhaustive-evidence.json](../research/fixtures/hex-exhaustive-evidence.json); [research/exhaustive-search/hex/campaigns.json](../research/exhaustive-search/hex/campaigns.json); [research/exhaustive-search/hex/search.cpp](../research/exhaustive-search/hex/search.cpp); [test-hex-exhaustive-evidence.js](../test-hex-exhaustive-evidence.js).

### Hexagonal five-cell p43 launcher

`hex-b2456s1345-c4-five-cell-launcher` · `B2456/S1345` · 4 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s bounded exhaustive search; discovery priority has not been established.

Campaign n5, enumerated seed n5s19, recorded trial 525071. Five live cells settle after six generations into a period-43 spaceship translating (-6,3). This is a finite launch, not a periodically emitting gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hex-exhaustive-evidence.json](../research/fixtures/hex-exhaustive-evidence.json); [research/exhaustive-search/hex/campaigns.json](../research/exhaustive-search/hex/campaigns.json); [research/exhaustive-search/hex/search.cpp](../research/exhaustive-search/hex/search.cpp); [test-hex-exhaustive-evidence.js](../test-hex-exhaustive-evidence.js).

### Hexagonal six-cell p9 knightship launcher

`hex-b23s13-c4-p9-knightship-launcher` · `B23/S13` · 4 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s bounded exhaustive search; discovery priority has not been established.

Campaign n6, enumerated seed n6s14, recorded trial 1407298. Six live cells settle after sixteen generations into a period-9 spaceship translating (5,-4). Its oblique heading is outside the edge-axis and angle-bisector directions; this does not establish a first such hexagonal spaceship. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hex-exhaustive-evidence.json](../research/fixtures/hex-exhaustive-evidence.json); [research/exhaustive-search/hex/campaigns.json](../research/exhaustive-search/hex/campaigns.json); [research/exhaustive-search/hex/search.cpp](../research/exhaustive-search/hex/search.cpp); [test-hex-exhaustive-evidence.js](../test-hex-exhaustive-evidence.js).

### Hexagonal six-cell p10 knightship launcher

`hex-b234s245-c5-p10-knightship-launcher` · `B234/S245` · 5 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s bounded exhaustive search; discovery priority has not been established.

Campaign n6, enumerated seed n6s78, recorded trial 2166518. Six live cells settle after twelve generations into a period-10 spaceship translating (1,2). Survival clause S5 acts during the launch, although inactive in the eventual orbit; removing it before launch destroys the example. This is a finite launch, not a gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hex-exhaustive-evidence.json](../research/fixtures/hex-exhaustive-evidence.json); [research/exhaustive-search/hex/campaigns.json](../research/exhaustive-search/hex/campaigns.json); [research/exhaustive-search/hex/search.cpp](../research/exhaustive-search/hex/search.cpp); [test-hex-exhaustive-evidence.js](../test-hex-exhaustive-evidence.js).

### Hexagonal Conway p2

`hex-conway-p2` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Independently found by this package’s soup search; earlier discovery priority has not been established.

Recovered campaign provenance: deterministic soup seed hex-conway-v31-2, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.12, transient 6, period 2. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/mine-oscillators.js](../research/mine-oscillators.js); [discoveries.js](../discoveries.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js).

### Hexagonal Conway p3

`hex-conway-p3` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Independently found by this package’s soup search; earlier discovery priority has not been established.

Recovered campaign provenance: deterministic soup seed hex-conway-v31-3851, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.35, transient 28, period 3. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/mine-oscillators.js](../research/mine-oscillators.js); [discoveries.js](../discoveries.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js).

### Hexagonal Conway p6

`hex-conway-p6` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Independently found by this package’s soup search; earlier discovery priority has not been established.

Recovered campaign provenance: deterministic soup seed hex-conway-v31-2813, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.35, transient 39, period 6. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/mine-oscillators.js](../research/mine-oscillators.js); [discoveries.js](../discoveries.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js).

### Hexagonal B2/S35 p5 traveller

`hex-b2s35-p5-traveller` · `B2/S35` · 2 states · shared-edge neighbourhood

**Published example.** Known B2/S35 spaceship described by Carter Bays (2005), with a matching RLE published by John Cerkan (2016). Independently recovered for this package.

Bays Figure 3 documents a period-5, one-cell-displacement spaceship in rule 3,5/2, equivalent to B2/S35. Cerkan’s 22 January 2016 RLE is 2bo$o3bo$2bo$bo2bo$6bo$2bo2bo$4bo!. Mapping Golly coordinates by (q,r)=(x,y-x) and comparing every complete orbit state proves exact equivalence to the catalogue: phase shift 2, rotation by one 60-degree step, no reflection, translation (3,0). The package’s independent constrained-search recovery does not make this a new spaceship. The earlier paper supplies scholarly context; its drawing was not independently transcribed in this audit.

Sources: [Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)](https://www.complex-systems.com/abstracts/v15_i03_a04/); [Bays (2005), Figures 3 and 4](https://wpmedia.wolfram.com/uploads/sites/13/2018/02/15-3-4.pdf); [John Cerkan, published B2/S35H spaceship RLE (22 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28428).

Local evidence: [discoveries.js](../discoveries.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal B245/S3 p10 traveller

`hex-b245s3-p10-traveller` · `B245/S3` · 2 states · shared-edge neighbourhood

**Published example.** Published Golly example, corresponding to the B245/S3 spaceship described by Carter Bays (2005).

The catalogue is D6-equivalent to Golly’s official QuickLife hexagonal example, RLE obo$4bo$2bo$bo2bobo$3bo$5bo!, using (q,r)=(x,y-x). Complete-state replay verifies period 10 and a two-cell displacement. Bays Figure 4 documents this rule and motion. Golly’s page does not itself name Bays, so distinguish the executable pattern source from scholarly context; this is not a new package discovery.

Sources: [Golly QuickLife documentation, hexagonal neighbourhood example](https://golly.sourceforge.io/Help/Algorithms/QuickLife.html); [Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)](https://www.complex-systems.com/abstracts/v15_i03_a04/); [Bays (2005), Figures 3 and 4](https://wpmedia.wolfram.com/uploads/sites/13/2018/02/15-3-4.pdf).

Local evidence: [research/fixtures/hex-b245s3-source.json](../research/fixtures/hex-b245s3-source.json); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal B235/S146 four-state launcher

`hex-b235s146-c4-launcher-traveller` · `B235/S146` · 4 states · shared-edge neighbourhood

**Adapted example.** Package rule adaptation of the published B2/S35 spaceship geometry (Bays; Cerkan). Priority of this multistate launcher has not been established.

The initial twelve live-cell coordinates are identical to the package’s published B2/S35 p5 spaceship phase, but the rule is changed to B235/S146 with 4 states. After 21 generations the seed becomes a period-10 spaceship translating (-5,0). Credit Bays and Cerkan for the starting pattern, not for these changed-rule dynamics. The package establishes this particular adaptation and verifies its launch and eventual complete-state recurrence; it does not establish worldwide priority for the launcher or resulting ship.

Sources: [Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)](https://www.complex-systems.com/abstracts/v15_i03_a04/); [John Cerkan, published B2/S35H spaceship RLE (22 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28428).

Local evidence: [discoveries.js](../discoveries.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js).

### Hexagonal B235/S134 five-state launcher

`hex-b235s134-c5-launcher-traveller` · `B235/S134` · 5 states · shared-edge neighbourhood

**Adapted example.** Package rule adaptation of the published B2/S35 spaceship geometry (Bays; Cerkan). Priority of this multistate launcher has not been established.

The initial twelve live-cell coordinates are identical to the package’s published B2/S35 p5 spaceship phase, but the rule is changed to B235/S134 with 5 states. After 58 generations the seed becomes a period-4 spaceship translating (2,0). Credit Bays and Cerkan for the starting pattern, not for these changed-rule dynamics. The package establishes this particular adaptation and verifies its launch and eventual complete-state recurrence; it does not establish worldwide priority for the launcher or resulting ship.

Sources: [Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)](https://www.complex-systems.com/abstracts/v15_i03_a04/); [John Cerkan, published B2/S35H spaceship RLE (22 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28428).

Local evidence: [discoveries.js](../discoveries.js); [docs/RULE_SURVEY.md](../docs/RULE_SURVEY.md); [test-traveller-evidence.js](../test-traveller-evidence.js); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js).

### Hexagonal Conway p4 half-turn rotor

`hex-conway-p4` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s deterministic soup search; discovery priority has not been established.

Oscillator miner source seed 272632, radius 8, initial density 60%, soup transient 19; the displayed phase is offset 1 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/oscillators/miner.cpp](../research/hex-search/oscillators/miner.cpp); [research/hex-search/oscillators/campaigns.json](../research/hex-search/oscillators/campaigns.json).

### Hexagonal Conway p5

`hex-conway-p5` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s deterministic soup search; discovery priority has not been established.

Oscillator miner source seed 1045970, radius 6, initial density 67%, soup transient 10; the displayed phase is offset 0 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/oscillators/miner.cpp](../research/hex-search/oscillators/miner.cpp); [research/hex-search/oscillators/campaigns.json](../research/hex-search/oscillators/campaigns.json).

### Hexagonal Conway p8

`hex-conway-p8` · `B3/S23` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s deterministic soup search; discovery priority has not been established.

Oscillator miner source seed 511247, radius 9, initial density 46%, soup transient 25; the displayed phase is offset 6 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/oscillators/miner.cpp](../research/hex-search/oscillators/miner.cpp); [research/hex-search/oscillators/campaigns.json](../research/hex-search/oscillators/campaigns.json).

### Hexagonal p269 clock

`hex-b34s234-p269` · `B34/S234` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s deterministic soup search; discovery priority has not been established.

Oscillator miner source seed 15338, radius 6, initial density 18%, soup transient 182; the displayed phase is offset 266 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/oscillators/miner.cpp](../research/hex-search/oscillators/miner.cpp); [research/hex-search/oscillators/campaigns.json](../research/hex-search/oscillators/campaigns.json).

### Hexagonal p25 diagonal spaceship

`hex-b245s35-p25-traveller` · `B245/S35` · 2 states · shared-edge neighbourhood

**Published example.** Published by muzik (2019), independently rediscovered by this package’s search.

The primary hexagonal spaceship thread credits muzik (2019) for B245/S35H RLE b3o$bobo$4o$bo!. Independent full-orbit comparison with the catalogue succeeds after phase shift 5, rotation by four 60-degree steps, no reflection and translation (1,1), using (q,r)=(x,y-x). Thus the package’s binary campaign seed 20261011, trial 483, mode 3, transient 57 recovered an already published spaceship. The displayed phase and orientation are not a distinct discovery.

Sources: [muzik, B245/S35H period-25 spaceship (2019)](https://conwaylife.com/forums/viewtopic.php?f=11&t=3670).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/binary/search.cpp](../research/hex-search/binary/search.cpp); [research/hex-search/binary/campaigns.json](../research/hex-search/binary/campaigns.json); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p48 half-turn rotor

`hex-b2s34-p48-rotor` · `B2/S34` · 2 states · shared-edge neighbourhood

**Published example.** Published by drc (2016), independently rediscovered by this package’s search.

The 18 January 2016 RLE o16bo$obo12b2o$2b2o10bobo$5bo9bo! contains two independently oscillating six-cell components. Catalogue coordinates translated by axial (2,-1) reproduce its first component exactly at generation zero. Extracting that independent component does not create a new oscillator. The package independently recovered it in binary campaign seed 20261011, trial 194, mode 4. Dean Hickerson also mentions earlier work on the rule, but the audit does not assign him priority for this particular oscillator.

Sources: [drc, published pair of B2/S34 period-48 oscillators (18 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28430).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/binary/search.cpp](../research/hex-search/binary/search.cpp); [research/hex-search/binary/campaigns.json](../research/hex-search/binary/campaigns.json); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p57 pulsator

`hex-b245s3-p57-pulsator` · `B245/S3` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s binary-rule soup search; discovery priority has not been established.

Binary campaign seed 20261011, trial 2586, mode 1, transient 7, chosen cycle phase offset 34. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/binary/search.cpp](../research/hex-search/binary/search.cpp); [research/hex-search/binary/campaigns.json](../research/hex-search/binary/campaigns.json).

### Hexagonal p128 half-turn rotor

`hex-b24s3-p128-rotor` · `B24/S3` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s binary-rule soup search; discovery priority has not been established.

Binary campaign seed 908020261011, trial 53543, mode 3, transient 25, chosen cycle phase offset 67. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/binary/search.cpp](../research/hex-search/binary/search.cpp); [research/hex-search/binary/campaigns.json](../research/hex-search/binary/campaigns.json).

### Hexagonal p4104 long clock

`hex-b234s3-p4104` · `B234/S3` · 2 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s binary-rule soup search; discovery priority has not been established.

Binary campaign seed 60520261011, trial 127, mode 2, transient 802, chosen cycle phase offset 2268. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/binary/search.cpp](../research/hex-search/binary/search.cpp); [research/hex-search/binary/campaigns.json](../research/hex-search/binary/campaigns.json).

### Hexagonal p372 sixfold rotor

`hex-b2s3456-c7-p372-rotor` · `B2/S3456` · 7 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s Generations search; discovery priority has not been established.

Generations campaign first, random seed 7522551138070962214, trial 75416, original rule B25/S3456, source transient 13. The displayed rule B2/S3456 removes B5, which is inactive throughout the verified periodic orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/generations/search.cpp](../research/hex-search/generations/search.cpp); [research/hex-search/generations/analyse.py](../research/hex-search/generations/analyse.py); [research/hex-search/generations/campaigns.json](../research/hex-search/generations/campaigns.json).

### Hexagonal p248 giant breather

`hex-b24s16-c3-p248-breather` · `B24/S16` · 3 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s Generations search; discovery priority has not been established.

Generations campaign million, random seed 7529271334792788165, trial 15937, original rule B24/S16, source transient 86. The original searched rule is retained. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/generations/search.cpp](../research/hex-search/generations/search.cpp); [research/hex-search/generations/analyse.py](../research/hex-search/generations/analyse.py); [research/hex-search/generations/campaigns.json](../research/hex-search/generations/campaigns.json).

### Hexagonal p138 wandering spaceship

`hex-b23s13-c5-p138-traveller` · `B23/S13` · 5 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s Generations search; discovery priority has not been established.

Generations campaign million, random seed 7529271334792788165, trial 106888, original rule B235/S13, source transient 53. The displayed rule B23/S13 removes B5, which is inactive throughout the verified travelling orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/generations/search.cpp](../research/hex-search/generations/search.cpp); [research/hex-search/generations/analyse.py](../research/hex-search/generations/analyse.py); [research/hex-search/generations/campaigns.json](../research/hex-search/generations/campaigns.json).

### Hexagonal p23 fast spaceship

`hex-b234s13-c4-p23-traveller` · `B234/S13` · 4 states · shared-edge neighbourhood

**Found by this package; priority unestablished.** Found by this package’s Generations search; discovery priority has not been established.

Generations campaign first, random seed 7522551138070962214, trial 50, original rule B2345/S135, source transient 15. The displayed rule B234/S13 removes B5 and S5, which are inactive throughout the verified travelling orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/generations/search.cpp](../research/hex-search/generations/search.cpp); [research/hex-search/generations/analyse.py](../research/hex-search/generations/analyse.py); [research/hex-search/generations/campaigns.json](../research/hex-search/generations/campaigns.json).

### Hexagonal three-way spaceship gun

`hex-b246s246-c4-p30-gun` · `B246/S246` · 4 states · shared-edge neighbourhood

**Published example.** Published by confocaloid (2024). The package independently verifies indefinite three-way emission.

Confocaloid published the twelve-live-cell seed 3A$4A$.3A$2.2A! on 14 October 2024 in Hexagonal Generations Rules. Direct comparison confirms that the catalogue retains exactly the published initial states, after coordinate conversion and translation. The package adds a complete-state emission certificate for the period-30 core and three permanently separating output streams; that verification is not authorship of the gun.

Sources: [confocaloid, 246/246/4H three-way gun (14 October 2024)](https://conwaylife.com/forums/viewtopic.php?f=11&t=1319).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/literature/certify-emitters.py](../research/hex-search/literature/certify-emitters.py); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal oscillator-trail puffer

`hex-b25s34-p20-puffer` · `B25/S34` · 2 states · shared-edge neighbourhood

**Published example.** Published by Naszvadi (2024); Dmitry Maitak points to an earlier 2023 occurrence. The package independently verifies its persistent oscillator trail.

Naszvadi’s 1 February 2024 post supplies the exact twenty-three-cell RLE used here and describes it as probably known. Dmitry Maitak’s later response links to a 2023 occurrence. This audit confirms the 2024 source and the report of earlier publication, but does not establish the original discoverer or independently compare the linked 2023 seed. Initial-state comparison confirms translation-only equivalence to the 2024 RLE. The package adds a certificate of period-20 translated core recurrence and independently separating period-2 deposits.

Sources: [Naszvadi, B25/S34H puffer (1 February 2024)](https://conwaylife.com/forums/viewtopic.php?p=177053#p177053); [Source thread containing Naszvadi’s RLE and Dmitry Maitak’s earlier-publication note](https://conwaylife.com/forums/viewtopic.php?p=162954); [Earlier 2023 occurrence cited by Dmitry Maitak; original priority not established in this audit](https://conwaylife.com/forums/viewtopic.php?p=163227#p163227).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/hex-search/literature/certify-emitters.py](../research/hex-search/literature/certify-emitters.py); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p999 threefold rotor

`hex-b2s1-c3-p999-rotor` · `B2/S1` · 3 states · shared-edge neighbourhood

**Published example.** Published by c0b0p0 (2014); independently replayed and verified for this package.

The Hexagonal Generations Rules post by c0b0p0 dated 27 February 2014 supplies this exact B2/S1 three-state period-999 rotor RLE. The catalogue retains every live and refractory initial state under (q,r)=(x,y-x), followed only by a centring translation. The full-state dynamics are therefore a replay of the published object, not a new package discovery.

Sources: [c0b0p0, B2/S1 three-state period-999 rotor (27 February 2014)](https://conwaylife.com/forums/viewtopic.php?f=11&t=1319).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p13 diagonal spaceship

`hex-b23s4-p13-traveller` · `B23/S4` · 2 states · shared-edge neighbourhood

**Published example.** Published by John Cerkan (2020); independently replayed and verified for this package.

John Cerkan’s 15 March 2020 post in Outer-totalistic hexagonal rules with spaceships gives RLE o3bo$bo2bo$2b3o$2bo2bo! for B23/S4H. The catalogue is exactly this nine-cell published seed after (q,r)=(x,y-x) and a centring translation. The exact period and displacement were independently replayed. Use the original thread URL rather than the author-search URL retained in the older source fixture.

Sources: [John Cerkan, B23/S4H period-13 spaceship (15 March 2020)](https://conwaylife.com/forums/viewtopic.php?f=11&t=3670).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p158 wandering spaceship

`hex-b2s1-c3-p158-traveller` · `B2/S1` · 3 states · shared-edge neighbourhood

**Published example.** Published by c0b0p0 (2014); independently replayed and verified for this package.

The Hexagonal Generations Rules post by c0b0p0 dated 27 February 2014 supplies this exact B2/S1 three-state period-158 spaceship RLE. The catalogue retains every live and refractory initial state under (q,r)=(x,y-x), followed only by a centring translation. The full-state dynamics are therefore a replay of the published object, not a new package discovery.

Sources: [c0b0p0, B2/S1 three-state period-158 spaceship (27 February 2014)](https://conwaylife.com/forums/viewtopic.php?f=11&t=1319).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal self-repairing wall

`hex-b2s34-wall-repair` · `B2/S34` · 2 states · shared-edge neighbourhood

**Published example.** Self-repairing wall published by Dean Hickerson (2016). The package independently verifies recovery of the complete state.

The 20 January 2016 post supplies the exact damaged-wall RLE used here. Direct coordinate comparison confirms the catalogue changes only embedding and centring. Independent replay of damaged and pristine walls shows full-state reunion at generation 44, including exterior debris. Hickerson describes earlier investigations of the rule, but this audit dates the retrieved public example to 2016 rather than assigning an unverified earlier discovery date.

Sources: [Dean Hickerson, B2/S34 walls and billiard tables (20 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28428); [Primary discussion containing the published wall and billiard-table RLEs](https://conwaylife.com/forums/viewtopic.php?p=26919).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal p2044 billiard table

`hex-b2s34-p2044-billiard` · `B2/S34` · 2 states · shared-edge neighbourhood

**Published example.** Period-2044 billiard table published by Dean Hickerson (2016); independently verified for this package.

The 20 January 2016 post supplies the exact B2/S34H period-2044 billiard-table RLE used here and describes the one-dimensional XOR behaviour inside its walls. Direct coordinate comparison confirms the catalogue changes only embedding and centring. The package’s long complete-state replay verifies the published oscillator; it does not establish a new oscillator or a new XOR mechanism.

Sources: [Dean Hickerson, B2/S34 walls and billiard tables (20 January 2016)](https://conwaylife.com/forums/viewtopic.php?p=28428); [Primary discussion containing the published wall and billiard-table RLEs](https://conwaylife.com/forums/viewtopic.php?p=26919).

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [research/fixtures/hex-published-provenance.json](../research/fixtures/hex-published-provenance.json); [research/verify-hex-published-provenance.js](../research/verify-hex-published-provenance.js).

### Hexagonal seven-copy replicator

`hex-parity-seven-copy` · `B135/S0246` · 2 states · shared-edge neighbourhood

**Constructed for this package.** Illustrative seed constructed for this package using the standard additive/XOR cellular-automaton mechanism.

The three-live-cell initial pattern was assembled for the package, not mined from a soup or imported as an attributed published pattern. B135/S0246 computes the XOR of the centre and six neighbours. Over GF(2), powers of two of this linear update yield translated copies, giving the seven-copy demonstration once their supports are disjoint. The package claims this illustrative arrangement and its exact verification only; neither XOR replication nor the underlying algebra is a new principle. No external source is asserted for this particular seed.

Local evidence: [research/fixtures/hexagonal-sources.json](../research/fixtures/hexagonal-sources.json); [research/fixtures/hexagonal-evidence.json](../research/fixtures/hexagonal-evidence.json); [research/hex-reference.js](../research/hex-reference.js); [test-hexagonal-evidence.js](../test-hexagonal-evidence.js); [docs/HEXAGONAL_STRUCTURES.md](../docs/HEXAGONAL_STRUCTURES.md).

## Square examples

### Block still life

`square-block` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** Classical Conway Life pattern

Published in the original 1970 presentation of Conway Life. The package uses the standard four-cell block, translated for display; it makes no separate discovery claim. An individual discoverer is not assigned here.

Sources: [Martin Gardner, Scientific American, October 1970 (original article)](https://www.ibiblio.org/lifepatterns/october1970.html); [Stephen Silver, Life Lexicon: block (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Blinker — period 2

`square-blinker` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** John H. Conway

The Life Lexicon credits Conway; the period-2 three-cell oscillator also appears in Gardner’s original article. The package uses its standard horizontal phase, translated for display.

Sources: [Stephen Silver, Life Lexicon: blinker (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm); [Martin Gardner, Scientific American, October 1970 (original article)](https://www.ibiblio.org/lifepatterns/october1970.html).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Pulsar — period 3

`square-pulsar` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** John H. Conway

The Life Lexicon credits Conway, and the 48-cell pulsar is described in the original 1970 article. The package uses the standard published 48-cell phase; placement and playback settings are package choices.

Sources: [Stephen Silver, Life Lexicon: pulsar (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_p.htm); [Martin Gardner, Scientific American, October 1970 (original article)](https://www.ibiblio.org/lifepatterns/october1970.html).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Pentadecathlon — period 15

`square-pentadecathlon` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** John H. Conway

The Life Lexicon credits Conway’s 1970 investigation of short rows. This is the published 12-cell oscillator phase, not a new 12-cell construction; the ten-cell row is a predecessor.

Sources: [Stephen Silver, Life Lexicon: pentadecathlon (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_p.htm); [Martin Gardner, Scientific American, October 1970 (original article)](https://www.ibiblio.org/lifepatterns/october1970.html).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Glider — diagonal spaceship

`square-glider` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** Richard K. Guy

Credit is to Richard K. Guy, as explicitly recorded in the Life Lexicon, rather than to Conway personally. The package seed is a rotated and translated standard glider phase. Older sources conventionally date it 1970 and newer histories say 1969; no discovery year is asserted here.

Sources: [Stephen Silver, Life Lexicon: glider (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_g.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js).

### Lightweight spaceship

`square-lwss` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** John H. Conway

The Life Lexicon credits Conway’s 1970 discovery of the lightweight spaceship. The package uses the published nine-cell phase, translated for display, under ordinary B3/S23.

Sources: [Stephen Silver, Life Lexicon: LWSS (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_l.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json); [test-traveller-evidence.js](../test-traveller-evidence.js).

### HighLife replicator

`square-highlife-replicator` · `B36/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** Nathan Thompson (1994)

Eppstein credits the HighLife replicator to Nathan Thompson in 1994. David Bell subsequently documented and investigated HighLife; he is not credited here as this replicator’s discoverer. The package uses the published 12-cell B36/S23 seed and independently checks its two-copy return after 12 generations.

Sources: [David Eppstein, Replicators: HighLife](https://ics.uci.edu/~eppstein/ca/replicators/b36s23.html); [Published HighLife replicator seed](https://conwaylife.com/wiki/OCA:HighLife/Replicator).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Diehard — extinction at 130

`square-diehard` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** Classical pattern; discoverer unconfirmed

The seven-cell seed matches the published Life Lexicon diehard exactly after translation. Its extinction at generation 130 is independently checked. The consulted sources do not establish an individual discoverer; no personal attribution or new-discovery claim is made.

Sources: [Stephen Silver, Life Lexicon: diehard (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_d.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### R-pentomino methuselah

`square-r-pentomino` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** John H. Conway’s classical R-pentomino

Gardner’s original article documents Conway’s study of this five-cell seed; the package uses the standard published shape. Its finite-board check establishes activity through generation 1,103, not equality with the infinite-plane final census.

Sources: [Martin Gardner, Scientific American, October 1970 (original article)](https://www.ibiblio.org/lifepatterns/october1970.html); [Stephen Silver, Life Lexicon: R-pentomino (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_r.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).

### Acorn methuselah

`square-acorn` · `B3/S23` · 2 states · edge-or-corner neighbourhood

**Published example.** Charles L. Corderman

Robert Wainwright’s Lifeline No. 3 (1971), page 12, credits Charles L. Corderman; Wainwright supplied the name. The package uses the same seven-cell seed, translated for display. Its finite-board replay establishes activity through 5,206 generations, not the infinite-plane final ash. Gosper is not the discoverer of this seed.

Sources: [Robert Wainwright, Lifeline No. 3 (1971), page 12: original Acorn attribution](https://conwaylife.com/wiki/Lifeline_Volume_3); [Stephen Silver, Life Lexicon: acorn (Golly distribution)](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_a.htm).

Local evidence: [discoveries.js](../discoveries.js); [test-discoveries.js](../test-discoveries.js); [research/verify-catalog.js](../research/verify-catalog.js); [research/fixtures/catalogue-verification.json](../research/fixtures/catalogue-verification.json).
