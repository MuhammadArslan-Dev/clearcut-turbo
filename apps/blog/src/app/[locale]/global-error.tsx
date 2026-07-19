'use client'
import ErrorPage from "@/components/error-page"

 // Error boundaries must be Client Components
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // global-error must include html and body tags
     <div className="flex items-center justify-center h-screen w-full">
          <ErrorPage />
        </div>    
  )
}