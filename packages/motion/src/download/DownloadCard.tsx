"use client";

import ui from "../core/ui.module.css";
import s from "./download.module.css";
import { formatBytes, type DownloadStatus } from "./useFileDownload";

type Lang = "en" | "hi";

export type DownloadCardProps = {
  title: string;
  /** e.g. "24 pages · 2.4 MB" */
  meta: string;
  status: DownloadStatus;
  progress: number | null;
  loadedBytes?: number;
  totalBytes?: number | null;
  /** card = file row with icon (PDF lists, notes) · button = compact pill (page headers, results) */
  variant?: "card" | "button";
  lang?: Lang;
  onDownload: () => void;
  onCancel?: () => void;
  onOpen?: () => void;
  onRetry?: () => void;
};

const T = {
  download: { en: "Download", hi: "डाउनलोड" },
  preparing: { en: "Preparing your PDF…", hi: "आपकी PDF तैयार हो रही है…" },
  of: { en: "of", hi: "/" },
  done: { en: "Downloaded · saved to your device", hi: "डाउनलोड हो गई · डिवाइस में सेव" },
  open: { en: "Open", hi: "खोलें" },
  failed: { en: "Download failed. Check your internet and retry.", hi: "डाउनलोड नहीं हुआ। इंटरनेट देखें और फिर कोशिश करें।" },
  retry: { en: "Retry", hi: "फिर से" },
  cancel: { en: "Cancel download", hi: "डाउनलोड रोकें" },
  downloaded: { en: "Downloaded", hi: "डाउनलोड हो गई" },
};

export function DownloadCard(p: DownloadCardProps) {
  return p.variant === "button" ? <DownloadButton {...p} /> : <Card {...p} />;
}

function metaLine({ status, progress, loadedBytes = 0, totalBytes, meta, lang = "en" }: DownloadCardProps) {
  if (status === "preparing") return T.preparing[lang];
  if (status === "downloading") {
    if (totalBytes) return `${formatBytes(loadedBytes)} ${T.of[lang]} ${formatBytes(totalBytes)} · ${Math.round((progress ?? 0) * 100)}%`;
    return formatBytes(loadedBytes);
  }
  if (status === "done") return T.done[lang];
  if (status === "error") return T.failed[lang];
  return meta;
}

function Card(p: DownloadCardProps) {
  const { title, status, progress, lang = "en", onDownload, onCancel, onOpen, onRetry } = p;
  const pct = progress ?? 0;
  const busy = status === "preparing" || status === "downloading";

  return (
    <div className={`${ui.root} ${ui.rootTokens} ${s.card} ${s[status]}`}>
      <FileIcon status={status} />
      <div className={s.text}>
        <b className={s.title}>{title}</b>
        <span key={status} className={s.meta} aria-live="polite">{metaLine(p)}</span>
      </div>

      {/* all action states share one fixed-size cell and crossfade: no layout shift */}
      <div className={s.action}>
        <button type="button" className={`${s.pill} ${s.layer} ${status === "idle" ? s.show : ""}`} onClick={onDownload} tabIndex={status === "idle" ? 0 : -1} aria-hidden={status !== "idle"}>
          <DownArrow /> {T.download[lang]}
        </button>

        <button
          type="button"
          className={`${s.ringBtn} ${s.layer} ${busy ? s.show : ""}`}
          onClick={onCancel}
          tabIndex={busy ? 0 : -1}
          aria-hidden={!busy}
          aria-label={T.cancel[lang]}
        >
          <svg viewBox="0 0 44 44" className={`${s.ring} ${status === "preparing" || progress === null ? s.indeterminate : ""}`}>
            <circle className={s.ringTrack} cx="22" cy="22" r="18" />
            <circle className={s.ringArc} cx="22" cy="22" r="18" pathLength={1} style={{ strokeDashoffset: status === "downloading" && progress !== null ? 1 - pct : 0.75 }} />
          </svg>
          <span className={s.stop} />
        </button>

        <button type="button" className={`${s.pill} ${s.pillOpen} ${s.layer} ${status === "done" ? s.show : ""}`} onClick={onOpen} tabIndex={status === "done" ? 0 : -1} aria-hidden={status !== "done"}>
          {T.open[lang]}
        </button>

        <button type="button" className={`${s.pill} ${s.pillRetry} ${s.layer} ${status === "error" ? s.show : ""}`} onClick={onRetry ?? onDownload} tabIndex={status === "error" ? 0 : -1} aria-hidden={status !== "error"}>
          {T.retry[lang]}
        </button>
      </div>

      <span className={s.bar} aria-hidden="true">
        <i style={{ transform: `scaleX(${status === "done" ? 1 : status === "downloading" ? pct : 0})` }} />
      </span>
      {status === "done" && (
        <span className={s.sparks} aria-hidden="true">
          <i className={ui.spark} />
          <i className={ui.spark} />
          <i className={ui.spark} />
        </span>
      )}
    </div>
  );
}

function DownloadButton(p: DownloadCardProps) {
  const { status, progress, lang = "en", onDownload, onCancel, onOpen, onRetry } = p;
  const pct = progress ?? 0;
  const label =
    status === "idle" ? T.download[lang]
    : status === "preparing" ? T.preparing[lang]
    : status === "downloading" ? `${progress === null ? "…" : `${Math.round(pct * 100)}%`}`
    : status === "done" ? T.downloaded[lang]
    : T.retry[lang];
  const onClick = status === "idle" ? onDownload : status === "done" ? onOpen : status === "error" ? (onRetry ?? onDownload) : onCancel;

  return (
    <button type="button" className={`${ui.root} ${ui.rootTokens} ${s.morph} ${s[status]}`} onClick={onClick} aria-live="polite">
      <span className={s.morphFill} style={{ transform: `scaleX(${status === "done" ? 1 : status === "downloading" ? pct : 0})` }} />
      <span key={status} className={s.morphLabel}>
        {status === "idle" && <DownArrow />}
        {status === "done" && (
          <svg viewBox="0 0 16 16" className={s.morphCheck}><path d="M4.2 8.3l2.5 2.4 5-5.2" pathLength={1} /></svg>
        )}
        {(status === "preparing" || (status === "downloading" && progress === null)) && <span className={s.dotSpin} />}
        {label}
      </span>
    </button>
  );
}

function DownArrow() {
  return (
    <svg viewBox="0 0 24 24" className={s.arrow} aria-hidden="true">
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  );
}

function FileIcon({ status }: { status: DownloadStatus }) {
  return (
    <div className={s.file} aria-hidden="true">
      <svg viewBox="0 0 48 60">
        <path className={s.page} d="M6 2h26l14 14v38a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
        <path className={s.fold} d="M32 2v10a4 4 0 0 0 4 4h10" />
        <rect className={s.ln} x="9" y="22" width="22" height="3" rx="1.5" />
        <rect className={s.ln} x="9" y="29" width="28" height="3" rx="1.5" />
        <rect className={s.ln} x="9" y="36" width="18" height="3" rx="1.5" />
      </svg>
      <span className={s.badge}>PDF</span>
      <span className={s.drop}>
        <svg viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5" /></svg>
      </span>
      <span className={s.ok}>
        <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" pathLength={1} /></svg>
      </span>
    </div>
  );
}
