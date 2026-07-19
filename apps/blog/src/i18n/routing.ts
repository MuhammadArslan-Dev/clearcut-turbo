import { AppLocale } from '@/types/components/language';
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi'] as AppLocale[],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/pathnames': {
      ur: '/pfadnamen'
    }
  }
});
