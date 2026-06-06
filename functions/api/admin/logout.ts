import { clearSessionCookie } from "../../_lib/auth";
import { assertSameOrigin, errorResponse, json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!assertSameOrigin(context.request)) {
    return errorResponse("Invalid request origin.", 403);
  }

  return json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(
          new URL(context.request.url).protocol === "https:",
        ),
      },
    },
  );
};
