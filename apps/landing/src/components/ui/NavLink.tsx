"use client";

import { scrollToSection } from "@/utils/scrollToSection";
import React, { useRef, useState } from "react";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";

interface NavItem {
  label: string;
  href: string;
  id: string;
}

interface NavLinkProps {
  items: NavItem[];
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function NavbarMenu({ items }: NavLinkProps) {
  const t = useTranslations("nav");
  const LINK_LABELS: Record<string, string> = { pricing: t("pricing"), features: t("features"), faqs: t("faqs") };
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const moveIndicator = (el: HTMLLIElement) => {
    const rect = el.getBoundingClientRect();
    const parentRect = containerRef.current!.getBoundingClientRect();
    setStyle({ left: rect.left - parentRect.left, width: rect.width, opacity: 1 });
  };

  const hideIndicator = () => setStyle((prev) => ({ ...prev, opacity: 0 }));

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center gap-2" onMouseLeave={hideIndicator}>
      <div
        className="absolute bottom-0 h-0.5 bg-brand rounded-full transition-all duration-300 ease-out pointer-events-none"
        style={{ left: style.left, width: style.width, opacity: style.opacity }}
      />
      <ul className="contents">
        {items.map((item: NavItem) => (
          <li
            key={item.label}
            onMouseEnter={(e) => moveIndicator(e.currentTarget)}
            onClick={() => scrollToSection(item.id)}
            className="relative px-4 py-2 cursor-pointer z-10 text-gray-700 hover:text-white transition-all duration-300 ease-out"
          >
            <Text as="p" variant="body-medium" weight="semibold">
              {LINK_LABELS[item.label] ?? item.label}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
