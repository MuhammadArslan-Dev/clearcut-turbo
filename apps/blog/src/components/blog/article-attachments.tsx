// "Resources" section listing an article's downloadable attachments (PDF,
// Excel/CSV sheets, etc). Server component — plain download links, no
// interactivity needed.
import { resolveMediaUrl } from "@/lib/blog/media";
import {
  fileKindOf,
  fileExtensionLabel,
  formatFileSize,
  type FileKind,
} from "@/lib/blog/file-format";
import type { PostAttachment } from "@/types/blog/post";

const KIND_STYLES: Record<FileKind, { bg: string; fg: string }> = {
  pdf: { bg: "bg-red-50", fg: "text-red-600" },
  spreadsheet: { bg: "bg-green-50", fg: "text-green-600" },
  image: { bg: "bg-purple-50", fg: "text-purple-600" },
  archive: { bg: "bg-amber-50", fg: "text-amber-600" },
  doc: { bg: "bg-blue-50", fg: "text-blue-600" },
  file: { bg: "bg-slate-100", fg: "text-slate-500" },
};

function FileIcon({ kind }: { kind: FileKind }) {
  // A single generic document glyph; color alone (via KIND_STYLES) plus the
  // extension badge differentiate file types, keeping the icon set simple.
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8.414A2 2 0 0017.414 7L13 2.586A2 2 0 0011.586 2H4zm7 1.414L16.586 8H12a1 1 0 01-1-1V4.414zM6 12a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h4a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1zM4 15a1 1 0 011 1v1h10v-1a1 1 0 112 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ArticleAttachments({
  attachments,
}: {
  attachments: PostAttachment[] | undefined;
}) {
  const items = (attachments ?? []).filter(
    (a): a is PostAttachment & { file: NonNullable<PostAttachment["file"]> } =>
      !!a.file && typeof a.file === "object",
  );
  if (items.length === 0) return null;

  return (
    <section className="my-10 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="mb-4 text-base font-bold text-slate-900">Resources</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const file = item.file as NonNullable<PostAttachment["file"]> & {
            url?: string;
            filename?: string;
            mimeType?: string;
            filesize?: number;
          };
          const url = resolveMediaUrl(file.url);
          if (!url) return null;

          const kind = fileKindOf(file.mimeType, file.filename);
          const ext = fileExtensionLabel(file.filename);
          const size = formatFileSize(file.filesize);
          const label = item.label || file.filename || "Download";
          const style = KIND_STYLES[kind];

          return (
            <li key={item.id}>
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.fg}`}
                >
                  <FileIcon kind={kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-blue-700">
                    {label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {[ext, size].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <DownloadIcon />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
