// Client for the clearcut-tools-backend API (C:\laragon\www\clearcut-tools-backend,
// see that repo's routes/api_v1.php). This app is a static export (see
// next.config.ts) — every call here happens at BUILD TIME only, inside
// generateStaticParams/generateMetadata/page renders, never in the browser.
// There is deliberately no fallback to stale local data if the API is
// unreachable: a build that can't reach the backend fails loudly instead of
// silently shipping outdated exam specs (wrong numbers here could get a real
// candidate's application rejected).

import { ExamDocument, ExamDocumentType, ResizerExamSpec, ResizerCategory, slugifyCategory } from "../resizerExams";
import { ExamOfficialRequirements, OfficialRequirementCard } from "../officialRequirements";
import type { AgeCategory, AgeCategoryRow, AgeEligibilityData, AgeEligibilityExam, AgeLocale } from "../ageEligibility";

const API_BASE = process.env.TOOLS_API_URL ?? "https://tools-api.clearcutoff.in/api/v1";

interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

interface ApiExamRef {
  exam_slug: string;
  short_name: string;
  full_name: string;
  conducting_body: string | null;
}

interface ApiCategoryRef {
  category_slug: string;
  label: string;
}

interface ApiToolExamListItem {
  public_slug: string;
  exam: ApiExamRef;
  category: ApiCategoryRef | null;
  popular_rank?: number | null;
}

interface ApiSpec {
  format: string;
  widthPx: number;
  heightPx: number;
  minSizeKB: number;
  maxSizeKB: number;
}

interface ApiOfficialRequirementCard {
  rulesLabel: string;
  rulesText: string;
  generalRequirements?: string;
}

interface ApiOfficialRequirements {
  administeringBody: string;
  photo?: ApiOfficialRequirementCard | null;
  signature?: ApiOfficialRequirementCard | null;
  thumb?: (Partial<ApiSpec> & { rulesLabel?: string; rulesText?: string; generalRequirements?: string }) | null;
}

// One entry of the detail endpoint's `documents` array (backend table
// tool_exam_documents). Numbers can be null when the official notice gives
// none (e.g. KB only).
interface ApiDocument {
  type: string;
  mode: string;
  widthPx: number | null;
  heightPx: number | null;
  minSizeKB: number | null;
  maxSizeKB: number | null;
  format: string | null;
  required: boolean;
  verification: string;
}

interface ApiToolExamDetail extends ApiToolExamListItem {
  documents?: ApiDocument[];
  data: {
    photoSpec?: ApiSpec;
    signatureSpec?: ApiSpec;
    officialRequirements?: ApiOfficialRequirements | null;
  } | null;
}

// One retry after a short delay — enough to ride out a transient blip
// (a local dev server still starting up, a connection reset under load)
// without masking a genuinely dead/unreachable backend, which still fails
// the build per this app's no-fallback policy (see file header).
async function apiGet<T>(path: string, attempt = 1): Promise<T> {
  const url = `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500));
      return apiGet<T>(path, attempt + 1);
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Tools API request failed: GET ${url} -> HTTP ${res.status}`);
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  return json.data;
}

function toLocalSpec(spec: ApiSpec | undefined): ResizerExamSpec["photoSpec"] | undefined {
  if (!spec) return undefined;
  return { widthPx: spec.widthPx, heightPx: spec.heightPx, minKB: spec.minSizeKB, maxKB: spec.maxSizeKB };
}

const DOC_TYPES: ExamDocumentType[] = ["photo", "signature", "left_thumb", "right_thumb", "handwritten_declaration"];

type LocalSpec = ResizerExamSpec["photoSpec"];

// A document's sizes come from its own backend row; any size the row leaves
// blank is filled from the exam's data_json spec of the same kind (photo /
// signature / thumb) so a KB-only official notice still yields a usable tool.
function completeSpec(d: ApiDocument, fallback?: LocalSpec): LocalSpec | null {
  const widthPx = d.widthPx ?? fallback?.widthPx;
  const heightPx = d.heightPx ?? fallback?.heightPx;
  const minKB = d.minSizeKB ?? fallback?.minKB;
  const maxKB = d.maxSizeKB ?? fallback?.maxKB;
  if (widthPx == null || heightPx == null || minKB == null || maxKB == null) return null;
  return { widthPx, heightPx, minKB, maxKB };
}

