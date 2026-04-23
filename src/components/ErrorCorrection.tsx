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
            className="font-serif-display rounded-xl p-4 text-[15px] leading-relaxed whitespace-pre-wrap italic shadow-editorial"
            style={{
              background: 'rgba(245,158,11,0.08)',
              borderLeft: '3px solid #F59E0B',
              color: '#FDE68A',
            }}
          >
            {part.content}
          </div>
        )
      )}
    </div>
  )
}
