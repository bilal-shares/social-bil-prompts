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
import type { Env } from "../../../_lib/types";
import {
  promptFieldsSchema,
  InputValidationError,
  uniqueSlug,
  validateWebpImage,
} from "../../../_lib/validation";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const prompts = await getPromptsFromGitHub(context.env);
    return json({ prompts });
  } catch (error) {
    console.error(error);
    return errorResponse("Could not load prompts from GitHub.", 502);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
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
    const form = await context.request.formData();
    const fields = promptFieldsSchema.parse({
      title: form.get("title"),
      prompt: form.get("prompt"),
    });
    const image = form.get("image");

    if (!(image instanceof File)) {
      return errorResponse("An image is required.");
    }

    const imageBytes = await validateWebpImage(image);
    const prompts = await getPromptsFromGitHub(context.env);
    const id = crypto.randomUUID();
    const slug = uniqueSlug(fields.title, prompts);
    const imagePath = `/images/${slug}-${id.slice(0, 8)}.webp`;
    const newPrompt: Prompt = {
      id,
      title: fields.title,
      slug,
      image: imagePath,
      prompt: fields.prompt,
      createdAt: new Date().toISOString(),
    };
    const nextPrompts = [newPrompt, ...prompts];

    await commitChanges(
      context.env,
      [
        {
          path: imagePath.replace(/^\//, "public/"),
          bytes: imageBytes,
        },
        {
          path: "data/prompts.json",
          content: promptsJson(nextPrompts),
        },
      ],
      `Add prompt: ${fields.title}`,
    );

    return json({ prompt: newPrompt, prompts: nextPrompts }, { status: 201 });
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
    return errorResponse("Could not publish the prompt.", 500);
  }
};
