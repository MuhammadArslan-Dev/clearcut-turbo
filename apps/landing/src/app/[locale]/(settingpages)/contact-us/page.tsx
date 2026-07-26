// import Footer from "@/app/components/footer/footer";
import Header from "@/components/layout/headers/Header";
import SectionBlock from "@/components/sectionblock";
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

const data = `<p>We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, please don't hesitate to get in touch.</p>
                <p>&zwj;<strong>Ways to Reach Us:</strong></p>
                <p><strong>Email:</strong>&nbsp;<a href="mailto:hi@clearcutoff.in">hi@clearcutoff.in</a>&nbsp;(General Inquiries)</p>
                <p><strong>Phone:</strong>&nbsp;+91 7210708599&nbsp;</p>
                <p><strong>Address:</strong>&nbsp;Merton, Omaxe North Avenue, Sector 15, Bahadurgarh, Jhajjar, Haryana, 124507</p>
                <p>&zwj;</p>
                <p><strong>Business Hours:</strong>Monday - Friday: 9:00 AM - 5:00 PM IST</p>
                <p>&zwj;<strong>Connect with us on Social Media:</strong></p>
                <p><strong>&zwj;</strong>Facebook -&nbsp;<a href="https://www.facebook.com/profile.php?id=61568953926452">https://www.facebook.com/profile.php?id=61568953926452</a></p>
                <p><a href="https://www.facebook.com/profile.php?id=61568953926452">&zwj;</a>Instagram -&nbsp;<a href="https://www.instagram.com/clearcutoff_teaching/">https://www.instagram.com/clearcutoff_teaching/&nbsp;</a></p>
                <p><a href="https://www.instagram.com/clearcutoff_teaching/">&zwj;</a><strong>We aim to respond to all inquiries within 24 business hours.</strong></p>   `;

// SEO for this page
export const metadata: Metadata = {
  title: "Contact Us | Clear Cutoff",
  description:
    "Get in touch with Clear Cutoff. Reach us by phone, email, or WhatsApp — Monday to Friday, 9 AM–5 PM IST. We respond within 24 business hours.",
  keywords: ["contact Clear Cutoff", "Clear Cutoff support", "teaching exam help"],
  alternates: {
    canonical: "https://clearcutoff.in/contact-us",
  },
  openGraph: {
    title: "Contact Us | Clear Cutoff",
    description:
      "Get in touch with Clear Cutoff. Reach us by phone, email, or WhatsApp — Monday to Friday, 9 AM–5 PM IST.",
    url: "https://clearcutoff.in/contact-us",
    siteName: "Clear Cutoff",
    type: "website",
    images: [
      {
        url: "https://www.clearcutoff.in/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clear Cutoff — Contact Us",
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
          <p className="heading-large !font-semibold text-text-gray-normal">
            {"Contact Us"}
          </p>
          <div
            className=" body-medium font-normal custom"
            dangerouslySetInnerHTML={{ __html: data }}
          />
        </SectionBlock>
      </Suspense>
    </div>
  );
}
