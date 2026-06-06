import { createSessionCookie, credentialsMatch } from "../../_lib/auth";
import {
  assertSameOrigin,
  errorResponse,
  hasJsonContentType,
  json,
} from "../../_lib/http";
import type { Env } from "../../_lib/types";
import { loginSchema } from "../../_lib/validation";

interface Attempt {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, Attempt>();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!assertSameOrigin(context.request)) {
    return errorResponse("Invalid request origin.", 403);
  }

  if (!hasJsonContentType(context.request)) {
    return errorResponse("Expected a JSON request.", 415);
  }

  if (
    !context.env.ADMIN_USERNAME ||
    !context.env.ADMIN_PASSWORD ||
    !context.env.SESSION_SECRET ||
    context.env.SESSION_SECRET.length < 32
  ) {
    return errorResponse("Admin authentication is not configured.", 503);
  }

  const ip = context.request.headers.get("CF-Connecting-IP") ?? "unknown";
  const now = Date.now();
  const current = attempts.get(ip);

  if (current && current.resetAt > now && current.count >= 5) {
    return errorResponse(
      "Too many login attempts. Please try again in 15 minutes.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse("The request body is invalid.");
  }

  const result = loginSchema.safeParse(body);
  const valid =
    result.success &&
    credentialsMatch(result.data.username, context.env.ADMIN_USERNAME) &&
    credentialsMatch(result.data.password, context.env.ADMIN_PASSWORD);

  if (!valid) {
    attempts.set(ip, {
      count: current && current.resetAt > now ? current.count + 1 : 1,
      resetAt: current && current.resetAt > now ? current.resetAt : now + 900_000,
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    return errorResponse("Invalid username or password.", 401);
  }

  attempts.delete(ip);
  const cookie = await createSessionCookie(
    context.env.ADMIN_USERNAME,
    context.env.SESSION_SECRET,
    new URL(context.request.url).protocol === "https:",
  );

  return json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": cookie,
      },
    },
  );
};
