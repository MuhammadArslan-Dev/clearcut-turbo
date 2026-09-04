import { createFetchClient } from "@clearcut/api/fetch-client";

import type { AlternativeDoc, AlternativeSummary, ComparisonDoc, FaqDoc, MarketingProof } from "@/types/cms";

const CMS_URL = process.env.CMS_URL || "http://localhost:3011";

// Revalidate CMS-driven pages hourly — matches the homepage's ISR cadence
// (see src/app/[locale]/page.tsx) rather than rebuilding on every request.
const REVALIDATE_SECONDS = 3600;

type PayloadListResponse<T> = { docs: T[] };

// Phase 2 (API & Data Layer): the fetch+revalidate+404-as-null+throw-on-error
// primitive this used to hand-roll now lives in @clearcut/api's
// createFetchClient — the same one apps/blog's Payload wrappers build on —
// so both apps' CMS reads share one core instead of two independent copies.
const client = createFetchClient({ baseUrl: CMS_URL, defaultRevalidate: REVALIDATE_SECONDS });

function payloadFetch<T>(path: string): Promise<T | null> {
  return client.fetchJsonOrNull<T>(path);
}

/**
 * Prefix a Payload media `url` (relative, e.g. "/media/logo.png") with the CMS host.
 * Payload returns `url` already percent-encoded (e.g. spaces as %20); decode first
 * so next/image doesn't double-encode it when building its optimizer proxy URL.
 */
export function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const decoded = decodeURIComponent(url);
  return decoded.startsWith("http") ? decoded : `${CMS_URL}${decoded}`;
}

export async function getComparisonBySlug(
  slug: string,
  locale: string = "en",
): Promise<ComparisonDoc | null> {
  const query = new URLSearchParams({
    "where[slug][equals]": slug,
    locale,
    depth: "2",
    limit: "1",
  });

  const data = await payloadFetch<PayloadListResponse<ComparisonDoc>>(
    `/api/comparisons?${query.toString()}`,
  );

  return data?.docs?.[0] ?? null;
}

/** Slugs for every published comparison page, used by generateStaticParams. */
export async function getComparisonSlugs(): Promise<string[]> {
  const query = new URLSearchParams({
    depth: "0",
    limit: "100",
    "select[slug]": "true",
  });

  const data = await payloadFetch<PayloadListResponse<{ slug: string }>>(
    `/api/comparisons?${query.toString()}`,
  );

  return data?.docs?.map((doc) => doc.slug) ?? [];
}

export async function getMarketingProof(locale: string = "en"): Promise<MarketingProof | null> {
  const query = new URLSearchParams({ locale, depth: "2" });
  return payloadFetch<MarketingProof>(`/api/globals/marketing-proof?${query.toString()}`);
}

/**
 * Published Alternatives pages, newest first. Drives the /alternatives index
 * and the dynamic footer "Alternatives" column — publish a page in the CMS
 * and it shows up in both automatically, no manual editing.
 */
export async function getAlternativesList(
  limit: number = 100,
  locale: string = "en",
): Promise<AlternativeSummary[]> {
  const query = new URLSearchParams({
    locale,
    depth: "1",
    limit: String(limit),
    sort: "-publishedDate",
  });

  const data = await payloadFetch<PayloadListResponse<AlternativeSummary>>(
    `/api/alternatives?${query.toString()}`,
  );
  return data?.docs ?? [];
}

/** Slugs for every published Alternatives page, used by generateStaticParams. */
export async function getAlternativesSlugs(): Promise<string[]> {
  const query = new URLSearchParams({
    depth: "0",
    limit: "100",
    "select[slug]": "true",
  });

  const data = await payloadFetch<PayloadListResponse<{ slug: string }>>(
    `/api/alternatives?${query.toString()}`,
  );
  return data?.docs?.map((doc) => doc.slug) ?? [];
}

export async function getAlternativeBySlug(slug: string, locale: string = "en"): Promise<AlternativeDoc | null> {
  const query = new URLSearchParams({
    "where[slug][equals]": slug,
    locale,
    depth: "2",
    limit: "1",
  });

  const data = await payloadFetch<PayloadListResponse<AlternativeDoc>>(`/api/alternatives?${query.toString()}`);
  return data?.docs?.[0] ?? null;
}

/** Categories + questions for the /faq page, editable from the CMS admin. */
export async function getFaq(locale: string = "en"): Promise<FaqDoc | null> {
  const query = new URLSearchParams({ locale, depth: "0" });
  return payloadFetch<FaqDoc>(`/api/globals/faq?${query.toString()}`);
}
