# Rationale

This document explains the implementation choices carried into the handover. The [design brief](DESIGN_BRIEF.md) states the requirements; the [decision log](DECISION_LOG.md) records their status and origin.

## One application, modular source and an offline build

`index.html`, `styles.css`, `core.js`, `discoveries.js` and `app.js` are the editable application sources. `build-standalone.js` combines them into one checked standalone. This meets immediate browser use while retaining readable modules for development. A freshness check prevents the downloadable app from lagging behind its sources. Runtime use has no package-manager setup or remote library dependency.

The handover's additional HTML embeds the PDF and Markdown and creates their download links on demand. This makes one-file browsing convenient. The repository standalone instead uses relative catalogue links so that GitHub Pages and the extracted project can serve the PDF and its full editable source normally. These are delivery forms of the same app.

## Prominent examples and direct mobile control

Curated examples provide the shortest route from opening the app to seeing meaningful behaviour. Separating Load from Load & run allows inspection before evolution. The permanently accessible canvas Play/Pause control responds directly to the user's experience of being unable to pause conveniently on a phone.

Pinch/pan handling must also work while painting is selected. Deferring a touch paint until the gesture is understood prevents the first finger of a pinch from changing the scientific state. Manual camera movement must retain control over the view rather than being undone by automatic framing. Slower example playback supports inspection; it does not alter the automaton's discrete generations.

## Rules as complete specifications

`B3/S23` alone does not identify an automaton across different graphs. Complete rule labels therefore include the tiling, neighbour relation, transition and state count. Pattern pages link to those definitions instead of relying on a remote introductory explanation. `R40:S5` and priority-table row labels identify precise clauses.

B/S Generations counts only state-1 neighbours and has automatic refractory ageing. Ordered priority tables can count every state and use the first matching row; their higher states are signals, not automatically ageing refractory states. Combining these explanations would obscure why Edmond's gliders work and what the package searches changed.

## Exact evidence and restrained conclusions

The same geometry and full state that produce the interactive display also generate the catalogue figures. Independent evolution and topology checks reduce the risk that an implementation error is mistaken for a mathematical structure. Hashes locate candidates; exact state comparisons establish the reported matches.

On a uniform infinite lattice, a complete translated recurrence can prove continuing travel. A Penrose or Hat pattern can meet new surroundings beyond a checked local return, so finite aperiodic flight remains finite evidence. An emitting source on a finite patch is not automatically an infinite gun. These distinctions preserve the research value of the observations without overstating them.

## Attribution at the level of the contribution

A seed, update rule, launch placement, travelling mechanism and proof are different contributions. H02/H03 use Edmond's published rules and travelling behaviour while recording package-generated launch/source configurations. H16 adapts his Spectre mechanism; H20 derives from his Hat B rule. X25/X26 reuse the published X23 seed under changed rules. Each needs specific credit, not one generic originality badge.

“Original to this package” is restricted to configurations generated here for which no exact precedent was identified in the literature actually reviewed by the stated date. It is not a claim that all possible literature has been exhausted. P09 has a possible antecedent in Owens and Stepney’s fireworks oscillator; it is not claimed original. Author names, numbered references and linked rule/pattern identifiers make these judgements inspectable.

## Editable scholarly documentation

The full catalogue has 89 pattern entries, 56 rule-sets, 12 named templates and 267 production-engine panels. Markdown is the actual narrative source; JSON stores exact rules, seeds and credit metadata; ReportLab lays out the PDF. This avoids a PDF-only handover and makes corrections repeatable. Bundled fonts make the layout less dependent on the receiving machine.

Catalogue source changes must be checked for citation integrity and page overflow. A documentation revision can correct attribution without changing the application version or scientific data. A rule/seed/geometry change instead requires the associated evidence, snapshots, labels and release version to be reviewed together.

## A clean release with enough evidence to continue

Removing old release archives and abandoned work reduces ambiguity about which version to use. Removing the retained search manifests and certificates would destroy provenance. The handover therefore keeps current supporting research records and adds a concise decision log rather than copying the development workspace wholesale.

The package is prepared locally. Publishing to GitHub, changing Pages settings or overwriting remote history is a separate action; earlier questions about force-pushing do not establish a standing requirement to overwrite a repository.
