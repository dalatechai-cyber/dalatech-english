'use client'
import { useState, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { NavBar } from './NavBar'
import { CertificateModal } from './CertificateModal'
import { StreakPopup } from './StreakPopup'
import { recordStudySession } from '@/lib/streak'
import { useLanguage } from '@/lib/i18n'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface QuizModeProps {
  level: LevelCode
}

type QuizState = 'loading' | 'question' | 'answered' | 'results'

export function QuizMode({ level }: QuizModeProps) {
  const { t } = useLanguage()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [state, setState] = useState<QuizState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null))
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [streakData, setStreakData] = useState<{ current: number; isNewDay: boolean } | null>(null)

  const loadQuiz = async () => {
    setState('loading')
    setError(null)
    setCurrentIndex(0)
    setAnswers(Array(10).fill(null))
    setSelectedAnswer(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
      if (!res.ok) throw new Error('Failed to generate quiz')
      const data = await res.json() as { questions: QuizQuestion[] }
      if (!data.questions || data.questions.length < 5) throw new Error('Invalid quiz data')
      setQuestions(data.questions)
      setState('question')
    } catch {
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setState('loading')
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuiz() }, [level])

  const handleSelectAnswer = (idx: number) => {
    if (state !== 'question') return
    setSelectedAnswer(idx)
    const newAnswers = [...answers]
    newAnswers[currentIndex] = idx
    setAnswers(newAnswers)
    setState('answered')
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setState('question')
    } else {
      const data = recordStudySession()
      setStreakData({ current: data.current, isNewDay: data.isNewDay })
      setState('results')
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct).length
  const passed = score >= 7
  const q = questions[currentIndex]

  if (error) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест" />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-rose-400 mb-4">{error}</p>
            <button onClick={loadQuiz} className="bg-gold text-navy font-semibold px-6 py-2.5 rounded-xl">
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-text-secondary text-sm">{t('quizLoading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'results') {
    const wrongTopics = questions
      .filter((_, i) => answers[i] !== questions[i].correct)
      .map(q => q.explanation)
      .slice(0, 3)

    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест — үр дүн" />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <div className="text-6xl font-extrabold text-gold mb-2">{score}/10</div>
            <div className={`text-xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passed ? t('quizPassed') : t('quizFailed')}
            </div>
            <p className="text-text-secondary text-sm">
              {passed ? t('quizPassMsg') : t('quizFailMsg')}
            </p>
          </div>

          {/* Score bar */}
          <div className="w-full h-3 bg-navy-surface-2 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${(score / 10) * 100}%` }}
            />
          </div>

          {/* Wrong explanations */}
          {!passed && wrongTopics.length > 0 && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-6">
              <div className="text-sm font-semibold text-text-primary mb-3">Давтах сэдвүүд:</div>
              <ul className="space-y-2">
                {wrongTopics.map((topic, i) => (
                  <li key={i} className="text-xs text-text-secondary flex gap-2">
                    <span className="text-rose-400">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Question review */}
          <div className="space-y-3 mb-6">
            {questions.map((question, i) => {
              const correct = answers[i] === question.correct
              return (
                <div key={i} className={`rounded-xl p-3 border text-sm ${correct ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                  <div className="flex items-start gap-2">
                    <span className={correct ? 'text-emerald-400' : 'text-rose-400'}>{correct ? '✓' : '✗'}</span>
                    <div>
                      <p className="text-text-primary mb-1">{question.question}</p>
                      {!correct && (
                        <p className="text-xs text-text-secondary">
                          Зөв: <span className="text-emerald-400">{question.options[question.correct]}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            {passed && (
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                🎓 Гэрчилгээ авах
              </button>
            )}
            <button
              onClick={loadQuiz}
              className="w-full bg-navy-surface hover:bg-navy-surface-2 border border-navy-surface-2 text-text-primary font-semibold py-3 min-h-[48px] rounded-xl transition-colors"
            >
              {t('quizRetry')}
            </button>
          </div>
        </div>

        {showCertificate && (
          <CertificateModal
            level={level}
            score={score}
            total={10}
            onClose={() => setShowCertificate(false)}
          />
        )}
        {streakData && streakData.isNewDay && (
          <StreakPopup streak={streakData.current} onClose={() => setStreakData(null)} />
        )}
      </div>
    )
  }

  // Question view
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <NavBar levelCode={level} lessonTitle={`Тест — ${currentIndex + 1}/10`} />
      <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: questions.length }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < currentIndex
                  ? answers[i] === questions[i].correct ? 'bg-emerald-500' : 'bg-rose-500'
                  : i === currentIndex
                  ? 'bg-gold'
                  : 'bg-navy-surface-2'
              }`}
            />
          ))}
        </div>

        <div className="text-xs text-text-secondary mb-3">{level} Тест · {currentIndex + 1}/{questions.length}</div>

        {q && (
          <>
            <h2 className="text-lg font-semibold text-text-primary mb-6">{q.question}</h2>

            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => {
                let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40 cursor-pointer'
                if (state === 'answered') {
                  if (i === q.correct) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
                  else if (i === selectedAnswer) style = 'border-rose-500 bg-rose-500/10 text-rose-400 cursor-default'
                  else style = 'border-navy-surface-2 text-text-secondary opacity-50 cursor-default'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(i)}
                    disabled={state === 'answered'}
                    className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                )
              })}
            </div>

            {state === 'answered' && (
              <div className={`rounded-xl p-4 mb-6 text-sm ${selectedAnswer === q.correct ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                <div className={`font-semibold mb-1 ${selectedAnswer === q.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedAnswer === q.correct ? '✅ Зөв!' : '❌ Буруу.'}
                </div>
                <p className="text-text-secondary text-xs">{q.explanation}</p>
              </div>
            )}

            {state === 'answered' && (
              <button
                onClick={handleNext}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                {currentIndex < questions.length - 1 ? `${t('next')} →` : 'Үр дүн харах →'}
              </button>
            )}
          </>
        )}
      </div>

      {streakData && streakData.isNewDay && (
        <StreakPopup streak={streakData.current} onClose={() => setStreakData(null)} />
      )}
    </div>
  )
}
