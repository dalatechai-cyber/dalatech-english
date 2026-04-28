'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const justRegistered = params.get('registered') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Имэйл эсвэл нууц үг буруу байна')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div>
      <Kicker label="Нэвтрэх" />

      {justRegistered && <SuccessBanner>Бүртгэл амжилттай. Нэвтэрнэ үү.</SuccessBanner>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          label="Имэйл"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          disabled={loading}
        />
        <Field
          label="Нууц үг"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          disabled={loading}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <PrimaryButton loading={loading} loadingLabel="Нэвтэрч байна">
          Нэвтрэх
        </PrimaryButton>
      </form>

      <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--hairline)' }}>
        <div className="flex items-center justify-between text-[13px]">
          <Link
            href="/forgot-password"
            className="transition-colors hover:text-candlelight-gold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Нууц үг мартсан уу?
          </Link>
          <Link
            href="/register"
            className="transition-colors hover:text-candlelight-gold"
            style={{ color: 'var(--vellum-champagne)' }}
          >
            Шинээр бүртгүүлэх
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Local presentation primitives ────────────────────────────────────────────

function LoginFormSkeleton() {
  return (
    <div aria-hidden>
      <Kicker label="Нэвтрэх" />
      <div className="space-y-5">
        <SkeletonRow />
        <SkeletonRow />
        <div
          className="h-12 rounded-xl"
          style={{ background: 'var(--midnight-ink-surface)' }}
        />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div>
      <div
        className="h-3 w-20 rounded mb-2.5"
        style={{ background: 'var(--midnight-ink-surface)' }}
      />
      <div
        className="h-12 rounded-lg"
        style={{ background: 'var(--midnight-ink-surface)' }}
      />
    </div>
  )
}

function Kicker({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <span
        className="h-px w-8"
        style={{ background: 'linear-gradient(90deg, transparent, var(--hairline-gold))' }}
      />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.22em] nums-tabular"
        style={{ color: 'var(--vellum-champagne)' }}
      >
        {label}
      </span>
      <span
        className="h-px w-8"
        style={{ background: 'linear-gradient(90deg, var(--hairline-gold), transparent)' }}
      />
    </div>
  )
}

function Field({
  label,
  type,
  required,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  label: string
  type: 'email' | 'password' | 'text'
  required?: boolean
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type

  return (
    <label className="block">
      <span
        className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] mb-2.5"
        style={{ color: 'var(--vellum-champagne)' }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type={inputType}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          className="block w-full rounded-lg px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'var(--midnight-ink-surface)',
            border: '1px solid var(--hairline)',
            color: 'var(--text-primary)',
            paddingRight: isPassword ? '2.75rem' : undefined,
          }}
        />
        {isPassword && (
          <PasswordToggle show={show} onToggle={() => setShow((s) => !s)} disabled={disabled} />
        )}
      </div>
    </label>
  )
}

function PasswordToggle({
  show,
  onToggle,
  disabled,
}: {
  show: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={show ? 'Нууц үгийг нуух' : 'Нууц үгийг харуулах'}
      className="absolute inset-y-0 right-0 flex items-center justify-center w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: 'var(--text-secondary)' }}
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function PrimaryButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean
  loadingLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="block w-full rounded-xl px-7 py-4 text-[15px] font-semibold transition-transform shadow-gold-sm disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, var(--candlelight-gold) 0%, var(--candlelight-gold-dark) 100%)',
        color: 'var(--midnight-ink)',
      }}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2.5">
          <Spinner />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  )
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="text-[13px] leading-relaxed rounded-lg px-3.5 py-3"
      style={{
        background: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.22)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </p>
  )
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 text-[13px] leading-relaxed rounded-lg px-3.5 py-3"
      style={{
        background: 'rgba(245, 158, 11, 0.04)',
        border: '1px solid var(--hairline-gold)',
        color: 'var(--vellum-champagne)',
      }}
    >
      {children}
    </p>
  )
}
