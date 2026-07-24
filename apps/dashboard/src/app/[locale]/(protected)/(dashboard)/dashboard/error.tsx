'use client'

import Topbar from '@/components/layout/dasbboard/Topbar'
import React from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
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
