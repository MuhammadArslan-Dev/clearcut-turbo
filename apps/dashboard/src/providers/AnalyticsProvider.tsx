'use client';

import { usableEmail } from '@clearcut/utils/usable-email';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { initAmplitude, setAnalyticsUser } from '@/lib/analytics/browser';
import { isInternalTester } from '@/lib/experiments/autopayPrice';
import { internalTesterUuids } from '@/lib/experiments/config';
import { ensureExperiments } from '@/lib/experiments/runtime';

type Props = {
  children: React.ReactNode;
};

export function AnalyticsProvider({ children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, loading } = useAuth();

  useEffect(() => {
    initAmplitude();
  }, [user]);

  useEffect(() => {

  
    if (!user) return;

    setAnalyticsUser(user?.uuid, {
      phone: user?.phone,
      // Real email or null, which removes the property (CC-113).
      email: usableEmail(user?.email),
      plan: 'free',
      // Phase 66: experiment analysis excludes these (only ever set to true).
      ...(isInternalTester(user?.uuid, internalTesterUuids()) ? { internal_tester: true } : {}),
    });
  }, [user]);

  // Phase 66: fetch this user's experiment variants. Runs after setUserId
  // above (effects run in order), so Amplitude's identity is already the uuid.
  // A no-op unless a deployment key is configured.
  useEffect(() => {
    void ensureExperiments(user?.uuid);
  }, [user?.uuid]);


  // Track page view on route change
  useEffect(() => {
    if (!pathname) return;

    // trackEvent('page_view', {
    //   path: pathname,
    //   query: searchParams?.toString() || undefined,
    //   referrer:
    //     typeof document !== 'undefined' ? document.referrer || null : null,
    // });
  }, [pathname, searchParams]);

  return <>{children}</>;
}