function buildDocuments(
  detail: ApiToolExamDetail,
  dataPhoto: LocalSpec | undefined,
  dataSignature: LocalSpec | undefined,
  dataThumb: LocalSpec | undefined,
): ExamDocument[] {
  const fromApi = (detail.documents ?? []).filter((d) => (DOC_TYPES as string[]).includes(d.type));

  if (fromApi.length === 0) {
    // No documents in the backend for this exam yet: the same photo +
    // signature pair the tool always offered, from data_json.
    return [
      { type: "photo", mode: "upload", spec: dataPhoto ?? null, format: detail.data?.photoSpec?.format ?? "jpg", required: true, verification: "unverified" },
      { type: "signature", mode: "upload", spec: dataSignature ?? null, format: detail.data?.signatureSpec?.format ?? "jpg", required: true, verification: "unverified" },
    ];
  }

  return fromApi.map((d) => {
    const type = d.type as ExamDocumentType;
    const fallback = type === "photo" ? dataPhoto : type === "signature" ? dataSignature : type === "left_thumb" ? dataThumb : undefined;
    return {
      type,
      mode: d.mode === "live_capture" ? "live_capture" : "upload",
      spec: completeSpec(d, fallback),
      format: d.format || "jpg",
      required: d.required,
      verification: d.verification,
    } satisfies ExamDocument;
  });
}

interface ResizerData {
  exams: ResizerExamSpec[];
  categories: ResizerCategory[];
  officialRequirements: Record<string, ExamOfficialRequirements>;
}

// Module-level cache: every build only ever needs to load this once, no
// matter how many pages/components ask for it — subsequent calls within the
// same build reuse the same in-flight/resolved promise instead of re-hitting
// the API.
let cache: Promise<ResizerData> | null = null;

export function getResizerData(): Promise<ResizerData> {
  if (!cache) {
    cache = loadResizerData();
  }
  return cache;
}

