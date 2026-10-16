# Hermes v0.22.2 qualification record

Status: **candidate only — promotion is blocked**

Recorded: October 16, 2026

The repository's read-only release watcher resolved the current official
stable release and annotated tag to:

| Evidence | Value |
|---|---|
| Release | `v0.22.2` |
| Source commit | `d923a5eb487a17c0a68801bba9ef0f56c81040a8` |
| Annotated tag object | `7b77e29eedd85a8497ce2821448dac7964dc46f6` |
| Docker manifest digest in tag metadata | `sha256:36099926da316742423544e055d4734777105ffe6341873af5459b957d0c2919` |
| Candidate image | `nousresearch/hermes-agent:stable@sha256:36099926da316742423544e055d4734777105ffe6341873af5459b957d0c2919` |
| Tag signature | GitHub reports `unsigned`; this is a provenance limitation |

This record only makes upstream drift visible. It does not update the active
Terraform image, install Hermes or authorize a client runtime.

Before promotion, the isolated staging qualification must review source and
effective tool allowlists, run the real API contract and container smoke tests,
scan the image/SBOM, prove migration and restore, and complete a staging canary.
Every gate remains false in
`infra/runtime/release-candidates/v0.22.2.json`, so
`promotionAllowed` remains false.

Official release: <https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.2>
