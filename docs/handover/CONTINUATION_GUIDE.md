# Continuation guide

## Current state

Use **application 3.7.5 / retained catalogue 3.7.4 revision 2**. Randomise/R now chooses a fresh visible seed; Apply seed/Enter repeats a specified seed. Arrow keys pan a focused canvas; Shift increases the step. There are **89 curated configurations**: 22 Hat, 21 Penrose, 36 hexagonal and 10 square. The full catalogue has **135 pages**, **56 complete rule-sets**, **12 named rule-selector templates**, **267 pattern panels** and **34 bibliography records**. Its attribution categories are 55 qualified package-original configurations, one unresolved possible antecedent (P09), four constructions, 25 published examples and four adaptations.

Read the [design brief](DESIGN_BRIEF.md) before changing behaviour or wording. Run development commands from the project root (`source/` in the handover), not from the outer handover directory.

## Immediate use

Open the outer `START_HERE.html`, then the embedded-catalogue browser app. Alternatively open `source/aperiodic-life-standalone.html`; keep its `docs/catalogue/` directory beside it. The source app can be served locally with:

```bash
python3 tools/project.py serve --open
```

The public address is https://bellissimogiorno.github.io/aperiodic-life/ . It is a live deployment, not a version-pinned copy of this handover. No remote deployment was performed when preparing the handover.

## Implementation map

| Path, relative to the project root | Responsibility |
|---|---|
| `core.js` | Four geometry builders, graph topology/boundaries, synchronous automata and priority tables |
| `discoveries.js` | All presets: exact state/recipe, rules, graph, speed, view, verification contracts and embedded provenance |
| `app.js`, `index.html`, `styles.css` | Browser controls, WebGL2 rendering, camera/input, mobile layout, About and source links |
| `build-standalone.js` | Deterministic offline HTML generation and freshness check |
| `research/fixtures/catalogue-provenance.json` | Editable runtime pattern credit records |
| `tools/build_catalogue_credits.js` | Generates runtime credit data and `docs/CATALOGUE_CREDITS.md`; use `--check` to detect drift |
| `docs/catalogue/catalogue.md` | Actual editable PDF narrative |
| `docs/catalogue/catalogue-source.json` | Full rules, seeds, attribution labels, numbered references and stable identifiers |
| `docs/catalogue/geometry/diagrams.json` | Exact production snapshots and geometry evidence |
| `docs/catalogue/build_catalogue.py` | PDF and attached/separate `catalogue-data.json` builder |
| `research/continued-search/`, `research/exhaustive-search/`, `research/hex-search/` | Retained search programmes, parameters, outputs and replay evidence |
| `tools/project.py` | Executable definitions of test profiles and local serving |
| `tools/package.py`, `tools/export_repository.py`, `tools/build_site.py` | Release downloads, GitHub source archive and local Pages payload |
| `tools/build_handover.py` | Current handover assembly, embedded catalogue HTML and integrity records |

See [architecture](../ARCHITECTURE.md), [core API](../CORE_API.md), [testing](../TESTING.md) and [release operations](../OPERATIONS.md) for details. Aperiodic tile IDs depend on deterministic geometry ordering; changes can invalidate saved states and seed IDs. Do not transfer a seed to a different-depth patch just by reusing its numerical indices.

## Scientific results to build on

- **H01 / R15, Hat wake traveller:** a package-evolved priority table, 293-generation catalogue replay and a recorded 1,000-generation interior flight on a larger patch, with at most nine nonzero cells. State-map comparisons distinguish the tested mature trajectory from included reference tables. This is finite evidence, not a first-Einstein-glider or indefinite-flight proof.
- **H02 / R10 and H03 / R11:** package-generated launch/emitting configurations under Edmond's published Hat A/B rules and travelling mechanisms. H02 is a one-off six-body launch. H03 has a finite emission certificate; it is not a proved perpetual gun.
- **H16 / R13 and H20 / R14:** adaptations of Edmond's Spectre mechanism and Hat B rule respectively. Preserve the exact state maps, changed guards and counterexamples described in the catalogue; observed trajectory agreement is not global rule equivalence.
- **P01–P03:** compact three-cell Penrose launch configurations with finite independent-body checks. For the twelve-body launch, all twelve have observed state/polygon returns but only five have the stronger three-ring neighbourhood match within the recorded horizon.
- **Hexagonal examples:** exact translated recurrences, a period-6 puffer/separation certificate, launchers and published gun/wall/billiard examples with independent full-state checks. Keep the mathematical unbounded-lattice results separate from finite browser demonstrations.

Exact curated seeds and claims are in the pattern entries and attached JSON. Some historical raw soup-search archives referenced in provenance are absent from the fresh release; do not confuse replaying a retained configuration with rerunning every original discovery campaign. The [continued-search report](../CONTINUED_SEARCH.md) explains the campaigns; its named records must be consulted when extending a result.

