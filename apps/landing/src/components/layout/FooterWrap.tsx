import Footer from "./Footer";
import { getAlternativesList } from "@/lib/api/cms";
import type { AlternativeSummary } from "@/types/cms";

// Server component: fetches the Alternatives list here (not in Footer.tsx,
// which is a client component) and hands it down as a prop. New pages show
// up automatically — nothing to edit in the footer itself.
//
// The footer renders on every page, but this list is a non-critical "related
// content" widget, not the page's actual content (unlike compare/alternatives
// detail pages, where missing CMS data means there's genuinely nothing to
// show and should keep failing loudly). A CMS outage here shouldn't take
// down every page on the site — degrade to an empty list instead.
export default async function FooterWrap() {
  let alternatives: Awaited<ReturnType<typeof getAlternativesList>> = [];
  try {
    alternatives = await getAlternativesList(6);
  } catch (err) {
    console.error("FooterWrap: failed to load alternatives list", err);
  }

  // Footer is a client component, so whatever it receives is serialized into
  // every page's RSC payload. The CMS returns full documents (rich text
  // included); a footer link only ever needs these fields.
  const links: AlternativeSummary[] = alternatives.map(({ id, slug, competitorName, hero }) => ({
    id,
    slug,
    competitorName,
    hero: { title: hero?.title },
  }));

  return (
    <div>
      <Footer alternatives={links} />
    </div>
  );
}
