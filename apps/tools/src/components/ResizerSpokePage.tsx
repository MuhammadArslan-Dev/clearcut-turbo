import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ToolBreadcrumbs from "./ToolBreadcrumbs";
import ResizeImageTool from "./ResizeImageTool";
import FAQAccordion, { AccordionItem } from "./FAQAccordion";
import RecentExamTracker from "./RecentExamTracker";
import { FadeIn } from "./motion";
import { ResizerExamSpec, getCategoryForExam, getExamFaqs } from "@/lib/resizerExams";
import Link from "next/link";

function SpecTable({ exam }: { exam: ResizerExamSpec }) {
  const rows = [
    { label: "Photo", spec: exam.photoSpec },
    { label: "Signature", spec: exam.signatureSpec },
  ];

  return (
    <div className="max-w-[620px] mx-auto w-full overflow-x-auto rounded-2xl border border-[var(--color-border-gray-subtle)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand/5">
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">Document</th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">Dimensions</th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">File size</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-[var(--color-border-gray-subtle)]">
              <td className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{row.label}</td>
              <td className="px-4 py-3 body-medium text-text-gray-muted">
                {row.spec.widthPx}×{row.spec.heightPx}px
              </td>
              <td className="px-4 py-3 body-medium text-text-gray-muted">
                {row.spec.minKB}–{row.spec.maxKB}KB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Spoke page — one dynamic template (src/app/[examSlug]/page.tsx) rendering
 * this same component for every exam in resizerExams.ts, not a separate
 * hardcoded page per exam. Same tool as the hub (ResizeHubPage), plus an
 * exam-specific spec table and FAQ section.
 */
export default function ResizerSpokePage({ exam }: { exam: ResizerExamSpec }) {
  const faqItems: AccordionItem[] = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec).map((faq, i) => ({
    id: `faq-${i}`,
    title: faq.q,
    content: faq.a,
  }));
  const category = getCategoryForExam(exam);

  return (
    <div>
      <RecentExamTracker exam={exam} />
      <SiteHeader />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-[1080px] mx-auto px-2 mb-6">
          <ToolBreadcrumbs
            items={[
              { name: "Home", url: "/" },
              ...(category ? [{ name: category.label, url: `/${category.slug}` }] : []),
              { name: exam.shortName },
            ]}
          />
        </div>

        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-large md:!text-[40px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {`${exam.shortName} Photo & Signature Resizer`}
          </h1>
          <p className="body-medium text-text-gray-muted">
            Resize and compress your photo or signature to the {exam.shortName} ({exam.fullName}) application-form
            requirements — processed right in your browser, nothing is ever uploaded.
          </p>
        </FadeIn>

        <ResizeImageTool photoSpec={exam.photoSpec} signatureSpec={exam.signatureSpec} />

        <div className="mt-16 md:mt-20 flex flex-col items-center gap-4">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center">
            {`${exam.shortName} photo & signature specifications`}
          </h2>
          <SpecTable exam={exam} />
        </div>

        <div className="mt-16 md:mt-20 max-w-[720px] mx-auto">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center mb-6">
            {`${exam.shortName} resizer — FAQs`}
          </h2>
          <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
        </div>

        <div className="mt-10 text-center">
          <Text as="p" variant="body-small" color="gray-muted">
            Preparing for a different exam?{" "}
            <Link href="/" className="text-brand font-semibold">
              Use the general resizer
            </Link>
          </Text>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
