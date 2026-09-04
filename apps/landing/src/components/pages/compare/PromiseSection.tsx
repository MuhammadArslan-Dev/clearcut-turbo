import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import { Link } from "@/i18n/navigation";
import type { CmsCtaBlock } from "@/types/cms";

export default function PromiseSection({ promise }: { promise?: CmsCtaBlock & { body?: string } }) {
  if (!promise?.title && !promise?.body) return null;

  return (
    <Section sectionId="promise" bgColor="bg-background-gray-subtle" padding="py-ym-section md:py-yd-section px-3">
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
        {promise.title && (
          <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
            {promise.title}
          </Text>
        )}
        {promise.body && (
          <Text as="p" variant="body-large" color="gray-subtle">
            {promise.body}
          </Text>
        )}
        {promise.ctaLabel && (
          <Link href={promise.ctaUrl || "#"} className="mt-2">
            <Button size="lg">{promise.ctaLabel}</Button>
          </Link>
        )}
      </div>
    </Section>
  );
}
