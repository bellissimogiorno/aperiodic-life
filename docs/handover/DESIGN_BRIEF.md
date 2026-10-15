# Design brief

**Baseline:** Aperiodic Life 3.7.5; retained catalogue 3.7.4, revision 2; 15 October 2026.

## Purpose and priorities

Create an accessible, open-source browser laboratory for cellular automata on square, hexagonal, Penrose and Einstein-hat tilings. It should let a first-time user load interesting examples immediately, inspect their evolution and rules, and reproduce or extend the accompanying research.

The user's central scientific aim is to find interesting structures, especially **gliders, spaceships and launchers**, with the highest priority given to an **Einstein glider**. Performance and interface improvements support exploration. They must preserve the mathematical update, exact initial states and honest interpretation of the evidence.

The user initially suggested that no Einstein glider was known. Subsequent work identified James Edmond's earlier published Hat/Spectre work. Preserve the research ambition while crediting that prior work; do not carry the earlier supposition forward as an established fact.

## Established requirements and preferences

The quoted fragments below identify the relevant user requests. They preserve intent without reproducing the entire conversation. `REQ` identifiers belong to this handover; catalogue `R` identifiers continue to name mathematical rules.

| ID | Requirement and discussion basis | Acceptance criterion / current location |
|---|---|---|
| REQ-01 | Prioritise discoveries: “most especially … finding gliders and other structures”; “above all … an einstein glider”. | Continue the Hat, Penrose and hexagonal search programmes; retain exact seeds, full rules, bounds, attribution and reproducible evidence. See the continuation guide. |
| REQ-02 | Search thoroughly: “very exhaustive search” and “Please keep looking”. | State which finite parameter spaces were exhaustive and which were sampled. Give actual search bounds and totals; never infer nonexistence or novelty from a failed search. |
| REQ-03 | Make an open-source project suitable for GitHub. | Include source, tests, documentation, research evidence, licences, standalone build, packaging and GitHub workflow files. `source/` in the handover is the repository root. |
| REQ-04 | “Switch spelling to UK spelling throughout”. | Use UK spelling in prose and interface text: catalogue, behaviour, colour, neighbour, centre, initialise, licence. Preserve required API identifiers, URLs, quoted publication titles and verbatim third-party notices. |
| REQ-05 | “Clean out all historical files. Present this … as a fresh release.” | Ship the current project, not old release ZIPs, superseded catalogues, backups or working directories. Keep evidence needed for current claims. The requested decision log records reasons, rather than bundling obsolete releases. |
| REQ-06 | Keep versioning deliberate. The user first requested retention, later explicitly requested version bumps. | Current app version is 3.7.5, bumped for the Randomise fix. The reviewed catalogue remains 3.7.4, revision 2. Substantive future app releases should receive a deliberate version bump; do not reuse an old version merely for convenience. |
| REQ-07 | Begin the README with the requested Murdoch J. Gabbay credit, invitation for patches and a no-warranty/no-fitness/no-liability disclaimer. | Preserve the exact opening paragraph in `README.md` and its existing disclaimer and licence link. Do not silently rewrite the authorship or remove the computer-crash/data-loss scope. |
| REQ-08 | Let the user “just open the webpage and run the app in their browser”; provide a locally browsable HTML. | No installation or npm dependencies for use. Supply the offline WebGL2 standalone. Keep the live URL in both the introductory runtime paragraph and “Run it”: https://bellissimogiorno.github.io/aperiodic-life/ . |
| REQ-09 | Put “curated configurations” and its “load” and “load and run” buttons “at the top of the controls”. | The selector remains prominent. Load prepares a paused configuration; Load & run starts it. Preserve search, credit/source display and appropriate framing. |
| REQ-10 | A Play/Pause button must be “always present even in the mobile site”. | The canvas control remains reachable with the mobile drawer open, closed or scrolled; its state agrees with the main playback control. Pausing actually stops generations. |
| REQ-11 | Pinch-to-zoom should work on mobile. | Two-finger pinch and pan work in both pan and paint modes, around the gesture midpoint; lifting/cancelling fingers does not cause accidental painting. Verify on real target devices as well as tests. |
| REQ-12 | “The step speed of the new examples is too high. Please halve it.” | Preserve the current per-preset speeds in `discoveries.js` and their regression expectations. This was a targeted reduction, not a request to halve every speed on each future rebuild. New examples should be comfortably inspectable. |
| REQ-13 | Credit Edmond and include the arXiv paper; check each example's originality or prior source. | Name the actual author and parent work, distinguish a newly selected seed from a published rule/mechanism, and keep linked sources. Edmond's paper: https://arxiv.org/abs/2609.22579 ; project: https://offlattice.org/monotile/ . |
| REQ-14 | A catalogue at “academic and pedagogic standards”, then a full catalogue for “all the presets”. | Cover all 89 curated configurations and all 12 named rule templates, with 56 complete rule definitions. Include exact seeds/recipes, state semantics, neighbourhood, diagrams, measurements, limitations and specific sources. Update coverage whenever presets change. |
| REQ-15 | Rules must be “clearly, uniquely, and discoverably labelled”; explain S5 and which neighbours count. | Keep the notation guide, neighbourhood diagrams, stable `R01–R56` labels, links and explicit rule-origin status. For example, `R40:S5` means survival with exactly five live neighbours among the six edge-sharing hexagons; it is one clause of R40. |
| REQ-16 | The About button should give the package credit, date, version and a clear catalogue link; include editable catalogue source in the repository. | Preserve the bottom-of-controls About button, exact credit “Aperiodic life package, vibe-coded by Murdoch J. Gabbay”, release metadata, PDF link and Markdown link. Bundle the complete builder/data/font sources, not just the PDF. |
| REQ-17 | Catalogue authorship must say “AI generated following prompts by Murdoch J. Gabbay”. | Keep this exact statement on the catalogue cover and in PDF author metadata. It also appears in the handover. |
| REQ-18 | Replace ambiguous originality and attribution: “Be specific!”; do not merely say “Credited below”. | Say what is original or adapted, name the parent, explain the change, and give an exact numbered citation or pointer. State “no exact precedent identified in the literature reviewed as at 14 October 2026” rather than claiming exhaustive worldwide priority. Preserve unresolved matches explicitly. |
| REQ-19 | Regenerate an updated handover with a “clearly-labelled design brief, rationale and decision log”. | Include this brief, the two separately named documents, continuation instructions, current evidence, integrity checks and the complete current project. A successor should not need the earlier chat to resume responsibly. |
| REQ-20 | Fix the Randomise button repeatedly selecting the same pattern; check for other issues and return an updated versioned handover. | Randomise/R uses a fresh visible seed; Apply seed/Enter reproduces an explicit seed. Include regression coverage and record executed checks and limitations. |
| REQ-21 | Arrow keys should pan when the canvas has focus. | Make the canvas focusable and visibly focused; arrow keys pan only there, with normal form-control behaviour preserved. |

## Scientific acceptance

An example is not accepted on visual impression alone. Save all nonzero states, including refractory/signal states, and give the complete automaton: tiling, neighbour relation, update and total state count. Exact cycles require full-state equality. A translated return on the uniform infinite hexagonal lattice has a different implication from a translated local patch on an aperiodic substrate.

The catalogue must distinguish a one-off launcher, a finite recurring emitter, and an indefinitely operating gun. Retain the separate original-rule and original-pattern judgements. A different phase, translation, reflection or rotation of a known seed is not a new discovery.

## Interface and delivery acceptance

A new user should be able to open the app, find a curated example, load it paused, run it, pause it on a phone, zoom, and reach its rule and credit without searching through implementation details. A researcher should be able to locate the exact configuration and replay the stated claim. A maintainer should be able to rebuild the standalone, catalogue, source archive and handover using documented commands.

User-facing wording should be plain and precise. Avoid unexplained terminology and vague references such as “the existing core” or “adaptation of prior work” without a named rule, pattern or source. Large search totals do not replace an intelligible explanation of the actual result.
