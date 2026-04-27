import { notFound } from 'next/navigation'
import { LEVEL_CODES } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { FreeChatInterface } from '@/components/FreeChatInterface'
import { Suspense } from 'react'

interface Props {
  params: { level: string }
}

export function generateStaticParams() {
  return LEVEL_CODES.map(code => ({ level: code }))
}

export default function FreeChatPage({ params }: Props) {
  if (!LEVEL_CODES.includes(params.level as LevelCode)) notFound()
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight-ink flex items-center justify-center text-text-secondary">Ачаалж байна...</div>}>
      <FreeChatInterface level={params.level as LevelCode} />
    </Suspense>
  )
}
