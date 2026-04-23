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
  const streamBufferRef = useRef('')
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current)
        streamTimerRef.current = null
      }
    }
  }, [])

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

      if (!res.ok) throw new Error('API error ' + res.status)
      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      streamBufferRef.current = ''

      const flush = () => {
        const snapshot = streamBufferRef.current
        setMessages(prev =>
          prev.map(m => (m.id === aiMsgId ? { ...m, content: snapshot } : m))
        )
        streamTimerRef.current = null
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        streamBufferRef.current += chunk
        if (!streamTimerRef.current) {
          streamTimerRef.current = setTimeout(flush, 30)
        }
      }

      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current)
        streamTimerRef.current = null
      }
      const fullContent = streamBufferRef.current
      setMessages(prev =>
        prev.map(m => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
      )

      const corrections = parseCorrectionsFromContent(fullContent, level)
      corrections.forEach(c => saveMistake(c))
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: 'Алдаа гарлаа. Дахин оролдоно уу.' }
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

      {/* Editorial header */}
      <div
        className="px-4 sm:px-6 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(11, 18, 34, 0.85)',
          borderBottom: '1px solid var(--hairline)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-baseline gap-3">
          <span
            className="font-serif-display text-2xl sm:text-3xl font-bold leading-none nums-tabular"
            style={{ color: 'var(--gold)', letterSpacing: '-0.02em' }}
          >
            {level}
          </span>
          <span
            className="font-serif-display text-base sm:text-lg italic"
            style={{ color: 'var(--champagne)' }}
          >
            {levelMeta?.label.split(' — ')[1] ?? 'Чөлөөт яриа'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.map(msg => (
            msg.content ? <ChatBubble key={msg.id} message={msg} /> : null
          ))}
          {isLoading && (
            <div className="flex justify-start mb-3 animate-fade-in">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#0B1222',
                }}
              >
                AI
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-editorial"
                style={{ background: '#1E293B', borderLeft: '3px solid var(--gold)' }}
              >
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: 'var(--gold)',
                        animation: 'orbIdleBreath 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="px-4 sm:px-6 pt-3 pb-input-area"
        style={{
          background: 'rgba(11, 18, 34, 0.92)',
          borderTop: '1px solid var(--hairline)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-2 rounded-full px-5 py-2 transition-all"
            style={{
              background: '#141C30',
              border: '1px solid var(--hairline)',
            }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'var(--hairline)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Англиар бичнэ үү..."
              rows={1}
              className="flex-1 bg-transparent text-text-primary text-[16px] sm:text-sm resize-none outline-none placeholder:text-text-secondary py-2 max-h-[120px]"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 disabled:opacity-40 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#0F172A',
              }}
              aria-label="Илгээх"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {streakData && streakData.isNewDay && (
        <StreakPopup streak={streakData.current} onClose={() => setStreakData(null)} />
      )}
    </div>
  )
}
