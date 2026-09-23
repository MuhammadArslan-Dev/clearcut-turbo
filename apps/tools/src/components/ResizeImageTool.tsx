"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";
import { getDict, Locale } from "@/lib/dictionary";

export type PresetKey = "photo" | "signature" | "custom" | "draw" | "thumb";

interface Preset {
  label: string;
  sublabel: string;
  width: number;
  height: number;
  minKB: number;
  maxKB: number;
}

export interface ImageSpec {
  widthPx: number;
  heightPx: number;
  minKB: number;
  maxKB: number;
}

const DEFAULT_PHOTO_SPEC: ImageSpec = { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 };
const DEFAULT_SIGNATURE_SPEC: ImageSpec = { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 };
// resizerExams.ts has no per-exam Left Thumb Impression figures (no exam in
// that dataset specifies one) — IBPS/SBI's own published LTI spec is the
// closest widely-cited real-world figure, used as a generic default the same
// way DEFAULT_PHOTO_SPEC/DEFAULT_SIGNATURE_SPEC are generic defaults.
const DEFAULT_THUMB_SPEC: ImageSpec = { widthPx: 200, heightPx: 200, minKB: 10, maxKB: 20 };

// Purely an input convenience for the Custom preset's optional cm entry —
// exam specs themselves are always defined in px. 300 DPI is the print-
// quality assumption most passport-photo guidance uses; there's no "correct"
// value since exam portals never publish a cm spec, only px.
const ASSUMED_DPI = 300;
const PX_PER_CM = ASSUMED_DPI / 2.54;

// Every exam has its own photo/signature dimensions (resizerExams.ts) — this
// tool is shared by the generic hub page and every exam's spoke page, so its
// presets are built from whatever spec the caller passes in rather than a
// single hardcoded size. "Add Name" reuses the PHOTO spec (it's a photo with
// a name/date stamp burned in, not a signature), while "Signature" (draw/
// upload) reuses the SIGNATURE spec — matching the two real document types
// exam portals ask for. "Custom" always stays generic: it's explicitly the
// escape hatch for a size neither preset covers. "Left Thumb" is its own
// generic default since no per-exam data exists for it yet.
function buildPresets(
  locale: Locale,
  photoSpec: ImageSpec = DEFAULT_PHOTO_SPEC,
  signatureSpec: ImageSpec = DEFAULT_SIGNATURE_SPEC,
): Record<PresetKey, Preset> {
  const p = getDict(locale).presets;
  return {
    photo: {
      ...p.photo,
      width: photoSpec.widthPx,
      height: photoSpec.heightPx,
      minKB: photoSpec.minKB,
      maxKB: photoSpec.maxKB,
    },
    signature: {
      ...p.signature,
      width: photoSpec.widthPx,
      height: photoSpec.heightPx,
      minKB: photoSpec.minKB,
      maxKB: photoSpec.maxKB,
    },
    custom: { ...p.custom, width: 200, height: 200, minKB: 20, maxKB: 100 },
    draw: {
      ...p.draw,
      width: signatureSpec.widthPx,
      height: signatureSpec.heightPx,
      minKB: signatureSpec.minKB,
      maxKB: signatureSpec.maxKB,
    },
    thumb: {
      ...p.thumb,
      width: DEFAULT_THUMB_SPEC.widthPx,
      height: DEFAULT_THUMB_SPEC.heightPx,
      minKB: DEFAULT_THUMB_SPEC.minKB,
      maxKB: DEFAULT_THUMB_SPEC.maxKB,
    },
  };
}

const MAX_UPLOAD_MB = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

function isHeicFile(f: File): boolean {
  return (
    f.type === "image/heic" ||
    f.type === "image/heif" ||
    HEIC_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
  );
}

