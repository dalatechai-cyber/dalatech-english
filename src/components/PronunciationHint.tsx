'use client'
import { findDifficultWords, speakWord } from '@/lib/pronunciation'

interface PronunciationHintProps {
  content: string
}

export function PronunciationHint({ content }: PronunciationHintProps) {
  const words = findDifficultWords(content)
  if (words.length === 0) return null

  const hasSpeech = typeof window !== 'undefined' && !!window.speechSynthesis

  return (
    <div className="mt-2 pt-2 border-t border-navy-surface-2/50 flex flex-wrap gap-2">
      {words.map(({ word, ipa }) => (
        <span key={word} className="flex items-center gap-1 text-xs text-text-secondary">
          <span className="font-medium text-text-primary/70">{word}</span>
          <span className="text-text-secondary/70 font-mono">/{ipa}/</span>
          {hasSpeech && (
            <button
              onClick={() => speakWord(word)}
              className="hover:text-gold transition-colors"
              title={`"${word}" дуудах`}
            >
              🔊
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
