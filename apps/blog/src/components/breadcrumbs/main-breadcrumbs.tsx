"use client";

import React from "react";
import Breadcrumbs from "@clearcut/ui/breadcrumbs";
import Link from "@clearcut/ui/link";
import Text from "@clearcut/ui/text";
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
        {/* `sx={{ padding: 0 }}` becomes a plain `style` — the shared Breadcrumbs
            takes standard props, not Joy's sx. */}
        <Breadcrumbs style={{ padding: 0 }} aria-label="breadcrumbs">
          {items.map((item, index) =>
            index !== items.length - 1 ? (
              // Joy's `component={NextLink}` is replaced by `asChild`, the Radix
              // composition pattern the shared Button already uses: the shared
              // Link contributes styling and NextLink stays the rendered element,
              // so client-side routing and prefetch behaviour are unchanged.
              <Link key={item.name} color="neutral" asChild>
                <NextLink href={item.url}>{item.name}</NextLink>
              </Link>
            ) : (
              // Inside <Breadcrumbs>, Joy set TypographyInheritContext, so this
              // Typography ran at level="inherit" and applied no typography of
              // its own — measured: 16px/24px, weight 400, colour 50/56/62, all
              // inherited from the <li>. `inherit` is the only way to reproduce
              // that; without it Text would force 15px/20px and colour 25/40/57.
              // `as="span"` matches the element Joy produced here: Breadcrumbs
              // clones each Typography child with component="span".
              <Text key={item.name} inherit as="span">
                {item.name}
              </Text>
            )
          )}
        </Breadcrumbs>
      </div>
    </MainContainer>
  );
}
