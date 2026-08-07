"use client";
import { FacebookIcon } from "@clearcut/ui/icons/facebook-icon";
import { LinkedInIcon } from "@clearcut/ui/icons/linked-in-icon";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import PhoneIcon from "@clearcut/ui/icons/phone-icon";
import WhatsappIcon from "../icons/whatsapp-icon";
import { InstagramIcon } from "@clearcut/ui/icons/instagram-icon";
import { LinksList } from "@clearcut/ui/links-list";
import { Link as I18nLink } from "@clearcut/i18n/navigation";
import { useTranslations } from "next-intl";
import type { AlternativeSummary } from "@/types/cms";

export default function Footer({ alternatives }: { alternatives?: AlternativeSummary[] }) {
  const isMobile = useIsMobile();
  const t = useTranslations("footer");
  const f = {
    phone: t("phone"),
    whatsapp: t("whatsapp"),
    privacy: t("privacy"),
    terms: t("terms"),
    refund: t("refund"),
    contact: t("contact"),
    rights: t("rights"),
  };

  const contactLinks = [
    { icon: <PhoneIcon />, href: "tel:7210708599", label: isMobile ? f.phone : "7210708599" },
    { icon: <WhatsappIcon size={20} />, href: "https://wa.me/917210708599", label: f.whatsapp },
  ];

  const pagesLinks = [
    { icon: null, href: "/privacy-policy", label: f.privacy },
    { icon: null, href: "/terms-and-conditions", label: f.terms },
    { icon: null, href: "/refund-policy", label: f.refund },
    { icon: null, href: "/contact-us", label: f.contact },
  ];

  const alternativesLinks = [
    ...(alternatives ?? []).map((item) => ({
      icon: null,
      href: `/alternatives/${item.slug}`,
      label: `${item.competitorName} Alternatives`,
    })),
    ...(alternatives?.length ? [{ icon: null, href: "/alternatives", label: "All Alternatives" }] : []),
  ];

  const socialLinks = [
    { icon: <InstagramIcon />, href: "https://www.instagram.com/clearcutoff_teaching", label: null, target: "_blank", ariaLabel: "Instagram" },
    { icon: <FacebookIcon />, href: "https://www.facebook.com/people/Clear-Cutoff-Teaching/61573525911878", label: null, target: "_blank", ariaLabel: "Facebook" },
    { icon: <LinkedInIcon />, href: "https://www.linkedin.com/company/clear-cutoff", label: null, target: "_blank", ariaLabel: "LinkedIn" },
  ];

  return (
    <footer>
      <div className="bg-brand-dark">
        <div
          style={{ minHeight: "88px", backgroundColor: "#006BD1" }}
          className="w-full gap-2 py-3 flex flex-col justify-center items-center"
        >
          <div className="flex gap-[24px] md:gap-[3.5rem] mx-auto">
            {contactLinks.map((link, index) => (
              <LinksList alignment={{ gap: "8px" }} key={index} icon={link.icon} href={link.href} label={link.label} variant="combined" LinkComponent={I18nLink} />
            ))}
          </div>

          <div className="w-full flex flex-wrap gap-4 text-white text-center md:gap-6 lg:flex-row flex-col-reverse justify-between items-center px-[20px] md:px-[80px]">
            <div className="min-w-[200px]">
              <p className="body-small !font-normal">
                © {new Date().getFullYear()} Clear Cutoff. {f.rights}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 w-auto justify-center">
              {pagesLinks.map((link, index) => (
                <LinksList font="body-large !font-medium" key={index} icon={link.icon} href={link.href} label={link.label} variant="combined" LinkComponent={I18nLink} />
              ))}
            </div>
            {/* {alternativesLinks.length > 0 && (
              <div className="flex flex-wrap gap-6 w-auto justify-center">
                {alternativesLinks.map((link, index) => (
                  <LinksList font="body-large !font-medium" key={index} icon={link.icon} href={link.href} label={link.label} variant="combined" LinkComponent={I18nLink} />
                ))}
              </div>
            )} */}
            <div className="flex justify-center gap-6 min-w-[200px]">
              {socialLinks.map((link, index) => (
                <LinksList key={index} icon={link.icon} href={link.href} label={link.label} target={link.target} ariaLabel={link.ariaLabel} variant="combined" LinkComponent={I18nLink} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
