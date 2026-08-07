// Card for a single blog post in the exam blog listing. Server component:
// renders a locale-aware link to the post detail page. Falls back to a
// gradient placeholder when a post has no hero image.
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/blog/media";
import CardPlaceholder from "./card-placeholder";
import type { Post } from "@/types/blog/post";

function formatDate(date: string | undefined, locale: string): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPostCard({
  post,
  examName,
  locale,
}: {
  post: Post;
  examName: string;
  locale: string;
}) {
  // Locale-aware href matching the `as-needed` prefix strategy (no prefix for
  // the default 'en' locale, `/hi/...` otherwise).
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const href = `${localePrefix}/${examName}/blog/${post.slug}`;
  const hero =
    post.heroImage && typeof post.heroImage === "object"
      ? resolveMediaUrl(post.heroImage.url)
      : undefined;
  const heroAlt =
    (post.heroImage && typeof post.heroImage === "object"
      ? post.heroImage.alt
      : undefined) || post.title;
  const examLabel =
    post.exam && typeof post.exam === "object"
      ? post.exam.short_name || post.exam.name
      : undefined;
  const date = formatDate(post.publishedDate, locale);

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
    >
      {/* Hover top-accent bar */}
      <span className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-blue-600 transition-transform duration-300 group-hover:scale-x-100" />

      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={heroAlt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CardPlaceholder title={post.title} />
        )}
        {examLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 backdrop-blur">
            {examLabel}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-700">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          {date ? (
            <span className="text-xs text-slate-400">{date}</span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
            Read more
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
