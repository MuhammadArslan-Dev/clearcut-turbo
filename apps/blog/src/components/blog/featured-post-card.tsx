// Large "featured" card for the top of the blog listing — a wide 2-column
// layout (cover + content) that gives the page a focal point above the grid.
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

export default function FeaturedPostCard({
  post,
  examName,
  locale,
}: {
  post: Post;
  examName: string;
  locale: string;
}) {
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
      className="group relative mb-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-xl lg:grid-cols-2"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden lg:aspect-auto lg:min-h-[340px]">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={heroAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CardPlaceholder title={post.title} size="large" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          Featured
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
        <div className="flex items-center gap-3 text-xs">
          {examLabel ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold uppercase tracking-wide text-blue-700">
              {examLabel}
            </span>
          ) : null}
          {date ? <span className="text-slate-400">{date}</span> : null}
        </div>

        <h2 className="line-clamp-3 text-2xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-700 md:text-3xl">
          {post.title}
        </h2>

        {post.excerpt ? (
          <p className="line-clamp-3 text-base leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        ) : null}

        <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">
          Read article
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
    </Link>
  );
}
