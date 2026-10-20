import React from 'react'
import type { Metadata } from 'next'

// Placeholder route that answers 200 for any /test/* path — keep it out of
// the index until it has real content.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
    return (
        <div>Page</div>
    )
}
