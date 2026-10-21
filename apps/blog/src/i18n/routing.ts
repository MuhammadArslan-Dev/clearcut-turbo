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
  // The URL alone decides the language (docs/phases/16 part D): no redirect of
  // an English URL to /hi because of a NEXT_LOCALE cookie left by an earlier
  // /hi visit or a Hindi Accept-Language header. Every URL serves exactly its
  // own language to every visitor and crawler.
  localeDetection: false,
  pathnames: {
    '/': '/'
  }
});
