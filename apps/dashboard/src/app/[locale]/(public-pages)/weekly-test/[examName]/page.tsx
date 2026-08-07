import WeeklyTestPage from '@/components/features/weekly-test/weekly-test-page'

interface PageProps {
  params: Promise<{ examName: string,locale: string }>
}

export default async function page({ params }: PageProps) {
  const { examName,locale } = await params
  return <WeeklyTestPage uuid={examName} locale={locale} />
}