// A plain Promise.all here fires every detail request at once — fine
// against a real production server, but Next's static build runs several
// worker processes in parallel (each with its own copy of this module's
// cache), so the true concurrency hitting the backend is a multiple of
// this list's length. Bounded concurrency keeps that reasonable for any
// backend, not just to work around a specific local server's limits.
const DETAIL_FETCH_CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function loadResizerData(): Promise<ResizerData> {
  const list = await apiGet<ApiToolExamListItem[]>("/tools/resizer/exams");

  const details = await mapWithConcurrency(list, DETAIL_FETCH_CONCURRENCY, (item) =>
    apiGet<ApiToolExamDetail>(`/tools/resizer/exams/${item.public_slug}`),
  );

  const exams: ResizerExamSpec[] = [];
  const officialRequirements: Record<string, ExamOfficialRequirements> = {};
  const categoriesBySlug = new Map<string, ResizerCategory>();

  for (const detail of details) {
    const dataPhoto = toLocalSpec(detail.data?.photoSpec);
    const dataSignature = toLocalSpec(detail.data?.signatureSpec);
    const reqThumb = detail.data?.officialRequirements?.thumb ?? undefined;
    const dataThumb = reqThumb ? toLocalSpec(reqThumb as ApiSpec) : undefined;

    const documents = buildDocuments(detail, dataPhoto, dataSignature, dataThumb);
    const docSpec = (type: ExamDocumentType) => documents.find((d) => d.type === type)?.spec ?? undefined;

    // Cards/search/FAQs still want one photo-like spec and one signature-like
    // spec per exam: the exam's own documents win, then data_json.
    const photoSpec = docSpec("photo") ?? dataPhoto ?? documents.find((d) => d.spec)?.spec ?? undefined;
    const signatureSpec = docSpec("signature") ?? dataSignature ?? photoSpec;

    if (!photoSpec || !signatureSpec) {
      // A tool_exam row that hasn't had its documents / data_json filled in
      // yet on the backend — skip it rather than build a spoke page with
      // missing specs; it'll appear automatically once the sheet is updated
      // and re-synced.
      continue;
    }

    const categoryLabel = detail.category?.label ?? "Other";
    const exam: ResizerExamSpec = {
      slug: detail.public_slug,
      shortName: detail.exam.short_name,
      fullName: detail.exam.full_name,
      category: categoryLabel,
      photoSpec,
      signatureSpec,
      documents,
    };
    exams.push(exam);

    const categorySlug = slugifyCategory(categoryLabel);
    const category = categoriesBySlug.get(categorySlug);
    if (category) {
      category.exams.push(exam);
    } else {
      categoriesBySlug.set(categorySlug, { slug: categorySlug, label: categoryLabel, exams: [exam] });
    }

    const req = detail.data?.officialRequirements;
    if (req?.photo && req?.signature) {
      const photoCard: OfficialRequirementCard = {
        ...photoSpec,
        format: documents.find((d) => d.type === "photo")?.format ?? detail.data?.photoSpec?.format ?? "jpg",
        rulesLabel: req.photo.rulesLabel,
        rulesText: req.photo.rulesText,
        generalRequirements: req.photo.generalRequirements,
      };
      const signatureCard: OfficialRequirementCard = {
        ...signatureSpec,
        format: documents.find((d) => d.type === "signature")?.format ?? detail.data?.signatureSpec?.format ?? "jpg",
        rulesLabel: req.signature.rulesLabel,
        rulesText: req.signature.rulesText,
        generalRequirements: req.signature.generalRequirements,
      };

      // Third "Thumb Impression" card only when the exam actually has a left
      // thumb document AND its official-requirements text for it.
      const thumbSpec = docSpec("left_thumb");
      const thumbCard: OfficialRequirementCard | undefined =
        thumbSpec && req.thumb?.rulesText
          ? {
              ...thumbSpec,
              format: documents.find((d) => d.type === "left_thumb")?.format ?? "jpg",
              rulesLabel: req.thumb.rulesLabel ?? "Rules",
              rulesText: req.thumb.rulesText,
              generalRequirements: req.thumb.generalRequirements,
            }
          : undefined;

      officialRequirements[detail.public_slug] = {
        administeringBody: req.administeringBody,
        photo: photoCard,
        signature: signatureCard,
        ...(thumbCard ? { thumb: thumbCard } : {}),
      };
    }

  }

  // Same collision guard resizerExams.ts used to assert at module load for
  // the hardcoded array — exam and category slugs share one flat URL
  // namespace (src/app/resizer/[slug]/page.tsx), so this still has to hold
  // for API-sourced data too. Checked once over the complete sets rather
  // than per-iteration, since a category discovered late could still
  // collide with an exam slug seen earlier.
  const examSlugs = new Set(exams.map((e) => e.slug));
  const collidingSlug = [...categoriesBySlug.keys()].find((slug) => examSlugs.has(slug));
  if (collidingSlug) {
    throw new Error(
      `toolsApi: category slug "${collidingSlug}" collides with an exam slug of the same name — rename one in the backend data.`,
    );
  }

  return { exams, categories: [...categoriesBySlug.values()], officialRequirements };
}

// ── Age eligibility calculator ───────────────────────────────────────────
// Same backend, same build-time-only/no-fallback rules as the resizer above,
// but for the `age-calculator` tool: /tools/age-calculator/exams (list) and
// /tools/age-calculator/exams/{public_slug} (detail, whose `data` blob holds
// group/year/qualification/categories/specialRelaxations/importantNotes/faqs).

interface ApiAgeCategory {
  name: string;
  minAge: number;
  maxAge: number | null;
  relaxation: string;
}

