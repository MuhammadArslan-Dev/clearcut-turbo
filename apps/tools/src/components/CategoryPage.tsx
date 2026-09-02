import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ToolBreadcrumbs from "./ToolBreadcrumbs";
import ExamCard from "./ExamCard";
import ExamSearch from "./ExamSearch";
import { FadeIn, StaggerGrid, StaggerItem } from "./motion";
import { ResizerCategory } from "@/lib/resizerExams";

/**
 * Category spoke — rendered by the same dynamic template as exam pages
 * (src/app/[slug]/page.tsx; category and exam slugs share one flat
 * namespace) for every category derived from resizerExams.ts, mirroring how
 * ResizerSpokePage does one template per exam. Lists every exam in the
 * category via the shared ExamCard (same component the hub page's category
 * list uses), so a card design change only happens in one place.
 */
export default function CategoryPage({ category }: { category: ResizerCategory }) {
  const searchableExams = category.exams.map(({ slug, shortName, fullName, photoSpec }) => ({
    slug,
    shortName,
    fullName,
    photoSpec,
  }));

  return (
    <div>
      <SiteHeader />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-[1080px] mx-auto px-2 mb-6">
          <ToolBreadcrumbs items={[{ name: "Home", url: "/" }, { name: category.label }]} />
        </div>

        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-large md:!text-[40px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {`${category.label} — Photo & Signature Resizer`}
          </h1>
          <p className="body-medium text-text-gray-muted">
            {`Pick your exam below to load its exact photo & signature dimensions — processed right in your browser, nothing is ever uploaded.`}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="max-w-[1080px] mx-auto mb-8">
          <ExamSearch exams={searchableExams} placeholder={`Search within ${category.label}…`} />
        </FadeIn>

        <div className="max-w-[1080px] mx-auto">
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {category.exams.map((exam) => (
              <StaggerItem key={exam.slug}>
                <ExamCard exam={exam} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>

        <div className="mt-10 text-center">
          <Text as="p" variant="body-small" color="gray-muted">
            Looking for a different category?{" "}
            <Link href="/" className="text-brand font-semibold">
              Browse all exams
            </Link>
          </Text>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
