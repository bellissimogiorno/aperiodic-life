# Publishing the project on GitHub

These instructions publish the extracted source directory as a Git repository. Run commands from the directory containing `README.md`, `core.js`, and `index.html`. The examples use a Bash-compatible shell, including Git Bash on Windows.

Git is required. Node.js 22+ and Python 3.10+ run the local verification. A GitHub account and command-line authentication are needed for the upload; the GitHub CLI (`gh`) is optional.

## Prepare the first commit

For a freshly extracted source directory that is not already a Git repository:

```bash
git init -b main
node build-standalone.js --check
python3 tools/project.py test standard
git status --short
git add .
git diff --cached --stat
git commit -m "Initial open-source release of Aperiodic Life"
```

Review the listed files before committing. Keep the source, documentation, licences, tests, and checked research evidence. Generated release ZIPs, local environments, and temporary search outputs do not belong in this first commit. If Git asks for your name and email, configure your own commit identity and repeat the commit.

For an existing clone, retain its history and use its normal branch workflow instead of initialising it again.

## Create and upload the repository

Choose either method below.

### GitHub website and Git

1. On GitHub, create a **new public repository** with the name you want, for example `aperiodic-life`.
2. Leave its README, `.gitignore`, and licence initialisation options unselected; those files already exist locally.
3. Copy the new repository's HTTPS or SSH URL. Authenticate using your configured Git credential manager or SSH key.
4. Set the variable below to that copied URL, then upload `main`:

```bash
REPOSITORY_URL='PASTE_THE_NEW_REPOSITORY_URL_HERE'
git remote add origin "$REPOSITORY_URL"
git remote -v
git push -u origin main
```

Replace the placeholder before running these commands. They assume this fresh repository has no `origin` remote. If one already exists, inspect it with `git remote -v` and use the intended existing remote rather than overwriting it blindly. Do not force-push over an existing project's history.

This uploads the files and Git history. Uploading a ZIP as a single file on GitHub does not unpack it into a browsable source repository.

### GitHub CLI

After creating the local commit above, the following authenticates and creates a public repository named `aperiodic-life` under the signed-in account:

```bash
gh auth login
gh repo create aperiodic-life --public --source=. --remote=origin --push
```

Choose a different name if that name is already in use. For an organisation, supply the organisation/repository name you control. Run this method only when creating a new remote repository; it is an alternative to the website method.

After uploading, open the repository and check that `README.md` renders, the source is browsable, and any configured checks complete. Add a description such as “Offline cellular automata on square, hexagonal, Einstein-hat, and Penrose tilings.” Set a project website URL only after enabling and verifying one.

## Optional: a playable GitHub Pages site

### Curated site through GitHub Actions

The included **Deploy Pages (manual)** workflow publishes only the standalone
application and licence files. It runs only when you request it:

1. Open the repository's **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Open **Actions → Deploy Pages (manual) → Run workflow**.
3. Select the default branch (`main` for the new repository) and run it.
4. After its verification and deployment jobs finish, open the URL in the `github-pages` deployment or Pages settings.

The workflow accepts the default branch only. Later pushes do not automatically
deploy this site; run the workflow again for each update. See [CI and workflows](CI.md)
for the checks and permissions.

To build the same small static payload locally:

```bash
python3 tools/build_site.py --output-dir ../aperiodic-life-site
```

The output contains `index.html` with the complete application, licence files,
and `.nojekyll`. Keep the output outside the source tree.

### Serve the root branch instead

Alternatively, GitHub can serve the source application directly from the repository:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then **Save**.
4. Wait for deployment and open the URL shown by GitHub.

The root `index.html` is the application entry point. Keep its accompanying `styles.css`, `core.js`, `discoveries.js`, and `app.js` at their relative paths. The included `.nojekyll` file requests plain static serving. The `docs/` directory contains project documentation and is not the application root. This branch-based alternative deploys subsequent changes to `main` automatically.

Check a discovery, stepping, state-file save/load, and browser-console errors on the published site. The hosted page is fetched from GitHub Pages; the app itself has no backend or telemetry. A downloaded standalone still works offline.

## Later changes and release files

When updating an existing clone from a release ZIP, copy the contents of the
extracted `aperiodic-life` directory into the repository root, including
`.github`, `.gitattributes`, `.gitignore`, and `.nojekyll`. Some file managers
hide names beginning with a full stop. Keep the clone's own `.git` directory.
The application files must sit beside the repository's `README.md`, rather than
inside a second nested `aperiodic-life` directory.

Review and commit the update, including the workflow files:

```bash
git status --short
git add -A
git diff --cached --stat
git commit -m "Update Aperiodic Life"
git push
```

The next CI run should show **Standard and topology (Node 22)**,
**Standard and topology (Node 24)**, **Large patches**, and
**Browser (HTTP and standalone file)**. If a check fails, see
[how to read the CI failure](CI.md#if-a-check-fails). Re-running an older failed
run does not pick up files from a newer commit.

Use [release operations](OPERATIONS.md) to rebuild and verify the standalone and deterministic archives. GitHub Releases can carry the standalone HTML and release archives as downloadable assets; keep their version and evidence consistent with the tagged source.

For a clean repository ZIP, excluding Git internals and local build artefacts:

```bash
python3 tools/export_repository.py --output ../aperiodic-life-source-3.6.2.zip
```

To obtain release downloads from GitHub, manually run **Actions → CI → Run workflow**
and enable **Build downloadable release files after all checks pass**.
After all gates succeed, the run provides an artefact named
`aperiodic-life-release-` followed by the commit SHA. This produces downloadable
workflow artefacts; it does not create a GitHub Release.

## Official references

- [Add locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub CLI: `gh repo create`](https://cli.github.com/manual/gh_repo_create)
- [Configure a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
