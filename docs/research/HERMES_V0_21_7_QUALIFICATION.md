# Hermes v0.21.7 qualification record

Status: **candidate only — promotion is blocked**

Reviewed: 2026-10-12

This record separates release detection from release installation. The official
GitHub release API and annotated tag resolve to:

| Evidence | Value |
|---|---|
| Release | `v0.21.7` |
| Source commit | `71d34bad1045610252eda02ee79549436896e784` |
| Annotated tag object | `00f69310e29c24dfd7c6bb258b0a2337d3455d79` |
| Docker manifest digest in tag metadata | `sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b` |
| Candidate image | `nousresearch/hermes-agent:stable@sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b` |
| Tag signature | GitHub reports `unsigned`; this is a provenance limitation, not a passing signature check |

The source archive was compared with the repository's `v2026.9.24` baseline.
The reviewed version supports the controls now pinned in both runtime configs:
explicit empty `platform_toolsets.api_server` and `platform_toolsets.cron`
allowlists, finite `agent.max_turns`, a wall-clock run budget, bounded provider
attempts, disabled recovery cycling, disabled BOT-created schedules and Bot
Mode disabled.

The release watcher at `scripts/hermes-release-candidate.mjs` is read-only. It
validates the tag shape, follows the annotated tag to the exact commit and
requires an immutable manifest digest in official tag metadata. It does not
pull, install, promote or modify a runtime.

## Closed promotion gates

- Docker is not installed on the review Mac, so the image has not been pulled
  or executed here.
- The image digest has not been independently resolved from the registry.
- The SBOM and vulnerability scan have not run.
- Adapter/API contract tests have not run against this real container.
- A sanitized state copy has not been migrated and restored.
- Network containment and effective toolsets have not been proved from inside
  the container.
- No AWS staging canary or soak has run.

`infra/runtime/release-candidates/v0.21.7.json` therefore keeps
`promotionAllowed` false. The active Terraform examples remain on the old
reproducible pin until the candidate passes the disposable-container and
staging gates. The old pin is not approved for staging either; live execution
remains locked in the application.

Official release: <https://github.com/NousResearch/hermes-agent/releases/tag/v0.21.7>
