"use client";

import { useState, useEffect } from "react";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { scrollToSection } from "@/utils/scrollToSection";
import { useTranslations } from "next-intl";

export default function MobileMenu({ items = [], linkShow = true }: any) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const LINK_LABELS: Record<string, string> = { pricing: tNav("pricing"), features: tNav("features"), faqs: tNav("faqs") };
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="md:hidden">
        <span className="text-xl">
          {open ? (
            <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="16" fill="#0083FF" />
              <path d="M18.7098 11.1219L28.6093 21.0214C28.9998 21.4119 29.633 21.4119 30.0235 21.0214C30.414 20.6309 30.414 19.9977 30.0235 19.6072L20.124 9.7077C19.7335 9.31718 19.1003 9.31718 18.7098 9.7077C18.3193 10.0982 18.3193 10.7314 18.7098 11.1219Z" fill="white" />
              <path d="M28.6066 9.70785L18.7071 19.6073C18.3166 19.9979 18.3166 20.631 18.7071 21.0216C19.0976 21.4121 19.7308 21.4121 20.1213 21.0216L30.0208 11.1221C30.4113 10.7315 30.4113 10.0984 30.0208 9.70785C29.6303 9.31733 28.9971 9.31733 28.6066 9.70785Z" fill="white" />
            </svg>
          ) : (
            <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="16" fill="#2B7EFF" />
              <path d="M31 19H17C16.4477 19 16 19.4477 16 20C16 20.5523 16.4477 21 17 21H31C31.5523 21 32 20.5523 32 20C32 19.4477 31.5523 19 31 19Z" fill="white" />
              <path d="M31 15H17C16.4477 15 16 15.4477 16 16C16 16.5523 16.4477 17 17 17H31C31.5523 17 32 16.5523 32 16C32 15.4477 31.5523 15 31 15Z" fill="white" />
              <path d="M31 11H17C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13H31C31.5523 13 32 12.5523 32 12C32 11.4477 31.5523 11 31 11Z" fill="white" />
            </svg>
          )}
        </span>
      </button>

      {open && (
        <>
          <div className="md:hidden absolute left-0 right-0 top-full bg-white shadow-xl z-[var(--z-mobile-menu)]">
            <div className="pb-3 flex flex-col gap-3">
              {linkShow && (
                <div className="px-2">
                  {items.map((item: any) => (
                    <div
                      key={item.label}
                      onClick={() => { scrollToSection(item.id); setOpen(false); }}
                      className="block py-2 px-3 text-lg font-medium capitalize"
                    >
                      {LINK_LABELS[item.label] ?? item.label}
                    </div>
                  ))}
                </div>
              )}
              <div className="px-5 w-full">
                <ContinueFreeButton fullWidth text={tCommon("continueFreeShort")} />
              </div>
            </div>
          </div>
          <div onClick={() => setOpen(false)} className="fixed left-0 right-0 bottom-0 top-[64px] bg-black/40 z-40 md:hidden" />
        </>
      )}
    </>
  );
}
