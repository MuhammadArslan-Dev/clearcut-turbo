"use client";

import Image from "next/image";
import { useRouter, Link } from "@/i18n/navigation";
import { PageNotFound, type PageNotFoundProps } from "@clearcut/ui/page-not-found";
import { IMAGES } from "@/constants/images";

// Rendered by apps/blog/src/app/[locale]/not-found.tsx — a route that DID
// match a valid [locale] segment but then found no matching page deeper.
// Unlike error-page.tsx (used by the root-level not-found.tsx and
// global-error.tsx, neither of which has a NextIntlClientProvider
// ancestor), this one runs inside [locale]/layout.tsx's provider tree, so
// it correctly uses blog's locale-aware @/i18n/navigation — matching
// apps/landing/src/components/not-found-content.tsx's equivalent role.
export default function NotFoundContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-10 h-full w-full py-10">
      <Image
        src={IMAGES.logo}
        alt="Clear Cutoff"
        width={220}
        height={48}
        className="h-auto w-[180px] md:w-[220px]"
        priority
      />
      <PageNotFound
        onGoBack={() => router.back()}
        // Blog's local Link (@/i18n/navigation) types `href` against its
        // routing.ts `pathnames` map (a literal union, not `string`), so
        // it doesn't structurally satisfy PageNotFound's generic
        // `HomeLinkComponent` shape even though "/" is a valid pathname
        // here. Same cast used in apps/blog/src/components/error-page.tsx.
        HomeLinkComponent={Link as unknown as PageNotFoundProps["HomeLinkComponent"]}
        illustration={
          <Image
            src={IMAGES.error404}
            alt=""
            width={626}
            height={370}
            className="h-auto max-w-[626px] w-full"
            priority
          />
        }
      />
    </div>
  );
}
