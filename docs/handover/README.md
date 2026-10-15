# Aperiodic Life: handover

Prepared on **15 October 2026** for **Aperiodic Life 3.7.5**, with **complete catalogue revision 2**. AI generated following prompts by Murdoch J. Gabbay.

This handover preserves the current working project and the requirements established in the accompanying discussion. Release 3.7.5 fixes repeated Randomise actions, adds explicit seed replay, and adds arrow-key panning when the canvas has focus. The simulation rules, geometry, curated patterns and reviewed 3.7.4 catalogue remain unchanged. Earlier release archives, abandoned working copies and temporary search output are excluded. Exact curated seeds and the currently distributed evidence are retained, including their original dates. Some older raw soup-search archives referenced by provenance were inspected in an earlier workspace and are not included in the fresh release; this handover does not reconstruct those missing archives.

## Read these documents in order

| Document | Purpose |
|---|---|
| [DESIGN_BRIEF.md](DESIGN_BRIEF.md) | User goals, requirements, preferences and acceptance criteria |
| [RATIONALE.md](RATIONALE.md) | Reasons for the current scientific, interface and delivery choices |
| [DECISION_LOG.md](DECISION_LOG.md) | Numbered decisions, their basis, current status and conditions for reconsideration |
| [CONTINUATION_GUIDE.md](CONTINUATION_GUIDE.md) | Current results, open issues, implementation map and next work |
| [VERIFICATION.md](VERIFICATION.md) | What was checked, what was inherited and what remains untested |

The [project README](../../README.md) is the user-facing entry point. The [complete catalogue](../catalogue/aperiodic-life-catalogue.pdf) is the scholarly record of all 89 presets, 56 complete rule-sets and 12 rule-selector templates. Its [editable source](../catalogue/README.md) includes the Markdown narrative, exact JSON data, geometry, fonts and Python builder.

## Authority and interpretation

Explicit later instructions from the user can change this brief. The decision log distinguishes user requirements from implementation choices; it is not a claim that the user explicitly approved every technical detail. Dates of individual earlier messages are not reconstructed: the log uses the recorded sequence and this handover date.

For dynamics, consult `core.js`, `discoveries.js` and the exact verification fixtures. For the revised scholarly attribution language, consult catalogue revision 2. Some older application/provenance prose remains more general; the continuation guide records that reconciliation work. If records disagree, inspect the actual fixture and report the discrepancy before changing a scientific claim.

The archive's root `START_HERE.html` opens the app and links to these documents. The `source/` directory is the GitHub-ready project root. The separate `browser/` HTML embeds the current PDF and Markdown for convenient single-file use; it is a generated handover convenience, not an additional application implementation.
