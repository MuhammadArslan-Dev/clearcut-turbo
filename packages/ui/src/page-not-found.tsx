"use client";

import * as React from "react";
import NextLink from "next/link";
import { Button, buttonVariants } from "./button";

type HomeLinkProps = {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export type PageNotFoundProps = {
  /** Called when the primary "Go Back" action is pressed. The component
   * has no router of its own — each app supplies this via its own
   * navigation (e.g. `() => router.back()` from `next/navigation` or a
   * locale-aware `next-intl` router), so this stays reusable by any app
   * regardless of how it routes. */
  onGoBack: () => void;
  /** Destination for the secondary "Go to Home Page" action. */
  homeHref?: string;
  /** Link component to render the home action with — defaults to
   * `next/link`. Pass an app's locale-aware Link (e.g.
   * `@clearcut/i18n/navigation`'s `Link`) so the link preserves the
   * current locale instead of always going to the default one. Same
   * injectable-Link pattern as `@clearcut/ui/links-list`. */
  HomeLinkComponent?: React.ComponentType<HomeLinkProps>;
  /** Illustration slot — intentionally has no default. This component
   * does not ship a fallback graphic; pass one from the app, or omit it
   * to render without one. */
  illustration?: React.ReactNode;
  code?: string;
  title?: string;
  description?: string;
  className?: string;
};

export function PageNotFound({
  onGoBack,
  homeHref = "/",
  HomeLinkComponent = NextLink,
  illustration,
  code = "404",
  title = "Error 404!",
  description = "The page you are trying to access has incorrect URL or it is removed!",
  className,
}: PageNotFoundProps) {
  return (
    <div className={`w-full max-w-[1050px] mx-auto px-4 py-10 ${className ?? ""}`}>
      <div
        className={`grid w-full grid-cols-1 gap-10 py-10 ${
          illustration ? "md:grid-cols-5 md:gap-20" : ""
        }`}
      >
        {illustration && (
          <div className="md:col-span-3 flex justify-center items-center">
            {illustration}
          </div>
        )}
        <div
          className={`flex flex-col items-center justify-center gap-10 text-center ${
            illustration ? "md:col-span-2" : ""
          }`}
        >
          <div className="flex w-full flex-col items-center justify-center gap-10">
            <h1 className="display-xlarge text-brand">{code}</h1>
            <div className="flex flex-col gap-4 text-center">
              <h2 className="heading-large">{title}</h2>
              <p className="body-medium text-text-gray-subtle">{description}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button  variant="solid" color="primary" rounded="9999px" onClick={onGoBack}>
                ← Go Back
              </Button>
              {/* Not using Button's `asChild` here: it's never been
                  exercised anywhere else in this codebase, and it turns
                  out to be broken — Button always wraps `children` in its
                  own <span> alongside several conditionally-falsy sibling
                  elements, so Radix's Slot never receives the single
                  child it requires and throws at render. That's a
                  pre-existing bug in packages/ui/button.tsx, not
                  something to silently patch here. buttonVariants() is
                  the same class-generating function Button uses
                  internally, so this renders identically styled without
                  needing Slot composition at all — also more correct
                  semantically, since this action is a link, not a
                  button. */}
              <HomeLinkComponent
                href={homeHref}
                className={buttonVariants({ variant: "outlined", color: "primary" })}
                style={{ borderRadius: "9999px" }}
              >
                Go to Home Page
              </HomeLinkComponent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
