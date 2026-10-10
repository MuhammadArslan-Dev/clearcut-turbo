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
 * check (`useAuth().loading`) has gone true -> false, the check is done.
 *
 * On success, `context.tsx` sets `token` to the verified value AND calls
 * `window.location.replace(...)` — but that navigation isn't instant, and
 * `loading` still flips back to `false` in its `finally` block right after,
 * in the same tick. Revealing the page on *any* loading->false transition
 * therefore showed the landing page for that gap, right before the browser
 * actually left — so this only reveals on the FAILURE path (`token` still
 * falsy once the check finishes, meaning nothing is navigating away and the
 * page needs to actually be shown). On success it deliberately stays
 * hidden/loading all the way through until the browser navigates away.
 */
export default function AuthRedirectLoader() {
  const { loading, token } = useAuth();
  const [checkStarted, setCheckStarted] = useState(false);

  useEffect(() => {
    if (loading) {
      setCheckStarted(true);
    } else if (checkStarted && !token) {
      document.documentElement.removeAttribute("data-auth-pending");
    }
  }, [loading, checkStarted, token]);

  return null;
}
