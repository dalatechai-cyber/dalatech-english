import { ChatInterface } from '@/components/ChatInterface'
import { LEVEL_CODES, getLevelMeta } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: { level: string; lesson: string }
}

export function generateStaticParams() {
  const params: Array<{ level: string; lesson: string }> = []
  for (const code of LEVEL_CODES) {
    for (let i = 1; i <= 10; i++) {
      params.push({ level: code, lesson: String(i) })
    }
  }
  return params
}

export default function LessonRoute({ params }: Props) {
  const levelCode = params.level as LevelCode
  const lessonId = parseInt(params.lesson)
  if (!LEVEL_CODES.includes(levelCode) || isNaN(lessonId) || lessonId < 1 || lessonId > 10) notFound()
  const meta = getLevelMeta(levelCode)
  if (!meta?.lessons.find(l => l.id === lessonId)) notFound()

  return <ChatInterface level={levelCode} lessonId={lessonId} />
}
