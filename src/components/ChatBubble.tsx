'use client'
import type { Message } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import { ErrorCorrection } from './ErrorCorrection'
import { PronunciationHint } from './PronunciationHint'

interface ChatBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const isAI = message.role === 'assistant'
  const hasCorrection = message.content.includes('<correction>')

  const cleanContent = message.content
    .replace(/<correction>[\s\S]*?<\/correction>/g, '')
    .replace(/<exam-result>[\s\S]*?<\/exam-result>/g, '')
    .trim()

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
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${isAI ? 'rounded-tl-sm' : 'rounded-tr-sm font-medium'}`}
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
              }
        }
      >
        {isAI && hasCorrection ? (
          <ErrorCorrection content={message.content} />
        ) : isAI ? (
          isStreaming ? (
            <div
              data-msg-id={message.id}
              data-streaming="true"
              className="streaming-text text-sm leading-relaxed whitespace-pre-wrap"
            >
              {cleanContent || message.content}
            </div>
          ) : (
            <div
              data-msg-id={message.id}
              className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed"
            >
              <ReactMarkdown>{cleanContent || message.content}</ReactMarkdown>
            </div>
          )
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent || message.content}</p>
        )}
        {isAI && !isStreaming && (
          <PronunciationHint content={cleanContent} />
        )}
      </div>
    </div>
  )
}
