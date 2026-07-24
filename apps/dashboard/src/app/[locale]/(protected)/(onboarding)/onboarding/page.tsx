import OnboardingWizard from '@/components/features/onboarding/OnboardingWizard'
import { Metadata } from 'next';
import { Locale } from 'next-intl';

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Onboarding | ClearCutoff",
    description: "Onboarding | ClearCutoff",
  };
}
export default function page() {
 
  return (
    <div className='w-full h-full'>
      <OnboardingWizard />
    </div>
  )
}
