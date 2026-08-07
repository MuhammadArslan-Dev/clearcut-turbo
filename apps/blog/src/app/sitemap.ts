import { MetadataRoute } from "next";
import { formatToSlug } from "@/utils/slugify";
import { resolveExamId } from "@/lib/api/exams";
import { getPostsByExam } from "@/lib/api/posts";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const API = (process.env.BACKEND_URL || "").replace(/\/$/, "");

const ALLOWED_EXAMS = ["ctet"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Homepage (en + hi)
  urls.push(
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/hi`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  );

  // All four reads below use `revalidate: 3600` rather than `cache: "no-store"`.
  //
  // `no-store` made this route un-prerenderable: the production build logged
  // `DYNAMIC_SERVER_USAGE — Route /sitemap.xml couldn't be rendered statically
  // because it used revalidate: 0 fetch`, so the sitemap was rebuilt from
  // scratch, with 4+ backend round trips, on every crawler request.
  //
  // A sitemap is the canonical case for time-based revalidation: it must be
  // reasonably fresh, never per-request. The URL set is unchanged, so indexing
  // behaviour is identical.
  try {
    const examsRes = await fetch(`${API}/blog/exam?status=active`, { next: { revalidate: 3600 } });
    const examsJson = await examsRes.json();
    const exams: any[] = (examsJson?.data || []).filter((e: any) =>
      ALLOWED_EXAMS.includes(e?.short_name?.toLowerCase()),
    );

    for (const exam of exams) {
      const examSlug: string = exam?.short_name?.toLowerCase();
      const examMod = new Date(exam.updatedAt || Date.now());

      // Exam listing page (en + hi)
      urls.push(
        { url: `${BASE_URL}/${examSlug}`, lastModified: examMod, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE_URL}/hi/${examSlug}`, lastModified: examMod, changeFrequency: "weekly", priority: 0.8 },
      );

      // Blog listing + posts (posts live in the Payload CMS, keyed by exam_id).
      urls.push(
        { url: `${BASE_URL}/${examSlug}/blog`, lastModified: examMod, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE_URL}/hi/${examSlug}/blog`, lastModified: examMod, changeFrequency: "weekly", priority: 0.7 },
      );
      const blogExamId = await resolveExamId(examSlug);
      if (blogExamId) {
        const posts = await getPostsByExam(blogExamId, { limit: 1000 });
        for (const post of posts) {
          const pMod = new Date(post.updatedAt || post.publishedDate || Date.now());
          urls.push(
            { url: `${BASE_URL}/${examSlug}/blog/${post.slug}`, lastModified: pMod, changeFrequency: "monthly", priority: 0.7 },
            { url: `${BASE_URL}/hi/${examSlug}/blog/${post.slug}`, lastModified: pMod, changeFrequency: "monthly", priority: 0.6 },
          );
        }
      }

      // Fetch levels and years in parallel
      const [levelsJson, yearsJson] = await Promise.all([
        fetch(`${API}/blog/get-enavigation?parent_id=true`, { next: { revalidate: 3600 } }).then((r) => r.json()),
        fetch(`${API}/blog/get-years?exam_id=${examSlug}`, { next: { revalidate: 3600 } }).then((r) => r.json()),
      ]);

      const levels: any[] = levelsJson?.data || [];
      const years: any[] = yearsJson?.data || [];

      for (const level of levels) {
        const ls: string = level?.slug;
        if (!ls) continue;
        const lMod = new Date(level.updatedAt || Date.now());

        // Level page + subject/year listing pages
        urls.push(
          { url: `${BASE_URL}/${examSlug}/${ls}`, lastModified: lMod, changeFrequency: "weekly", priority: 0.8 },
          { url: `${BASE_URL}/hi/${examSlug}/${ls}`, lastModified: lMod, changeFrequency: "weekly", priority: 0.7 },
          { url: `${BASE_URL}/${examSlug}/${ls}/subject`, lastModified: lMod, changeFrequency: "weekly", priority: 0.7 },
          { url: `${BASE_URL}/${examSlug}/${ls}/year`, lastModified: lMod, changeFrequency: "weekly", priority: 0.7 },
        );

        // Fetch subjects for this level
        const subjectsRes = await fetch(
          `${API}/blog/get-subject?exam_id=${examSlug}&slug=${ls}`,
          { next: { revalidate: 3600 } },
        );
        const subjects: any[] = (await subjectsRes.json()).data || [];

        for (const subject of subjects) {
          const ss: string = subject?.section?.slug;
          if (!ss) continue;
          urls.push({
            url: `${BASE_URL}/${examSlug}/${ls}/subject/${ss}`,
            lastModified: new Date(subject.updatedAt || Date.now()),
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }

        // Year pages per level (years are exam-wide but each level has its own year listing)
        for (const year of years) {
          const ys = formatToSlug((year?.instance_id || "").replace("_", " "));
          if (!ys) continue;
          urls.push({
            url: `${BASE_URL}/${examSlug}/${ls}/year/${ys}`,
            lastModified: new Date(year.updatedAt || Date.now()),
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch (err) {
    console.error("Sitemap generation error:", err);
  }

  return urls;
}
