import promptsData from "../../data/prompts.json";
import type { Prompt } from "@/types/prompt";

export function getPrompts(): Prompt[] {
  return [...(promptsData as Prompt[])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPromptBySlug(slug: string): Prompt | undefined {
  return getPrompts().find((prompt) => prompt.slug === slug);
}
