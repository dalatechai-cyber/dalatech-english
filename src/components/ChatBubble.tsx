import type { Message } from '@/lib/types'
import { ErrorCorrection } from './ErrorCorrection'

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

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? 'bg-navy-surface text-text-primary rounded-tl-sm'
            : 'bg-gold text-navy font-medium rounded-tr-sm'
        }`}
      >
        {isAI && hasCorrection ? (
          <ErrorCorrection content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent || message.content}</p>
        )}
      </div>
    </div>
  )
}
