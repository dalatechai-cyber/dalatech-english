'use client'
import type { Message } from '@/lib/types'
import { ErrorCorrection } from './ErrorCorrection'
import { PronunciationHint } from './PronunciationHint'
import { speakText } from '@/lib/pronunciation'

interface ChatBubbleProps {
  message: Message
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.role === 'assistant'
  const hasCorrection = message.content.includes('<correction>')

  const cleanContent = message.content
    .replace(/<correction>[\s\S]*?<\/correction>/g, '')
    .replace(/<exam-result>[\s\S]*?<\/exam-result>/g, '')
    .trim()

  const hasEnglish = /[a-zA-Z]{3,}/.test(cleanContent)

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
      {isAI && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
        >
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${isAI ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={
          isAI
            ? {
                background: '#1E293B',
                borderLeft: '3px solid #F59E0B',
                color: '#F8FAFC',
              }
            : {
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#0F172A',
                fontWeight: 500,
              }
        }
      >
        {isAI && hasEnglish && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => speakText(cleanContent)}
              className="text-text-secondary hover:text-gold transition-colors text-sm"
              title="Англиар уншуулах"
            >
              🔊
            </button>
          </div>
        )}
        {isAI && hasCorrection ? (
          <ErrorCorrection content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent || message.content}</p>
        )}
        {isAI && hasEnglish && (
          <PronunciationHint content={cleanContent} />
        )}
      </div>
    </div>
  )
}
