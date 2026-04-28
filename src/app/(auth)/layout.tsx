import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Masthead — small Playfair italic wordmark. Single editorial mark, no chrome. */}
      <header className="px-6 sm:px-10 pt-8 sm:pt-10 flex items-center justify-center">
        <Link
          href="/"
          lang="en"
          className="font-serif-display italic text-[22px] sm:text-[24px] font-bold tracking-tight"
          style={{ color: 'var(--candlelight-gold)' }}
        >
          Core English
        </Link>
      </header>

      {/* Hairline divider beneath the masthead */}
      <div
        className="mx-6 sm:mx-10 mt-6 sm:mt-8"
        style={{ borderTop: '1px solid var(--hairline)' }}
      />

      <main className="flex-1 flex items-start sm:items-center justify-center px-6 sm:px-10 pt-12 sm:pt-10 pb-16 sm:pb-20">
        <div className="w-full max-w-[420px] page-enter-up">{children}</div>
      </main>
    </div>
  )
}
