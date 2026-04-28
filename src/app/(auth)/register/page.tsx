'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { validateAndRedeemCode } from '@/app/actions/register'

export default function RegisterPage() {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Нууц үг таарахгүй байна')
      return
    }

    setLoading(true)
    const result = await validateAndRedeemCode(code.trim().toUpperCase(), email, password)

    if (!result.success) {
      setError(result.error ?? 'Бүртгэл үүсгэхэд алдаа гарлаа')
      setLoading(false)
      return
    }

    router.push('/login?registered=1')
  }

  return (
    <div>
      <Kicker label="Бүртгүүлэх" />

      <p
        className="text-[14px] leading-relaxed text-center mb-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        Танд илгээсэн 8 оронтой нэвтрэх кодоор бүртгэл үүсгэнэ.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          label="Нэвтрэх код"
          type="text"
          required
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          disabled={loading}
          maxLength={8}
          autoComplete="one-time-code"
          mono
          autoFocus
        />
        <Field
          label="Имэйл"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
        />
        <Field
          label="Нууц үг"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={loading}
        />
        <Field
          label="Нууц үг дахин"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          disabled={loading}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <PrimaryButton loading={loading} loadingLabel="Бүртгэж байна">
          Бүртгэл үүсгэх
        </PrimaryButton>
      </form>

      <div
        className="mt-8 pt-6 text-center text-[13px]"
        style={{ borderTop: '1px solid var(--hairline)' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Аль хэдийн бүртгэлтэй юу? </span>
        <Link
          href="/login"
          className="font-medium transition-colors hover:text-candlelight-gold"
          style={{ color: 'var(--vellum-champagne)' }}
        >
          Нэвтрэх
        </Link>
      </div>
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
  maxLength,
  mono,
  autoFocus,
}: {
  label: string
  type: 'email' | 'password' | 'text'
  required?: boolean
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
  maxLength?: number
  mono?: boolean
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
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="block w-full rounded-lg px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'var(--midnight-ink-surface)',
          border: '1px solid var(--hairline)',
          color: 'var(--text-primary)',
          fontFamily: mono
            ? "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
            : undefined,
          letterSpacing: mono ? '0.18em' : undefined,
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
