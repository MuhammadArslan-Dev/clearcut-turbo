"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Pure side-effect component — renders nothing itself. The actual loader is
 * static HTML + a blocking pre-hydration script in the root layout
 * (apps/landing/src/app/[locale]/layout.tsx): that script sets
 * `data-auth-pending` on <html> synchronously, before the browser paints
 * anything, for a visitor who (a) isn't on the Facebook/Instagram in-app
 * browser and (b) has a locally stored session token — i.e. a real
 * candidate for AuthProvider's mount-time redirect
 * (packages/auth/src/context.tsx). That's what actually prevents the
 * landing-page flash; a React-only loader can't, since it can only render
 * after hydration, by which point the static page has already painted.
 *
 * This component's only job is the other half: once AuthProvider's verify
 * check (`useAuth().loading`) has gone true -> false, the check is done. If
 * it succeeded, the page is already navigating away
 * (`window.location.replace`) and this is moot. If it failed, the token was
 * cleared and nothing will reveal the page again — so remove the attribute
 * to reveal the already-rendered landing page underneath.
 */
export default function AuthRedirectLoader() {
  const { loading } = useAuth();
  const [checkStarted, setCheckStarted] = useState(false);

  useEffect(() => {
    if (loading) {
      setCheckStarted(true);
    } else if (checkStarted) {
      document.documentElement.removeAttribute("data-auth-pending");
    }
  }, [loading, checkStarted]);

  return null;
}
