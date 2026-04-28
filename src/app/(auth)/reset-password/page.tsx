'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Нууц үг доод тал нь 8 тэмдэгт байх ёстой')
      return
    }

    if (password !== confirm) {
      setError('Нууц үг таарахгүй байна')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Нууц үг шинэчлэхэд алдаа гарлаа. Холбоос хүчинтэй эсэхийг шалгана уу.')
      setLoading(false)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <div>
      <Kicker label="Шинэ нууц үг" />

      <p
        className="text-[14px] leading-relaxed text-center mb-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        Шинэ нууц үгээ оруулна уу. Доод тал нь 8 тэмдэгт.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          label="Шинэ нууц үг"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={loading}
          autoFocus
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

        <PrimaryButton loading={loading} loadingLabel="Шинэчилж байна">
          Шинэчлэх
        </PrimaryButton>
      </form>
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