## Open issues and next work

1. **Highest research priority: stronger Einstein transport evidence.** Extend H01/H02/H03 with exact placement transfer, boundary-clear replays and full-state comparisons. To prove indefinite travel, a finite local return is insufficient: establish continuing travel with controlled support on the specified infinite tiling, stating the seed placement assumptions and quantifiers. Any argument using a finite classification of environments must cover those reachable from that stated configuration. Keep any new proof separate from a longer replay. A fresh bounded search should declare rules, seeds, horizon, budget and stopping criteria first.
2. **Resolve P09's possible antecedent.** Compare exact geometry, state phase and neighbourhood with Owens–Stepney's fireworks `r-p12-33-6`, not just period 12, territory 33 and minimum population 6. Catalogue references [5] Figure 18.96 and [6] Figure 6 identify the published candidate.
3. **Reconcile attribution wording outside the PDF.** Revision 2 corrects the catalogue. Runtime provenance, `docs/CATALOGUE_CREDITS.md` and some general prose still use broader “package-found” or historical-priority language. Update the editable provenance fixture through its generator and tests rather than editing generated files alone. Keep source roles as precise as the catalogue. This has not been completed by the handover.
4. **Finish target-device acceptance.** Test actual phone pinch/paint transitions, pause with a scrolled drawer, landscape/portrait, local HTML opening, About downloads and WebGL2 on the user's browsers. No new real-browser pass is claimed here.
5. **Check general documentation against exact records when editing.** The current catalogue total is 89; playback tests retain explicit per-entry expectations. Extended Hat replay summaries can describe different placements, checkpoints or stopping horizons. Use catalogue IDs and exact fixtures to make these distinctions explicit rather than silently merging numbers.
6. **Performance work should be measured.** Large geometry construction and simulation can block the main thread; board size and cycle snapshots consume memory. Measure stepping, building and rendering separately with named patch/rule/device settings before optimising. Preserve topology, complete states and seed compatibility. No new performance benchmark was executed for this handover.

The R-pentomino and Acorn browser runs eventually diverge from their unbounded-plane benchmarks because of finite board edges; keep the catalogue’s explicit distinctions.

The app's Einstein backend is **Hat**, not Spectre. `TABLE:SPECTRE` is a reference transition table, not a Spectre geometry backend. “No result in this bounded search” is not a nonexistence theorem. No stable collision logic, universality construction or indefinite aperiodic gun is currently established.

## Build and verify

Runtime use needs only a WebGL2-capable browser. Development uses Node.js 22+ and Python 3.10+. Optional catalogue rebuilding requires ReportLab and pypdf, with installation instructions and supported dependency ranges in [the catalogue README](../catalogue/README.md). Bulk C++ searches additionally require a C++17 compiler. Browser checks require Chromium/Chrome (`CHROMIUM` can select its path).

```bash
node build-standalone.js --check
python3 docs/catalogue/build_catalogue.py --check
python3 tools/project.py test standard
python3 tools/project.py test topology
```

After an application change, run `node build-standalone.js` and retain the generated result. Choose additional `research`, `large` and `browser` profiles for the affected risk. Large profiles require substantial memory. Missing browser prerequisites are not a pass.

For a catalogue prose/credit edit, update the Markdown and/or source JSON, rebuild with `python3 docs/catalogue/build_catalogue.py`, inspect all changed pages and links, and check source/PDF agreement. If seeds, geometry or rules change, first regenerate `node docs/catalogue/export_geometry.js` and replay the affected scientific evidence, including `node research/verify-catalog.js`. Do not rerun million-trial searches merely to typeset a wording correction.

For GitHub, copy the **contents of `source/`**, including its workflow/configuration files, into the intended repository root. Keep an existing clone's own Git metadata. Do not upload the outer handover ZIP as a substitute for source files. See [publishing](../PUBLISHING.md) for the two supported Pages methods. A new handover does not itself authorise a force-push or remote publication.

## Before claiming a new discovery

Record the full automaton, exact seed, deterministic search parameters, patch/graph hashes, tested horizon and boundary clearance. Check every nonzero state with an independent reference. Compare known sources, phase shifts and lattice symmetries; distinguish a seed/placement contribution from a new rule or mechanism. Assign clear rule/pattern identifiers, state remaining uncertainties, add a reproducible preset with suitable speed/framing, update credit records and the full catalogue, then review the release version and handover.

To regenerate a handover from the current source, choose a new destination outside the project:

```bash
python3 tools/build_handover.py --output-dir ../aperiodic-life-handover-3.7.5-2026-10-15 --date 2026-10-15
```

This creates the directory and its sibling ZIP. Use a new date/name for a later handover, review the brief and verification record first, and do not overwrite earlier evidence silently.
