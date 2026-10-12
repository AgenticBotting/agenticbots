#!/usr/bin/env node

import { readFile } from "node:fs/promises";

/**
 * Read-only Hermes release watcher.
 *
 * It resolves the latest non-draft, non-prerelease release from the official
 * repository, follows the annotated tag to its source commit, and extracts
 * the Docker manifest digest recorded in that tag. It never pulls an image,
 * changes a runtime, writes credentials, or promotes a release.
 */

const REPOSITORY = "NousResearch/hermes-agent";
const API = `https://api.github.com/repos/${REPOSITORY}`;

export function validateTagName(value) {
  if (!/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error(`Unexpected Hermes release tag: ${value}`);
  }
  return value;
}

export function parseManifestDigest(message) {
  const value = String(message);
  try {
    const payload = JSON.parse(value);
    if (/^sha256:[a-f0-9]{64}$/.test(payload?.dockerManifestDigest ?? "")) {
      return payload.dockerManifestDigest.toLowerCase();
    }
  } catch {
    // Older release tags may use a human-readable annotation.
  }
  const match = value.match(/Docker manifest digest:\s*`?(sha256:[a-f0-9]{64})`?/i);
  if (!match) throw new Error("Official annotated tag does not contain a Docker manifest digest");
  return match[1].toLowerCase();
}

async function github(path) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "AgenticBots-Hermes-release-watcher",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${path} failed (${response.status})`);
  return response.json();
}

export async function resolveLatestCandidate() {
  const release = await github("/releases/latest");
  if (release.draft || release.prerelease) throw new Error("Latest Hermes release is not a stable release");
  const tag = validateTagName(String(release.tag_name ?? ""));
  const ref = await github(`/git/ref/tags/${encodeURIComponent(tag)}`);
  if (ref.object?.type !== "tag") throw new Error("Hermes release tag is not an annotated tag");
  const tagObject = await github(`/git/tags/${ref.object.sha}`);
  if (tagObject.object?.type !== "commit" || !/^[a-f0-9]{40}$/.test(tagObject.object.sha ?? "")) {
    throw new Error("Hermes annotated tag does not resolve to a commit");
  }

  return {
    repository: REPOSITORY,
    tag,
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
    tagObjectSha: ref.object.sha,
    sourceCommit: tagObject.object.sha,
    manifestDigest: parseManifestDigest(tagObject.message),
    tagSignatureVerified: tagObject.verification?.verified === true,
    tagSignatureReason: tagObject.verification?.reason ?? "unavailable",
  };
}

export function verifyCandidateRecord(live, recorded) {
  for (const key of ["repository", "tag", "releaseUrl", "publishedAt", "tagObjectSha", "sourceCommit", "manifestDigest", "tagSignatureVerified", "tagSignatureReason"]) {
    if (recorded[key] !== live[key]) throw new Error(`Recorded Hermes candidate differs from official metadata: ${key}`);
  }
  if (recorded.promotionAllowed !== false) throw new Error("Unqualified Hermes candidate must not allow promotion");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  resolveLatestCandidate()
    .then(async (candidate) => {
      if (process.argv.includes("--verify-record")) {
        const recorded = JSON.parse(await readFile(`infra/runtime/release-candidates/${candidate.tag}.json`, "utf8"));
        verifyCandidateRecord(candidate, recorded);
      }
      process.stdout.write(`${JSON.stringify(candidate, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`Hermes release check failed: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
