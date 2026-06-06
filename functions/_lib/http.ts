const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

export function methodNotAllowed(): Response {
  return errorResponse("Method not allowed.", 405);
}

export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function hasJsonContentType(request: Request): boolean {
  return request.headers
    .get("Content-Type")
    ?.toLowerCase()
    .startsWith("application/json") ?? false;
}

export function hasFormContentType(request: Request): boolean {
  return request.headers
    .get("Content-Type")
    ?.toLowerCase()
    .startsWith("multipart/form-data") ?? false;
}