// Resizing a small photo/signature is near-instant on canvas — without a
// floor, the "processing" state would flash for a frame or two and the
// result would just pop in. Padding it to a perceptible minimum (and
// stepping through a few status lines during that window) makes the tool
// feel like it's actually doing work instead of jarring the user.
const MIN_PROCESSING_MS = 1400;
function getProcessingStatusMessages(locale: Locale): string[] {
  const t = getDict(locale).tool;
  return [t.statusAnalyzing, t.statusResizing, t.statusCompressing];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Step = "configure" | "adjust" | "processing" | "result";

interface ResultData {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

// Just the crop rect — brightness/contrast/cleanup live in the parent
// (ResizeImageTool) now, not here, so Column 1's sliders and the AdjustStep
// preview always show the same values instead of two copies drifting.
interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

function loadImage(src: string, errorMessage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(errorMessage));
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// Shared between the adjust screen (to size the crop frame correctly) and
// the final render (to know how much height the stamp strip eats into) — if
// these ever disagree, the crop preview stops matching the actual output.
function getStampStripHeight(height: number): number {
  // Two stacked lines (name, then date) need more headroom than the single
  // combined line this used to reserve for.
  return Math.max(26, Math.round(height * 0.22));
}

// `<input type="date">` always gives an ISO yyyy-mm-dd value regardless of
// the browser's display locale — exam portals want DD/MM/YYYY on the photo
// itself (matching the reference site's output), so this reformats rather
// than trusting whatever the input happened to display while typing.
function formatDateDDMMYYYY(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

// Government exam requirements (SSC/UPSC/NEET etc.) print the candidate's
// name and a date on ONE line at the bottom of the signature — centered as
// a group, bold and plain.
function drawNameDateStamp(
  ctx: CanvasRenderingContext2D,
  name: string,
  isoDate: string,
  width: number,
  height: number,
) {
  const rootStyle = getComputedStyle(document.documentElement);
  const textColor = rootStyle.getPropertyValue("--color-text-gray-normal").trim() || "black";

  const nameText = name ? name.toUpperCase() : "";
  const dateText = isoDate ? formatDateDDMMYYYY(isoDate) : "";
  // Name above date, each its own centered line — not side-by-side on one
  // line, which is what this used to do and reads awkwardly for anything
  // but very short names.
  const lines = [nameText, dateText].filter(Boolean);
  if (lines.length === 0) return;

  const stripHeight = ctx.canvas.height - height;
  const padding = width * 0.06;
  const availableWidth = width - padding * 2;
  const rowHeight = stripHeight / lines.length;

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  lines.forEach((line, i) => {
    let fontSize = Math.max(8, Math.round(rowHeight * 0.55));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const lineWidth = ctx.measureText(line).width;
    if (lineWidth > availableWidth) {
      fontSize = Math.max(7, Math.floor(fontSize * (availableWidth / lineWidth)));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }
    const y = height + rowHeight * i + rowHeight / 2;
    ctx.fillText(line, width / 2, y);
  });
}

// Whitens the page background and darkens ink relative to a threshold —
// approximates the adaptive thresholding real signature-cleanup tools use to
// remove scanned-paper shadows and strengthen faint strokes. `amount` (the
// Signature Clean Up slider, 0-100) raises the threshold, so higher values
// treat more of the midtones as "background" and clear them to white.
function applySignatureCleanup(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const threshold = 150 + amount;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (luminance >= threshold) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    } else {
      const darken = Math.max(0.15, luminance / threshold);
      data[i] *= darken;
      data[i + 1] *= darken;
      data[i + 2] *= darken;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

async function resizeAndCompress(
  file: File,
  width: number,
  height: number,
  maxKB: number,
  crop: { sx: number; sy: number; sw: number; sh: number },
  adjust: { brightness: number; contrast: number; cleanup: number },
  messages: { readError: string; processError: string },
  stampName?: string,
  stampDate?: string,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl, messages.readError);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(messages.processError);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const trimmedName = stampName?.trim();
    const hasStamp = Boolean(trimmedName || stampDate);
    const imageAreaHeight = hasStamp ? height - getStampStripHeight(height) : height;

    ctx.filter = `brightness(${100 + adjust.brightness}%) contrast(${100 + adjust.contrast}%)`;
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, imageAreaHeight);
    ctx.filter = "none";

    applySignatureCleanup(ctx, width, imageAreaHeight, adjust.cleanup);

    if (hasStamp) {
      drawNameDateStamp(ctx, trimmedName ?? "", stampDate ?? "", width, imageAreaHeight);
    }

    let quality = 0.92;
    let blob = await canvasToJpegBlob(canvas, quality);
    let attempts = 0;

    while (blob && blob.size / 1024 > maxKB && quality > 0.1 && attempts < 15) {
      quality -= 0.06;
      blob = await canvasToJpegBlob(canvas, quality);
      attempts++;
    }

    if (!blob) throw new Error(messages.processError);
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function PhotoTypeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function NameTagTypeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 11.5h4M7 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="10.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function CropTypeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignatureTypeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 4l5 5-9.5 9.5H5.5V14L15 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3 20h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ThumbTypeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13.5a7 7 0 0 1 14 0c0 2.6-.8 4.7-2.1 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 13.5a4 4 0 0 1 8 0c0 2.1-.6 3.7-1.6 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 12.5a2 2 0 0 0-2 2c0 3-1 5.2-2.6 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Icons are keyed by PresetKey rather than folded into buildPresets(), since
// they're static (never vary by exam spec) while Preset's other fields do.
const PRESET_ICONS: Record<PresetKey, React.ReactNode> = {
  photo: <PhotoTypeIcon />,
  signature: <NameTagTypeIcon />,
  custom: <CropTypeIcon />,
  draw: <SignatureTypeIcon />,
  thumb: <ThumbTypeIcon />,
};

// No existing @clearcut/ui component covers a selectable icon+label+sublabel
// tile (Chip has no selected/interactive state, Button isn't a 3-part
// vertical layout) — built locally rather than inventing one in the shared
// package for a single call site.
function PresetTile({
  active,
  icon,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-colors ${
        active
          ? "border-brand bg-brand/5"
          : "border-[var(--color-border-gray-subtle)] hover:border-brand/40"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center ${
          active ? "bg-brand/15 text-brand" : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted"
        }`}
      >
        {icon}
      </div>
      <span className={`body-medium !font-semibold ${active ? "text-brand" : "text-text-gray-normal"}`}>
        {label}
      </span>
      <span className="body-small text-text-gray-muted">{sublabel}</span>
    </button>
  );
}

// Mouse-and-touch signature pad. Pointer Events cover both input types with
// one set of handlers, unlike separate mouse/touch listeners. The canvas's
// internal resolution is fixed and higher than its displayed CSS size so
// strokes stay crisp regardless of how the box is laid out; getPoint()
// converts a client coordinate into that internal space via the element's
// actual rendered size.
function SignaturePad({ locale, onUse }: { locale: Locale; onUse: (blob: Blob) => void }) {
  const t = getDict(locale).tool;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const from = lastPointRef.current;
    if (!ctx || !from) return;

    const to = getPoint(e);
    const strokeColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-text-gray-normal")
      .trim() || "black";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    lastPointRef.current = to;
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleUse = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onUse(blob);
    }, "image/png");
  };

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-[220px]">
      <div className="relative flex-1 min-h-[180px]">
        <canvas
          ref={canvasRef}
          width={500}
          height={220}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-full rounded-xl border-2 border-dashed border-[var(--color-border-gray-subtle)] bg-white touch-none cursor-crosshair"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Text as="p" variant="body-medium" color="gray-muted">
              {t.signHere}
            </Text>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outlined" color="gray" fullWidth sx={{ borderRadius: "50px" }} onClick={handleClear}>
          {t.clear}
        </Button>
        <Button fullWidth sx={{ borderRadius: "50px" }} disabled={isEmpty} onClick={handleUse}>
          {t.useThisSignature}
        </Button>
      </div>
    </div>
  );
}

function PersonGuideIcon() {
  // The generic "person" placeholder glyph (head circle + shoulders arc) —
  // not a face-detection outline, just a positioning reference so a
  // candidate can see at a glance whether their head/shoulders roughly fill
  // the frame the way exam portals expect.
  return (
    <svg viewBox="0 0 200 200" className="w-[60%] h-[60%]" fill="none">
      <circle cx="100" cy="80" r="42" stroke="white" strokeOpacity="0.9" strokeWidth="2.5" strokeDasharray="6 5" />
      <path
        d="M30 178c0-42 31-70 70-70s70 28 70 70"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="2.5"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SelectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type HandleCorner = "tl" | "tr" | "bl" | "br";

const ADJUST_CANVAS_MAX = 320;
const MIN_SELECTION_PX = 24;

// The largest centered box at the target aspect ratio that still fits
// inside the displayed image — the default crop, and what "Reset" restores.
function defaultSelection(dispW: number, dispH: number, aspect: number): SelectionBox {
  let w = dispW;
  let h = w / aspect;
  if (h > dispH) {
    h = dispH;
    w = h * aspect;
  }
  return { x: (dispW - w) / 2, y: (dispH - h) / 2, w, h };
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shows the WHOLE photo on a fixed dark canvas — not a cropped/zoomed
// preview — with a resizable, draggable selection box (corner handles,
// aspect-locked to the target document size) marking what gets kept. This
// mirrors how every real photo-crop tool works: you can always see what's
// about to be cropped away, not just what's currently inside the frame.
function AdjustStep({
  locale,
  imageUrl,
  targetWidth,
  targetHeight,
  showFaceGuide,
  brightness,
  contrast,
  onCancel,
  onApply,
}: {
  locale: Locale;
  imageUrl: string;
  targetWidth: number;
  targetHeight: number;
  showFaceGuide: boolean;
  brightness: number;
  contrast: number;
  onCancel: () => void;
  onApply: (crop: CropRect) => void;
}) {
  const t = getDict(locale).tool;
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const dragRef = useRef<
    | { mode: "move"; startX: number; startY: number; startBox: SelectionBox }
    | { mode: "resize"; corner: HandleCorner; anchorX: number; anchorY: number }
    | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspect = targetWidth / targetHeight;

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // Resets to the default centered box whenever a new image loads or the
  // target aspect ratio changes (e.g. toggling the name/date stamp).
  useEffect(() => {
    if (!naturalSize) return;
    const imgAspect = naturalSize.w / naturalSize.h;
    const dispW = imgAspect >= 1 ? ADJUST_CANVAS_MAX : ADJUST_CANVAS_MAX * imgAspect;
    const dispH = imgAspect >= 1 ? ADJUST_CANVAS_MAX / imgAspect : ADJUST_CANVAS_MAX;
    setSelection(defaultSelection(dispW, dispH, aspect));
  }, [naturalSize, aspect]);

  if (!naturalSize || !selection) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[220px]">
        <Text as="p" variant="body-small" color="gray-muted">
          {t.loadingImage}
        </Text>
      </div>
    );
  }

  const imgAspect = naturalSize.w / naturalSize.h;
  const dispW = imgAspect >= 1 ? ADJUST_CANVAS_MAX : ADJUST_CANVAS_MAX * imgAspect;
  const dispH = imgAspect >= 1 ? ADJUST_CANVAS_MAX / imgAspect : ADJUST_CANVAS_MAX;
  const dispScale = dispW / naturalSize.w;

  const clampBoxPosition = (box: SelectionBox): SelectionBox => ({
    ...box,
    x: Math.min(Math.max(box.x, 0), dispW - box.w),
    y: Math.min(Math.max(box.y, 0), dispH - box.h),
  });

  const getLocalPoint = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleBoxPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mode: "move", startX: e.clientX, startY: e.clientY, startBox: selection };
  };

  const handleCornerPointerDown = (corner: HandleCorner) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const anchorX = corner === "tl" || corner === "bl" ? selection.x + selection.w : selection.x;
    const anchorY = corner === "tl" || corner === "tr" ? selection.y + selection.h : selection.y;
    dragRef.current = { mode: "resize", corner, anchorX, anchorY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === "move") {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setSelection(clampBoxPosition({ ...drag.startBox, x: drag.startBox.x + dx, y: drag.startBox.y + dy }));
      return;
    }

    // Corner resize, aspect-locked: the opposite corner is the fixed
    // anchor; the dragged corner follows the pointer, but width/height are
    // derived together (never independently) so the box never distorts.
    const point = getLocalPoint(e);
    const { anchorX, anchorY } = drag;
    const sx = point.x >= anchorX ? 1 : -1;
    const sy = point.y >= anchorY ? 1 : -1;
    const rawW = Math.abs(point.x - anchorX);
    const rawH = Math.abs(point.y - anchorY);
    const driveW = Math.max(rawW, rawH * aspect);

    const maxWByWidth = sx === 1 ? dispW - anchorX : anchorX;
    const maxWByHeight = (sy === 1 ? dispH - anchorY : anchorY) * aspect;
    const maxW = Math.max(MIN_SELECTION_PX, Math.min(maxWByWidth, maxWByHeight));

    const w = Math.min(Math.max(driveW, MIN_SELECTION_PX), maxW);
    const h = w / aspect;
    const x = sx === 1 ? anchorX : anchorX - w;
    const y = sy === 1 ? anchorY : anchorY - h;
    setSelection({ x, y, w, h });
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const handleReset = () => setSelection(defaultSelection(dispW, dispH, aspect));

  const handleApply = () => {
    onApply({
      sx: selection.x / dispScale,
      sy: selection.y / dispScale,
      sw: selection.w / dispScale,
      sh: selection.h / dispScale,
    });
  };

  const handlePositions: { corner: HandleCorner; style: React.CSSProperties }[] = [
    { corner: "tl", style: { left: 0, top: 0 } },
    { corner: "tr", style: { right: 0, top: 0 } },
    { corner: "bl", style: { left: 0, bottom: 0 } },
    { corner: "br", style: { right: 0, bottom: 0 } },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        className="relative mx-auto overflow-hidden rounded-lg bg-[var(--color-gray-stronger)] touch-none"
        style={{ width: dispW, height: dispH }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Your photo"
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
          style={{ filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%)` }}
        />

        {/* Darkens everything outside the selection box — four plain bands
            rather than a clip-path hole, so there's no reliance on
            clip-path's less-obvious multi-subpath/fill-rule behavior. */}
        <div
          className="absolute pointer-events-none bg-black/45"
          style={{ left: 0, top: 0, width: dispW, height: selection.y }}
        />
        <div
          className="absolute pointer-events-none bg-black/45"
          style={{ left: 0, top: selection.y + selection.h, width: dispW, height: dispH - selection.y - selection.h }}
        />
        <div
          className="absolute pointer-events-none bg-black/45"
          style={{ left: 0, top: selection.y, width: selection.x, height: selection.h }}
        />
        <div
          className="absolute pointer-events-none bg-black/45"
          style={{
            left: selection.x + selection.w,
            top: selection.y,
            width: dispW - selection.x - selection.w,
            height: selection.h,
          }}
        />

        <div
          onPointerDown={handleBoxPointerDown}
          className="absolute border-2 border-brand cursor-move"
          style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
        >
          {showFaceGuide && (
            // A positioning guide, not automated detection — this tool has
            // no face-detection model. Marks roughly where a head/shoulders
            // should sit, which is what exam portals mean by proper "face
            // coverage": resize/drag the box until it fills the outline.
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10">
              <PersonGuideIcon />
            </div>
          )}
          {handlePositions.map(({ corner, style }) => (
            <div
              key={corner}
              onPointerDown={handleCornerPointerDown(corner)}
              className="absolute w-4 h-4 -m-2 rounded-full bg-white border-2 border-brand cursor-nwse-resize touch-none"
              style={style}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between -mt-2">
        <Text as="p" variant="body-small" color="gray-muted">
          {t.dragToReposition}
        </Text>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-text-gray-muted hover:text-brand transition-colors"
        >
          <ResetIcon /> {t.reset}
        </button>
      </div>

      <div className="flex gap-2 mt-auto">
        <Button variant="outlined" color="gray" fullWidth sx={{ borderRadius: "50px" }} onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button fullWidth sx={{ borderRadius: "50px" }} onClick={handleApply}>
          {t.applyOptimize}
        </Button>
      </div>
    </div>
  );
}

// No "custom" here — the Custom Size tool was removed to match the
// reference site, which has no equivalent. Left as a valid PresetKey/preset
// definition (unused, unreachable) rather than ripped out of buildPresets/
// isEditablePreset/downloadFilename, since nothing else in this file
// branches on its absence.
const ALL_PRESET_KEYS: PresetKey[] = ["photo", "signature", "draw", "thumb"];

interface ResizeImageToolProps {
  photoSpec?: ImageSpec;
  signatureSpec?: ImageSpec;
  /** Which preset tile is active on first render — lets a dedicated tool page (e.g. "/signature-compressor") open straight into the relevant mode instead of always defaulting to Photo. */
  defaultPreset?: PresetKey;
  /** Restricts which document-type tiles render — e.g. an exam spoke page only lists Photo + Signature, since that's the only pair resizerExams.ts actually has verified specs for. Defaults to every preset (the general hub page). */
  allowedPresets?: PresetKey[];
  /** Hides the "Document type" tile grid entirely — the Add Name & Date page is its own dedicated single-purpose form in the reference, not a mode picked from a tile grid. Defaults to shown. */
  showPresetPicker?: boolean;
  locale?: Locale;
}

export default function ResizeImageTool({
  photoSpec,
  signatureSpec,
  defaultPreset = "photo",
  allowedPresets = ALL_PRESET_KEYS,
  showPresetPicker = true,
  locale = "en",
}: ResizeImageToolProps) {
  const t = getDict(locale).tool;
  const PRESETS = buildPresets(locale, photoSpec, signatureSpec);
  const visiblePresetEntries = (Object.entries(PRESETS) as [PresetKey, Preset][]).filter(([key]) =>
    allowedPresets.includes(key),
  );
  const processingStatusMessages = getProcessingStatusMessages(locale);

  const [preset, setPreset] = useState<PresetKey>(defaultPreset);
  const [width, setWidth] = useState(PRESETS[defaultPreset].width);
  const [height, setHeight] = useState(PRESETS[defaultPreset].height);
  const [minKB, setMinKB] = useState(PRESETS[defaultPreset].minKB);
  const [maxKB, setMaxKB] = useState(PRESETS[defaultPreset].maxKB);
  const [unit, setUnit] = useState<"px" | "cm">("px");
  const [stampName, setStampName] = useState("");
  const [stampDate, setStampDate] = useState("");
  const [includeDate, setIncludeDate] = useState(false);
  // "Add Name & Date" only (preset === "signature") — off by default, matching
  // the reference tool: keep the photo at its original uploaded dimensions
  // and skip the crop step entirely, rather than forcing it into a fixed
  // size the way every other preset does.
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");

  // Live on Column 1 (not inside the crop screen) so they're visible — and
  // adjustable — the moment an image is selected, matching the reference
  // tool's layout: the crop preview is purely visual, the actual controls
  // sit with the rest of the configuration.
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [cleanup, setCleanup] = useState(60);

  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("configure");
  const [result, setResult] = useState<ResultData | null>(null);
  const [lastCrop, setLastCrop] = useState<CropRect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycles the status line through the messages below while processing —
  // paced against MIN_PROCESSING_MS so the last message lands near the end
  // of the guaranteed-minimum window rather than racing ahead of it.
  useEffect(() => {
    if (step !== "processing") {
      setStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, processingStatusMessages.length - 1));
    }, MIN_PROCESSING_MS / processingStatusMessages.length);
    return () => clearInterval(interval);
  }, [step]);

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setWidth(PRESETS[key].width);
    setHeight(PRESETS[key].height);
    setMinKB(PRESETS[key].minKB);
    setMaxKB(PRESETS[key].maxKB);
    setUnit("px");
    setBrightness(0);
    setContrast(0);
    setCleanup(60);
    if (key !== "signature") {
      setStampName("");
      setStampDate("");
      setIncludeDate(false);
      setResizeEnabled(false);
    }
    if (key === "draw") setSignatureMode("draw");
  };

  const runCompress = useCallback(
    // `dims` overrides width/height for this one call without waiting on a
    // state update to flush first — used by the Add Name & Date "keep
    // original dimensions" path, which learns the real size (the uploaded
    // photo's own) only moments before it needs to compress with it.
    async (targetFile: File, crop: CropRect, dims?: { width: number; height: number }) => {
      const outWidth = dims?.width ?? width;
      const outHeight = dims?.height ?? height;
      setStep("processing");
      setError(null);
      try {
        const [blob] = await Promise.all([
          resizeAndCompress(
            targetFile,
            outWidth,
            outHeight,
            maxKB,
            crop,
            { brightness, contrast, cleanup: preset === "draw" ? cleanup : 0 },
            { readError: t.errorReadImage, processError: t.errorProcessImage },
            preset === "signature" ? stampName : undefined,
            preset === "signature" && includeDate ? stampDate : undefined,
          ),
          delay(MIN_PROCESSING_MS),
        ]);
        setResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: URL.createObjectURL(blob), blob, width: outWidth, height: outHeight };
        });
        setStep("result");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorGeneric);
        setStep("configure");
      }
    },
    [width, height, maxKB, preset, stampName, stampDate, includeDate, brightness, contrast, cleanup, t],
  );

  const selectFile = useCallback(
    async (selected: File) => {
      setError(null);
      let workingFile = selected;

      if (isHeicFile(selected)) {
        try {
          const heic2any = (await import("heic2any")).default;
          const converted = await heic2any({ blob: selected, toType: "image/jpeg", quality: 0.92 });
          const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
          workingFile = new File([convertedBlob], selected.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: "image/jpeg",
          });
        } catch {
          setError(t.errorHeic);
          return;
        }
      } else if (!ACCEPTED_TYPES.includes(selected.type)) {
        setError(t.errorFileType);
        return;
      }

      if (workingFile.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(t.errorFileSize(MAX_UPLOAD_MB));
        return;
      }

      // Add Name & Date with "Resize Settings" off: no target dimensions to
      // validate or crop to — the photo keeps whatever size it already is.
      const skipCrop = preset === "signature" && !resizeEnabled;

      if (!skipCrop && (width < 1 || height < 1 || maxKB < 1)) {
        setError(t.errorInvalidValues);
        return;
      }

      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      setFile(workingFile);
      const previewUrl = URL.createObjectURL(workingFile);
      setOriginalPreviewUrl(previewUrl);
      setBrightness(0);
      setContrast(0);
      setCleanup(60);

      if (skipCrop) {
        try {
          const img = await loadImage(previewUrl, t.errorReadImage);
          const dims = { width: img.naturalWidth, height: img.naturalHeight };
          const crop: CropRect = { sx: 0, sy: 0, sw: dims.width, sh: dims.height };
          setWidth(dims.width);
          setHeight(dims.height);
          setLastCrop(crop);
          await runCompress(workingFile, crop, dims);
        } catch (err) {
          setError(err instanceof Error ? err.message : t.errorReadImage);
          setStep("configure");
        }
        return;
      }

      setLastCrop(null);
      setStep("adjust");
    },
    [width, height, maxKB, originalPreviewUrl, preset, resizeEnabled, t, runCompress],
  );

  const handleAdjustApply = (crop: CropRect) => {
    if (!file) return;
    setLastCrop(crop);
    runCompress(file, crop);
  };

  const handleAdjustCancel = () => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    setFile(null);
    setOriginalPreviewUrl(null);
    setStep("configure");
  };

  // Editing the name/date, or dragging Brightness/Contrast/Signature Clean
  // Up, after an image is already processed re-runs the SAME crop instead
  // of forcing the user back through "Process Another" + upload + re-crop.
  // Debounced so it reprocesses once the user pauses, not on every input.
  useEffect(() => {
    if (!file || !lastCrop || step === "configure" || step === "adjust") return;
    const timer = setTimeout(() => {
      runCompress(file, lastCrop);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stampName, stampDate, includeDate, brightness, contrast, cleanup]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  };

  const handleReset = () => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setOriginalPreviewUrl(null);
    setResult(null);
    setLastCrop(null);
    setError(null);
    setStep("configure");
  };

  // Matches the reference tool's "auto-renamed for error-free portal
  // upload" behavior — a browser's default download name (often something
  // like "IMG_20260212_scan (3).jpg") is exactly the kind of filename an
  // exam portal's upload validator tends to choke on.
  const downloadFilename =
    { photo: "photo", signature: "photo-with-name", custom: "custom", draw: "signature", thumb: "thumb-impression" }[
      preset
    ] + ".jpg";

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard API can be blocked (permissions, non-secure context) — a
      // failed copy isn't worth surfacing an error dialog for.
    }
  };

  const originalSizeKB = file ? Math.round(file.size / 1024) : 0;
  const resultSizeKB = result ? Math.round(result.blob.size / 1024) : 0;
  // Add Name & Date has no Min/Max KB fields to be "outside the range" of —
  // there's nothing on screen for that warning to point the user back to.
  const withinTarget = result ? (preset === "signature" || (resultSizeKB <= maxKB && resultSizeKB >= minKB)) : false;

  // "signature" (Add Name & Date) has its own bespoke Column 1 layout below
  // instead of the shared editable-fields block custom/draw use.
  const isEditablePreset = preset === "custom" || preset === "draw";
  const hasStamp = preset === "signature" && Boolean(stampName.trim() || (includeDate && stampDate));
  const cropTargetHeight = hasStamp ? height - getStampStripHeight(height) : height;

  const widthDisplay = unit === "cm" ? Math.round((width / PX_PER_CM) * 100) / 100 : width;
  const heightDisplay = unit === "cm" ? Math.round((height / PX_PER_CM) * 100) / 100 : height;
  const handleWidthChange = (value: number) => setWidth(unit === "cm" ? Math.round(value * PX_PER_CM) : Math.round(value));
  const handleHeightChange = (value: number) => setHeight(unit === "cm" ? Math.round(value * PX_PER_CM) : Math.round(value));

  return (
    <div className="w-full max-w-[880px] mx-auto flex flex-col gap-4">
      <Card
        padding={0}
        borderRadius={16}
        bordercolor="var(--color-border-gray-subtle)"
        className="grid md:grid-cols-2"
      >
        {/* COLUMN 1: CONFIGURATION */}
        <div className="p-5 md:p-6 flex flex-col gap-4 md:border-r border-b md:border-b-0 border-[var(--color-border-gray-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
              1
            </div>
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {t.configuration}
            </Text>
          </div>

          {showPresetPicker && (
            <div className="space-y-1.5">
              <Text as="label" variant="body-small" weight="semibold" color="gray-muted">
                {t.documentType}
              </Text>
              <div className="grid grid-cols-2 gap-3">
                {visiblePresetEntries.map(([key, p]) => (
                  <PresetTile
                    key={key}
                    active={preset === key}
                    icon={PRESET_ICONS[key]}
                    label={p.label}
                    sublabel={p.sublabel}
                    onClick={() => applyPreset(key)}
                  />
                ))}
              </div>
            </div>
          )}

          {preset === "signature" && (
            <div className="rounded-xl border border-[var(--color-border-gray-subtle)] bg-brand/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckBadgeIcon />
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    {getDict(locale).modeTabs.addNameDate}
                  </Text>
                </div>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.nameOrDateRequired}
                </Text>
              </div>

              <div className="space-y-1.5">
                <Text as="label" variant="body-small" color="gray-muted">
                  {t.nameBlockLettersLabel}
                </Text>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-gray-muted pointer-events-none">
                    <PersonFieldIcon />
                  </span>
                  <input
                    type="text"
                    value={stampName}
                    onChange={(e) => setStampName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    maxLength={30}
                    style={{ textTransform: "uppercase" }}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white pl-9 pr-3 body-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.dateOfPhotoLabel}
                  </Text>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDate}
                      onChange={(e) => setIncludeDate(e.target.checked)}
                      className="accent-brand"
                    />
                    <Text as="span" variant="body-small" color="gray-muted">
                      {t.includeDateLabel}
                    </Text>
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-gray-muted pointer-events-none">
                    <CalendarFieldIcon />
                  </span>
                  <input
                    type="date"
                    value={stampDate}
                    onChange={(e) => setStampDate(e.target.value)}
                    disabled={!includeDate}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white pl-9 pr-3 body-medium disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {preset === "signature" && (
            <div className="rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ResizeSettingsIcon />
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    {t.resizeSettingsLabel}
                  </Text>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-[var(--color-gray-bg-soft)] text-text-gray-muted">
                    {t.optionalBadge}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={resizeEnabled}
                  onChange={(e) => setResizeEnabled(e.target.checked)}
                  className="accent-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.width("px")}
                  </Text>
                  <input
                    type="number"
                    value={width}
                    disabled={!resizeEnabled}
                    onChange={(e) => setWidth(Number(e.target.value) || 0)}
                    placeholder={t.width("px")}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.height("px")}
                  </Text>
                  <input
                    type="number"
                    value={height}
                    disabled={!resizeEnabled}
                    onChange={(e) => setHeight(Number(e.target.value) || 0)}
                    placeholder={t.height("px")}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium disabled:opacity-50"
                  />
                </div>
              </div>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.keepOriginalDimensionsHint}
              </Text>
            </div>
          )}

          {preset !== "signature" && (isEditablePreset ? (
            <div className="space-y-3">
              {preset === "custom" && (
                <div className="flex items-center gap-2">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.unit}
                  </Text>
                  <div className="flex rounded-full border border-[var(--color-border-gray-subtle)] p-0.5">
                    {(["px", "cm"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-3 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                          unit === u ? "bg-brand text-white" : "text-text-gray-muted"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.width(unit)}
                  </Text>
                  <input
                    type="number"
                    value={widthDisplay}
                    onChange={(e) => handleWidthChange(Number(e.target.value) || 0)}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.height(unit)}
                  </Text>
                  <input
                    type="number"
                    value={heightDisplay}
                    onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.minSizeKB}
                  </Text>
                  <input
                    type="number"
                    value={minKB}
                    onChange={(e) => setMinKB(Number(e.target.value) || 0)}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.maxSizeKB}
                  </Text>
                  <input
                    type="number"
                    value={maxKB}
                    onChange={(e) => setMaxKB(Number(e.target.value) || 0)}
                    className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${width}x${height}-${minKB}-${maxKB}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl border border-[var(--color-border-gray-subtle)] bg-brand/5 p-3 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <InfoIcon />
                  <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
                    {t.imageRequirements}
                  </Text>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-2 py-1.5">
                    <Text as="p" variant="body-small" color="gray-muted">
                      {t.dimensions}
                    </Text>
                    <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
                      {width}×{height}
                    </Text>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-2 py-1.5">
                    <Text as="p" variant="body-small" color="gray-muted">
                      {t.size}
                    </Text>
                    <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
                      {minKB}–{maxKB}KB
                    </Text>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-2 py-1.5">
                    <Text as="p" variant="body-small" color="gray-muted">
                      {t.format}
                    </Text>
                    <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
                      JPG
                    </Text>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}

          {(step === "adjust" || step === "result") && (
            <div className="space-y-3 rounded-xl border border-[var(--color-border-gray-subtle)] p-3">
              <Text
                as="p"
                variant="body-small"
                weight="semibold"
                color="gray-muted"
                className="uppercase tracking-wide"
              >
                {t.imageAdjustments}
              </Text>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.brightness}
                  </Text>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand/8 text-[var(--color-primary-strong)] font-semibold">
                    {brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Text as="label" variant="body-small" color="gray-muted">
                    {t.contrast}
                  </Text>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand/8 text-[var(--color-primary-strong)] font-semibold">
                    {contrast}
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>
              {preset === "draw" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Text as="label" variant="body-small" color="gray-muted">
                      {t.signatureCleanUp}
                    </Text>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-brand/8 text-[var(--color-primary-strong)] font-semibold">
                      {cleanup}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={cleanup}
                    onChange={(e) => setCleanup(Number(e.target.value))}
                    className="w-full accent-brand"
                  />
                  <Text as="p" variant="body-small" color="gray-muted">
                    {t.signatureCleanUpHint}
                  </Text>
                </div>
              )}
            </div>
          )}

          <div className="flex-1" />
          <hr className="border-[var(--color-border-gray-subtle)]" />
          <Text as="p" variant="body-small" color="gray-muted" className="italic">
            {t.privacyFirst}
          </Text>
        </div>

        {/* COLUMN 2: UPLOAD / ADJUST / RESULT */}
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </div>
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {step === "adjust" ? t.cropAdjust : step === "result" ? t.yourOptimizedImage : t.uploadProcess}
            </Text>
          </div>

          {step === "configure" && (
            <>
              {preset === "draw" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`flex-1 rounded-full px-4 py-1.5 body-small !font-semibold transition-colors ${
                      signatureMode === "draw"
                        ? "bg-brand text-white"
                        : "bg-brand/5 text-text-gray-normal hover:bg-brand/10"
                    }`}
                  >
                    {t.drawSignature}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("upload")}
                    className={`flex-1 rounded-full px-4 py-1.5 body-small !font-semibold transition-colors ${
                      signatureMode === "upload"
                        ? "bg-brand text-white"
                        : "bg-brand/5 text-text-gray-normal hover:bg-brand/10"
                    }`}
                  >
                    {t.uploadImage}
                  </button>
                </div>
              )}

              {preset === "draw" && signatureMode === "draw" ? (
                <SignaturePad
                  locale={locale}
                  onUse={(blob) => selectFile(new File([blob], "signature.png", { type: "image/png" }))}
                />
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 px-4 cursor-pointer transition-colors min-h-[220px] ${
                    isDragging
                      ? "border-brand bg-brand/5"
                      : "border-[var(--color-border-gray-subtle)] hover:border-brand/50"
                  }`}
                >
                  <motion.div
                    animate={isDragging ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={isDragging ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" } : { duration: 0.15 }}
                  >
                    <UploadIcon />
                  </motion.div>
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    {t.clickToUpload}
                  </Text>
                  <Text as="p" variant="body-small" color="gray-muted">
                    {t.acceptedFormats(MAX_UPLOAD_MB)}
                  </Text>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={[...ACCEPTED_TYPES, ...HEIC_EXTENSIONS].join(",")}
                onChange={handleFileInput}
                className="hidden"
              />
            </>
          )}

          {step === "adjust" && originalPreviewUrl && (
            <AdjustStep
              locale={locale}
              imageUrl={originalPreviewUrl}
              targetWidth={width}
              targetHeight={cropTargetHeight}
              showFaceGuide={preset === "photo" || preset === "signature"}
              brightness={brightness}
              contrast={contrast}
              onCancel={handleAdjustCancel}
              onApply={handleAdjustApply}
            />
          )}

          {step === "processing" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-[220px]">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-brand/15 animate-ping" />
                <div className="relative w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                  <UploadIcon />
                </div>
              </div>

              <div className="w-full max-w-[220px] h-1.5 rounded-full bg-[var(--color-border-gray-subtle)] overflow-hidden">
                <div className="h-full bg-brand rounded-full cc-resize-progress" />
              </div>

              <Text as="p" variant="body-medium" color="gray-muted">
                {processingStatusMessages[statusIndex]}
              </Text>

              <style>{`
                @keyframes cc-resize-progress-fill { from { width: 0%; } to { width: 100%; } }
                .cc-resize-progress { animation: cc-resize-progress-fill ${MIN_PROCESSING_MS}ms ease-out forwards; }
              `}</style>
            </div>
          )}

          {step === "result" && result && originalPreviewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="relative rounded-lg overflow-hidden border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)]">
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white">
                      {t.original}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalPreviewUrl}
                      alt="Original"
                      className="w-full aspect-square object-contain"
                    />
                  </div>
                  <Text as="p" variant="body-small" color="gray-muted" className="text-center">
                    {`${originalSizeKB}KB`}
                  </Text>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div
                    className={`relative rounded-lg overflow-hidden border-2 bg-[var(--color-gray-bg-soft)] ${
                      withinTarget ? "border-[var(--color-success-strong)]" : "border-[var(--color-warning-strong)]"
                    }`}
                  >
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                        withinTarget ? "bg-[var(--color-success-strong)]" : "bg-[var(--color-warning-strong)]"
                      }`}
                    >
                      {withinTarget ? t.ready : t.checkSize}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.url} alt="Optimized" className="w-full aspect-square object-contain" />
                  </div>
                  <Text as="p" variant="body-small" color="gray-muted" className="text-center">
                    {`${width}×${height}px • ${resultSizeKB}KB`}
                  </Text>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  withinTarget
                    ? "bg-success/10 text-[var(--color-success-strong)]"
                    : "bg-warning-strong/10 text-[var(--color-warning-strong)]"
                }`}
              >
                {withinTarget ? t.perfectMatch : t.outsideTarget}
              </div>

              <Button fullWidth sx={{ borderRadius: "50px" }} onClick={handleDownload}>
                {t.downloadImage}
              </Button>

              <Text as="p" variant="body-small" color="gray-muted" className="text-center -mt-2">
                {t.autoRenamedPrefix}{" "}
                <span className="font-semibold text-[var(--color-success-strong)]">{downloadFilename}</span>{" "}
                {t.autoRenamedSuffix}
              </Text>

              <div className="flex gap-2">
                <Button variant="outlined" color="gray" fullWidth sx={{ borderRadius: "50px" }} onClick={handleShare}>
                  {shareCopied ? t.copied : t.share}
                </Button>
                <Button variant="outlined" color="gray" fullWidth sx={{ borderRadius: "50px" }} onClick={handleReset}>
                  {t.processAnother}
                </Button>
              </div>
            </motion.div>
          )}

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div className="flex-1" />
          <hr className="border-[var(--color-border-gray-subtle)]" />
          <Text as="p" variant="body-small" color="gray-muted" className="italic">
            {t.fastSecure}
          </Text>
        </div>
      </Card>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brand">
      <path
        d="M12 15V3m0 0L7 8m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v6M12 8v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonFieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.2-4 4.2-6 7.5-6s6.3 2 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarFieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ResizeSettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
      <path
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 12v9M12 12L4 7.5M12 12l8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
