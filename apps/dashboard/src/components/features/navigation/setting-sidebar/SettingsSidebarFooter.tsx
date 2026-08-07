"use client";
import React from "react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  LogoutDoorIcon,
} from "@/components/ui/icons";
import YouTubeIcon from "@/components/ui/icons/youtube-icon";
import { useTranslations } from "next-intl";

import Link from "next/link";
import { memo } from "react";
import { useAuth } from "@/providers/AuthProvider";

/* ----------------------------- Sidebar Footer ----------------------------- */

export default function SettingsSidebarFooter() {
  const t = useTranslations();
  const footer = useTranslations("footer");
  const { logout } = useAuth();

  return (
    <div className="fixed bottom-0 w-full relative">
      <div className="flex pb-4 md:hidden items-center w-full justify-between px-3 py-2">
        <div
          onClick={() => logout()}
          className="flex cursor-pointer justify-center items-center gap-2 body-large !font-normal text-surface-gray-normal"
        >
          <LogoutDoorIcon />
          <p className="">{t("actions.logout")}</p>
        </div>
        <p className="body-xsmall !font-normal text-surface-gray-subtle ">
          Build V 1.0 (1)
          {/* © {new Date().getFullYear()} Clear Cutoff */}
        </p>
      </div>
      <div className="hidden md:block">
        <SettingFooter />
      </div>
    </div>
  );
}

/* ----------------------------- Config ----------------------------- */

const SOCIAL_LINKS = Object.freeze([
  {
    href: "https://youtube.com",
    label: "YouTube",
    Icon: YouTubeIcon,
    show: false,
  },
  {
    href: "https://www.facebook.com/p/Clear-Cutoff-Teaching-61573525911878/",
    label: "Facebook",
    Icon: FacebookIcon,
    show: true,
  },
  {
    href: "https://www.instagram.com/clearcutoff_teaching/",
    label: "Instagram",
    Icon: InstagramIcon,
    show: true,
  },
  {
    href: "https://www.linkedin.com/company/clear-cutoff/",
    label: "LinkedIn",
    Icon: LinkedInIcon,
    show: true,
  },
] as const);

const FOOTER_LINKS = Object.freeze([
  { href: "https://www.clearcutoff.in/terms-and-conditions", label: "terms" },
  { href: "https://www.clearcutoff.in/privacy-policy", label: "privacy" },
  { href: "https://www.clearcutoff.in/refund-policy", label: "refund" },
  { href: "https://www.clearcutoff.in/contact-us", label: "contact" },
]);

/* ----------------------------- Full Footer ----------------------------- */

export const SettingFooter = memo(function SettingFooter() {
  const footer = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0053A2] h-[100px] md:rounded-b-md">
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-2">
        {/* Social Links */}
        <div className="flex gap-7">
          {SOCIAL_LINKS.map(({ href, label, Icon, show }) => {
            if (!show) return null;
            return (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white transition-opacity hover:opacity-80"
              >
                <Icon width={24} height={24} />
              </Link>
            );
          })}
        </div>

        {/* Policy Links */}
        <div className="flex gap-3 body-medium text-white">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {footer(label)}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <p className="body-xsmall text-white">
          {footer("copyright", {
            year,
            brand: "Clear Cutoff",
          })}
        </p>
      </div>
    </footer>
  );
});
