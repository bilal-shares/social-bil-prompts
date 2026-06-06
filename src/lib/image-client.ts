const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024;
const MAX_DIMENSION = 2000;

export interface ProcessedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("This browser could not create a WEBP image."));
        }
      },
      "image/webp",
      quality,
    );
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, JPEG, PNG, or WEBP image.");
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("The original image must be smaller than 20 MB.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const initialScale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  let width = Math.max(1, Math.round(bitmap.width * initialScale));
  let height = Math.max(1, Math.round(bitmap.height * initialScale));
  let quality = 0.84;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      bitmap.close();
      throw new Error("Image processing is not available in this browser.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    blob = await canvasToBlob(canvas, quality);

    if (blob.size <= MAX_OUTPUT_SIZE) {
      break;
    }

    quality = Math.max(0.62, quality - 0.07);
    width = Math.round(width * 0.88);
    height = Math.round(height * 0.88);
  }

  bitmap.close();

  if (!blob || blob.size > MAX_OUTPUT_SIZE) {
    throw new Error("The optimized image is still too large to upload.");
  }

  const baseName =
    file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-") ||
    "prompt-image";
  const processedFile = new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    file: processedFile,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    originalBytes: file.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
