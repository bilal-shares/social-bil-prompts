import { getSession } from "../../_lib/auth";
import { json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const session = await getSession(context.request, context.env);
  return json(
    { authenticated: Boolean(session) },
    { status: session ? 200 : 401 },
  );
};
