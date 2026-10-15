# Verification record

**Date:** 15 October 2026. **Application:** 3.7.6. **Catalogue:** retained 3.7.4, revision 2.

## Startup error and correction

The reported error was `Unable to start: Required interface element #newSeedButton is missing`. The original 3.7.4 JavaScript requests that control. The updated interface uses `applySeedButton`. Combining the original script with the updated HTML reproduces the exact error.

The previously delivered 3.7.5 ZIP contains matching scripts and markup in its expanded source, ordinary standalone and embedded-catalogue standalone. This indicates cached or mixed-version assets in the failing environment; that browser/deployment was not accessible, so its precise cache state is not claimed as observed.

Release 3.7.6 gives all four expanded-source runtime asset URLs a `?v=3.7.6` suffix. New HTML therefore requests different URLs from the old unversioned assets. The builder checks these references against `VERSION` and refuses an inconsistent source set. Standalone HTML and the curated Pages output still embed their JavaScript and CSS directly.

After publishing the complete source set, a previously open page may need **Ctrl+Shift+R** (or **Cmd+Shift+R** on macOS) to refresh its HTML. For immediate offline use, open `browser/aperiodic-life-3.7.6.html` from the extracted handover. A source URL version is a cache key, not a cryptographic guarantee about what an incorrectly configured server returns.

## Checks run for 3.7.6

The [machine-readable report](evidence/maintenance-3.7.6.json) links the retained logs. Node.js v24.19.0 and Python 3.12.14 were used.

- `node test-interface.js`: execute the actual production element collector and event binding against source and standalone HTML, resolving all **61 required controls**; check seed-button wiring, missing controls, duplicate IDs, exact stale-script diagnostic and all versioned runtime URLs.
- `node test-static.js`: inline asset equality, current standalone, expected interface and runtime assets, notices and absence of external runtime dependencies in the standalone.
- `node test-interactions.js` and `node test-snapshots.js`: Randomise/replay, focused arrow panning, camera/pointer behaviour and exact state restoration remain correct.
- `python3 test-package.py`: **12 tests**, including refusal of unversioned or wrong-version URLs for each of the four assets.
- `python3 test-repository.py`: **4 tests**, including the self-contained Pages payload.
- `python3 test-handover.py`: **9 tests**, including exact payload/embedded assets, reproducibility and tamper detection.
- `python3 docs/catalogue/build_catalogue.py --check` and `python3 test-catalogue.py`: source validation and **4 tests** for catalogue compatibility and scientific hash integrity.
- Local HTTP serving: all four versioned runtime URLs returned bytes identical to the canonical source files.
- The completed ZIP is freshly extracted, its full integrity verifier is run, and `test-interface.js` also checks the delivered browser convenience HTML. The standalone is checked for freshness after extraction.

The standard profile now includes `test-interface.js`. These dependency-free checks do not emulate native browser layout, rendering or caching. Chromium is still unavailable, so no real-browser pass is claimed. No live deployment was made.

## Prior broad verification retained

`app.js`, `styles.css`, `core.js` and `discoveries.js` are unchanged from the tested 3.7.5 release; this patch changes the asset URLs, release metadata, builders, tests and documentation. The catalogue PDF, prose, structured data and geometry remain unchanged.

The [3.7.5 verification record](evidence/maintenance-3.7.5/verification.md) and [machine-readable evidence](evidence/maintenance-3.7.5.json) retain the previous complete standard, topology and large-patch results, 38,400 independent full-state comparisons and replay of all 89 configurations. Those computational runs were not repeated merely to change URL version keys. Historical evidence retains its original date and version.

## Verify the handover

From the outer extracted directory, before modifying files:

```bash
python3 tools/verify_handover.py
```

From `source/`, the interface regression can additionally inspect the packaged browser HTML:

```bash
node test-interface.js ../browser/aperiodic-life-3.7.6.html
```

The full test instructions are in [TESTING.md](../TESTING.md). The build and reproduction instructions are in [the continuation guide](CONTINUATION_GUIDE.md).
