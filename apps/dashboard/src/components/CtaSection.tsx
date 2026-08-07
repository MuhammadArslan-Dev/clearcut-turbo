// components/CtaSection.tsx
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function CtaSection() {
  const t = useTranslations('CTA');

  return (
    <section className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-20 text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          {t('headline')}
        </h2>
        <p className="text-xl md:text-2xl mb-10 opacity-90">
          {t('subheadline')}
        </p>
        <Link href="/signup" className="px-10 py-5 bg-white text-indigo-700 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-100 transition-transform duration-300 transform hover:-translate-y-2">
          {t('cta_button')}
        </Link>
      </div>
    </section>
  );
}