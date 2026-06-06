import type { Env } from "./types";

const COOKIE_NAME = "social_bil_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

interface SessionPayload {
  sub: string;
  exp: number;
  nonce: string;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSigningKey(secret),
    new TextEncoder().encode(value),
  );
  let binary = "";
  for (const byte of new Uint8Array(signature)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

interface RequestWithHeaders {
  headers: {
    get(name: string): string | null;
  };
}

function parseCookies(request: RequestWithHeaders): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return [
          decodeURIComponent(part.slice(0, separator)),
          decodeURIComponent(part.slice(separator + 1)),
        ];
      }),
  );
}

export function credentialsMatch(
  supplied: string,
  expected: string,
): boolean {
  const suppliedBytes = new TextEncoder().encode(supplied);
  const expectedBytes = new TextEncoder().encode(expected);
  const length = Math.max(suppliedBytes.length, expectedBytes.length);
  let mismatch = suppliedBytes.length ^ expectedBytes.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |=
      (suppliedBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }

  return mismatch === 0;
}

export async function createSessionCookie(
  username: string,
  secret: string,
  secure: boolean,
): Promise<string> {
  const payload: SessionPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);

  return [
    `${COOKIE_NAME}=${encodedPayload}.${signature}`,
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function getSession(
  request: RequestWithHeaders,
  env: Env,
): Promise<SessionPayload | null> {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return null;
  }

  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) {
    return null;
  }

  const separator = token.lastIndexOf(".");
  if (separator < 1) {
    return null;
  }

  const encodedPayload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expectedSignature = await sign(encodedPayload, env.SESSION_SECRET);

  if (!credentialsMatch(suppliedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as SessionPayload;

    if (
      payload.sub !== env.ADMIN_USERNAME ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
