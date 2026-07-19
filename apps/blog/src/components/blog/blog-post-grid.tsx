"use client";

// Client wrapper for the blog listing that adds search (filter by title/excerpt),
// a "load more" pager, and promotes the newest post to a large featured card.
// The featured card + pager show in the default (non-search) view; searching
// switches to a flat grid of all matches.
import { useMemo, useState } from "react";
import type { Post } from "@/types/blog/post";
import BlogPostCard from "./blog-post-card";
import FeaturedPostCard from "./featured-post-card";

const PAGE_SIZE = 6;

export default function BlogPostGrid({
  posts,
  examName,
  locale,
}: {
  posts: Post[];
  examName: string;
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const filtered = useMemo(() => {
    if (!q) return posts;
    return posts.filter((p) =>
      `${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(q),
    );
  }, [posts, q]);

  // Default view: first post featured, remainder paginated. Search view: flat.
  const featured = !searching ? filtered[0] : undefined;
  const rest = searching ? filtered : filtered.slice(1);
  const shown = searching ? rest : rest.slice(0, visible);
  const hasMore = !searching && visible < rest.length;

  return (
    <div>
      {/* Search + count */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {searching
            ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${query.trim()}”`
            : `${posts.length} article${posts.length === 1 ? "" : "s"}`}
        </p>
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-lg font-medium text-slate-700">
            {searching ? "No matching articles" : "No articles yet"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {searching
              ? "Try a different search term."
              : "Check back soon for new preparation guides."}
          </p>
        </div>
      ) : (
        <>
          {featured ? (
            <FeaturedPostCard post={featured} examName={examName} locale={locale} />
          ) : null}

          {shown.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  examName={examName}
                  locale={locale}
                />
              ))}
            </div>
          ) : null}

          {hasMore ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Load more articles
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
