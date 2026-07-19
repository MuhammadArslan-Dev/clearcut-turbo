import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import ArticleContent from "@/components/blog/article-content";
import ArticleAttachments from "@/components/blog/article-attachments";
import TableOfContents from "@/components/blog/table-of-contents";
import ArticleShare from "@/components/blog/article-share";
import BackToTop from "@/components/blog/back-to-top";
import ArticlePager from "@/components/blog/article-pager";
import BlogPostCard from "@/components/blog/blog-post-card";
import MainContainer from "@/components/main-container";
import { parseArticle } from "@/lib/blog/article";
import { resolveMediaUrl } from "@/lib/blog/media";
import { readingTime } from "@/lib/blog/reading-time";
import { getPostBySlug, getPostsByExam } from "@/lib/api/posts";
import { resolveExamId } from "@/lib/api/exams";
import { unFormatSlug } from "@/utils/slugify";
import { siteConfig } from "@/lib/metadata";

// Absolute base URL used for canonical/OG URLs and JSON-LD ids.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(
  /\/$/,
  "",
);

// Resolve a post's social-share image (hero, else the site fallback).
function postOgImage(heroUrl?: string): string {
  return resolveMediaUrl(heroUrl) || siteConfig.ogImage;
}

function authorNameOf(
  author: { name?: string } | string | null | undefined,
): string | undefined {
  if (author && typeof author === "object") return author.name || undefined;
  return undefined;
}

/* =========================================================
   TYPES
========================================================= */

type Params = {
  params: Promise<{
    locale: string;
    examName: string;
    slug: string;
  }>;
};

/* =========================================================
   DATA
   The exam URL segment maps to an exam's external `exam_id`. We first try an
   exam-scoped lookup; if that misses (e.g. the segment is a display slug rather
   than the exam_id), we fall back to a slug-only lookup so valid posts still
   resolve. Exam-mismatch hardening can tighten this in a later pass.
========================================================= */

async function loadPost(slug: string, locale: string, examName: string) {
  // Resolve the URL exam segment ("ctet") to the canonical exam_id
  // ("teaching_CTET") so the exam-scoped lookup matches. Fall back to a
  // slug-only lookup so a valid post still resolves if scoping misses.
  const examId = (await resolveExamId(examName)) ?? examName;
  const scoped = await getPostBySlug(slug, { locale, examId });
  if (scoped) return scoped;
  return getPostBySlug(slug, { locale });
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { locale, examName, slug } = await params;
  const post = await loadPost(slug, locale, examName);

  if (!post) {
    return { title: siteConfig.name };
  }

  const path = `/${examName}/blog/${slug}`;
  const enUrl = `${SITE_URL}${path}`;
  const hiUrl = `${SITE_URL}/hi${path}`;
  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;

  const heroUrl =
    post.heroImage && typeof post.heroImage === "object"
      ? post.heroImage.url
      : undefined;
  const ogImage = postOgImage(heroUrl);
  const authorName = authorNameOf(post.author);

  return {
    // Root layout applies the "%s | Clear Cutoff" title template, so use the
    // bare post title here to avoid a doubled site name.
    title: post.title,
    description: post.excerpt || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, hi: hiUrl, "x-default": enUrl },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.publishedDate,
      modifiedTime: post.updatedAt,
      authors: authorName ? [authorName] : undefined,
      images: [{ url: ogImage, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: [ogImage],
    },
  };
}

/* =========================================================
   PAGE — 2-column layout: article (left) + sticky Contents (right).
   The Contents sidebar is scaffolded here; the scroll-spy TOC component
   is wired up in a later phase (P5).
========================================================= */

