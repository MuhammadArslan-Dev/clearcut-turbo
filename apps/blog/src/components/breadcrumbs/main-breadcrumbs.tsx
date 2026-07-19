"use client";

import React from "react";
import Breadcrumbs from "@mui/joy/Breadcrumbs";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import NextLink from "next/link";
import MainContainer from "@/components/main-container";

type BreadcrumbItem = {
  name: string;
  url: string;
};

type Props = {
  items?: BreadcrumbItem[];
};

// Default breadcrumbs
const itemsDefault: BreadcrumbItem[] = [
  { name: "Home", url: "/" },
  { name: "Student", url: "/student" },
  { name: "Blog", url: "/blog" },
];

export default function MainBreadcrumbs({ items = itemsDefault }: Props) {
  return (
    <MainContainer maxWidth="max-w-[900px]">

      <div className="mx-auto px-4 sm:px-6 md:px-4 lg:px-4 flex items-center justify-between">
        <Breadcrumbs sx={{
          padding: 0,
        }} aria-label="breadcrumbs">
          {items.map((item, index) =>
            index !== items.length - 1 ? (
              <Link
                key={item.name}
                color="neutral"
                component={NextLink}
                href={item.url}
              >
                {item.name}
              </Link>
            ) : (
              <Typography key={item.name}>{item.name}</Typography>
            )
          )}
        </Breadcrumbs>
      </div>
    </MainContainer>
  );
}
