"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";

type PresetKey = "photo" | "signature" | "custom";

interface Preset {
  label: string;
  sublabel: string;
  width: number;
  height: number;
  minKB: number;
  maxKB: number;
}

const PRESETS: Record<PresetKey, Preset> = {
  photo: { label: "Photo", sublabel: "Passport size", width: 200, height: 230, minKB: 20, maxKB: 50 },
  signature: { label: "Signature", sublabel: "Digital sign", width: 200, height: 230, minKB: 20, maxKB: 50 },
  custom: { label: "Custom", sublabel: "Your own size", width: 200, height: 200, minKB: 20, maxKB: 100 },
};

const MAX_UPLOAD_MB = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Resizing a small photo/signature is near-instant on canvas — without a
// floor, the "processing" state would flash for a frame or two and the
// result would just pop in. Padding it to a perceptible minimum (and
// stepping through a few status lines during that window) makes the tool
// feel like it's actually doing work instead of jarring the user.
const MIN_PROCESSING_MS = 1400;
const PROCESSING_STATUS_MESSAGES = ["Analyzing image…", "Resizing…", "Compressing…"];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Step = "configure" | "processing" | "result";

interface ResultData {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// Crops to fill the exact target box (like CSS `object-fit: cover`) instead
// of stretching — a plain width/height draw would distort passport photos
// and signatures, which is exactly what these exam-portal uploads get
// rejected for.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetW / targetH;
  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
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

  const stripHeight = ctx.canvas.height - height;
  let fontSize = Math.max(10, Math.round(stripHeight * 0.5));
  const baselineY = height + stripHeight / 2 + 1;
  const padding = width * 0.04;
  const gap = width * 0.04;

  const nameText = name ? name.toUpperCase() : "";
  const dateText = isoDate ? formatDateDDMMYYYY(isoDate) : "";

  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";

  // Measure both strings at the natural size and shrink the font until the
  // combined group fits with room to spare — a fixed 60/40 width split (the
  // earlier approach) still let a long name run into the date for names
  // like "RIYA SHARMA".
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const availableWidth = width - padding * 2;
  const nameWidth = ctx.measureText(nameText).width;
  const dateWidth = ctx.measureText(dateText).width;
  const groupGap = nameText && dateText ? gap : 0;
  let combinedWidth = nameWidth + dateWidth + groupGap;
  if (combinedWidth > availableWidth && combinedWidth > 0) {
    fontSize = Math.max(8, Math.floor(fontSize * (availableWidth / combinedWidth)));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    combinedWidth = ctx.measureText(nameText).width + ctx.measureText(dateText).width + groupGap;
  }

  // Center the name+date pair as one group instead of pinning name/date to
  // opposite edges — both draws use "left" alignment from a shared start
  // point so the visible gap between them stays exactly `groupGap`.
  let x = (width - combinedWidth) / 2;
  ctx.textAlign = "left";
  if (nameText) {
    ctx.fillText(nameText, x, baselineY);
    x += ctx.measureText(nameText).width + groupGap;
  }
  if (dateText) {
    ctx.fillText(dateText, x, baselineY);
  }
}

