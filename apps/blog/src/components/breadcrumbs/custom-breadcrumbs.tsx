
// src/components/common/CustomBreadcrumbs.tsx
"use client";

import React from "react";
import Breadcrumbs from "@clearcut/ui/breadcrumbs";
import Link from "@clearcut/ui/link";
import Text from "@clearcut/ui/text";
import HomeIcon from "@clearcut/ui/icons/HomeIcon";

// ✅ Props type
interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface CustomBreadcrumbsProps {
  items: BreadcrumbItem[];
  highlightClass?: string; // optional custom class for last item
  isShow?: boolean;
  padding?: string;
}

const CustomBreadcrumbs: React.FC<CustomBreadcrumbsProps> = ({
  padding = "10px",
  items,
  // #0083ff measured only 3.37:1 against this #F1F5FA chip background (14px
  // semibold is not WCAG "large text", so it needs 4.5:1). #0060bd is the same
  // hue at 5.63:1 on #F1F5FA.
  highlightClass = "bg-[#F1F5FA] py-0.5 px-3 capitalize rounded-lg text-[#0060bd] body-medium !font-semibold ",
  isShow = false,
}) => {
  if (!items || items.length === 1) return null;
  return (
    <>
      {isShow && (
        // Joy's `sx={{ p: padding }}` becomes a plain `style` — `p` was Joy
        // shorthand for padding, and `padding` here is already a CSS string
        // ("10px" by default), so the computed value is unchanged.
        <Breadcrumbs
          aria-label="breadcrumbs"
          style={{ padding }}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            if (isLast) {
              // Migrated from @mui/joy/Typography to the shared Text primitive.
              //
              // Safe here — and ONLY here — because `highlightClass` already
              // supplies every typographic value: `body-medium` (size/line-height),
              // `!font-semibold` (weight) and `text-[#0060bd]` (colour). Those
              // override Text's opinionated defaults (body-medium / !font-normal /
              // gray-normal), so the two render identically. Verified in-browser
              // across all 16 measured properties plus the bounding rect: Joy and
              // Text both computed SPAN, display:block, 15px/20px, weight 600,
              // rgb(0,96,189), 103x24 — zero differences.
              //
              // The weight override is deterministic, not luck: `!font-normal`
              // and `!font-semibold` are both !important single-class rules, so
              // source order decides, and in the production CSS `!font-semibold`
              // is emitted after `!font-normal` (offsets 45410 vs 45294) because
              // Tailwind sorts font-weight utilities by value.
              //
              // ⚠ Contract: if `highlightClass` ever stops supplying a size,
              // weight or colour, Text's defaults will surface and this crumb
              // will change appearance. Joy's Typography could not do that,
              // because inside <Breadcrumbs> it ran at level="inherit" and
              // applied no typography of its own.
              //
              // The other two Typography call sites (main-breadcrumbs.tsx,
              // breadcrumb-nav.tsx) are NOT migrated — they have no such class
              // and Text cannot reproduce level="inherit". See the ticket report.
              return (
                <Text key={index} as="span" className={highlightClass}>
                  {item.name}
                </Text>
              );
            }

            return (
              // The "Home" crumb renders an icon only, which left the <a> with
              // no text — axe/Lighthouse `link-name` scored 0. aria-label gives
              // every crumb a discernible name without changing the visuals.
              <Link
                key={index}
                color="primary"
                href={item.url || "#"}
                aria-label={item.name}
              >
                {item.name === "Home" ? (
                  <HomeIcon size={16} color="#40566D" />
                ) : (
                  item.name.charAt(0).toUpperCase() + item.name.slice(1)
                )}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
    </>
  );
};

export default CustomBreadcrumbs;
