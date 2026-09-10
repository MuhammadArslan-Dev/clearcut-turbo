// Client for the clearcut-tools-backend API (C:\laragon\www\clearcut-tools-backend,
// see that repo's routes/api_v1.php). This app is a static export (see
// next.config.ts) — every call here happens at BUILD TIME only, inside
// generateStaticParams/generateMetadata/page renders, never in the browser.
// There is deliberately no fallback to stale local data if the API is
// unreachable: a build that can't reach the backend fails loudly instead of
// silently shipping outdated exam specs (wrong numbers here could get a real
// candidate's application rejected).

import { ResizerExamSpec, ResizerCategory, slugifyCategory } from "../resizerExams";
import { ExamOfficialRequirements, OfficialRequirementCard } from "../officialRequirements";

const API_BASE = process.env.TOOLS_API_URL ?? "http://clearcut-tools-backend.test/api/v1";

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
}

interface ApiToolExamDetail extends ApiToolExamListItem {
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
    const photoSpec = toLocalSpec(detail.data?.photoSpec);
    const signatureSpec = toLocalSpec(detail.data?.signatureSpec);

    if (!photoSpec || !signatureSpec) {
      // A tool_exam row that hasn't had its data_json filled in yet on the
      // backend — skip it rather than build a spoke page with missing
      // specs; it'll appear automatically once the sheet is updated and
      // re-synced.
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
        format: detail.data!.photoSpec!.format,
        rulesLabel: req.photo.rulesLabel,
        rulesText: req.photo.rulesText,
        generalRequirements: req.photo.generalRequirements,
      };
      const signatureCard: OfficialRequirementCard = {
        ...signatureSpec,
        format: detail.data!.signatureSpec!.format,
        rulesLabel: req.signature.rulesLabel,
        rulesText: req.signature.rulesText,
        generalRequirements: req.signature.generalRequirements,
      };

      // Thumb-impression cards aren't in the API's officialRequirements
      // shape yet (no dimensions source for them there), so an exam that
      // used to show a third "Thumb Impression" card via the old
      // hardcoded STANDARD_THUMB constant just shows Photo + Signature
      // for now — see OfficialRequirements.tsx, which already renders
      // fine with 2 cards.
      officialRequirements[detail.public_slug] = {
        administeringBody: req.administeringBody,
        photo: photoCard,
        signature: signatureCard,
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
