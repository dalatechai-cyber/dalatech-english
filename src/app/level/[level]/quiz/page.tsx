import { notFound } from 'next/navigation'
import { LEVEL_CODES } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { QuizMode } from '@/components/QuizMode'

interface Props {
  params: { level: string }
}

export function generateStaticParams() {
  return LEVEL_CODES.map(code => ({ level: code }))
}

export default function QuizPage({ params }: Props) {
  if (!LEVEL_CODES.includes(params.level as LevelCode)) notFound()
  return <QuizMode level={params.level as LevelCode} />
}
