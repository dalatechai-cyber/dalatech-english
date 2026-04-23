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

const NAVY = '#1E293B'
const GOLD = '#F59E0B'
const DARK_GOLD = '#D97706'
const GOLD_LIGHT = '#FCD34D'

const PATTERN_BG: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'radial-gradient(#F59E0B22 1px, transparent 1px), radial-gradient(#F59E0B22 1px, transparent 1px)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 10px 10px',
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

function cornerStyle(corner: Corner): React.CSSProperties {
  const stripeDir = corner === 'tl' || corner === 'br' ? '135deg' : '45deg'
  const pos: React.CSSProperties =
    corner === 'tl'
      ? { top: 0, left: 0 }
      : corner === 'tr'
      ? { top: 0, right: 0 }
      : corner === 'bl'
      ? { bottom: 0, left: 0 }
      : { bottom: 0, right: 0 }
  return {
    position: 'absolute',
    width: 140,
    height: 140,
    background: `linear-gradient(${stripeDir}, transparent 45%, ${DARK_GOLD} 45%, ${GOLD_LIGHT} 50%, ${DARK_GOLD} 55%, transparent 55%), ${NAVY}`,
    zIndex: 2,
    ...pos,
  }
}

function GoldSeal() {
  return (
    <svg
      width={90}
      height={90}
      viewBox="0 0 90 90"
      style={{
        position: 'absolute',
        top: 28,
        right: 28,
        zIndex: 3,
        filter: 'drop-shadow(0 2px 6px rgba(217,119,6,0.35))',
      }}
    >
      <defs>
        <radialGradient id="ceSealGrad" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="40%" stopColor="#FCD34D" />
          <stop offset="80%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>
      <polygon
        points="45,1 51,15 66,9 61,24 76,26 64,37 78,45 64,53 76,64 61,66 66,81 51,75 45,89 39,75 24,81 29,66 14,64 26,53 12,45 26,37 14,26 29,24 24,9 39,15"
        fill={DARK_GOLD}
        opacity={0.9}
      />
      <circle cx={45} cy={45} r={34} fill="url(#ceSealGrad)" stroke={DARK_GOLD} strokeWidth={2} />
      <circle cx={45} cy={45} r={28} fill="none" stroke="#78350F" strokeWidth={0.8} opacity={0.45} />
      <text
        x={45}
        y={54}
        textAnchor="middle"
        fontSize={24}
        fontWeight={700}
        fill={NAVY}
        fontFamily='"Playfair Display", Georgia, "Times New Roman", serif'
        letterSpacing={1}
      >
        CE
      </text>
    </svg>
  )
}

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  const meta = getLevelMeta(level)
  const shortName = meta?.label.split(' — ')[1] ?? ''
  const levelDisplay = shortName ? `${level} ${shortName}` : level

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
      const scale = Math.min(1, w / 842)
      el.style.transform = `scale(${scale})`
      parent.style.height = `${595 * scale}px`
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
      element.style.transform = 'scale(1)'
      if (parent) parent.style.height = '595px'
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
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
              width: '842px',
              height: '595px',
              transformOrigin: 'top left',
              ...PATTERN_BG,
              border: `4px solid ${DARK_GOLD}`,
              boxSizing: 'border-box',
              fontFamily: '"EB Garamond", Georgia, "Times New Roman", serif',
              color: NAVY,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                border: `1px solid ${GOLD}`,
                boxSizing: 'border-box',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            <div style={cornerStyle('tl')} />
            <div style={cornerStyle('tr')} />
            <div style={cornerStyle('bl')} />
            <div style={cornerStyle('br')} />

            <GoldSeal />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '56px 80px 48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  color: NAVY,
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: 6,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  lineHeight: 1.1,
                }}
              >
                CORE ENGLISH
              </div>

              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: 11,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  marginTop: 8,
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontWeight: 400,
                }}
              >
                AI Суралцахуйн Платформ
              </div>

              <div
                style={{
                  width: '50%',
                  height: 2,
                  background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
                  marginTop: 22,
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: 52,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  lineHeight: 1,
                  fontFamily: '"Playfair Display", Georgia, serif',
                  marginBottom: 12,
                }}
              >
                {t('certificate')}
              </div>

              <div
                style={{
                  color: NAVY,
                  fontSize: 13,
                  fontStyle: 'italic',
                  fontFamily: '"EB Garamond", Georgia, serif',
                  opacity: 0.8,
                  marginBottom: 10,
                }}
              >
                Proudly presented to
              </div>

              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: 38,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {levelDisplay}
              </div>

              <div
                style={{
                  width: '30%',
                  height: 1,
                  background: GOLD,
                  marginTop: 14,
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  color: NAVY,
                  fontSize: 16,
                  lineHeight: 1.55,
                  maxWidth: 560,
                  fontFamily: '"EB Garamond", Georgia, serif',
                }}
              >
                Энэхүү гэрчилгээг <b>{level}</b> түвшний шалгалтыг амжилттай
                давсны баталгаа болгон олгов.
              </div>

              <div
                style={{
                  color: NAVY,
                  fontSize: 13,
                  marginTop: 'auto',
                  fontFamily: '"EB Garamond", Georgia, serif',
                  opacity: 0.85,
                }}
              >
                {formatMongolianDate(today)}
              </div>

              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: 10,
                  marginTop: 8,
                  letterSpacing: 2,
                  fontFamily: '"EB Garamond", Georgia, serif',
                  opacity: 0.85,
                }}
              >
                english.dalatech.online
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            style={{ background: GOLD, color: NAVY }}
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
