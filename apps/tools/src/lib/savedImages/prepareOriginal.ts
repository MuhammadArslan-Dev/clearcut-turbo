// CC-174: the original that is stored on the account. Re-encoded in the browser through a canvas,
// which drops EXIF (GPS location, camera serial) and caps the size, so the server never receives
// more than it needs to build any exam's file. Signatures keep PNG (transparent background).
import { scaledSize, type CropRect } from "./logic";
import type { SavedImageKind } from "./api";

export type { CropRect };

const MAX_BYTES = 7.5 * 1024 * 1024; // the backend accepts 8 MB

function loadBitmap(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode the image"))), type, quality),
  );
}

export async function prepareOriginal(file: Blob, kind: SavedImageKind): Promise<Blob> {
  const img = await loadBitmap(file);
  const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  const png = kind === "signature" && file.type === "image/png";
  if (!png) {
    ctx.fillStyle = "white"; // a transparent PNG photo must not turn black as JPEG
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  if (png) {
    const blob = await toBlob(canvas, "image/png");
    if (blob.size <= MAX_BYTES) return blob;
  }
  for (const q of [0.92, 0.85, 0.75]) {
    const blob = await toBlob(canvas, "image/jpeg", q);
    if (blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("Image too large to save");
}
