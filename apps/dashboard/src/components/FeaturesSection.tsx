// components/FeaturesSection.tsx
import { useTranslations } from 'next-intl';
import {
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline'; // Install @heroicons/react

// Install Heroicons: npm install @heroicons/react

export default function FeaturesSection() {
  const t = useTranslations('Features');

  const features = [
    {
      icon: <BookOpenIcon className="h-10 w-10 text-indigo-600" />,
      title: t('feature1_title'),
      description: t('feature1_description'),
    },
    {
      icon: <UsersIcon className="h-10 w-10 text-indigo-600" />,
      title: t('feature2_title'),
      description: t('feature2_description'),
    },
    {
      icon: <ChartBarIcon className="h-10 w-10 text-indigo-600" />,
      title: t('feature3_title'),
      description: t('feature3_description'),
    },
    {
      icon: <PuzzlePieceIcon className="h-10 w-10 text-indigo-600" />,
      title: t('feature4_title'),
      description: t('feature4_description'),
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-12">
          {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2"
            >
              <div className="flex justify-center mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}