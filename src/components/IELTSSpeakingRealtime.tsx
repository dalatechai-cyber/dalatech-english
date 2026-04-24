'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent } from '@/lib/ielts'

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'
type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking'
type TestPart = 1 | 2 | 3

export interface RealtimeCompletionPayload {
  speakingPart1: string[]
  speakingPart2: string
  speakingPart3: string[]
  fullTranscript: { role: 'examiner' | 'student'; text: string; part: TestPart }[]
}

interface Props {
  content: IELTSContent
  onComplete: (payload: RealtimeCompletionPayload) => void
  onStop: (partial: RealtimeCompletionPayload | null) => void
  onFallback: () => void
}

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function isEnglishText(text: string): boolean {
  if (!text) return false
  const latinChars = text.match(/[a-zA-Z\s.,!?]/g)
  if (!latinChars) return false
  return latinChars.length / text.length > 0.5
}

function playBoopSound() {
  try {
    const Ctor: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined
    if (!Ctor) return
    const audioCtx = new Ctor()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.3)
    oscillator.onended = () => { try { audioCtx.close() } catch { /* ignore */ } }
  } catch (e) {
    console.warn('Boop sound failed:', e)
  }
}

function stripMarkers(text: string): string {
  return text
    .replace(/\[PART_2_START\]/g, '')
    .replace(/\[PART_3_START\]/g, '')
    .replace(/\[PREP_START\]/g, '')
    .replace(/\[PREP_END\]/g, '')
    .replace(/\[TEST_COMPLETE\]/g, '')
    .trim()
}

const ORB_COLORS: Record<OrbState, string> = {
  idle: '#1E40AF',
  speaking: '#F59E0B',
  listening: '#38BDF8',
  thinking: '#8B5CF6',
}

type OrbStyleSet = Record<OrbState, { outer: React.CSSProperties; middle: React.CSSProperties; inner: React.CSSProperties }>

function SpeakOrb({ state }: { state: OrbState }) {
  const orbStyles = useMemo<OrbStyleSet>(
    () =>
      (Object.keys(ORB_COLORS) as OrbState[]).reduce((acc, st) => {
        const c = ORB_COLORS[st]
        acc[st] = {
          outer: { width: 280, height: 280, border: `2px solid ${c}`, opacity: 0.2, boxShadow: `0 0 60px ${c}22` },
          middle: { width: 200, height: 200, border: `2px solid ${c}`, opacity: 0.35, boxShadow: `0 0 40px ${c}33` },
          inner: {
            width: 120,
            height: 120,
            background: `radial-gradient(circle, ${c}66 0%, ${c}33 50%, ${c}11 100%)`,
            border: `2px solid ${c}99`,
            boxShadow: `0 0 30px ${c}55, 0 0 60px ${c}33, 0 0 100px ${c}11`,
          },
        }
        return acc
      }, {} as OrbStyleSet),
    [],
  )
  const s = orbStyles[state]
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div className={`absolute rounded-full orb-ring-outer orb-${state}`} style={s.outer} />
      <div className={`absolute rounded-full orb-ring-middle orb-${state}`} style={s.middle} />
      <div className={`orb-inner orb-${state} rounded-full flex items-center justify-center`} style={s.inner} />
    </div>
  )
}

