
// src/components/common/CustomBreadcrumbs.tsx
"use client";

import React from "react";
import Breadcrumbs from "@mui/joy/Breadcrumbs";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
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
        <Breadcrumbs
          aria-label="breadcrumbs"
          sx={{ p: padding }}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            if (isLast) {
              return (
                <Typography key={index} className={highlightClass}>
                  {item.name}
                </Typography>
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
