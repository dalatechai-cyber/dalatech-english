'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Message, LevelCode } from '@/lib/types'
import { getLessonMeta, getLevelMeta } from '@/lib/levels'
import { useProgress } from '@/hooks/useProgress'
import { ChatBubble } from './ChatBubble'
import { ExamScore, parseExamResult } from './ExamScore'
import { ProgressBar } from './ProgressBar'
import { NavBar } from './NavBar'
import { StreakPopup } from './StreakPopup'
import { parseCorrectionsFromContent, saveMistake } from '@/lib/mistakes'
import { recordStudySession } from '@/lib/streak'

interface ChatInterfaceProps {
  level: LevelCode
  lessonId: number
}

export function ChatInterface({ level, lessonId }: ChatInterfaceProps) {
  const router = useRouter()
  const { completeLesson, passExam, getLevelProgress, progress } = useProgress()
  const lessonMeta = getLessonMeta(level, lessonId)
  const levelMeta = getLevelMeta(level)
  const lp = getLevelProgress(level)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(lp.completedLessons.includes(lessonId))
  const [lastExamContent, setLastExamContent] = useState<string | null>(null)
  const [streakData, setStreakData] = useState<{ current: number; isNewDay: boolean } | null>(null)
  const [hasRecordedStreak, setHasRecordedStreak] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        id: 'init',
        role: 'assistant',
        content: `Сайн байна уу! Тавтай морилно уу — **${levelMeta?.label} · Хичээл ${lessonId}: ${lessonMeta?.titleMn}**\n\n${lessonMeta?.description}\n\nЭхэлцгээе! 🌟`,
        timestamp: Date.now(),
      }
      setMessages([greeting])
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
    const assistantId = `a-${Date.now()}`
    setInput('')
    setIsLoading(true)

    // Single React state update at start: user message + empty assistant placeholder
    setMessages([...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }])
    setStreamingId(assistantId)

    let fullText = ''

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, level, lessonId }),
      })

      if (!response.ok) throw new Error('API error ' + response.status)
      if (!response.body) throw new Error('No stream body')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Read stream — direct DOM update on every chunk, zero timers, zero React updates
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        fullText += decoder.decode(value, { stream: true })

        const el = document.querySelector(`[data-msg-id="${assistantId}"]`)
        if (el) el.textContent = fullText
      }

      // Single React state update at end: finalize content + exit streaming mode
      setStreamingId(null)
      setMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...m, content: fullText } : m))
      )

      // Save corrections to mistake diary
      const corrections = parseCorrectionsFromContent(fullText, level)
      corrections.forEach(c => saveMistake(c))

      if (fullText.includes('<exam-result>')) {
        setLastExamContent(fullText)
        parseExamResult(fullText)
        if (!lessonMeta?.isExam) {
          completeLesson(level, lessonId)
          setIsComplete(true)
        }
      } else {
        if (!lessonMeta?.isExam && !isComplete && newMessages.filter(m => m.role === 'user').length >= 1) {
          completeLesson(level, lessonId)
          setIsComplete(true)
        }
      }
    } catch (err: unknown) {
      setStreamingId(null)
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Алдаа гарлаа. Дахин оролдоно уу.' }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, level, lessonId, lessonMeta, isComplete, completeLesson, hasRecordedStreak])

  const handlePassConfirmed = useCallback((score: number) => {
    passExam(level, score)
    router.push(`/level/${level}`)
  }, [passExam, level, router])

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

  const progressCount = (progress.levels[level]?.completedLessons.length) ?? lp.completedLessons.length

  return (
    <div className="flex flex-col h-dvh bg-midnight-ink">
      <NavBar levelCode={level} lessonId={lessonId} lessonTitle={lessonMeta?.titleMn} />

      {/* Editorial header */}
      <div
        className="px-4 sm:px-6 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(11, 18, 34, 0.85)',
          borderBottom: '1px solid var(--hairline)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="font-serif-display text-2xl sm:text-3xl font-bold leading-none nums-tabular"
              style={{ color: 'var(--candlelight-gold)', letterSpacing: '-0.02em' }}
            >
              {level}
            </span>
            <span
              className="font-serif-display text-base sm:text-lg italic truncate"
              style={{ color: 'var(--vellum-champagne)' }}
            >
              {lessonMeta?.titleMn ?? levelMeta?.label.split(' — ')[1]}
            </span>
          </div>
          <ProgressBar completed={progressCount} total={10} label={`${level} дэвшил`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.map(msg => {
            const isThisStreaming = msg.id === streamingId
            if (!msg.content && !isThisStreaming) return null
            return <ChatBubble key={msg.id} message={msg} isStreaming={isThisStreaming} />
          })}
          {isLoading && !streamingId && (
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
                style={{ background: '#1E293B', borderLeft: '3px solid var(--candlelight-gold)' }}
              >
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: 'var(--candlelight-gold)',
                        animation: 'orbIdleBreath 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {lastExamContent && !isLoading && (
            <ExamScore
              content={lastExamContent}
              level={level}
              onPassConfirmed={handlePassConfirmed}
            />
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
              e.currentTarget.style.borderColor = 'var(--candlelight-gold)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'var(--hairline)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Энд бичнэ үү..."
              rows={1}
              className="flex-1 bg-transparent text-text-primary text-[16px] sm:text-sm resize-none outline-none placeholder:text-text-secondary py-2 max-h-[120px]"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 flex items-center justify-center"
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
          <p
            className="text-[11px] text-center mt-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Vocabulary дасгалын хувьд: &quot;Make a sentence with [word]&quot;
          </p>
        </div>
      </div>

      {streakData && streakData.isNewDay && (
        <StreakPopup
          streak={streakData.current}
          onClose={() => setStreakData(null)}
        />
      )}
    </div>
  )
}