async function resizeAndCompress(
  file: File,
  width: number,
  height: number,
  maxKB: number,
  stampName?: string,
  stampDate?: string,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const trimmedName = stampName?.trim();

    if (trimmedName || stampDate) {
      const stripHeight = Math.max(16, Math.round(height * 0.16));
      const imageAreaHeight = height - stripHeight;
      drawCover(ctx, img, width, imageAreaHeight);
      drawNameDateStamp(ctx, trimmedName ?? "", stampDate ?? "", width, imageAreaHeight);
    } else {
      drawCover(ctx, img, width, height);
    }

    let quality = 0.92;
    let blob = await canvasToJpegBlob(canvas, quality);
    let attempts = 0;

    while (blob && blob.size / 1024 > maxKB && quality > 0.1 && attempts < 15) {
      quality -= 0.06;
      blob = await canvasToJpegBlob(canvas, quality);
      attempts++;
    }

    if (!blob) throw new Error("Could not process this image.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// No existing @clearcut/ui component covers a selectable preset tile (Chip
// has no selected/interactive state, Button isn't a 2-line label+sublabel
// layout) — built locally rather than inventing one in the shared package
// for a single call site.
function PresetTile({
  active,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
        active
          ? "border-brand bg-brand/5"
          : "border-[var(--color-border-gray-subtle)] hover:border-brand/40"
      }`}
    >
      <span className={`body-medium !font-semibold ${active ? "text-brand" : "text-text-gray-normal"}`}>
        {label}
      </span>
      <span className="body-small text-text-gray-muted">{sublabel}</span>
    </button>
  );
}

export default function ResizeImageTool() {
  const [preset, setPreset] = useState<PresetKey>("photo");
  const [width, setWidth] = useState(PRESETS.photo.width);
  const [height, setHeight] = useState(PRESETS.photo.height);
  const [maxKB, setMaxKB] = useState(PRESETS.photo.maxKB);
  const [stampName, setStampName] = useState("");
  const [stampDate, setStampDate] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("configure");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

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
      setStatusIndex((i) => Math.min(i + 1, PROCESSING_STATUS_MESSAGES.length - 1));
    }, MIN_PROCESSING_MS / PROCESSING_STATUS_MESSAGES.length);
    return () => clearInterval(interval);
  }, [step]);

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setWidth(PRESETS[key].width);
    setHeight(PRESETS[key].height);
    setMaxKB(PRESETS[key].maxKB);
    if (key !== "signature") {
      setStampName("");
      setStampDate("");
    }
  };

  const processFile = useCallback(
    async (selected: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(selected.type)) {
        setError("Please choose a JPG, PNG, or WEBP image.");
        return;
      }
      if (selected.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setError(`Please choose an image under ${MAX_UPLOAD_MB}MB.`);
        return;
      }
      if (width < 1 || height < 1 || maxKB < 1) {
        setError("Enter valid width, height, and size values.");
        return;
      }

      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      setFile(selected);
      setOriginalPreviewUrl(URL.createObjectURL(selected));
      setStep("processing");

      try {
        const [blob] = await Promise.all([
          resizeAndCompress(
            selected,
            width,
            height,
            maxKB,
            preset === "signature" ? stampName : undefined,
            preset === "signature" ? stampDate : undefined,
          ),
          delay(MIN_PROCESSING_MS),
        ]);
        setResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: URL.createObjectURL(blob), blob, width, height };
        });
        setStep("result");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setStep("configure");
      }
    },
    [width, height, maxKB, preset, stampName, stampDate, originalPreviewUrl],
  );

  // Editing the name/date after an image is already selected re-stamps the
  // SAME file instead of forcing "Process Another" + a fresh upload just to
  // fix a typo. Debounced so it reprocesses once typing pauses, not on
  // every keystroke. Deliberately keyed only on stampName/stampDate (not
  // `file`, which already triggers its own processFile call on selection).
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => {
      processFile(file);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stampName, stampDate]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  const handleReset = () => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setOriginalPreviewUrl(null);
    setResult(null);
    setError(null);
    setStep("configure");
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = "photo.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const originalSizeKB = file ? Math.round(file.size / 1024) : 0;
  const resultSizeKB = result ? Math.round(result.blob.size / 1024) : 0;
  const withinTarget = result ? resultSizeKB <= maxKB : false;

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
              Configuration
            </Text>
          </div>

          <div className="space-y-1.5">
            <Text as="label" variant="body-small" weight="semibold" color="gray-muted">
              Document type
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PRESETS) as [PresetKey, Preset][]).map(([key, p]) => (
                <PresetTile
                  key={key}
                  active={preset === key}
                  label={p.label}
                  sublabel={p.sublabel}
                  onClick={() => applyPreset(key)}
                />
              ))}
            </div>
          </div>

          {preset === "custom" || preset === "signature" ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Text as="label" variant="body-small" color="gray-muted">
                  Width (px)
                </Text>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 0)}
                  className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Text as="label" variant="body-small" color="gray-muted">
                  Height (px)
                </Text>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 0)}
                  className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Text as="label" variant="body-small" color="gray-muted">
                  Max size (KB)
                </Text>
                <input
                  type="number"
                  value={maxKB}
                  onChange={(e) => setMaxKB(Number(e.target.value) || 0)}
                  className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-sm bg-brand/8 text-[var(--color-primary-strong)] font-medium">
                Dimensions: {width}×{height}px
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-brand/8 text-[var(--color-primary-strong)] font-medium">
                Size: up to {maxKB}KB
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-brand/8 text-[var(--color-primary-strong)] font-medium">
                Format: JPG
              </span>
            </div>
          )}

          {preset === "signature" && (
            <div className="space-y-1.5">
              <Text as="label" variant="body-small" weight="semibold" color="gray-muted">
                Add name &amp; date (optional)
              </Text>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={stampName}
                  onChange={(e) => setStampName(e.target.value)}
                  placeholder="e.g. RAHUL SHARMA"
                  maxLength={30}
                  style={{ textTransform: "uppercase" }}
                  className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                />
                <input
                  type="date"
                  value={stampDate}
                  onChange={(e) => setStampDate(e.target.value)}
                  className="h-[44px] w-full rounded-lg border border-[var(--color-border-gray-subtle)] px-3 body-medium"
                />
              </div>
              <Text as="p" variant="body-small" color="gray-muted">
                Required by SSC, UPSC, NEET and other boards — printed in block letters at the bottom, inside the
                same {width}×{height}px size.
              </Text>
            </div>
          )}

          <div className="flex-1" />
          <hr className="border-[var(--color-border-gray-subtle)]" />
          <Text as="p" variant="body-small" color="gray-muted" className="italic">
            Privacy First: your photos are processed locally in your browser and never uploaded.
          </Text>
        </div>

        {/* COLUMN 2: UPLOAD / RESULT */}
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </div>
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {step === "result" ? "Your optimized image" : "Upload & Process"}
            </Text>
          </div>

          {step === "configure" && (
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
              <UploadIcon />
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                Click to upload or drag and drop
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                JPG, PNG, or WEBP up to {MAX_UPLOAD_MB}MB
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
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
                {PROCESSING_STATUS_MESSAGES[statusIndex]}
              </Text>

              <style>{`
                @keyframes cc-resize-progress-fill { from { width: 0%; } to { width: 100%; } }
                .cc-resize-progress { animation: cc-resize-progress-fill ${MIN_PROCESSING_MS}ms ease-out forwards; }
              `}</style>
            </div>
          )}

          {step === "result" && result && originalPreviewUrl && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Text as="p" variant="body-small" weight="semibold" color="gray-muted" className="text-center">
                    Original ({originalSizeKB}KB)
                  </Text>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalPreviewUrl}
                    alt="Original"
                    className="w-full aspect-square object-contain rounded-lg border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Text as="p" variant="body-small" weight="semibold" color="gray-muted" className="text-center">
                    Optimized ({resultSizeKB}KB)
                  </Text>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.url}
                    alt="Optimized"
                    className="w-full aspect-square object-contain rounded-lg border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)]"
                  />
                </div>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  withinTarget
                    ? "bg-success/10 text-[var(--color-success-strong)]"
                    : "bg-warning-strong/10 text-[var(--color-warning-strong)]"
                }`}
              >
                {withinTarget ? "✓ Meets your size requirement" : "⚠ Still above target — try a lower quality preset"}
              </div>

              <div className="flex gap-2">
                <Button fullWidth sx={{ borderRadius: "50px" }} onClick={handleDownload}>
                  Download
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="gray"
                  sx={{ borderRadius: "50px" }}
                  onClick={handleReset}
                >
                  Process Another
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div className="flex-1" />
          <hr className="border-[var(--color-border-gray-subtle)]" />
          <Text as="p" variant="body-small" color="gray-muted" className="italic">
            Fast &amp; Secure: image processing happens instantly on your device. No waiting, no uploads.
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
