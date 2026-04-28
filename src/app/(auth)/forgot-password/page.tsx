'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (resetError) {
      setError('Холбоос илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div>
      <Kicker label="Нууц үг сэргээх" />

      {sent ? (
        <div className="space-y-6">
          <p
            className="text-[14px] leading-relaxed rounded-lg px-4 py-4"
            style={{
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid var(--hairline-gold)',
              color: 'var(--vellum-champagne)',
            }}
          >
            Нууц үг сэргээх холбоос имэйлд илгээгдлээ.
          </p>
          <div className="text-center text-[13px]">
            <Link
              href="/login"
              className="font-medium transition-colors hover:text-candlelight-gold"
              style={{ color: 'var(--vellum-champagne)' }}
            >
              Нэвтрэх рүү буцах
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p
            className="text-[14px] leading-relaxed text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Бүртгэлтэй имэйл хаягаа оруулна уу. Сэргээх холбоосыг тэндрүү илгээнэ.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Field
              label="Имэйл"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={setEmail}
              disabled={loading}
              autoFocus
            />

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <PrimaryButton loading={loading} loadingLabel="Илгээж байна">
              Холбоос илгээх
            </PrimaryButton>
          </form>

          <div
            className="mt-8 pt-6 text-center text-[13px]"
            style={{ borderTop: '1px solid var(--hairline)' }}
          >
            <Link
              href="/login"
              className="transition-colors hover:text-candlelight-gold"
              style={{ color: 'var(--text-secondary)' }}
            >
              Нэвтрэх рүү буцах
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Local presentation primitives ────────────────────────────────────────────

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
  autoFocus,
}: {
  label: string
  type: 'email' | 'password' | 'text'
  required?: boolean
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
  autoFocus?: boolean
}) {
  return (
    <label className="block">
      <span
        className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] mb-2.5"
        style={{ color: 'var(--vellum-champagne)' }}
      >
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="block w-full rounded-lg px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'var(--midnight-ink-surface)',
          border: '1px solid var(--hairline)',
          color: 'var(--text-primary)',
        }}
      />
    </label>
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
