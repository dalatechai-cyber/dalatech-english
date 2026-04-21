'use client'
import { useRef, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { formatMongolianDate, saveCertificate } from '@/lib/certificates'
import { useLanguage } from '@/lib/i18n'

interface CertificateModalProps {
  level: LevelCode
  score: number
  total: number
  onClose: () => void
}

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const today = new Date().toISOString().slice(0, 10)

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
    const text = encodeURIComponent(`Core English ${level} түвшний тестийг ${score}/${total} оноотойгоор амжилттай дууслаа! 🎓`)
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}&u=${encodeURIComponent('https://core-english.vercel.app')}`, '_blank')
  }

  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
        {/* Certificate design */}
        <div
          ref={certRef}
          className="bg-[#0F172A] border-2 border-[#F59E0B] rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Gold corner decorations */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#F59E0B] rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#F59E0B] rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#F59E0B] rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#F59E0B] rounded-br-lg" />

          <div className="text-[#F59E0B] text-xl font-bold tracking-wide mb-1">Core English</div>
          <div className="w-16 h-px bg-[#F59E0B]/40 mx-auto mb-4" />

          <div className="text-4xl font-extrabold text-white tracking-widest mb-4">
            {t('certificate')}
          </div>

          <div className="text-3xl mb-4">🎓</div>

          <p className="text-white text-base mb-2">
            Та <span className="text-[#F59E0B] font-bold">{level}</span> түвшний тестийг амжилттай өглөө!
          </p>

          <div className="text-[#F59E0B] text-3xl font-bold my-4">
            {score}/{total}
          </div>

          <p className="text-gray-400 text-xs mb-6">{formatMongolianDate(today)}</p>

          <div className="text-[#F59E0B]/60 text-xs">Powered by Dalatech.ai</div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownload}
            className="flex-1 bg-gold hover:bg-gold-dark text-navy font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            📥 {t('download')}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            f {t('share')}
          </button>
          <button
            onClick={onClose}
            className="w-12 bg-navy-surface border border-navy-surface-2 text-text-secondary hover:text-text-primary rounded-xl transition-colors text-sm flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
