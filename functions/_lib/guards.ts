import { getSession } from "./auth";
import { errorResponse } from "./http";
import type { Env } from "./types";

export async function requireAdmin(
  request: { headers: { get(name: string): string | null } },
  env: Env,
): Promise<Response | null> {
  const session = await getSession(request, env);
  return session ? null : errorResponse("Authentication required.", 401);
}
