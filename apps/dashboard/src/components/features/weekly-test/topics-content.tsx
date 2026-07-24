interface TopicsContentProps {
  topics: string[]
}

export function TopicsContent({ topics }: TopicsContentProps) {
  return (
    <div className="space-y-2 mt-4">
      {topics.map((topic) => (
        <div key={topic} className="flex items-center gap-3 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-sm text-slate-700 font-medium">{topic}</span>
        </div>
      ))}
    </div>
  )
}
