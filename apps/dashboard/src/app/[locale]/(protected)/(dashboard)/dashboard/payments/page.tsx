import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import React from 'react'
type Props = {
  params: { locale: Locale };
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PaymentsPage" });

  return {
    title: t("metaTitle"),        // e.g. "Settings | ClearCutoff"
    description: t("metaDescription"),
  };
}
export default function page() {
  return (
    <div>Payments</div>
  )
}
