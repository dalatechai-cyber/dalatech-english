'use client'
import { useRef, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { formatMongolianDate, saveCertificate } from '@/lib/certificates'
import { getLevelMeta } from '@/lib/levels'
import { t } from '@/lib/i18n'

interface CertificateModalProps {
  level: LevelCode
  score: number
  total: number
  onClose: () => void
}

// Refined, prestigious palette (antique gold + deep navy on warm ivory)
const NAVY = '#0F1E3D'
const NAVY_DEEP = '#081230'
const GOLD = '#C9A55C'
const GOLD_DARK = '#8B6F2E'
const GOLD_LIGHT = '#E8D29A'
const GOLD_PALE = '#F5E7C2'
const IVORY = '#FDFCF5'

// A4 landscape at 72 dpi — exact A4 aspect (1.414:1)
const CERT_W = 842
const CERT_H = 595

// Subtle diamond damask in gold — layered repeating gradients read like a
// faint guilloche pattern under text while staying print-ready.
const PATTERN_BG: React.CSSProperties = {
  backgroundColor: IVORY,
  backgroundImage: [
    `repeating-linear-gradient(45deg,  transparent 0 26px, rgba(201,165,92,0.055) 26px 27px)`,
    `repeating-linear-gradient(-45deg, transparent 0 26px, rgba(201,165,92,0.055) 26px 27px)`,
    `radial-gradient(ellipse at 50% 0%, rgba(201,165,92,0.10), transparent 55%)`,
    `radial-gradient(ellipse at 50% 100%, rgba(201,165,92,0.08), transparent 55%)`,
  ].join(', '),
}

function CornerFiligree({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 150
  const flipX = corner === 'tr' || corner === 'br'
  const flipY = corner === 'bl' || corner === 'br'
  const transform = `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`
  const pos: React.CSSProperties =
    corner === 'tl'
      ? { top: 18, left: 18 }
      : corner === 'tr'
      ? { top: 18, right: 18 }
      : corner === 'bl'
      ? { bottom: 18, left: 18 }
      : { bottom: 18, right: 18 }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 150 150"
      style={{ position: 'absolute', zIndex: 3, ...pos }}
    >
      <g transform={transform} transformOrigin="75 75">
        <path
          d="M 6 6 L 90 6 Q 78 18 64 20 Q 46 22 34 34 Q 22 46 20 64 Q 18 78 6 90 Z"
          fill={NAVY}
        />
        <path
          d="M 12 12 L 78 12 Q 66 22 54 25 Q 40 28 30 38 Q 20 48 17 62 Q 14 74 12 80 Z"
          fill="none"
          stroke={GOLD}
          strokeWidth={0.8}
          opacity={0.55}
        />
        <path
          d="M 22 22 Q 40 26 54 40 Q 60 46 58 56 Q 54 50 46 48 Q 38 46 34 50 Q 30 54 32 60 Q 28 54 28 46 Q 28 36 22 22 Z"
          fill={GOLD}
        />
        <circle cx={24} cy={24} r={3} fill={GOLD_LIGHT} />
        <circle cx={22} cy={22} r={1.2} fill={NAVY} />
        <circle cx={70} cy={14} r={1.8} fill={GOLD} />
        <circle cx={14} cy={70} r={1.8} fill={GOLD} />
        <circle cx={50} cy={50} r={1.4} fill={GOLD_LIGHT} />
      </g>
    </svg>
  )
}

function OrnamentDivider({ width = 320 }: { width?: number }) {
  return (
    <svg
      width={width}
      height={20}
      viewBox="0 0 320 20"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="ceRule" x1="0" x2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
          <stop offset="50%" stopColor={GOLD_DARK} stopOpacity="1" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="10" y1="10" x2="140" y2="10" stroke="url(#ceRule)" strokeWidth={1} />
      <line x1="180" y1="10" x2="310" y2="10" stroke="url(#ceRule)" strokeWidth={1} />
      <circle cx={148} cy={10} r={1.5} fill={GOLD_DARK} />
      <circle cx={172} cy={10} r={1.5} fill={GOLD_DARK} />
      <g transform="translate(160,10)">
        <path d="M 0 -7 L 5 0 L 0 7 L -5 0 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth={0.6} />
        <path d="M 0 -3 L 2 0 L 0 3 L -2 0 Z" fill={GOLD_PALE} />
      </g>
    </svg>
  )
}

function Crest() {
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ceCrest" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <g stroke="url(#ceCrest)" strokeWidth={1.2} fill="none" strokeLinecap="round">
        <path d="M 14 20 Q 8 32 14 46" />
        <path d="M 50 20 Q 56 32 50 46" />
        {[0, 1, 2, 3, 4].map(i => (
          <path
            key={`L${i}`}
            d={`M ${13 - i * 0.4} ${24 + i * 5} q -4 1 -6 5 q 4 0 6 -5`}
            fill={GOLD}
            stroke="none"
          />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <path
            key={`R${i}`}
            d={`M ${51 + i * 0.4} ${24 + i * 5} q 4 1 6 5 q -4 0 -6 -5`}
            fill={GOLD}
            stroke="none"
          />
        ))}
      </g>
      <path
        d="M 32 14 L 44 18 L 44 34 Q 44 46 32 52 Q 20 46 20 34 L 20 18 Z"
        fill={NAVY_DEEP}
        stroke={GOLD}
        strokeWidth={1}
      />
      <text
        x={32}
        y={36}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill={GOLD_LIGHT}
        fontFamily='"Playfair Display", Georgia, serif'
        letterSpacing={1}
      >
        CE
      </text>
      <circle cx={32} cy={10} r={2} fill={GOLD} />
    </svg>
  )
}

function WaxSeal() {
  return (
    <svg width={120} height={150} viewBox="0 0 120 150" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="ceWax" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#FFF4D6" />
          <stop offset="25%" stopColor={GOLD_LIGHT} />
          <stop offset="70%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </radialGradient>
        <linearGradient id="ceRibbonL" x1="0" x2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="ceRibbonR" x1="1" x2="0">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>

      <path d="M 42 56 L 22 140 L 42 128 L 52 140 L 62 86 Z" fill="url(#ceRibbonL)" />
      <path d="M 78 56 L 98 140 L 78 128 L 68 140 L 58 86 Z" fill="url(#ceRibbonR)" />
      <path d="M 22 140 L 32 130 L 42 140 Z" fill={IVORY} />
      <path d="M 98 140 L 88 130 L 78 140 Z" fill={IVORY} />

      <polygon
        points="60,12 64,30 80,22 70,38 88,42 70,46 80,62 64,54 60,72 56,54 40,62 50,46 32,42 50,38 40,22 56,30"
        fill={GOLD_DARK}
        opacity={0.85}
      />
      <circle cx={60} cy={42} r={30} fill="url(#ceWax)" stroke={GOLD_DARK} strokeWidth={1.4} />
      <circle cx={60} cy={42} r={25} fill="none" stroke={GOLD_DARK} strokeWidth={0.7} opacity={0.6} />
      <circle cx={60} cy={42} r={21} fill="none" stroke={GOLD_DARK} strokeWidth={0.4} opacity={0.4} />
      <text
        x={60}
        y={48}
        textAnchor="middle"
        fontSize={18}
        fontWeight={700}
        fill={NAVY_DEEP}
        fontFamily='"Playfair Display", Georgia, serif'
        letterSpacing={1.5}
      >
        CE
      </text>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x = 60 + Math.cos(a) * 28
        const y = 42 + Math.sin(a) * 28
        return <circle key={i} cx={x} cy={y} r={0.8} fill={NAVY_DEEP} opacity={0.5} />
      })}
    </svg>
  )
}

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  const meta = getLevelMeta(level)
  const shortName = meta?.label.split(' — ')[1] ?? ''
  const levelDisplay = shortName ? `${level} — ${shortName}` : level

  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = certRef.current
    if (!el) return
    const update = () => {
      const parent = el.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const scale = Math.min(1, w / CERT_W)
      el.style.transform = `scale(${scale})`
      parent.style.height = `${CERT_H * scale}px`
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleDownload = async () => {
    const element = certRef.current
    if (!element) return
    const prevTransform = element.style.transform
    const parent = element.parentElement
    const prevHeight = parent?.style.height
    try {
      if (typeof document !== 'undefined' && 'fonts' in document) {
        try { await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready } catch {}
      }
      element.style.transform = 'scale(1)'
      if (parent) parent.style.height = `${CERT_H}px`
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: IVORY,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `CoreEnglish-Certificate-${level}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Certificate download failed', e)
    } finally {
      element.style.transform = prevTransform
      if (parent && prevHeight !== undefined) parent.style.height = prevHeight
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[880px] my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
          <div
            id="certificate"
            ref={certRef}
            style={{
              width: `${CERT_W}px`,
              height: `${CERT_H}px`,
              transformOrigin: 'top left',
              ...PATTERN_BG,
              boxSizing: 'border-box',
              fontFamily: '"EB Garamond", Georgia, "Times New Roman", serif',
              color: NAVY,
              position: 'relative',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.8) inset, 0 30px 60px -20px rgba(15,30,61,0.35)',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 14,
                border: `3px solid ${GOLD_DARK}`,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                boxShadow: `inset 0 0 0 1px ${GOLD_PALE}, 0 0 0 1px ${GOLD_PALE}`,
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 26,
                border: `1px solid ${GOLD}`,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 34,
                border: `1px solid ${GOLD_LIGHT}`,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
                opacity: 0.7,
              }}
            />

            <CornerFiligree corner="tl" />
            <CornerFiligree corner="tr" />
            <CornerFiligree corner="bl" />
            <CornerFiligree corner="br" />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '58px 96px 52px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 2,
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <Crest />
              </div>

              <div
                style={{
                  color: NAVY_DEEP,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 10,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                CORE&nbsp;&nbsp;ENGLISH
              </div>

              <div
                style={{
                  color: GOLD_DARK,
                  fontSize: 9.5,
                  letterSpacing: 5.5,
                  textTransform: 'uppercase',
                  marginTop: 6,
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Academy of English · Est. MMXXVI
              </div>

              <div style={{ marginTop: 14 }}>
                <OrnamentDivider width={360} />
              </div>

              <div
                style={{
                  color: NAVY_DEEP,
                  fontSize: 14,
                  letterSpacing: 8,
                  textTransform: 'uppercase',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 400,
                  marginTop: 14,
                }}
              >
                Certificate of Achievement
              </div>

              <div
                style={{
                  color: GOLD_DARK,
                  fontSize: 11,
                  fontStyle: 'italic',
                  fontFamily: '"EB Garamond", Georgia, serif',
                  opacity: 0.85,
                  marginTop: 10,
                  letterSpacing: 1,
                }}
              >
                — this is proudly presented to —
              </div>

              <div
                style={{
                  color: NAVY_DEEP,
                  fontSize: 46,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  marginTop: 10,
                  textShadow: `0 1px 0 ${GOLD_PALE}`,
                }}
              >
                {levelDisplay}
              </div>

              <div
                style={{
                  width: 260,
                  height: 1,
                  background: `linear-gradient(to right, transparent, ${GOLD_DARK}, transparent)`,
                  marginTop: 14,
                  marginBottom: 12,
                }}
              />

              <div
                style={{
                  color: NAVY,
                  fontSize: 14,
                  lineHeight: 1.6,
                  maxWidth: 560,
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                Энэхүү гэрчилгээг <b style={{ fontStyle: 'normal', color: NAVY_DEEP }}>{level}</b>{' '}
                түвшний шалгалтыг{' '}
                <b style={{ fontStyle: 'normal', color: GOLD_DARK }}>
                  {score}/{total}
                </b>{' '}
                амжилттай давсны баталгаа болгон олгов.
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  paddingTop: 18,
                }}
              >
                <div style={{ textAlign: 'center', minWidth: 170 }}>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 18,
                      color: NAVY_DEEP,
                      lineHeight: 1.1,
                    }}
                  >
                    {formatMongolianDate(today)}
                  </div>
                  <div
                    style={{
                      width: 150,
                      height: 1,
                      background: GOLD_DARK,
                      margin: '6px auto 4px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      color: GOLD_DARK,
                      fontFamily: '"EB Garamond", Georgia, serif',
                    }}
                  >
                    Date of Issue
                  </div>
                </div>

                <div style={{ transform: 'translateY(14px)' }}>
                  <WaxSeal />
                </div>

                <div style={{ textAlign: 'center', minWidth: 170 }}>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 18,
                      color: NAVY_DEEP,
                      lineHeight: 1.1,
                    }}
                  >
                    Core English
                  </div>
                  <div
                    style={{
                      width: 150,
                      height: 1,
                      background: GOLD_DARK,
                      margin: '6px auto 4px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      color: GOLD_DARK,
                      fontFamily: '"EB Garamond", Georgia, serif',
                    }}
                  >
                    english.dalatech.online
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            style={{ background: GOLD, color: NAVY_DEEP }}
          >
            📥 {t('download')}
          </button>

          <p
            className="hidden md:block text-center text-xs mt-1"
            style={{ color: GOLD }}
          >
            Гэрчилгээгээ татаж аваад найзуудтайгаа хуваалцаарай 🎉
          </p>
          <p
            className="md:hidden text-center text-xs mt-1 leading-relaxed px-2"
            style={{ color: GOLD }}
          >
            📱 Утасны хэрэглэгчид: Зургийг татсаны дараа галерейд хадгалахын
            тулд зургийг нээгээд &apos;Галерейд хадгалах&apos; дарна уу.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-navy-surface border border-navy-surface-2 text-text-secondary hover:text-text-primary py-3 min-h-[44px] rounded-xl transition-colors text-sm mt-2"
          >
            {t('close')} ✕
          </button>
        </div>
      </div>
    </div>
  )
}
