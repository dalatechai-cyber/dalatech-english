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

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async () => {
    if (!certRef.current) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(certRef.current, { backgroundColor: '#0F172A', scale: 2 })
      const link = document.createElement('a')
      link.download = `core-english-${level}-certificate.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Certificate download failed', e)
    }
  }

  const handleShare = () => {
    const appUrl = 'https://core-english.vercel.app'
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`
    const popup = window.open(shareUrl, 'fb-share-dialog', 'width=626,height=436,toolbar=0,status=0,menubar=0,scrollbars=yes,resizable=yes')
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = shareUrl
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate */}
        <div
          ref={certRef}
          className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-center relative"
          style={{
            border: '2px solid #F59E0B',
            boxShadow: '0 0 40px rgba(245,158,11,0.15), inset 0 0 60px rgba(245,158,11,0.03)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#F59E0B] rounded-tl-lg opacity-70" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#F59E0B] rounded-tr-lg opacity-70" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#F59E0B] rounded-bl-lg opacity-70" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#F59E0B] rounded-br-lg opacity-70" />

          {/* Trophy icon */}
          <div className="text-5xl mb-2">🏆</div>

          {/* Brand */}
          <div className="text-[#F59E0B] text-base font-bold tracking-widest uppercase mb-1">
            CORE ENGLISH
          </div>

          {/* Top separator */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#F59E0B]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#F59E0B]/60" />
          </div>

          {/* Certificate title */}
          <div className="text-white text-2xl sm:text-3xl font-extrabold tracking-widest mb-4">
            {t('certificate')}
          </div>

          {/* Level */}
          <div
            className="text-[#F59E0B] text-5xl sm:text-6xl font-extrabold mb-2 leading-none"
            style={{ textShadow: '0 0 30px rgba(245,158,11,0.5)' }}
          >
            {level}
          </div>
          <div className="text-white text-sm font-medium mb-4">
            түвшинг амжилттай дүүргэлээ
          </div>

          {/* Bottom separator */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#F59E0B]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#F59E0B]/60" />
          </div>

          {/* Score */}
          <div className="text-[#F59E0B] text-xl font-bold mb-2">
            Оноо: {score}/{total}
          </div>

          {/* Date */}
          <p className="text-gray-400 text-xs mb-4">{formatMongolianDate(today)}</p>

          {/* Attribution */}
          <div className="text-[#F59E0B]/50 text-xs tracking-wide">Powered by Dalatech.ai</div>
        </div>

        {/* Action buttons — stacked vertically */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            📥 {t('download')}
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span className="font-bold">f</span> {t('share')}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-navy-surface border border-navy-surface-2 text-text-secondary hover:text-text-primary py-3 min-h-[44px] rounded-xl transition-colors text-sm"
          >
            {t('close')} ✕
          </button>
        </div>
      </div>
    </div>
  )
}
