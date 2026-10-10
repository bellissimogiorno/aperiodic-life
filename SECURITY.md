# Reporting security issues

If this repository has private vulnerability reporting enabled, use **Security →
Report a vulnerability**. Otherwise use a private contact published by the
repository owner. If none is available, open an issue asking for a private
reporting channel without including exploit details or private state files.

Include the affected version, browser and operating system, reproducible steps,
and expected versus observed behaviour. Share a minimal synthetic state file
when needed. Do not include credentials or personal data.

There is no separate long-term-support branch or response-time commitment.
Reports should identify whether the issue reproduces on the current default
branch. Fixes and affected versions can be recorded in GitHub security advisories
and release notes by the repository maintainers.

The application runs locally in the browser. Its data flow, JSON import limits,
and dependency posture are documented in
[Security and privacy](docs/SECURITY_AND_PRIVACY.md).
