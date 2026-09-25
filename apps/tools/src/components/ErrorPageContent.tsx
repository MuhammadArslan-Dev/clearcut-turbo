"use client";

import { useRouter } from "next/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";

// The 404 / 500 screens for the tools app, built from the shared PageNotFound
// (same component blog and landing render). `homeHref="/"` is prefixed with
// this app's basePath by next/link, so "Go to Home Page" lands on /tools.
export default function ErrorPageContent({ variant }: { variant: "404" | "500" }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <PageNotFound
        onGoBack={() => router.back()}
        {...(variant === "500"
          ? {
              code: "500",
              title: "Something went wrong",
              description: "An unexpected error occurred. Please reload the page or try again in a moment.",
            }
          : {})}
      />
    </div>
  );
}
