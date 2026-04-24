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

function parseIPA(text: string): Array<{ type: 'text' | 'ipa'; content: string }> {
  const parts: Array<{ type: 'text' | 'ipa'; content: string }> = []
  const regex = /\/([^/\n]+)\//g
  let last = 0
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) })
    parts.push({ type: 'ipa', content: `/${m[1]}/` })
    last = regex.lastIndex
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

function renderCorrectionBody(raw: string) {
  const lines = raw.split(/\r?\n/)
  type LineKind = 'wrong' | 'correct' | 'note'
  type RenderLine = { kind: LineKind; text: string }
  const rendered: RenderLine[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let kind: LineKind = 'note'
    let text = trimmed
    const wrongMatch = trimmed.match(/^(?:Буруу|Wrong|WRONG)\s*[:：]\s*(.*)$/i)
    const correctMatch = trimmed.match(/^(?:Зөв|Correct|CORRECT)\s*[:：]\s*(.*)$/i)
    if (wrongMatch) {
      kind = 'wrong'
      text = wrongMatch[1]
    } else if (correctMatch) {
      kind = 'correct'
      text = correctMatch[1]
    }
    rendered.push({ kind, text })
  }
  if (rendered.length === 0) rendered.push({ kind: 'note', text: raw })
  return rendered
}

function renderWithIPA(text: string) {
  const segs = parseIPA(text)
  return segs.map((seg, i) =>
    seg.type === 'ipa' ? (
      <span
        key={i}
        className="font-serif-display italic"
        style={{ color: 'var(--champagne)' }}
      >
        {seg.content}
      </span>
    ) : (
      <span key={i}>{seg.content}</span>
    )
  )
}

export function ErrorCorrection({ content }: ErrorCorrectionProps) {
  const parts = parseCorrections(content)

  return (
    <div className="space-y-3">
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <p
            key={i}
            className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {renderWithIPA(part.content)}
          </p>
        ) : (
          <div
            key={i}
            className="rounded-xl p-4 shadow-editorial"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid var(--hairline)',
              borderLeftWidth: '3px',
              borderLeftColor: 'var(--gold)',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2"
              style={{ color: 'var(--champagne)' }}
            >
              Correction
            </div>
            <div className="space-y-1.5">
              {renderCorrectionBody(part.content).map((ln, j) => {
                if (ln.kind === 'wrong') {
                  return (
                    <div key={j} className="flex gap-3 items-start">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.2em] flex-shrink-0 mt-1"
                        style={{ color: '#F87171' }}
                      >
                        Wrong
                      </span>
                      <span
                        className="text-[14px] leading-relaxed line-through"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {renderWithIPA(ln.text)}
                      </span>
                    </div>
                  )
                }
                if (ln.kind === 'correct') {
                  return (
                    <div key={j} className="flex gap-3 items-start">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.2em] flex-shrink-0 mt-1"
                        style={{ color: '#34D399' }}
                      >
                        Correct
                      </span>
                      <span
                        className="text-[15px] leading-relaxed font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {renderWithIPA(ln.text)}
                      </span>
                    </div>
                  )
                }
                return (
                  <p
                    key={j}
                    className="text-[13px] leading-relaxed italic font-serif-display"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {renderWithIPA(ln.text)}
                  </p>
                )
              })}
            </div>
          </div>
        )
      )}
    </div>
  )
}
