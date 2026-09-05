import type { Metadata } from 'next'
import NotFoundContent from '@/components/not-found-content'

export const metadata: Metadata = {
  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <NotFoundContent />
    </div>
  )
}
