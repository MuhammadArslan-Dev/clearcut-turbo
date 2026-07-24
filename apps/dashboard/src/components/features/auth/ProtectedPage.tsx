"use client";

import * as Sentry from "@sentry/nextjs";

import FullScreenLoader from "@/components/FullScreenLoader";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { get, remove } = useQueryParams();

  const user_sourse = get("user_source");
  useEffect(() => {
    if (!user_sourse) return

    remove("user_source");

  }, [user_sourse]);
  useEffect(() => {
    
    if (!loading && !user) {
      window.location.href = "https://clearcutoff.in";
    }

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
      });
    }
  }, [user, loading]);

  if (loading) return <FullScreenLoader />;

  return <>{children}</>;
}
