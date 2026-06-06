import type { Prompt } from "../../../../src/types/prompt";
import { ZodError } from "zod";
import { getPromptsFromGitHub, commitChanges, promptsJson } from "../../../_lib/github";
import { requireAdmin } from "../../../_lib/guards";
import {
  assertSameOrigin,
  errorResponse,
  hasFormContentType,
  json,
} from "../../../_lib/http";
import type { CommitChange, Env } from "../../../_lib/types";
import {
  promptFieldsSchema,
  InputValidationError,
  uniqueSlug,
  validateWebpImage,
} from "../../../_lib/validation";

function routeId(params: { id?: string | string[] }) {
  const value = params.id;
  return Array.isArray(value) ? value[0] : value;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }
  if (!assertSameOrigin(context.request)) {
    return errorResponse("Invalid request origin.", 403);
  }
  if (!hasFormContentType(context.request)) {
    return errorResponse("Expected a multipart form request.", 415);
  }

  try {
    const id = routeId(context.params);
    const prompts = await getPromptsFromGitHub(context.env);
    const existing = prompts.find((prompt) => prompt.id === id);
    if (!existing) {
      return errorResponse("Prompt not found.", 404);
    }

    const form = await context.request.formData();
    const fields = promptFieldsSchema.parse({
      title: form.get("title"),
      prompt: form.get("prompt"),
    });
    const slug = uniqueSlug(fields.title, prompts, existing.id);
    const image = form.get("image");
    const changes: CommitChange[] = [];
    let imagePath = existing.image;

    if (image instanceof File && image.size > 0) {
      const imageBytes = await validateWebpImage(image);
      imagePath = `/images/${slug}-${existing.id.slice(0, 8)}.webp`;
      changes.push({
        path: imagePath.replace(/^\//, "public/"),
        bytes: imageBytes,
      });

      if (existing.image !== imagePath) {
        changes.push({
          path: existing.image.replace(/^\//, "public/"),
          delete: true,
        });
      }
    }

    const updated: Prompt = {
      ...existing,
      title: fields.title,
      slug,
      image: imagePath,
      prompt: fields.prompt,
    };
    const nextPrompts = prompts.map((prompt) =>
      prompt.id === existing.id ? updated : prompt,
    );
    changes.push({
      path: "data/prompts.json",
      content: promptsJson(nextPrompts),
    });

    await commitChanges(
      context.env,
      changes,
      `Update prompt: ${fields.title}`,
    );

    return json({ prompt: updated, prompts: nextPrompts });
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "The prompt details are invalid.",
        400,
      );
    }
    if (error instanceof InputValidationError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Could not update the prompt.", 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }
  if (!assertSameOrigin(context.request)) {
    return errorResponse("Invalid request origin.", 403);
  }

  try {
    const id = routeId(context.params);
    const prompts = await getPromptsFromGitHub(context.env);
    const existing = prompts.find((prompt) => prompt.id === id);
    if (!existing) {
      return errorResponse("Prompt not found.", 404);
    }

    const nextPrompts = prompts.filter((prompt) => prompt.id !== existing.id);
    const imageIsShared = nextPrompts.some(
      (prompt) => prompt.image === existing.image,
    );
    const changes: CommitChange[] = [
      {
        path: "data/prompts.json",
        content: promptsJson(nextPrompts),
      },
    ];

    if (!imageIsShared) {
      changes.push({
        path: existing.image.replace(/^\//, "public/"),
        delete: true,
      });
    }

    await commitChanges(
      context.env,
      changes,
      `Delete prompt: ${existing.title}`,
    );

    return json({ prompts: nextPrompts });
  } catch (error) {
    console.error(error);
    return errorResponse("Could not delete the prompt.", 500);
  }
};
