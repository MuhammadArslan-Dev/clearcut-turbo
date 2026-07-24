// components/Footer.tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const tHeader = useTranslations('Header'); // For logo in footer

  return (
    <footer className="bg-gray-800 text-gray-300 py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <Link href="/" className="text-2xl font-bold text-indigo-400">
          {tHeader('logo')}
        </Link>
        <p className="text-sm">{t('copy')}</p>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-white transition text-sm">
            {t('privacy')}
          </Link>
          <Link href="/terms" className="hover:text-white transition text-sm">
            {t('terms')}
          </Link>
        </div>
      </div>
    </footer>
  );
}