export default async function BlogArticlePage({ params }: Params) {
  const { locale, examName, slug } = await params;
  const post = await loadPost(slug, locale, examName);

  if (!post) {
    notFound();
  }

  const examLabel =
    post.exam && typeof post.exam === "object"
      ? post.exam.short_name || post.exam.name || unFormatSlug(examName)
      : unFormatSlug(examName);

  // Parse content_html once: injects heading ids + extracts the TOC.
  const { content, toc } = parseArticle(post.content_html ?? "");
  const minutes = readingTime(post.content_html);
  const heroImage =
    post.heroImage && typeof post.heroImage === "object"
      ? resolveMediaUrl(post.heroImage.url)
      : undefined;

  // Sibling posts (same exam, newest-first) for prev/next + related.
  const examId = (await resolveExamId(examName)) ?? examName;
  const examPosts = await getPostsByExam(examId, { locale, limit: 100 });
  const idx = examPosts.findIndex((p) => p.slug === slug);
  const prevPost = idx > 0 ? examPosts[idx - 1] : null;
  const nextPost =
    idx >= 0 && idx < examPosts.length - 1 ? examPosts[idx + 1] : null;
  const relatedPosts = examPosts.filter((p) => p.slug !== slug).slice(0, 3);

  // Locale-aware link back to the exam blog listing.
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const blogHref = `${localePrefix}/${examName}/blog`;

  /* ---------- Structured data (JSON-LD) ---------- */
  const pageUrl = `${SITE_URL}${localePrefix}/${examName}/blog/${slug}`;
  const heroUrl =
    post.heroImage && typeof post.heroImage === "object"
      ? post.heroImage.url
      : undefined;
  const authorName = authorNameOf(post.author);

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    headline: post.title,
    description: post.excerpt || undefined,
    image: postOgImage(heroUrl),
    datePublished: post.publishedDate,
    dateModified: post.updatedAt || post.publishedDate,
    author: {
      "@type": authorName ? "Person" : "Organization",
      name: authorName || siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: siteConfig.ogImage },
    },
    about: examLabel,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: `${examLabel} Blog`,
        item: `${SITE_URL}${blogHref}`,
      },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };

  // Visible breadcrumb (last crumb is the current page; title truncated so a
  // long headline doesn't dominate the trail).
  const crumbTitle =
    post.title.length > 48 ? `${post.title.slice(0, 48).trimEnd()}…` : post.title;
  const breadcrumbItems = [
    { name: "Home", url: `${localePrefix}/` },
    { name: examLabel, url: `${localePrefix}/${examName}` },
    { name: "Blog", url: blogHref },
    { name: crumbTitle },
  ];

  return (
    <MainContainer padding="py-8" maxWidth="max-w-[1400px]" bgColor="bg-[#f8fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="grid grid-cols-1 gap-10 px-4 lg:grid-cols-[260px_minmax(0,1fr)_100px]">

          {/* Contents (sticky). Entries are extracted from the article's H2/H3
            headings; TableOfContents adds scroll-spy highlighting + smooth
            scroll on the client. */}
        {toc.length > 0 ? (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contents
              </p>
              <TableOfContents items={toc} />
            </div>
          </aside>
        ) : null}
        {/* Article */}
        <article className="min-w-0 ">
          <CustomBreadcrumbs
            padding="0px 0px 16px 0px"
            isShow={true}
            items={breadcrumbItems}
          />
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
            {examLabel}
          </p>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mb-6 text-lg text-slate-600">{post.excerpt}</p>
          ) : null}
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
            {post.publishedDate ? (
              <span>
                {new Date(post.publishedDate).toLocaleDateString(
                  locale === "hi" ? "hi-IN" : "en-IN",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </span>
            ) : null}
            {post.publishedDate ? <span aria-hidden="true">•</span> : null}
            <span>{minutes} min read</span>
          </div>

          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={post.title}
              className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover"
            />
          ) : null}

          {post.content_html ? (
            <ArticleContent content={content} />
          ) : (
            <p className="text-slate-500">No content available.</p>
          )}

          <ArticleAttachments attachments={post.attachments} />

          {/* Share (mobile — desktop uses the sticky rail) */}
          <div className="mt-10 border-t border-slate-200 pt-6 lg:hidden">
            <ArticleShare url={pageUrl} title={post.title} />
          </div>
        </article>

        {/* Share rail (sticky, desktop) */}
        <aside className="hidden lg:block ">
          <div className="sticky top-24 flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Share
            </span>
            <ArticleShare url={pageUrl} title={post.title} orientation="vertical" />
          </div>
        </aside>
      </div>

      {/* Prev / next + related (full width) */}
      <div className="px-4">
        {/* <ArticlePager
          prev={prevPost}
          next={nextPost}
          examName={examName}
          locale={locale}
        /> */}

        {relatedPosts.length > 0 ? (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                {/* <span className="mb-1 block h-1 w-10 rounded-full bg-blue-600" /> */}
                <h2 className="text-2xl font-bold text-slate-900">
                  Related articles
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  More {examLabel} preparation guides
                </p>
              </div>
              <Link
                href={blogHref}
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 sm:inline-flex"
              >
                View all
                <svg
                  className="h-4 w-4"
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
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPosts.map((p) => (
                <BlogPostCard
                  key={p.id}
                  post={p}
                  examName={examName}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BackToTop />
    </MainContainer>
  );
}
