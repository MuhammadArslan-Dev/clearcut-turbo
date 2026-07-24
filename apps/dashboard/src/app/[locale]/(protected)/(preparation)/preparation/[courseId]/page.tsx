import PreparationPage from "@/components/features/preparation/pages/preparationPage";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
type Props = {
  params: {
    locale: Locale;
    courseId: string;
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
export default async function page({ params, }: Props) {
  const { locale,courseId } = await params;

  return (
    <div className="space-y-6">
      <PreparationPage courseId={courseId} />
    </div>
  );
}
