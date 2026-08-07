"use client";

import { useIsMobile } from "@clearcut/hooks/use-is-mobile";

import { useTranslations } from "next-intl";
import PhoneIcon from "@clearcut/ui/icons/phone-icon";
import EMailIcon from "@clearcut/ui/icons/email-icon";
import WhatsappIcon from "@/components/ui/icons/whatsapp-icon";
import { InstagramIcon } from "@clearcut/ui/icons/instagram-icon";
import { FacebookIcon } from "@clearcut/ui/icons/facebook-icon";
import { LinkedInIcon } from "@clearcut/ui/icons/linked-in-icon";
import { LinksList } from "@clearcut/ui/links-list";

export default function Footer() {
  const isMobile = useIsMobile();

  const t = useTranslations("footer");

  const contactLinks = [
    {
      icon: <PhoneIcon />,
      href: "tel:7210708599",
      label: isMobile ? "Phone" : "7210708599",
    },
    {
      icon: <EMailIcon />,
      href: "mailto:hi@clearcutoff.in",
      label: isMobile ? "Email" : "hi@clearcutoff.in",
    },
    {
      icon: <WhatsappIcon size={20} />,
      href: "https://wa.me/7210708599",
      label: isMobile ? "Whatsapp" : "Whatsapp",
    },
    // {
    //     icon: <TelegramIcon size={20} />,
    //     href: "/",
    //     label: isMobile ? "Telegram" : "Telegram",
    // },
  ];

  const pagesLinks = [
    {
      icon: null,
      href: "/privacy-policy",
      label: t("links.policy"),
    },
    {
      icon: null,
      href: "/terms-and-conditions",
      label: t("links.terms"),
    },
    {
      icon: null,
      href: "/refund-policy",
      label: t("links.refund"),
    },
    {
      icon: null,
      href: "/contact-us",
      label: t("links.contact"),
    },
  ];

  const socialLinks = [
    {
      icon: <InstagramIcon />,
      href: "https://www.instagram.com/clearcutoff_teaching",
      label: null,
      ariaLabel: "Instagram",
    },
    {
      icon: <FacebookIcon />,
      href: "https://www.facebook.com/people/Clear-Cutoff-Teaching/61573525911878",
      label: null,
      ariaLabel: "Facebook",
    },
    {
      icon: <LinkedInIcon />,
      href: "https://www.linkedin.com/company/clear-cutoff",
      label: null,
      ariaLabel: "LinkedIn",
    },
    // {
    //     icon: <YouTubeIcon size={24} />,
    //     href: "https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/images/youtube.svg",
    //     label: null
    // },
  ];

  return (
    <>
      <footer id="footer">
        {/* <FloatingButton /> */}
        {/* Floating button */}
        <div className="bg-brand-dark">
          {/* was <Box sx={{ maxHeight: "123px", minHeight: "88px",
                            backgroundColor: "primaryDark" }} className="…">

              maxHeight/minHeight are plain px and move to Tailwind arbitrary
              values unchanged.

              `backgroundColor: "primaryDark"` is deliberately NOT carried over.
              It was a no-op: MUI resolves that string against the theme palette,
              and this app's joytheme.ts declares `primaryDark` only as a
              TypeScript type — it never assigns a value. So MUI passed the bare
              string through as CSS (`background-color: primaryDark`), which is
              not a valid colour and the browser dropped it. Verified in-browser
              before this change: computed backgroundColor was
              `rgba(0, 0, 0, 0)` (transparent). The blue band you see comes from
              the parent `div.bg-brand-dark` (`rgb(0, 107, 209)`).
              Translating it to a real colour would ADD a background that does
              not render today, i.e. a visual regression — so it is dropped and
              recorded instead. */}
          <div className="w-full gap-2 py-1 flex flex-col justify-center items-center max-h-[123px] min-h-[88px]">
            {/* Left Side: Copyright Grid */}
            <div className="flex gap-[24px] md:gap-[3.5rem] mx-auto">
              {contactLinks.map((link, index) => (
                <LinksList
                  alignment={{ gap: "8px" }}
                  key={index}
                  icon={link.icon}
                  href={link.href}
                  label={link.label}
                />
              ))}
            </div>

            {/* Right Side: Privacy */}
            <div className="w-full flex gap-2 text-white text-center md:gap-0 lg:flex-row flex-col-reverse justify-between px-[20px] md:px-[80px]">
              <div className="min-w-[200px]">
                <p className="body-small !font-normal">
                  {t("copyright", { year: new Date().getFullYear() })}
                 
                </p>
              </div>
              <div className="flex gap-6 w-auto justify-center">
                {pagesLinks.map((link, index) => (
                  <LinksList
                    font="body-large !font-medium"
                    key={index}
                    icon={link.icon}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-6 min-w-[200px]">
                {socialLinks.map((link, index) => (
                  <LinksList
                    key={index}
                    icon={link.icon}
                    href={link.href}
                    label={link.label}
                    ariaLabel={link.ariaLabel}
                    variant="combined"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
