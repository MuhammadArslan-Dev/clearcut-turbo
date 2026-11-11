import TargetPage from "@/components/features/target/TargetPage";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: Locale; courseId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function Page({ params }: Props) {
  const { courseId } = await params;
  return <TargetPage courseId={courseId} />;
}
