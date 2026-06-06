import type { Prompt } from "../../src/types/prompt";
import { promptsSchema } from "./validation";
import type { CommitChange, Env, GitHubFile } from "./types";

const GITHUB_API_VERSION = "2022-11-28";

function githubHeaders(env: Env): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "social-bil-prompts-cloudflare-pages",
  };
}

function branch(env: Env): string {
  return env.GITHUB_BRANCH?.trim() || "main";
}

async function githubFetch<T>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    throw new Error("GitHub integration is not configured.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      ...githubHeaders(env),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const requestId = response.headers.get("X-GitHub-Request-Id");
    throw new Error(
      `GitHub request failed (${response.status})${requestId ? ` [${requestId}]` : ""}.`,
    );
  }

  return (await response.json()) as T;
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export async function getPromptsFromGitHub(env: Env): Promise<Prompt[]> {
  const owner = encodeURIComponent(env.GITHUB_OWNER);
  const repo = encodeURIComponent(env.GITHUB_REPO);
  const file = await githubFetch<GitHubFile>(
    env,
    `/repos/${owner}/${repo}/contents/data/prompts.json?ref=${encodeURIComponent(branch(env))}`,
  );
  const parsed = JSON.parse(decodeBase64Utf8(file.content));
  return promptsSchema.parse(parsed).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function commitChanges(
  env: Env,
  changes: CommitChange[],
  message: string,
): Promise<void> {
  const owner = encodeURIComponent(env.GITHUB_OWNER);
  const repo = encodeURIComponent(env.GITHUB_REPO);
  const repoPath = `/repos/${owner}/${repo}`;
  const targetBranch = branch(env);
  const refPath = targetBranch
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const ref = await githubFetch<{ object: { sha: string } }>(
    env,
    `${repoPath}/git/ref/heads/${refPath}`,
  );
  const headCommit = await githubFetch<{ tree: { sha: string } }>(
    env,
    `${repoPath}/git/commits/${ref.object.sha}`,
  );

  const treeEntries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }> = [];

  for (const change of changes) {
    if (change.delete) {
      treeEntries.push({
        path: change.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }

    const blob = await githubFetch<{ sha: string }>(
      env,
      `${repoPath}/git/blobs`,
      {
        method: "POST",
        body: JSON.stringify({
          content:
            change.content !== undefined
              ? change.content
              : arrayBufferToBase64(change.bytes as ArrayBuffer),
          encoding: change.content !== undefined ? "utf-8" : "base64",
        }),
      },
    );

    treeEntries.push({
      path: change.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await githubFetch<{ sha: string }>(
    env,
    `${repoPath}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: headCommit.tree.sha,
        tree: treeEntries,
      }),
    },
  );

  const commit = await githubFetch<{ sha: string }>(
    env,
    `${repoPath}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    },
  );

  await githubFetch(
    env,
    `${repoPath}/git/refs/heads/${refPath}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: commit.sha,
        force: false,
      }),
    },
  );
}

export function promptsJson(prompts: Prompt[]): string {
  return `${JSON.stringify(prompts, null, 2)}\n`;
}
