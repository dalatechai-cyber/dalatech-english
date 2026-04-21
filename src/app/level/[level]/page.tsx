import { LevelPage } from '@/components/LevelPage'
import { LEVEL_CODES } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: { level: string }
}

export function generateStaticParams() {
  return LEVEL_CODES.map(code => ({ level: code }))
}

export default function LevelRoute({ params }: Props) {
  if (!LEVEL_CODES.includes(params.level as LevelCode)) notFound()
  return <LevelPage levelCode={params.level as LevelCode} />
}
