'use client'
import { useRef, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { formatMongolianDate, saveCertificate } from '@/lib/certificates'
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

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scale certificate (fixed 842x595 px) to fit container width responsively
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
      // Reset scale so html2canvas captures at native A4 resolution
      element.style.transform = 'scale(1)'
      if (parent) parent.style.height = '595px'
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = 'Core-English-Certificate.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Certificate download failed', e)
    } finally {
      element.style.transform = prevTransform
      if (parent && prevHeight !== undefined) parent.style.height = prevHeight
    }
  }

  const handleFacebookShare = () => {
    const shareUrl = 'https://www.facebook.com/sharer/sharer.php'
    const url = encodeURIComponent('https://english.dalatech.online')
    const quote = encodeURIComponent(
      `Core English платформоос ${level} түвшний гэрчилгээ авлаа! Та ч англи хэл сурах уу? 🎓`
    )
    window.open(
      `${shareUrl}?u=${url}&quote=${quote}`,
      '_blank',
      'width=600,height=400'
    )
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
        {/* Certificate scaler — A4 landscape (842x595) */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            id="certificate"
            ref={certRef}
            style={{
              width: '842px',
              height: '595px',
              transformOrigin: 'top left',
              background: '#FFFFFF',
              border: `8px solid ${DARK_GOLD}`,
              boxSizing: 'border-box',
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: NAVY,
              position: 'relative',
            }}
          >
            {/* Inner gold border with gap */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                right: '8px',
                bottom: '8px',
                border: `2px solid ${GOLD}`,
                boxSizing: 'border-box',
                padding: '36px 56px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Corner flourishes */}
              <div style={{ position: 'absolute', top: 10, left: 14, color: GOLD, fontSize: '22px', lineHeight: 1 }}>✦</div>
              <div style={{ position: 'absolute', top: 10, right: 14, color: GOLD, fontSize: '22px', lineHeight: 1 }}>✦</div>
              <div style={{ position: 'absolute', bottom: 10, left: 14, color: GOLD, fontSize: '22px', lineHeight: 1 }}>✦</div>
              <div style={{ position: 'absolute', bottom: 10, right: 14, color: GOLD, fontSize: '22px', lineHeight: 1 }}>✦</div>

              {/* Gold seal/medal top right */}
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  right: 56,
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, #FCD34D, ${GOLD} 55%, ${DARK_GOLD})`,
                  border: `3px solid ${DARK_GOLD}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(217,119,6,0.4)',
                }}
              >
                <div style={{ fontSize: '32px', lineHeight: 1 }}>🏅</div>
              </div>

              {/* Brand */}
              <div
                style={{
                  color: NAVY,
                  fontSize: '40px',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  marginTop: '4px',
                }}
              >
                CORE ENGLISH
              </div>
              <div
                style={{
                  color: NAVY,
                  fontSize: '12px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  opacity: 0.7,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                AI Суралцахуйн Платформ
              </div>

              {/* Gold divider */}
              <div
                style={{
                  width: '60%',
                  height: '2px',
                  background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
                  marginTop: '18px',
                  marginBottom: '14px',
                }}
              />

              {/* Гэрчилгээ (script) */}
              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: '58px',
                  fontFamily: '"Brush Script MT", "Lucida Handwriting", Georgia, cursive',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1,
                  marginBottom: '10px',
                }}
              >
                {t('certificate')}
              </div>

              {/* Proudly presented to */}
              <div
                style={{
                  color: NAVY,
                  fontSize: '13px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  opacity: 0.75,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                Proudly presented to
              </div>

              {/* Student name placeholder (level-based) */}
              <div
                style={{
                  color: DARK_GOLD,
                  fontSize: '44px',
                  fontFamily: '"Brush Script MT", "Lucida Handwriting", Georgia, cursive',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  marginBottom: '6px',
                }}
              >
                {level} Level Student
              </div>

              {/* Divider */}
              <div
                style={{
                  width: '40%',
                  height: '1px',
                  background: GOLD,
                  marginTop: '10px',
                  marginBottom: '16px',
                }}
              />

              {/* Achievement text */}
              <div
                style={{
                  color: NAVY,
                  fontSize: '15px',
                  lineHeight: 1.6,
                  maxWidth: '620px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  marginBottom: '14px',
                }}
              >
                Энэхүү гэрчилгээг <b>{level}</b> түвшний шалгалтыг амжилттай
                давсны баталгаа болгон олгов.
              </div>

              {/* Date */}
              <div
                style={{
                  color: NAVY,
                  fontSize: '13px',
                  marginTop: 'auto',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  opacity: 0.85,
                }}
              >
                {formatMongolianDate(today)}
              </div>

              {/* Footer attribution */}
              <div
                style={{
                  color: NAVY,
                  fontSize: '10px',
                  marginTop: '10px',
                  opacity: 0.55,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                Powered by Dalatech.ai · dalatech.online
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            style={{ background: GOLD, color: NAVY }}
          >
            📥 {t('download')}
          </button>
          <button
            onClick={handleFacebookShare}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2 text-white hover:opacity-90"
            style={{ background: '#1877F2' }}
          >
            Facebook-т хуваалцах 📘
          </button>
          <p className="text-center text-xs mt-1" style={{ color: '#94A3B8' }}>
            Гэрчилгээгээ татаж аваад найзуудтайгаа хуваалцаарай 🎉
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