interface ApiAgeExamDetail extends ApiToolExamListItem {
  data: {
    group?: string;
    year?: number;
    qualification?: string;
    categories?: ApiAgeCategory[];
    specialRelaxations?: string[];
    importantNotes?: string[];
    faqs?: { q: string; a: string }[];
  } | null;
}

// The backend stores a category by display name only; the UI needs a stable
// key for the category dropdown and the row colour (see categoryTone in
// AgeEligibilityPage.tsx: general / obc / sc_st / pwd / ex_servicemen).
function ageCategoryKey(name: string, used: Set<string>): string {
  const n = name.toLowerCase();
  let key: string;
  if (n.includes("general")) key = "general";
  else if (n.startsWith("obc")) key = "obc";
  else if (n.startsWith("sc")) key = "sc_st";
  else if (n.includes("pwd")) key = "pwd";
  else if (n.includes("ex-serviceman") || n.includes("ex serviceman") || n.includes("ex-servicemen")) key = "ex_servicemen";
  else key = n.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "category";

  // Keep keys unique within one exam (they are React keys and <select> values).
  let unique = key;
  for (let i = 2; used.has(unique); i++) unique = `${key}_${i}`;
  used.add(unique);
  return unique;
}

let ageCache: Promise<AgeEligibilityData> | null = null;

export function getAgeEligibilityData(): Promise<AgeEligibilityData> {
  if (!ageCache) {
    ageCache = loadAgeEligibilityData();
  }
  return ageCache;
}

interface ApiCategoryItem {
  category_slug: string;
  label: string | null;
  icon: string | null;
  sort_order: number;
}

const AGE_LOCALES: AgeLocale[] = ["en", "hi", "mr"];

async function loadAgeCategories(locale: AgeLocale): Promise<AgeCategory[]> {
  const rows = await apiGet<ApiCategoryItem[]>(`/tools/age-calculator/categories?filter[is_active]=1&sort=sort_order&locale=${locale}`);
  return rows.map((c) => ({
    slug: c.category_slug,
    label: c.label ?? c.category_slug,
    icon: c.icon,
    sortOrder: c.sort_order,
  }));
}

async function loadAgeEligibilityData(): Promise<AgeEligibilityData> {
  const list = await apiGet<ApiToolExamListItem[]>("/tools/age-calculator/exams");

  const details = await mapWithConcurrency(list, DETAIL_FETCH_CONCURRENCY, (item) =>
    apiGet<ApiAgeExamDetail>(`/tools/age-calculator/exams/${item.public_slug}`),
  );

  const exams: AgeEligibilityExam[] = [];

  for (const detail of details) {
    const data = detail.data;

    // An exam row whose data_json isn't filled in yet has nothing to
    // calculate against (the calculator needs at least one category) — skip
    // it, same as the resizer does; it appears once the sheet is synced.
    if (!data?.categories?.length) continue;

    const usedKeys = new Set<string>();

    exams.push({
      slug: detail.public_slug,
      shortName: detail.exam.short_name,
      fullName: detail.exam.full_name,
      conductingBody: detail.exam.conducting_body ?? "",
      // The exam's category in the backend is the source of truth for its
      // group; data.group (a display name) is only a fallback.
      group: detail.category?.category_slug ?? (data.group ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      year: data.year ?? new Date().getFullYear(),
      popularRank: detail.popular_rank ?? null,
      categories: data.categories.map(
        (c): AgeCategoryRow => ({
          key: ageCategoryKey(c.name, usedKeys),
          label: c.name,
          minAge: c.minAge,
          maxAge: c.maxAge,
          relaxation: c.relaxation,
        }),
      ),
      qualification: data.qualification ?? "",
      specialRelaxations: data.specialRelaxations ?? [],
      importantNotes: data.importantNotes ?? [],
      faqs: data.faqs ?? [],
    });
  }

  const categoryLists = await Promise.all(AGE_LOCALES.map((l) => loadAgeCategories(l)));
  const categories = Object.fromEntries(AGE_LOCALES.map((l, i) => [l, categoryLists[i]])) as Record<AgeLocale, AgeCategory[]>;

  return { exams, categories };
}
