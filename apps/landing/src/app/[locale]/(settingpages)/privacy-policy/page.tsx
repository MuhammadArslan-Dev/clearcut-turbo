import Header from "@/components/layout/headers/Header";
import SectionBlock from "@/components/sectionblock";
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@clearcut/ui/json-ld";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clearcutoff.in" },
    { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://clearcutoff.in/privacy-policy" },
  ],
};

const data = `<p><div>Account Deletion<br /><br />Users can request deletion of their Clear Cutoff account and associated personal data by visiting the following page:<br /><a href="https://www.clearcutoff.in/account-delete">https://www.clearcutoff.in/account-delete</a></div> <br /> <span style="font-weight: 400;">We at Clear Cutoff, under Rohit Dalal (&ldquo;the Company/Clear Cutoff/we/us&rdquo;) is committed to protecting the privacy and security of your personal information. Keeping your personal information secure and using it solely for activities related and relevant to our business is the top priority of Clear Cutoff.</span></p>
<p><span style="font-weight: 400;">In this policy, &ldquo;personal information&rdquo; means any data about an individual who is identifiable by or in relation to such data.</span></p>
<p><span style="font-weight: 400;">This privacy policy (&ldquo;Policy&rdquo;) is to provide you with a timely notice at the time of or before collecting your personal information about the different ways we may collect, use, process, disclose and share the collected personal information about you. This Policy also describes the different grounds basis which we process this personal information. Please note that this Policy has to be read in conjunction with our </span><a href="https://www.clearcutoff.in/terms-and-conditions"><span style="font-weight: 400;">Terms of Use</span></a><span style="font-weight: 400;">. This Policy applies to your interaction with our website/ app and affiliated services (&ldquo;Platforms&rdquo;), wherever this Policy has been published. This Policy does not apply to those affiliates and partners that have their own privacy policy.</span></p>
<p><span style="font-weight: 400;">We will update this Policy from time to time to reflect changes in our practices or relevant laws. Whenever this Policy is changed, the date at the top of the policy will notify you of the change. In some cases, we may also notify you of the relevant changes by email, in website/ app notifications, or through other appropriate means. We encourage you to review this Policy regularly to make sure that you understand your relationship with Clear Cutoff and the ways we may collect, use, process, disclose and share personal information about you.</span></p>
<p><span style="font-weight: 400;">Any capitalised terms not defined hereunder shall hold the same definition as provided under the Terms of Use.</span></p>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Personal Information Collected</span><span style="font-weight: 400;"><br /></span><span style="font-weight: 400;">The following personal information is collected by or on behalf of us:</span></li>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Information provided to us/ collected by us directly: We collect personal information for the purpose of registering your account, when you contact us via a form, email or any other manner, information to personalise your usage of the Platforms or upgrade features and functionalities of the Platforms, market and advertise, maintain safety of the Platforms, and comply with applicable laws. Please note that within this Policy, &ldquo;applicable laws&rdquo; include laws applicable to our business and operations together with any other requirements that we believe in our best faith judgement to be necessary for defending or preparing to defend a legal right or claim.</span><span style="font-weight: 400;"><br /></span><span style="font-weight: 400;">We also collect other personal information in the course of your interactions with our Platforms and utilising our services, such as those reflecting your preferences, or when you make a purchase or payment. Kindly note that some features may be restricted, unavailable or unusable if you choose not to provide certain information. The following personal information falls within the category of information provided to us or collected by us directly:</span></li>
<ul>
<li style="font-weight: 400;"><span style="font-weight: 400;">Full Name (first and last names)</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Phone number</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Email address</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Transaction history on our platform</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Information provided voluntarily through different means of communication, such as comments, or any other publicly available forums for interactions.</span></li>
</ul>
<li style="font-weight: 400;"><span style="font-weight: 400;">Information collected from other sources and third parties: We may collect personal information about you from publicly available sources, or third parties. This may be done to further personalise your use of the Platforms, or provide you with additional tools and functionalities. Whenever a third party tool, content, or link is provided on our Platforms, or whenever third parties host our tools, contents, or links, we may request such third parties to provide some information such as user ID, information about your interests and preferences, and other service related information. Such third parties will share the information based on their privacy practices. As an example, please consider when you interact with a video or post posted by us on a social networking platform, we may access or request certain information about you such as your username, time spent by you on the post, interactions with the post, and any other information that is relevant to our services.</span></li>
</ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Using the Personal Information Collected: Similar to and connected with purposes for which we may collect personal information, we set out below the existing and proposed or expected purposes for which the personal information may be used:</span></li>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Creating, verifying, and managing user accounts and features.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Providing services and any support connected to the services (such as those related to conducting tests and exams, purchasing courses and study materials, etc.).</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Developing, delivering, and updating or improving services and functionalities with or without other third-party partners.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Showing you relevant information, advertisements or other marketing materials about our products and services or that of third parties, based on our inferences of your preferences and interests.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Assessing the performance of our tools and other advertisements or marketing materials.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Conducting data analytics for purposes such as understanding and improving the most common needs of our users.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Complying with legal and contractual obligations, such as resolving complaints, disputes and queries.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">For other necessary business purposes such as impact assessments, audits, etc.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Draft for discussion purposes only Privileged and confidential</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Preventing fraudulent, illegal and other harmful actions such as abuse and security incidents on or against our Platforms.</span></li>
</ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Sharing and Disclosure of Personal Information: It is crucial for running our Platform and providing you with the services that we share and disclose some of the personal information about you. As such, you understand and agree that this is done to comply with or satisfy crucial legal, contractual, or business and commercial obligations, or any other purpose that is necessary for and in respect of our services. The following are some of the reasons for and parties with which we share such information:</span></li>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Our group of companies for the purposes mentioned in this Privacy Policy.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Service providers, business partners, and other contractors either seek some information that enables them to provide their services, or when a portion of the personal information has to be processed for a specific purpose by another party such as payment gateways, cloud service providers, and data analytics providers.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">With technical, legal, financial and other advisors to prevent any fraud, wrong, dispute, abuse, breach, or for providing advice in relation to the running of our business which is related to these services.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">With advertising and marketing service providers, and with third-parties that advertise on our Platforms or through us, to enable us to understand what products and services may suit your preferences and customise the marketing campaigns accordingly. The processing and sharing of this information by third parties may involve integrating this information with any other data or information and will be subject to their own privacy practices and terms of use.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Social networking platforms when you interact with any of their widgets or links placed on our platforms or when our content or part of the service is available on a social networking platform.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Other third parties when their services have to be made available through our Platforms, or if they assist us in advertising our services to you, or when a co-branded, co-sponsored or any collaborative product or service is made available to you through our platform or otherwise.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">With specified parties for very specific purposes, with your specific consent for such purposes, such as when you need us to share information about your overall marks, scores, and overall performance report with someone.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Others as per the applicable law, or when necessitated under a court order or process, or orders by any other governmental or non-governmental authority to honour or defend ours, yours, or the rights of others.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Parties we interact with in a corporate transaction such as a merger or acquisition, business or asset transfers, any reorganisation, etc.</span></li>
</ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Your rights: In your interactions with us, you have certain rights under the legal regime concerning data protection and privacy in India. You can request:</span></li>
<ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">To have the personal information provided by you corrected, completed, or updated. Please note that most of these activities can be done within your registered account in Clear Cutoff by selecting the &ldquo;Edit Profile&rdquo; section. For any other changes or additions, you can write to us at the email address provided within this Policy.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Wherever your personal information was collected and processed with your consent, you also have the right to review or revoke your consent. Please note that the consequences of such withdrawal may be the termination of one or all functionalities or services.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Redressal of your grievances in relation to anything contained within this Policy, such as if you have any trouble exercising a right, or have a complaint regarding how your data has been used. Please read the paragraph on Grievance Redressal within this Policy.</span></li>
</ol>
<li style="font-weight: 400;"><span style="font-weight: 400;">Deletion and Retention Statement: You are allowed to delete your user account that is created at the time of registration. To delete, the functionalities are available to you within your user account. Following your exercise of such right, we delete all information related to your account that contains your personal information, including transaction history or details related to your preferences, that is not required to be retained for a legitimate business interest or as per the applicable laws. Legitimate business interests may involve preventing fraud and other illegal activities on the platform or enhancing the overall safety of users on the Platform. For detailed instructions on account delete, please visit: <a href="https://www.clearcutoff.in/account-delete">https://www.clearcutoff.in/account-delete</a></span> </li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Cookie policy: We use technologies like cookies, which can be understood as small record-keeping files created and stored on your device used to access the Platform, to automatically collect certain information. This information may include technical details about the device used to access the Platforms like device identifiers, IP addresses, and others, together with information related to your preferences, progress within a task or service, saved settings, and other records that assist in recognising and personalising your usage of and interaction with our Platform and services. Cookies also help us in analysing our Platform operations. You understand that most of the functionalities offered by the cookies are crucial to the effective operation of the Platform and by accessing our Platform, you agree to the placement of cookies on your device. Please note that there may be certain features provided by third parties with the use of their own cookies which are guided by their own privacy practices and cookie policies for which Clear Cutoff is not responsible. Please also note that you can change or manage your browser or device settings to block, delete, or manage cookies, in which cases certain features and services we offer may not work as intended.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Security and Compliance: We maintain appropriate administrative, technical, and physical safeguards to protect your personal information from accidental, unlawful, or unauthorised destruction, loss, alteration, access, disclosure, or use and other unlawful forms of processing. We follow the extant standard encryption norms for the transmission and exchange of information on our Platform. We also ensure that our employees and other staff members respect the privacy and confidentiality of any personal information held by us.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Grievance Redressal: In the event that you have a grievance regarding this Policy or the manner in which we use or process your personal information or any discrepancies are faced by you while exercising a right, please do not hesitate to reach out to our Grievance Redressal Officer at the details below:</span><span style="font-weight: 400;"><br /></span><span style="font-weight: 400;">Name of the Grievance Redressal Officer: Ganesh Jaiswal, Contact: </span><a href="mailto:hi@clearcutoff.in"><span style="font-weight: 400;">hi@clearcutoff.in</span><span style="font-weight: 400;"><br /></span></a><span style="font-weight: 400;">Please note that all grievances will be addressed and aimed to be solved as early as possible and within 15 (fifteen) days from the date of receipt of the grievance within our systems.</span></li>
<li style="font-weight: 400;"><span style="font-weight: 400;">Contact Us: If you have any questions related to, or need to exercise a right as per this Policy, please reach out to us at </span><a href="mailto:hi@clearcutoff.in"><span style="font-weight: 400;">hi@clearcutoff.in</span></a><span style="font-weight: 400;"> or on WhatsApp support </span><a href="https://wa.me/917210708599"><span style="font-weight: 400;">7210708599</span></a><span style="font-weight: 400;">.</span></li>
</ol>
<p>&nbsp;</p>`;

// SEO for this page
export const metadata: Metadata = {
  title: "Privacy Policy | Clear Cutoff",
  description:
    "Read Clear Cutoff's privacy policy. Learn how we collect, use, and protect your personal data when you use our teaching exam preparation platform.",
  keywords: ["privacy policy", "Clear Cutoff", "data protection", "personal information"],
  alternates: {
    canonical: "https://clearcutoff.in/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Clear Cutoff",
    description:
      "Read Clear Cutoff's privacy policy. Learn how we collect, use, and protect your personal data.",
    url: "https://clearcutoff.in/privacy-policy",
    siteName: "Clear Cutoff",
    type: "website",
    images: [
      {
        url: "https://www.clearcutoff.in/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clear Cutoff — Privacy Policy",
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
      <JsonLd data={breadcrumbSchema} />
      <Suspense fallback={null}>
        <Header linkShow={false} />
        {/* content section  */}
        <SectionBlock
          padding="custom"
          margin="custom"
          className="px-6 md:px-[210px] py-[32px]"
        >
          <p className="heading-large !font-semibold text-text-gray-normal">
            {"Privacy Policy"}
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
