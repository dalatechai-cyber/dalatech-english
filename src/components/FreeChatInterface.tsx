'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Message, LevelCode } from '@/lib/types'
import { getLevelMeta } from '@/lib/levels'
import { ChatBubble } from './ChatBubble'
import { NavBar } from './NavBar'
import { StreakPopup } from './StreakPopup'
import { parseCorrectionsFromContent, saveMistake } from '@/lib/mistakes'
import { recordStudySession } from '@/lib/streak'

interface FreeChatInterfaceProps {
  level: LevelCode
}

export function FreeChatInterface({ level }: FreeChatInterfaceProps) {
  const levelMeta = getLevelMeta(level)
  const searchParams = useSearchParams()
  const drillTopic = searchParams.get('drill')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streakData, setStreakData] = useState<{ current: number; isNewDay: boolean } | null>(null)
  const [hasRecordedStreak, setHasRecordedStreak] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const greeting = drillTopic
      ? `Сайн байна уу! Өнөөдөр бид "${drillTopic}" зөв хэлбэрийг дадлагажуулах болно.\n\nЭнэ граммарын сэдвийг дахин дадлагажуулахад бэлэн үү? Эхэлцгээе! 💪`
      : `Сайн байна уу! **${levelMeta?.label}** түвшний чөлөөт яриа хичээлд тавтай морилно уу!\n\nЯмар сэдвээр ярилцмаар байна вэ? Гэр бүл, сонирхол, аялал, хоол — аль ч сэдэв сайн. Англиар бичиж эхэлнэ үү! 😊`

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    }])

    if (drillTopic && inputRef.current) {
      inputRef.current.focus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    if (!hasRecordedStreak) {
      const data = recordStudySession()
      setStreakData({ current: data.current, isNewDay: data.isNewDay })
      setHasRecordedStreak(true)
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const aiMsgId = `a-${Date.now()}`
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() }])

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/free-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, level }),
      })

      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages(prev =>
          prev.map(m => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
        )
      }

      const corrections = parseCorrectionsFromContent(fullContent, level)
      corrections.forEach(c => saveMistake(c))
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.' }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, level, hasRecordedStreak])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col h-dvh bg-navy">
      <NavBar levelCode={level} lessonTitle="Чөлөөт яриа" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          msg.content ? <ChatBubble key={msg.id} message={msg} /> : null
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0">AI</div>
            <div className="bg-navy-surface rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pt-3 pb-3 pb-safe bg-navy-surface border-t border-navy-surface-2">
        <div className="flex items-end gap-2 bg-navy rounded-2xl px-4 py-2 border border-navy-surface-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Англиар бичнэ үү... (Enter = илгээх, Shift+Enter = шинэ мөр)"
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-[16px] sm:text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 bg-gold hover:bg-gold-dark disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>

      {streakData && streakData.isNewDay && (
        <StreakPopup streak={streakData.current} onClose={() => setStreakData(null)} />
      )}
    </div>
  )
}
