import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // No hreflang `Link` response header on every URL: it claimed an en/hi
  // pair for pages whose /hi copy canonicalizes to English. Page metadata
  // (lib/seo/locale-alternates.ts) declares hreflang only where the Hindi
  // content is real.
  alternateLinks: false,
  pathnames: {
    '/': '/'
  }
});
