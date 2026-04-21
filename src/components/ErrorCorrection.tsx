interface ErrorCorrectionProps {
  content: string
}

export function parseCorrections(text: string): Array<{ type: 'text' | 'correction'; content: string }> {
  const parts: Array<{ type: 'text' | 'correction'; content: string }> = []
  const regex = /<correction>([\s\S]*?)<\/correction>/g
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    }
    parts.push({ type: 'correction', content: match[1].trim() })
    last = regex.lastIndex
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }
  return parts
}

export function ErrorCorrection({ content }: ErrorCorrectionProps) {
  const parts = parseCorrections(content)

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
            {part.content}
          </p>
        ) : (
          <div
            key={i}
            className="bg-amber-400/15 border border-amber-400/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {part.content}
          </div>
        )
      )}
    </div>
  )
}
