import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// The one canonical createNavigation() call. navigation.ts re-exports
// getPathname/redirect/usePathname straight from here (server-safe); Link
// and useRouter are wrapped in navigation-loading.tsx ("use client") before
// being re-exported from navigation.ts under the same names.
export const {Link, getPathname, redirect, usePathname, useRouter} =
  createNavigation(routing);
