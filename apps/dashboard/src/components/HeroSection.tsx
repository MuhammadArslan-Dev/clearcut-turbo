// components/HeroSection.tsx
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('Hero');

  return (
    <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-20 md:py-32">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            {t('headline')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {t('subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-indigo-700 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-transform duration-300 transform hover:-translate-y-1">
              {t('cta_start')}
            </button>
            <button className="px-8 py-4 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-700 transition-transform duration-300 transform hover:-translate-y-1">
              {t('cta_demo')}
            </button>
          </div>
        </div>
        <div className="md:w-1/2 relative mt-10 md:mt-0">
          {/* Placeholder for an attractive illustration/image */}
          <div className="w-full h-80 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-2xl shadow-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">LMS Dashboard Mockup</span>
          </div>
          {/* You would replace the div above with an actual Image component */}
          {/* <Image
            src="/images/lms-dashboard.png" // Path to your LMS dashboard screenshot/illustration
            alt="LMS Dashboard Mockup"
            width={700}
            height={400}
            className="rounded-2xl shadow-xl"
            priority
          /> */}
        </div>
      </div>
    </section>
  );
}