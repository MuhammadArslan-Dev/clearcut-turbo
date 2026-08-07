// Helpers for rendering downloadable attachments: a coarse "kind" (drives
// which icon/color to show) and a human-readable file size.

export type FileKind = "pdf" | "spreadsheet" | "image" | "archive" | "doc" | "file";

const EXT_KIND: Record<string, FileKind> = {
  pdf: "pdf",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  doc: "doc",
  docx: "doc",
};

function extensionOf(filename?: string): string {
  if (!filename) return "";
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

export function fileKindOf(mimeType?: string, filename?: string): FileKind {
  const ext = extensionOf(filename);
  if (ext && EXT_KIND[ext]) return EXT_KIND[ext];

  if (mimeType) {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("image/")) return "image";
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType === "text/csv"
    )
      return "spreadsheet";
    if (mimeType.includes("word")) return "doc";
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";
  }
  return "file";
}

export function fileExtensionLabel(filename?: string): string {
  return extensionOf(filename).toUpperCase();
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const precision = i === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[i]}`;
}
