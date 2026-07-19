// Previous / next article navigation for the same exam. `prev` is the newer
// post, `next` the older one (posts are ordered newest-first). Each card keeps
// a half-width slot so a single neighbour still sits balanced on its side.
import Link from "next/link";
import type { Post } from "@/types/blog/post";

const HALF = "sm:w-[calc(50%-0.5rem)]";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-600 group-hover:text-white">
      <svg
        className={`h-5 w-5 transition-transform duration-200 ${
          dir === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        }`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        {dir === "left" ? (
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        )}
      </svg>
    </span>
  );
}

export default function ArticlePager({
  prev,
  next,
  examName,
  locale,
}: {
  prev: Post | null;
  next: Post | null;
  examName: string;
  locale: string;
}) {
  if (!prev && !next) return null;
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const href = (p: Post) => `${localePrefix}/${examName}/blog/${p.slug}`;

  return (
    <nav className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:justify-between">
      {prev ? (
        <Link
          href={href(prev)}
          className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md ${HALF}`}
        >
          <Chevron dir="left" />
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Previous
            </span>
            <span className="mt-0.5 block line-clamp-2 font-semibold text-slate-800 group-hover:text-blue-700">
              {prev.title}
            </span>
          </span>
        </Link>
      ) : (
        <span className={`hidden sm:block ${HALF}`} />
      )}

      {next ? (
        <Link
          href={href(next)}
          className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-right transition-all duration-200 hover:border-blue-300 hover:shadow-md ${HALF}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Next
            </span>
            <span className="mt-0.5 block line-clamp-2 font-semibold text-slate-800 group-hover:text-blue-700">
              {next.title}
            </span>
          </span>
          <Chevron dir="right" />
        </Link>
      ) : null}
    </nav>
  );
}
