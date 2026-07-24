import React from 'react'

export default function PaymentHistorySkeleton() {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="px-4 py-3 bg-gray-100 grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded" />
        ))}
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-4 grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}

      <div className="px-4 py-3 border-t flex justify-between">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
