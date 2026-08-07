import BottomNavWrap from "@/components/features/navigation/bottom-bar/dashboard-bar/BottomNavWrap";
import FullScreenLoader from "@/components/FullScreenLoader";
import LearnPage from "@/components/layout/dasbboard/pages/LearnPage";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Learn" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function page() {
  return (
    <>
     <Suspense
        fallback={
          <div className="flex w-full justify-center items-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>{" "}
          </div>
        }
      >
        <LearnPage />
      </Suspense>
      <BottomNavWrap />
    </>
  );
}
