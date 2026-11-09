# PDF download

`useFileDownload` does the real work; `DownloadCard` shows it.

```tsx
const dl = useFileDownload(pdfUrl, { fileName: "HTET-2025-L2.pdf" });

<DownloadCard
  title="HTET 2025 Level 2 — Question paper"
  meta="36 pages · 2.4 MB"
  {...dl}                 // status, progress, loadedBytes, totalBytes
  onDownload={dl.start}
  onCancel={dl.cancel}
  onRetry={dl.start}
  onOpen={() => window.open(pdfUrl, "_blank")}
  variant="card"          // or "button" for a single morphing pill
/>
```

**States:** idle → preparing (until the first byte; file lines "print", ring spins) → downloading (arrow drops into the file, ring + bottom bar fill with real bytes) → done (check pops and draws, green glow, Open) or error (shake, Retry). All action states share one fixed cell, so the row never reflows.

**Hook notes:** streams with `fetch` + `ReadableStream`, re-renders at most ~12×/s, indeterminate when the server sends no `Content-Length`, abortable, saves via an object URL. The URL must be same-origin or CORS-enabled (signed S3/CloudFront URLs work). For very large files (>100 MB) link directly instead, since the file is held in memory.
