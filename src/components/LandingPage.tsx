'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { NavBar } from './NavBar'
import {
  BookIcon,
  PencilIcon,
  TargetIcon,
  BrainIcon,
  ChartIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  SparkIcon,
} from './Icon'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-midnight-ink relative">
      <NavBar />

      {/* ─── Hero ─── */}
      <header className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-center">
        {/* Layered ambient glow */}
        <div
          className="absolute top-1/3 left-1/2 orb-pulse pointer-events-none"
          style={{
            width: 820,
            height: 460,
            background:
              'radial-gradient(ellipse, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 40%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Fine grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-16 text-center page-enter-up">
          {/* Eyebrow — kicker typography */}
          <div className="inline-flex items-center gap-2.5 mb-10">
            <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6))' }} />
            <span
              lang="en"
              className="text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: 'var(--vellum-champagne)' }}
            >
              AI · Dalatech Academy
            </span>
            <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.6), transparent)' }} />
          </div>

          {/* Wordmark — serif for editorial premium feel */}
          <h1
            lang="en"
            className="mb-6 leading-[0.95]"
            style={{ fontSize: 'clamp(52px, 9vw, 96px)' }}
          >
            <span
              className="font-serif-display italic font-normal"
              style={{
                background: 'linear-gradient(135deg, var(--candlelight-gold) 0%, var(--candlelight-gold-light) 45%, var(--vellum-champagne) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Core
            </span>
            <span className="font-extrabold text-white tracking-tight"> English</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#94A3B8' }}
          >
            Монгол хэлтнүүдэд зориулсан{' '}
            <span className="font-serif-display italic" style={{ color: 'var(--vellum-champagne)' }}>
              дэлхийн стандартын
            </span>{' '}
            англи хэлний сургалт
          </p>

          {/* Stat badges — refined */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { icon: <BookIcon size={14} />, label: '5 Түвшин' },
              { icon: <PencilIcon size={14} />, label: '50+ Хичээл' },
              { icon: <TargetIcon size={14} />, label: 'IELTS Бэлтгэл' },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm"
                style={{
                  color: 'var(--vellum-champagne)',
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.18)',
                }}
              >
                <span className="text-candlelight-gold">{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Dual CTA — primary + secondary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#levels"
              className="group inline-flex items-center gap-2.5 font-semibold py-4 px-7 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-gold-sm"
              style={{
                background: 'linear-gradient(135deg, var(--candlelight-gold) 0%, var(--candlelight-gold-dark) 100%)',
                color: 'var(--midnight-ink)',
                fontSize: 15,
                letterSpacing: '-0.01em',
              }}
            >
              Сургалт эхлэх
              <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/ielts"
              className="inline-flex items-center gap-2 font-medium py-4 px-6 rounded-xl text-sm transition-colors hover:text-candlelight-gold"
              style={{ color: 'var(--text-secondary)' }}
            >
              <TargetIcon size={15} />
              IELTS дадлага
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce"
          style={{ color: 'rgba(228,192,138,0.35)' }}
        >
          <ArrowDownIcon size={14} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pb-20 relative">
        {/* Daily Challenge */}
        <div className="mb-14 page-enter-up" style={{ animationDelay: '0.1s' }}>
          <DailyChallenge />
        </div>

        {/* Features — editorial numbered grid */}
        <section className="mb-20 page-enter-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-end justify-between mb-10 border-b hairline pb-5">
            <div>
              <div
                className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-2"
                style={{ color: 'var(--vellum-champagne)' }}
              >
                Философи
              </div>
              <h2 className="font-serif-display text-3xl sm:text-4xl text-white leading-tight">
                Яагаад <em className="italic" style={{ color: 'var(--candlelight-gold)' }}>Core English</em>?
              </h2>
            </div>
            <div
              className="hidden sm:block text-xs text-right"
              style={{ color: 'var(--text-muted)' }}
            >
              Дэлхийн стандарт<br />
              монголоор
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border hairline">
            {[
              {
                n: '01',
                Icon: BrainIcon,
                title: 'AI Багш',
                desc: 'Хувийн AI багш таны алдааг тэр даруй засна. Монгол хэлээр тайлбар авна.',
              },
              {
                n: '02',
                Icon: ChartIcon,
                title: 'Дэвшлийн хяналт',
                desc: 'Streak, оноо, гэрчилгээгээр дэвшлээ хяна. Профайлд бүх үр дүнгээ хар.',
              },
              {
                n: '03',
                Icon: TargetIcon,
                title: 'IELTS Бэлтгэл',
                desc: 'Жинхэнэ IELTS шалгалтад бэлд. 4 хэсэгтэй дадлага тест ба band оноо.',
              },
            ].map(f => (
              <div
                key={f.title}
                className="bg-midnight-ink-surface p-7 transition-colors duration-300 hover:bg-midnight-ink-elevated group relative"
              >
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="font-serif-display text-2xl italic nums-tabular"
                    style={{ color: 'rgba(245,158,11,0.5)' }}
                  >
                    {f.n}
                  </span>
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      color: 'var(--candlelight-gold)',
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.15)',
                    }}
                  >
                    <f.Icon size={18} />
                  </span>
                </div>
                <h3
                  className="font-semibold text-white mb-2.5 text-lg"
                  style={{ letterSpacing: '-0.015em' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Level selector */}
        <section id="levels" className="page-enter-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-end justify-between mb-8 border-b hairline pb-5">
            <div>
              <div
                className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-2"
                style={{ color: 'var(--vellum-champagne)' }}
              >
                Сургалтын зам
              </div>
              <h2 className="font-serif-display text-3xl sm:text-4xl text-white leading-tight">
                Түвшин <em className="italic" style={{ color: 'var(--candlelight-gold)' }}>сонгох</em>
              </h2>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <SparkIcon size={14} />
              А1 → С1
            </div>
          </div>
          <p
            className="text-sm mb-8 max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            Тэнцсэн тестийн дараа дараагийн түвшин нээгдэнэ.
          </p>
          <LevelSelector />
        </section>
      </main>

      <footer
        className="border-t hairline py-8 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span lang="en" className="font-serif-display italic">Core English</span>
          <span>
            Powered by{' '}
            <a
              href="https://dalatech.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-candlelight-gold hover:underline underline-offset-4"
            >
              Dalatech.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
