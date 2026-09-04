import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import { Link } from "@/i18n/navigation";
import type { AlternativeDoc } from "@/types/cms";

export default function ArticleHero({ hero }: { hero: AlternativeDoc["hero"] }) {
  return (
    <Section sectionId="article-hero" padding="py-ym-section md:py-yd-section px-3">
      <div className="max-w-3xl mx-auto text-center">
        <Text as="p" variant="body-medium" weight="semibold" className="text-brand mb-2 uppercase tracking-wide">
          {hero.eyebrow || "Alternatives"}
        </Text>
        <Text as="h1" variant="heading-xlarge" weight="bold" color="gray-normal" className="mb-4">
          {hero.title}
        </Text>
        {hero.description && (
          <Text as="p" variant="body-large" color="gray-muted" className="mb-6">
            {hero.description}
          </Text>
        )}
        <Link href={hero.ctaUrl || "/"}>
          <Button size="lg">{hero.ctaLabel || "Try for Free"}</Button>
        </Link>
      </div>
    </Section>
  );
}
