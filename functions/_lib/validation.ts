import { z } from "zod";
import type { Prompt } from "../../src/types/prompt";

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(256),
});

export const promptFieldsSchema = z.object({
  title: z.string().trim().min(3).max(120),
  prompt: z.string().trim().min(10).max(20_000),
});

export const promptsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(120),
    slug: z.string().min(1).max(160),
    image: z.string().startsWith("/images/"),
    prompt: z.string().min(1).max(20_000),
    createdAt: z.string().datetime(),
  }),
);

export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

  return slug || "prompt";
}

export function uniqueSlug(
  title: string,
  prompts: Prompt[],
  excludeId?: string,
): string {
  const base = slugify(title);
  const used = new Set(
    prompts
      .filter((prompt) => prompt.id !== excludeId)
      .map((prompt) => prompt.slug),
  );

  if (!used.has(base)) {
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16)
  );
}

function getWebpDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkType = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const chunkSize = view.getUint32(offset + 4, true);
    const payload = offset + 8;

    if (chunkType === "VP8X" && payload + 10 <= bytes.length) {
      return {
        width: 1 + readUint24LE(bytes, payload + 4),
        height: 1 + readUint24LE(bytes, payload + 7),
      };
    }

    if (
      chunkType === "VP8 " &&
      payload + 10 <= bytes.length &&
      bytes[payload + 3] === 0x9d &&
      bytes[payload + 4] === 0x01 &&
      bytes[payload + 5] === 0x2a
    ) {
      return {
        width: (bytes[payload + 6] | (bytes[payload + 7] << 8)) & 0x3fff,
        height: (bytes[payload + 8] | (bytes[payload + 9] << 8)) & 0x3fff,
      };
    }

    if (
      chunkType === "VP8L" &&
      payload + 5 <= bytes.length &&
      bytes[payload] === 0x2f
    ) {
      const bits =
        bytes[payload + 1] |
        (bytes[payload + 2] << 8) |
        (bytes[payload + 3] << 16) |
        (bytes[payload + 4] << 24);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    offset = payload + chunkSize + (chunkSize % 2);
  }

  return null;
}

export async function validateWebpImage(file: File): Promise<ArrayBuffer> {
  const maxSize = 3 * 1024 * 1024;

  if (file.size < 20 || file.size > maxSize) {
    throw new InputValidationError(
      "The optimized image must be between 20 bytes and 3 MB.",
    );
  }

  const allowedTypes = [
    "image/webp",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new InputValidationError(
      "Only WEBP, JPG, JPEG and PNG images are allowed.",
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}