function ExplanationText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export function ExplanationBlock({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (/^\d+\.\s/.test(line) || /^-\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-slate-400 shrink-0">{/^\d+\./.test(line) ? "•" : "–"}</span>
              <ExplanationText text={line.replace(/^[\d]+\.\s|-\s/, "")} />
            </div>
          )
        }
        return <p key={i}><ExplanationText text={line} /></p>
      })}
    </div>
  )
}
