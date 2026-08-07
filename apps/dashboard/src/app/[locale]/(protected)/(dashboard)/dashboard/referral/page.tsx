import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import ReferralWrap from "@/components/features/referral/ReferralWrap";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ReferralPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function ReferralPage() {
  return (
    <div className="px-3 py-2">
      <ReferralWrap />
    </div>
  );
}
