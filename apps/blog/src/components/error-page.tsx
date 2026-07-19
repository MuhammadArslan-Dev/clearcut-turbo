"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";
import { IMAGES } from "@/constants/images";

// Rendered by both apps/blog/src/app/not-found.tsx (root-level, outside
// [locale]) and apps/blog/src/app/[locale]/global-error.tsx (which, per
// Next.js's global-error contract, replaces the entire app shell — root
// layout included — when active). Neither has a NextIntlClientProvider
// ancestor, so this deliberately uses plain next/navigation instead of
// blog's locale-aware @/i18n/navigation: there is no reliable "current
// locale" to preserve for a route that didn't even match [locale], and
// using the locale-aware router here crashes at build time (no i18n
// context to read from). PageNotFound's own default HomeLinkComponent
// (next/link) is exactly right for this case — no override needed.
export default function ErrorPage() {
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