export function IELTSSpeakingRealtime({ content, onComplete, onStop, onFallback }: Props) {
  const [connState, setConnState] = useState<ConnectionState>('idle')
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [showCard, setShowCard] = useState<string | null>(null)
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null)
  const [part2Countdown, setPart2Countdown] = useState<number | null>(null)
  const [statusLabel, setStatusLabel] = useState('')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [micDenied, setMicDenied] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const partRef = useRef<TestPart>(1)
  const currentExaminerRespRef = useRef<string>('')
  const transcriptRef = useRef<RealtimeCompletionPayload['fullTranscript']>([])
  const studentAnswersByPart = useRef<{ part1: string[]; part2: string[]; part3: string[] }>({
    part1: [], part2: [], part3: [],
  })
  const finishedRef = useRef(false)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const part2TimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const micReenableTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null }
    if (part2TimerRef.current) { clearInterval(part2TimerRef.current); part2TimerRef.current = null }
    if (finishTimeoutRef.current) { clearTimeout(finishTimeoutRef.current); finishTimeoutRef.current = null }
    if (micReenableTimeoutRef.current) { clearTimeout(micReenableTimeoutRef.current); micReenableTimeoutRef.current = null }
    if (dcRef.current) {
      try { dcRef.current.close() } catch { /* ignore */ }
      dcRef.current = null
    }
    if (pcRef.current) {
      try { pcRef.current.close() } catch { /* ignore */ }
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => { try { t.stop() } catch { /* ignore */ } })
      localStreamRef.current = null
    }
    if (audioElRef.current) {
      try { audioElRef.current.pause() } catch { /* ignore */ }
      audioElRef.current.srcObject = null
      try { document.body.removeChild(audioElRef.current) } catch { /* ignore */ }
      audioElRef.current = null
    }
  }, [])

  const buildPayload = useCallback((): RealtimeCompletionPayload => {
    const p1Count = content.speaking.part1Questions.length || 8
    const p3Count = content.speaking.part3Questions.length || 4
    const p1 = studentAnswersByPart.current.part1.slice(0, p1Count)
    while (p1.length < p1Count) p1.push('')
    const p2 = studentAnswersByPart.current.part2.join(' ').trim()
    const p3 = studentAnswersByPart.current.part3.slice(0, p3Count)
    while (p3.length < p3Count) p3.push('')
    return {
      speakingPart1: p1,
      speakingPart2: p2,
      speakingPart3: p3,
      fullTranscript: [...transcriptRef.current],
    }
  }, [content])

  const finishTest = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const payload = buildPayload()
    cleanup()
    setConnState('ended')
    setOrbState('idle')
    onComplete(payload)
  }, [buildPayload, cleanup, onComplete])

  const handleStop = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    const anyAnswers =
      studentAnswersByPart.current.part1.length > 0 ||
      studentAnswersByPart.current.part2.length > 0 ||
      studentAnswersByPart.current.part3.length > 0
    const payload = anyAnswers ? buildPayload() : null
    cleanup()
    setConnState('ended')
    onStop(payload)
  }, [buildPayload, cleanup, onStop])

  const startPrepCountdown = useCallback(() => {
    setShowCard(content.speaking.part2Card || null)
    setPrepCountdown(60)
    setStatusLabel('Бэлдэх хугацаа')
    setOrbState('thinking')
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    prepTimerRef.current = setInterval(() => {
      setPrepCountdown(c => {
        if (c === null) return null
        if (c <= 1) {
          if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null }
          try {
            const dc = dcRef.current
            if (dc && dc.readyState === 'open') {
              dc.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{ type: 'input_text', text: 'CONTINUE_AFTER_PREP' }],
                },
              }))
              dc.send(JSON.stringify({ type: 'response.create' }))
            }
          } catch { /* ignore */ }
          return null
        }
        return c - 1
      })
    }, 1000)
  }, [content.speaking.part2Card])

  const startPart2SpeakingCountdown = useCallback(() => {
    setPart2Countdown(120)
    if (part2TimerRef.current) clearInterval(part2TimerRef.current)
    part2TimerRef.current = setInterval(() => {
      setPart2Countdown(c => {
        if (c === null) return null
        if (c <= 1) {
          if (part2TimerRef.current) { clearInterval(part2TimerRef.current); part2TimerRef.current = null }
          return 0
        }
        return c - 1
      })
    }, 1000)
  }, [])

  const processExaminerFinal = useCallback((text: string) => {
    const cleaned = stripMarkers(text)
    if (text.includes('[PART_2_START]')) {
      partRef.current = 2
    }
    if (text.includes('[PART_3_START]')) {
      partRef.current = 3
      setShowCard(null)
      setPart2Countdown(null)
      if (part2TimerRef.current) { clearInterval(part2TimerRef.current); part2TimerRef.current = null }
    }
    if (text.includes('[PREP_START]')) {
      startPrepCountdown()
    }
    if (text.includes('[PREP_END]')) {
      setShowCard(content.speaking.part2Card || null)
      setPrepCountdown(null)
      if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null }
      startPart2SpeakingCountdown()
    }
    if (cleaned.length > 0) {
      transcriptRef.current.push({ role: 'examiner', text: cleaned, part: partRef.current })
    }
    if (text.includes('[TEST_COMPLETE]')) {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
      finishTimeoutRef.current = setTimeout(finishTest, 1500)
    }
  }, [content.speaking.part2Card, finishTest, startPart2SpeakingCountdown, startPrepCountdown])

  const processStudentUtterance = useCallback((text: string) => {
    const t = text.trim()
    if (!t) return
    transcriptRef.current.push({ role: 'student', text: t, part: partRef.current })
    if (partRef.current === 1) studentAnswersByPart.current.part1.push(t)
    else if (partRef.current === 2) studentAnswersByPart.current.part2.push(t)
    else studentAnswersByPart.current.part3.push(t)
  }, [])

  const connect = useCallback(async () => {
    if (connState === 'connecting' || connState === 'connected') return
    setConnState('connecting')
    setConnectionError(null)
    setMicDenied(false)
    setStatusLabel('AI шалгагчтай холбогдож байна...')

    // HTTPS is required for getUserMedia on non-localhost; fail fast with a clear message.
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setConnectionError('Микрофон ашиглахын тулд HTTPS шаардлагатай')
      setConnState('error')
      return
    }

    // WebRTC capability check — some embedded browsers lack RTCPeerConnection.
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      setConnectionError('Таны хөтөч энэ функцийг дэмждэггүй. Chrome эсвэл Safari хөтчийг ашиглана уу.')
      setConnState('error')
      return
    }

    // Request mic permission explicitly up-front so iOS/Android surface the dialog
    // inside the current user gesture, then release the probe stream.
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
      probe.getTracks().forEach(t => t.stop())
    } catch (err) {
      const name = (err as { name?: string } | undefined)?.name
      if (name === 'NotAllowedError') {
        setConnectionError('Микрофоны зөвшөөрөл өгнө үү. Утасны тохиргооноос хөтчид микрофон ашиглах зөвшөөрөл олгоно уу.')
      } else if (name === 'NotFoundError') {
        setConnectionError('Микрофон олдсонгүй. Төхөөрөмжийн микрофон ажиллаж байгаа эсэхийг шалгана уу.')
      } else {
        setConnectionError('Микрофон ашиглах боломжгүй байна. Дахин оролдоно уу.')
      }
      setMicDenied(true)
      setConnState('error')
      return
    }

    try {
      const sessRes = await fetch('/api/ielts/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part1Questions: content.speaking.part1Questions,
          part2Card: content.speaking.part2Card,
          part3Questions: content.speaking.part3Questions,
        }),
      })
      if (!sessRes.ok) {
        const detail = await sessRes.text().catch(() => '')
        throw new Error(`Session error (${sessRes.status}): ${detail.slice(0, 200)}`)
      }
      const session = await sessRes.json() as { clientSecret: string; model: string }
      if (!session.clientSecret) throw new Error('No client secret')

      let stream: MediaStream
      try {
        // Mobile-optimized constraints: mono, 24kHz matches OpenAI Realtime's
        // preferred input; built-in suppression keeps typing noise out of speech.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            suppressLocalAudioPlayback: true,
            sampleRate: 24000,
            channelCount: 1,
          } as MediaTrackConstraints,
        })
      } catch (err) {
        const name = (err as { name?: string } | undefined)?.name
        setMicDenied(true)
        if (name === 'NotAllowedError') {
          throw new Error('Микрофоны зөвшөөрөл өгнө үү. Утасны тохиргооноос хөтчид микрофон ашиглах зөвшөөрөл олгоно уу.')
        }
        if (name === 'NotFoundError') {
          throw new Error('Микрофон олдсонгүй.')
        }
        throw new Error('Микрофон ажиллахгүй байна. Дахин оролдоно уу.')
      }
      localStreamRef.current = stream

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      if (!audioElRef.current) {
        const el = document.createElement('audio')
        el.autoplay = true
        el.style.display = 'none'
        document.body.appendChild(el)
        audioElRef.current = el
      }
      pc.ontrack = (ev) => {
        if (audioElRef.current && ev.streams[0]) {
          audioElRef.current.srcObject = ev.streams[0]
          audioElRef.current.play().catch(() => { /* autoplay may fail briefly */ })
        }
      }

      stream.getAudioTracks().forEach(t => pc.addTrack(t, stream))

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.addEventListener('open', () => {
        setConnState('connected')
        setStatusLabel('Шалгагч ярьж эхэлж байна...')
        setOrbState('speaking')
        try {
          dc.send(JSON.stringify({
            type: 'response.create',
            response: { modalities: ['text', 'audio'] },
          }))
        } catch { /* ignore */ }
      })

      dc.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type: string
            transcript?: string
            delta?: string
            item?: { content?: Array<{ transcript?: string }> }
            error?: { message?: string }
          }
          switch (msg.type) {
            case 'response.audio.delta':
              // Direct event-driven mute — fires before orbState useEffect
              // so speaker audio cannot bleed into the mic during the delay.
              localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false })
              break
            case 'response.audio.done':
              // Server has finished SENDING audio; the client jitter buffer
              // is still playing it. Do NOT reopen the mic here — use
              // output_audio_buffer.stopped, which fires at actual
              // end-of-playback from the client's perspective.
              break
            case 'output_audio_buffer.stopped':
              // WebRTC-only event: server has observed (via RTCP) that the
              // client's output audio buffer finished playing. This is the
              // true end-of-playback signal; no jitter-buffer grace needed.
              // 200ms natural pause, boop, 300ms so the boop doesn't bleed
              // into the student's first word, then flip the orb blue and
              // unmute the mic.
              if (micReenableTimeoutRef.current) clearTimeout(micReenableTimeoutRef.current)
              micReenableTimeoutRef.current = setTimeout(() => {
                playBoopSound()
                micReenableTimeoutRef.current = setTimeout(() => {
                  setOrbState('listening')
                  localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
                  micReenableTimeoutRef.current = null
                }, 300)
              }, 200)
              break
            case 'response.audio_transcript.delta':
              if (typeof msg.delta === 'string') {
                currentExaminerRespRef.current += msg.delta
                setOrbState('speaking')
              }
              break
            case 'response.audio_transcript.done':
              if (typeof msg.transcript === 'string') {
                processExaminerFinal(msg.transcript)
                currentExaminerRespRef.current = ''
              }
              break
            case 'input_audio_buffer.speech_stopped':
              setOrbState('thinking')
              break
            case 'conversation.item.input_audio_transcription.completed':
              if (typeof msg.transcript === 'string') {
                const t = msg.transcript.trim()
                if (t && t !== 'CONTINUE_AFTER_PREP' && isEnglishText(t)) {
                  processStudentUtterance(t)
                }
              }
              break
            case 'error':
              console.error('[Realtime] error event:', msg.error)
              setConnectionError(msg.error?.message ?? 'OpenAI error')
              break
          }
        } catch {
          /* non-JSON frames — ignore */
        }
      })

      dc.addEventListener('close', () => {
        if (!finishedRef.current) {
          setConnectionError('Холболт тасарлаа')
          setConnState('error')
        }
      })

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          if (!finishedRef.current) {
            setConnectionError('WebRTC холболт амжилтгүй')
            setConnState('error')
          }
        }
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(session.model)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })
      if (!sdpRes.ok) {
        const detail = await sdpRes.text().catch(() => '')
        throw new Error(`SDP exchange failed (${sdpRes.status}): ${detail.slice(0, 200)}`)
      }
      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Realtime] connect failed:', msg)
      setConnectionError(msg)
      setConnState('error')
      cleanup()
    }
  }, [connState, content.speaking, cleanup, processExaminerFinal, processStudentUtterance])

  const handleReconnect = useCallback(async () => {
    cleanup()
    await new Promise(resolve => setTimeout(resolve, 500))
    setConnState('idle')
    setConnectionError(null)
    setMicDenied(false)
    connect()
  }, [cleanup, connect])

  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  // Mute mic while AI speaks (gold orb = 'speaking'); unmute on student turn
  // (blue orb = 'listening'). Prevents AI audio bleeding into the mic on mobile.
  useEffect(() => {
    if (!localStreamRef.current) return
    const tracks = localStreamRef.current.getAudioTracks()
    if (orbState === 'speaking') {
      // AI speaking (gold) — mute mic completely
      tracks.forEach(t => { t.enabled = false })
    } else if (orbState === 'listening') {
      // Student turn (blue) — unmute mic
      tracks.forEach(t => { t.enabled = true })
    }
  }, [orbState])

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#050D1A' }}>
      {connState !== 'idle' && (
        <>
          <div className="hidden md:block fixed top-4 right-4 z-50">
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
              style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}>
              ⏹ Дуусгах
            </button>
          </div>
          <div className="md:hidden fixed z-50" style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }}>
            <button
              onClick={handleStop}
              className="rounded-xl font-semibold text-sm"
              style={{
                minWidth: 160,
                minHeight: 52,
                padding: '14px 32px',
                background: 'rgba(239, 68, 68, 0.9)',
                border: '1px solid #EF4444',
                color: '#FFF5F5',
                boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
              }}>
              ⏹ Дуусгах
            </button>
          </div>
        </>
      )}

      <NavBar lessonTitle="Speaking" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <SpeakOrb state={orbState} />

        {connState === 'idle' && (
          <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xs">
            <p className="text-sm text-center" style={{ color: '#64748B' }}>
              AI шалгагч Sarah таныг асуулт асуух болно. Жинхэнэ IELTS адил яриа.
            </p>
            <button
              onClick={connect}
              className="w-52 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              🎤 Ярианы шалгалт эхлэх
            </button>
          </div>
        )}

        {connState === 'connecting' && (
          <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map(i => <span key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
              {statusLabel || 'AI шалгагчтай холбогдож байна...'}
            </p>
          </div>
        )}

        {connState === 'error' && (
          <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-sm">
            <p className="text-sm text-center" style={{ color: '#F87171' }}>
              {connectionError ?? (micDenied
                ? 'Микрофон хэрэглэхийг зөвшөөрнө үү. Хөтчийн тохиргооноос микрофонд зөвшөөрөл өгөөд дахин оролдоно уу.'
                : 'Холболт амжилтгүй')}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleReconnect}
                className="px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                🔄 Дахин оролдох
              </button>
              <button
                onClick={onFallback}
                className="px-5 py-3 rounded-xl font-semibold text-sm transition-all border"
                style={{ background: '#1E293B', borderColor: '#334155', color: '#CBD5E1' }}>
                Хуучин хувилбар
              </button>
            </div>
          </div>
        )}

        {connState === 'connected' && (
          <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-md">
            {prepCountdown !== null && (
              <div className="text-center">
                <div className="text-5xl font-extrabold mb-2" style={{ color: '#FCD34D', letterSpacing: '-0.03em' }}>
                  0:{String(prepCountdown).padStart(2, '0')}
                </div>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Бэлдэх хугацаа</p>
              </div>
            )}

            {showCard && (
              <div className="text-left px-4 py-3 rounded-2xl w-full" style={{ background: '#0F172A', border: '1px solid #F59E0B55' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gold uppercase tracking-wide">📋 Topic Card</div>
                  {part2Countdown !== null && (
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: part2Countdown === 0 ? '#F59E0B' : '#FCD34D' }}>
                      ⏱ {mmss(part2Countdown)}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">{showCard}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
