'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { initAmplitude, setAnalyticsUser } from '@/lib/analytics/browser';

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
      plan: 'free',
    });
  }, [user]);


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