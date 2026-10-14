# Continuous integration

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests, pushes to `main`, and manual requests. It uses Ubuntu 24.04 and the existing test commands; no npm or Python dependency installation is required. The checked-in standalone HTML must already match its sources. CI checks that correspondence without silently rebuilding the file.

| Check name | Runtime | Work performed |
|---|---|---|
| Standard and topology (Node 22) | Node 22, system Python 3 | `python3 tools/project.py test standard`, then `test topology` |
| Standard and topology (Node 24) | Node 24, system Python 3 | The same two profiles |
| Large patches | Node 24, system Python 3 | `python3 tools/project.py test large` |
| Browser (HTTP and standalone file) | Node 24, preinstalled Chrome/Chromium | Browser interactions, saved states, rendering, and standalone loading |

The browser job locates a Chromium-compatible executable and sets `CHROMIUM`. The harness uses Xvfb when available and otherwise launches headless Chromium. GitHub's [Ubuntu 24.04 software manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) lists Chrome, Chromium, Xvfb, and Python. Browser startup or test failure fails the job. CI additionally requires the harness result `mode: "http-and-file"`; its fallback using document injection does not satisfy this gate. The JSON result and any generated preview are retained as the `browser-evidence` artefact for 14 days.

When configuring branch protection, select the four check names above after their first run. The optional packaging job is skipped during ordinary CI and should not be required. If the default branch is renamed, update the `push.branches` entry in `ci.yml`.

## If a check fails

The **CI** workflow tests the project. It is separate from **Deploy Pages (manual)**
and GitHub's **pages build and deployment** workflow. A failed CI run does not by
itself establish that the website is unavailable. Check the Pages deployment and
open the published URL to determine whether the site is running.

Open the failed run, select the red job, and expand its failed step. Each command
in a test profile has an expandable log group; a failed command also appears in
the run's error annotations with its exit status. Read its assertion or traceback
above the final exit-status message. A deprecation warning or runner-image notice
is not the same as a failed test.

Failed standard/topology jobs retain their output as `check-logs-node-22` or
`check-logs-node-24`; the large-patch job uses `check-logs-large`. Pages verification
uses `pages-check-logs`. These downloadable artefacts are retained for 14 days.
If setup fails before a test starts, there may be no test log to upload; use the
failed setup step's own log. The Bash pipelines preserve test failures when
copying output to log files.

When reporting a failure, include the failed command and its complete output,
the commit SHA, and the Node.js version. A screenshot containing only
“Process completed with exit code 1” does not identify the cause. GitHub explains
how to [view and download workflow logs](https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs).

If GitHub shows different job names from the table above, compare the workflow
at that run's commit with `.github/workflows/ci.yml` in this release. When copying
a release into a clone, include the `.github` directory and review the staged
changes. Rerunning an old workflow run uses its original commit; push the updated
files to test the new version.

## Local equivalents

Run these from the repository root with Node 22 or 24 and Python 3.10 or later:

```bash
python3 tools/project.py test standard
python3 tools/project.py test topology
python3 tools/project.py test large
python3 tools/project.py test browser
```

The browser profile needs an installed Chromium-compatible browser. Set `CHROMIUM` to its executable path if it is not on `PATH`. Large-patch checks start separate Node processes with the memory limits recorded in `tools/project.py`.

## Manually build downloadable packages

Open **Actions → CI → Run workflow**, choose the branch, and enable **Build downloadable release files after all checks pass** (`build_package`). The packaging job runs only after both standard/topology matrix entries, large-patch checks, and browser checks succeed for that run. It writes into `$RUNNER_TEMP/aperiodic-life-packages`, outside the source tree, and uploads the deliverables and checksum file as `aperiodic-life-release-<commit SHA>`, retained for 30 days.

This creates a workflow artefact. It does not create a tag or GitHub Release. Download the artefact and inspect its contents before attaching selected files to a release. A local packaging command is:

```bash
python3 tools/package.py --output-dir ../aperiodic-life-release
```

The output directory must be new or empty and outside the repository. It receives the standalone HTML, source ZIP, per-file source manifest, and SHA-256 checksums listed in [OPERATIONS.md](OPERATIONS.md). Packaging checks the committed standalone bundle and verifies the archive and manifest; run the test profiles before making a local release.

## Optional Pages deployment

The separate [Deploy Pages (manual) workflow](../.github/workflows/pages.yml) has only a manual trigger. Follow [PUBLISHING.md](PUBLISHING.md) to enable GitHub Pages with **Source: GitHub Actions**. Run it from the default branch after CI passes. Other branches cannot enter its build job.

The build job reruns the standard profile and executes:

```bash
python3 tools/build_site.py --output-dir "$RUNNER_TEMP/aperiodic-life-site"
```

That curated static directory includes the application, notices, and `docs/catalogue/` with the PDF and editable source. Only that directory is uploaded. A separate job deploys it through the `github-pages` environment. Repository environment protection rules apply. The workflow exposes the resulting URL through the deployment environment. Commits and pull requests do not trigger publication.

## Permissions and action updates

CI grants only `contents: read`; checkout does not retain credentials. It uses the ordinary `pull_request` event, never `pull_request_target`, and does not request repository secrets. The Pages workflow starts with no permissions: its build job gets `contents: read`, while its separate deployment job gets only `pages: write` and `id-token: write`. No repository code runs in that deployment job.

All directly referenced actions are pinned to full commit SHAs. The table links each pinned commit to its official action release. [Dependabot](../.github/dependabot.yml) proposes monthly updates for GitHub Actions; review those pull requests and keep immutable pins.

| Action | Release | Pinned commit |
|---|---|---|
| `actions/checkout` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | [3d3c42e](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1) |
| `actions/setup-node` | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) | [949feb2](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1) |
| `actions/upload-artifact` | [v7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) | [cf430e0](https://github.com/actions/upload-artifact/commit/cf430e030ddbb5b0abf93d22962f4752f3646cd9) |
| `actions/upload-pages-artifact` | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | [fc324d3](https://github.com/actions/upload-pages-artifact/commit/fc324d3547104276b827a68afc52ff2a11cc49c9) |
| `actions/deploy-pages` | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | [368f825](https://github.com/actions/deploy-pages/commit/368f82528645a54fb793d4d04e342629a3f51346) |

The workflows follow GitHub's [workflow security guidance](https://docs.github.com/en/actions/reference/security/secure-use) and [custom Pages workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Hosted runner images and browsers can change; the first hosted run must still be reviewed after uploading this repository. Preparing these files does not run a GitHub workflow or publish a site.
