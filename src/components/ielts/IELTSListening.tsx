'use client'
import type { RefObject } from 'react'
import type { IELTSContent, IELTSAnswer } from '@/lib/ielts'
import { stopSpeech } from '@/lib/tts'
import type { AudioHandle } from '@/lib/elevenlabs'
import { NavBar } from '../NavBar'
import { SectionProgress, renderQuestionBody, isAnswered } from './ielts-shared'

function ListeningWaveform() {
  return (
    <div className="flex items-end justify-center gap-1 h-10">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ width: 4, background: '#F59E0B', borderRadius: 2, height: `${12 + i * 6}px`, transformOrigin: 'bottom', animation: `waveBar ${0.6 + i * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}

interface IELTSListeningProps {
  content: IELTSContent
  sectionIdx: number
  listenAnswers: IELTSAnswer[]
  setListenAnswers: (a: IELTSAnswer[]) => void
  listenSubmitted: boolean
  setListenSubmitted: (v: boolean) => void
  listenPlayCount: number
  listenAudioReady: boolean
  listenAudioError: boolean
  listenAudioLoading: boolean
  listenLoadProgress: { done: number; total: number }
  listenNotice: string | null
  listenCurrentTurn: number
  isPlaying: boolean
  showTranscript: boolean
  setShowTranscript: (fn: (v: boolean) => boolean) => void
  playConversationTwice: () => void
  listenCurrentHandleRef: RefObject<AudioHandle | null>
  onAdvance: () => void
}

export function IELTSListening({
  content,
  sectionIdx,
  listenAnswers,
  setListenAnswers,
  listenSubmitted,
  setListenSubmitted,
  listenPlayCount,
  listenAudioReady,
  listenAudioError,
  listenAudioLoading,
  listenLoadProgress,
  listenNotice,
  listenCurrentTurn,
  isPlaying,
  showTranscript,
  setShowTranscript,
  playConversationTwice,
  listenCurrentHandleRef,
  onAdvance,
}: IELTSListeningProps) {
  const conv = content.listening.conversation
  const allAnswered = listenAnswers.length === content.listening.questions.length && listenAnswers.every(isAnswered)

  const playStatusText =
    listenPlayCount === 1 ? '1-р удаа тоглуулж байна...' :
    listenPlayCount === 2 ? '2-р удаа тоглуулж байна...' :
    listenPlayCount === 3 ? 'Дууссан ✓' : ''

  const canPlay = listenAudioReady || listenAudioError

  return (
    <div className="min-h-dvh bg-midnight-ink flex flex-col">
      <NavBar lessonTitle="Listening" />
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
        <SectionProgress idx={sectionIdx} />

        {/* Audio player card */}
        <div className="bg-midnight-ink-surface border border-midnight-ink-elevated rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-candlelight-gold uppercase tracking-wide">🎧 Яриа сонсох</div>
            {isPlaying && listenCurrentTurn >= 0 && (
              <div className="flex items-center gap-2">
                {(['A', 'B'] as const).map(sp => {
                  const active = conv[listenCurrentTurn]?.speaker === sp
                  return (
                    <span key={sp} className="text-xs font-bold rounded-full flex items-center justify-center transition-all"
                      style={{
                        width: 22, height: 22,
                        background: active ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#1E293B',
                        color: active ? '#0F172A' : '#475569',
                        boxShadow: active ? '0 0 12px #F59E0B66' : 'none',
                        transform: active ? 'scale(1.1)' : 'scale(1)',
                      }}>{sp}</span>
                  )
                })}
              </div>
            )}
          </div>

          {listenNotice && (
            <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B33' }}>
              ⚠ {listenNotice}
            </p>
          )}

          {!canPlay && listenAudioLoading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />)}
              </div>
              <p className="text-xs" style={{ color: '#F59E0B' }}>
                Яриа бэлтгэж байна...
                {listenLoadProgress.total > 0 && ` (${listenLoadProgress.done}/${listenLoadProgress.total})`}
              </p>
              {listenLoadProgress.total > 0 && (
                <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                  <div className="h-full transition-all" style={{ width: `${(listenLoadProgress.done / listenLoadProgress.total) * 100}%`, background: '#F59E0B' }} />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-1">
              {isPlaying ? (
                <div className="flex flex-col items-center py-2 gap-2">
                  <ListeningWaveform />
                  <p className="text-xs" style={{ color: '#F59E0B' }}>{playStatusText}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  {listenPlayCount === 3 && <p className="text-xs font-semibold" style={{ color: '#34D399' }}>✓ Яриа дууссан</p>}
                  {listenAudioReady && (
                    <button onClick={playConversationTwice}
                      className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                      ▶ Тоглуулах
                    </button>
                  )}
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {listenAudioError ? 'Аудио ачаалагдсангүй — дахин оролдоно уу' : 'Яриа 2 удаа автоматаар тоглуулна'}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* All questions at once */}
        <p className="text-xs mb-3 font-semibold" style={{ color: '#64748B' }}>Бүх {content.listening.questions.length} асуултад хариулна уу</p>
        <div className="space-y-4 mb-6">
          {content.listening.questions.map((q, qi) => (
            <div key={qi} className="bg-midnight-ink-surface border border-midnight-ink-elevated rounded-2xl p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">
                <span style={{ color: '#F59E0B' }}>{qi + 1}.</span> {q.question}
                {(q.type === 'fill') && (
                  <span className="ml-2 text-xs font-medium" style={{ color: '#94A3B8' }}>· Нөхөх</span>
                )}
                {(q.type === 'tfng') && (
                  <span className="ml-2 text-xs font-medium" style={{ color: '#94A3B8' }}>· True/False/NG</span>
                )}
              </p>
              {renderQuestionBody(q, qi, listenAnswers, setListenAnswers, listenSubmitted)}
            </div>
          ))}
        </div>

        {!listenSubmitted ? (
          <button onClick={() => setListenSubmitted(true)} disabled={!allAnswered}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed mb-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
            Хариултаа илгээх
          </button>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setShowTranscript(v => !v)}
              className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={{ background: '#0F172A', borderColor: '#334155', color: '#94A3B8' }}>
              {showTranscript ? '🙈 Яриа нуух' : '👁 Яриа харах'}
            </button>
            {showTranscript && (
              <div className="bg-midnight-ink-surface border border-midnight-ink-elevated rounded-2xl p-4 space-y-2 max-h-52 overflow-y-auto">
                {conv.map((turn, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: turn.speaker === 'A' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155', color: turn.speaker === 'A' ? '#0F172A' : '#F8FAFC', fontSize: 9 }}>
                      {turn.speaker}
                    </span>
                    <p className="flex-1 text-text-secondary leading-relaxed">{turn.text}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { stopSpeech(); listenCurrentHandleRef.current?.stop(); onAdvance() }}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              <span lang="en">Reading →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
