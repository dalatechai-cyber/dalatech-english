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

interface ChatInterfaceProps {
  level: LevelCode
  lessonId: number
}

export function ChatInterface({ level, lessonId }: ChatInterfaceProps) {
  const router = useRouter()
  const { completeLesson, passExam, getLevelProgress } = useProgress()
  const lessonMeta = getLessonMeta(level, lessonId)
  const levelMeta = getLevelMeta(level)
  const lp = getLevelProgress(level)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(lp.completedLessons.includes(lessonId))
  const [lastExamContent, setLastExamContent] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, level, lessonId }),
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

      if (fullContent.includes('<exam-result>')) {
        setLastExamContent(fullContent)
        const result = parseExamResult(fullContent)
        if (result?.passed) {
          // handled by onPassConfirmed button click
        } else if (!lessonMeta?.isExam) {
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
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.' }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, level, lessonId, lessonMeta, isComplete, completeLesson])

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

  const progressCount = lp.completedLessons.length

  return (
    <div className="flex flex-col h-screen bg-navy">
      <NavBar levelCode={level} lessonId={lessonId} lessonTitle={lessonMeta?.titleMn} />

      <div className="px-4 py-2 bg-navy-surface border-b border-navy-surface-2">
        <ProgressBar completed={progressCount} total={10} label={`${level} дэвшил`} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0">AI</div>
            <div className="bg-navy-surface rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
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

      <div className="px-4 py-3 bg-navy-surface border-t border-navy-surface-2">
        <div className="flex items-end gap-2 bg-navy rounded-2xl px-4 py-2 border border-navy-surface-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Энд бичнэ үү... (Enter = илгээх, Shift+Enter = шинэ мөр)"
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
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
        <p className="text-xs text-text-secondary text-center mt-1.5">
          Vocabulary дасгалын хувьд: &quot;Make a sentence with [word]&quot; гэж бичнэ үү
        </p>
      </div>
    </div>
  )
}
