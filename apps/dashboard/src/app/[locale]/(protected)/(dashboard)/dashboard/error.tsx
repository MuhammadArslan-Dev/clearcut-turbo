'use client'

import Topbar from '@/components/layout/dasbboard/Topbar'
import React, { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // This boundary sits below the root `app/error.tsx`, so it catches dashboard
  // crashes first — and used to swallow them without reporting, meaning nothing
  // that broke on this page ever reached Sentry.
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        boundary: 'dashboard-error',
        digest: error.digest ?? 'none',
      },
      extra: {
        digest: error.digest,
        pathname:
          typeof window !== 'undefined' ? window.location.pathname : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    })
  }, [error])

  return (
    < div className="flex flex-1 flex-col min-h-0 min-w-0" >
                <Topbar />

      {/* Only this part scrolls */}
      < main className="flex-1  overflow-y-auto overflow-y-auto md:px-3 py-6 -my-2" >
        <div className='flex flex-col w-full justify-center h-full  items-center'>
          <h2>Something went wrong</h2>
          <button onClick={() => reset()}>Try again</button>

        </div>
      </main >

    </div >

  )
}
