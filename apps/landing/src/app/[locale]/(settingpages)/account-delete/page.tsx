// import Footer from "@/app/components/footer/footer";
import Header from "@/components/layout/headers/Header";
import SectionBlock from "@/components/sectionblock";
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

const data = `How to Delete Your Clear Cutoff Account<br />Clear Cutoff allows users to permanently delete their account and associated personal data.<br />You can delete your account directly from within the Clear Cutoff mobile application or by contacting our support team as described below.<br /><br />Option 1: Delete Account from the App (Recommended)<br />If you have access to the Clear Cutoff app, you can delete your account instantly by following these steps:<br />Open the <strong>Clear Cutoff</strong> app<br />Go to <strong>Profile</strong></div>
<ol data-list-tree="true" data-indent="0" data-border="0">
<li>Tap on <strong>Delete Account</strong></li>
<li>Confirm the deletion request</li>
</ol>
<div>Once confirmed, your account deletion request is initiated.<br /><br />Option 2: Request Account Deletion by Email<br />If you are unable to access the app, you can request account deletion by email.<br /><strong>Steps:</strong><br />1. Send an email from your registered email address to:<br /><strong><a href="mailto:hi@clearcutoff.in" target="_blank" rel="noopener noreferrer" data-sk="tooltip_parent">hi@clearcutoff.in</a></strong><br />2. Use the subject line:<br /><strong>Account Deletion Request &ndash; Clear Cutoff</strong><br />3. Include the following details in the email:<br />Registered mobile number or user ID<br />Reason for deletion (optional)<br />Our support team will verify your request and process the deletion.<br /><br />Data Deletion Timeline<br />After verification, your Clear Cutoff account and associated personal data will be permanently deleted within <strong>7 to 30 days</strong>.<br /><br />Data That Will Be Deleted<br />The following data will be permanently deleted:</div>
<ul data-list-tree="true" data-indent="0" data-border="0">
<li>User profile information</li>
<li>Login credentials</li>
<li>App usage data</li>
<li>Any personal data linked to your account</li>
</ul>
<div><br /><br />Data That May Be Retained<br />Certain data may be retained for legal, regulatory, or compliance purposes, if applicable:</div>
<ul data-list-tree="true" data-indent="0" data-border="0">
<li>Transaction records</li>
<li>Legal or audit logs</li>
</ul>
<div>Any retained data is securely stored and not used for any other purpose.<br /><br />Important Notes</div>
<ul data-list-tree="true" data-indent="0" data-border="0">
<li>Account deletion is <strong>permanent</strong> and cannot be undone.</li>
<li>Once deleted, you will no longer be able to access your Clear Cutoff account.</li>
<li>If you reinstall the app, you will need to create a new account.</li>
</ul>
<div><br /><br />Contact Information<br />If you have any questions regarding account or data deletion, you may contact us at:<br /><strong>Email:</strong> <a href="mailto:hi@clearcutoff.in" target="_blank" rel="noopener noreferrer" data-sk="tooltip_parent">hi@clearcutoff.in</a><br /><strong>App Name:</strong> Clear Cutoff<br /><strong>Developer:</strong> Clear Cutoff App</div>`;

// SEO for this page
export const metadata: Metadata = {
  title: "Account & Data Deletion Request | Clear Cutoff",
  description:
    "Request permanent deletion of your Clear Cutoff account and personal data. Delete via the app or email hi@clearcutoff.in. Data is removed within 7–30 days.",
  keywords: [
    "account deletion",
    "delete account",
    "Clear Cutoff account deletion",
    "Clearcutoff delete account",
    "user data deletion",
    "delete Clear Cutoff account",
    "request account deletion",
    "Clear Cutoff data deletion",
    "remove user account",
    "close Clear Cutoff account",
    "delete app account",
    "account removal request",
  ],
  alternates: {
    canonical: "https://clearcutoff.in/account-delete",
  },
  openGraph: {
    title: "Account & Data Deletion Request | Clear Cutoff",
    description:
      "Request permanent deletion of your Clear Cutoff account and personal data. Data is removed within 7–30 days.",
    url: "https://clearcutoff.in/account-delete",
    siteName: "Clear Cutoff",
    type: "website",
    images: [
      {
        url: "https://www.clearcutoff.in/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clear Cutoff — Account Deletion",
      },
    ],
  },
};

export default async function ContactUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div>
      <Suspense fallback={null}>
        <Header linkShow={false} />
        {/* content section  */}
        <SectionBlock
          padding="custom"
          margin="custom"
          className="px-6 md:px-[210px] py-[32px]"
        >
          <p className="heading-large !font-semibold surface-text-gray-normal">
            {"Clear Cutoff – Account & Data Deletion Request"}
          </p>
          <div
            className=" body-medium custom"
            dangerouslySetInnerHTML={{ __html: data }}
          />
        </SectionBlock>
      </Suspense>
    </div>
  );
}
