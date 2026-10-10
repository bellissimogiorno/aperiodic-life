# Security, privacy, and dependency posture

## Data flow

Aperiodic Life is a local static application. It has no backend, analytics,
telemetry, advertising, login, cookie, service worker, or runtime dependency.
The standalone makes no external resource request. The expanded source page
loads its scripts and stylesheet from the same location as the page. When a
site hosts either build, the host receives the normal page/resource requests;
the application does not send it experiment data.

User-entered seeds, rules, configurations, and cell states remain in browser
memory unless the user explicitly selects **Copy settings**, **Save PNG**, or
**Save state**. **Load state** reads a user-selected JSON file locally. The
application does not upload that file or automatically persist experiments.

## Browser capabilities used

- WebGL2 for rendering;
- Canvas `toBlob` for PNG export;
- Clipboard API for settings copy, with a prompt fallback;
- Web Crypto to create random seeds and random rules;
- pointer and keyboard events;
- a file picker and `File.text()` for local JSON state import;
- object URLs for temporary PNG and JSON downloads.

No capability requires elevated permission except that clipboard behaviour may
be restricted by browser context/policy.

## Input handling

Rule text is parsed by a bounded grammar. Numeric controls are normalised to
finite bounded integers. Picking guards unsafe spatial-grid sizes. Exported
configuration is serialised with `JSON.stringify`; no HTML is generated from
user text.

State import accepts the versioned `aperiodic-life-state` JSON format. It checks
the 8 MiB file limit before reading, validates supported patch sizes and numeric
bounds, and checks the rebuilt contact graph before applying cell IDs. Invalid
versions, duplicate or out-of-range cells, nonzero locked-border cells, and
graph mismatches are rejected. Every nonzero state, including refractory cells,
is preserved on a successful import, which restores the experiment paused.

The two graph checksums detect accidental incompatibility; they are not an
authentication or signature mechanism. Schema and topology validation failures
preserve the current experiment. Settings-only exports use a different format
and cannot be loaded as exact states. See the [configuration reference](CONFIGURATION.md).

## Supply chain

Runtime code is checked into the project. The application, build, and standard
tests have no package-manager dependencies. Browser testing invokes an installed
Chromium executable but does not ship it. The research tools also run without
package-manager dependencies; see the [research guide](../research/README.md).

The Einstein-hat geometry is adapted from `hatviz` under BSD 3-Clause. Project
code is MIT-licensed. Complete notices are in source documentation and embedded
in the standalone.

## Deployment headers

A strict static-host Content Security Policy is compatible with the expanded
source build, for example permitting only same-origin scripts/styles and
`blob:` downloads. The standalone embeds script and style elements, so a CSP
must use hashes/nonces or permit those inline blocks. Do not add remote CDN
exceptions; none are required.

## Threat model boundary

This is an exploratory visualisation, not a data-protection or safety-control
system. Its main risks are browser/GPU compatibility, resource exhaustion from
unsupported patch sizes, corrupted distribution files, and incorrect future
geometry modifications—not remote account compromise or server data loss.
