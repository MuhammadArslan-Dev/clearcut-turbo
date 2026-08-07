import React from "react";
import MainContent from "../../../../../../components/features/exam/pages/mainContent";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Locale } from "next-intl";
type Props = {
  params: {
    locale: Locale;
    examId: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardPage" });

  return {
    title: t("metaTitle"), // e.g. "Settings | ClearCutoff"
    description: t("metaDescription"),
  };
}
export default async function page({ params }: Props) {
    const { locale,examId } = await params;

  return (
    <>
      <MainContent examId={examId} />
    </>
  );
}
