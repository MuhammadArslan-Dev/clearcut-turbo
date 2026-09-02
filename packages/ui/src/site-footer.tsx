"use client";

import type { ComponentType, ReactNode } from "react";
import PhoneIcon from "./icons/phone-icon";
import EMailIcon from "./icons/email-icon";
import WhatsappIcon from "./icons/whatsapp-icon";
import { InstagramIcon } from "./icons/instagram-icon";
import { FacebookIcon } from "./icons/facebook-icon";
import { LinkedInIcon } from "./icons/linked-in-icon";
import { LinksList } from "./links-list";

export interface SiteFooterLink {
  href: string;
  label: string;
}

export interface SiteFooterProps {
  /**
   * Locale-aware Link the consuming app already has (e.g. @clearcut/i18n/
   * navigation's Link, or an app's own src/i18n/navigation Link). Omit only
   * for an app with no i18n routing at all — LinksList then falls back to
   * plain next/link, which is correct there but WRONG for any app that has
   * locale-prefixed routes (missing this was the actual bug in apps/blog's
   * footer before this component existed: every footer link silently
   * ignored the /hi prefix).
   */
  LinkComponent?: ComponentType<{
    href: string;
    className?: string;
    target?: string;
    "aria-label"?: string;
    children?: ReactNode;
  }>;
  /** Resolved copy, not translation keys — each app's own useTranslations()
   * call still owns the actual strings; this component only owns layout. */
  copyrightText: string;
  phoneNumber: string;
  phoneLabel: string;
  emailAddress?: string;
  emailLabel?: string;
  whatsappNumber: string;
  whatsappLabel: string;
  policyLabel: string;
  termsLabel: string;
  refundLabel: string;
  contactLabel: string;
  /** Extra page links appended after the standard four, e.g. landing's
   * per-competitor "Alternatives" pages. */
  extraLinks?: SiteFooterLink[];
  /**
   * Prefixed onto every /privacy-policy /terms-and-conditions /refund-policy
   * /contact-us href. Leave unset (relative links) for an app where those
   * pages actually live in the same deployment — apps/landing, apps/blog.
   * Set to an absolute origin (e.g. "https://clearcutoff.in") for a
   * standalone app — like apps/tools — that doesn't have those pages
   * itself and would otherwise 404 linking to them relatively.
   */
  pageLinksBaseUrl?: string;
}

/**
 * The one footer, shared by every public-facing app (apps/landing,
 * apps/blog, apps/tools, ...) so a design/behavior fix lands everywhere at
 * once instead of drifting per-app the way it had — landing and blog had
 * independently built, subtly different footers (different WhatsApp icon
 * artwork, blog missing variant="combined" on its page links, and blog's
 * links silently NOT locale-aware because LinkComponent was never passed to
 * LinksList there).
 */
export default function SiteFooter({
  LinkComponent,
  copyrightText,
  phoneNumber,
  phoneLabel,
  emailAddress,
  emailLabel,
  whatsappNumber,
  whatsappLabel,
  policyLabel,
  termsLabel,
  refundLabel,
  contactLabel,
  extraLinks = [],
  pageLinksBaseUrl = "",
}: SiteFooterProps) {
  const contactLinks = [
    { icon: <PhoneIcon />, href: `tel:${phoneNumber}`, label: phoneLabel },
    ...(emailAddress
      ? [{ icon: <EMailIcon />, href: `mailto:${emailAddress}`, label: emailLabel ?? emailAddress }]
      : []),
    { icon: <WhatsappIcon size={20} />, href: `https://wa.me/${whatsappNumber}`, label: whatsappLabel },
  ];

  const pageLinks: (SiteFooterLink & { icon: null })[] = [
    { icon: null, href: `${pageLinksBaseUrl}/privacy-policy`, label: policyLabel },
    { icon: null, href: `${pageLinksBaseUrl}/terms-and-conditions`, label: termsLabel },
    { icon: null, href: `${pageLinksBaseUrl}/refund-policy`, label: refundLabel },
    { icon: null, href: `${pageLinksBaseUrl}/contact-us`, label: contactLabel },
    ...extraLinks.map((link) => ({ ...link, icon: null as null })),
  ];

  const socialLinks = [
    {
      icon: <InstagramIcon />,
      href: "https://www.instagram.com/clearcutoff_teaching",
      label: null,
      target: "_blank",
      ariaLabel: "Instagram",
    },
    {
      icon: <FacebookIcon />,
      href: "https://www.facebook.com/people/Clear-Cutoff-Teaching/61573525911878",
      label: null,
      target: "_blank",
      ariaLabel: "Facebook",
    },
    {
      icon: <LinkedInIcon />,
      href: "https://www.linkedin.com/company/clear-cutoff",
      label: null,
      target: "_blank",
      ariaLabel: "LinkedIn",
    },
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
              <LinksList
                alignment={{ gap: "8px" }}
                key={index}
                icon={link.icon}
                href={link.href}
                label={link.label}
                variant="combined"
                LinkComponent={LinkComponent}
              />
            ))}
          </div>

          <div className="w-full flex flex-wrap gap-4 text-white text-center md:gap-6 lg:flex-row flex-col-reverse justify-between items-center px-[20px] md:px-[80px]">
            <div className="min-w-[200px]">
              <p className="body-small !font-normal">{copyrightText}</p>
            </div>
            <div className="flex flex-wrap gap-6 w-auto justify-center">
              {pageLinks.map((link, index) => (
                <LinksList
                  font="body-large !font-medium"
                  key={index}
                  icon={link.icon}
                  href={link.href}
                  label={link.label}
                  variant="combined"
                  LinkComponent={LinkComponent}
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
                  target={link.target}
                  ariaLabel={link.ariaLabel}
                  variant="combined"
                  LinkComponent={LinkComponent}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
