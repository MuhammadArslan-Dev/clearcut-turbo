
// src/components/common/CustomBreadcrumbs.tsx
"use client";

import React from "react";
import Breadcrumbs from "@mui/joy/Breadcrumbs";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import HomeIcon from "@/components/ui/icons/HomeIcon";

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
  highlightClass = "bg-[#F1F5FA] py-0.5 px-3 capitalize rounded-lg text-[#0083ff] body-medium !font-semibold ",
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
              <Link key={index} color="primary" href={item.url || "#"}>
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
