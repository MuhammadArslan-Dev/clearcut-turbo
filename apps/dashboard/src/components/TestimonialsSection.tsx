// components/TestimonialsSection.tsx
import { useTranslations } from 'next-intl';
import { StarIcon } from '@heroicons/react/24/solid';

export default function TestimonialsSection() {
  const t = useTranslations('Testimonials');

  const testimonials = [
    {
      quote: t('quote1'),
      author: t('author1'),
    },
    {
      quote: t('quote2'),
      author: t('author2'),
    },
  ];

  return (
    <section className="py-20 bg-indigo-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-12">
          {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="flex justify-center mb-4 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-6 w-6" />
                ))}
              </div>
              <p className="text-lg italic text-gray-700 mb-4">
                &quot;{testimonial.quote}&quot;
              </p>
              <p className="font-semibold text-gray-800">
                - {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}