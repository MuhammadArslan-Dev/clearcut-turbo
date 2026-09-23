import Text from "@clearcut/ui/text";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import type { Locale } from "@/lib/dictionary";

/**
 * Server-rendered explanation of the Syllabus Tracker. The tracker itself is
 * a client-only app (exam data comes from a live API in the browser), so
 * without this the static HTML of /syllabus-tracker has no indexable text
 * beyond the site header/footer — search and AI crawlers that don't run
 * JavaScript would see an empty page. Sits below the tracker so the tool's
 * own layout is untouched. The title is the page's <h1> in the static HTML (the
 * tracker's own step headings only exist after hydration, so without it a
 * non-JS crawler sees no heading at all).
 */
export default function SyllabusAbout({ locale = "en" }: { locale?: Locale }) {
  const t = getSyllabusStrings(locale);

  return (
    <section className="max-w-[820px] mx-auto px-4 md:px-6 py-12">
      <Text as="h1" variant="heading-large" weight="bold" color="gray-normal">
        {t.aboutTitle}
      </Text>
      <Text as="p" variant="body-medium" color="gray-muted" className="mt-3">
        {t.aboutBody}
      </Text>
      <Text as="h2" variant="body-large" weight="semibold" color="gray-normal" className="mt-6">
        {t.howTitle}
      </Text>
      <ol className="mt-2 list-decimal pl-5 flex flex-col gap-1.5">
        {t.howSteps.map((step) => (
          <li key={step}>
            <Text as="span" variant="body-medium" color="gray-muted">
              {step}
            </Text>
          </li>
        ))}
      </ol>
    </section>
  );
}
