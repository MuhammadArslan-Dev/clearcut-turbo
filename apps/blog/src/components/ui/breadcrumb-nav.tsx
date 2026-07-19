"use client";

import { Breadcrumbs, Link, Typography } from "@mui/joy";
import { usePathname } from "next/navigation";
import MainContainer from "../main-container";

export default function BreadcrumbNav() {
  const pathname = usePathname(); // e.g. "/dashboard/courses/physics"
  const segments = pathname.split("/").filter(Boolean); // ["dashboard", "courses", "physics"]

  return (
    <MainContainer padding="px-2">
      <Breadcrumbs aria-label="breadcrumbs">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/"); // build path progressively
          const isLast = index === segments.length - 1;

          const label =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " ");

          return isLast ? (
            <Typography key={href} color="neutral">
              {label}
            </Typography>
          ) : (
            <Link key={href} color="primary" href={href}>
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </MainContainer>
  );
}
