import type { Prompt } from "../../src/types/prompt";

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

export interface GitHubFile {
  content: string;
  sha: string;
}

export interface CommitChange {
  path: string;
  content?: string;
  bytes?: ArrayBuffer;
  delete?: boolean;
}

export interface PromptMutationResult {
  prompt?: Prompt;
  prompts: Prompt[];
}
