import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface FeedbackBody {
  listeningScore: number
  readingScore: number
  writingBand: number
  speakingBand: number
  overallBand: number
  wrongAnswers?: string[]
}

function isValid(body: unknown): body is FeedbackBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return ['listeningScore', 'readingScore', 'writingBand', 'speakingBand', 'overallBand']
    .every(k => typeof b[k] === 'number' && Number.isFinite(b[k] as number))
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-feedback')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  if (!isValid(body)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const wrongList = Array.isArray(body.wrongAnswers)
    ? body.wrongAnswers.slice(0, 20).map(s => String(s).slice(0, 300)).join('\n- ')
    : ''
  const wrongSection = wrongList
    ? `\n\nАлдсан асуултууд:\n- ${wrongList}`
    : ''

  const prompt = `Та IELTS шалгалтын мэргэжлийн багш юм.
Оюутан дараах оноо авлаа:

Сонсох: ${body.listeningScore}/10
Унших: ${body.readingScore}/30
Бичих: ${body.writingBand}/9
Ярих: ${body.speakingBand}/9
Нийт: ${body.overallBand}/9${wrongSection}

ЧУХАЛ ФОРМАТЫН ДҮРЭМ:
- Markdown ашиглахгүй
- ## эсвэл # тэмдэгт ашиглахгүй
- ** тэмдэгт ашиглахгүй (bold хийхгүй)
- * тэмдэгт bullet-д ашиглахгүй
- Тусгай тэмдэгт ашиглахгүй
- Зөвхөн энгийн монгол текстээр бич
- Тоотой жагсаалт: 1. 2. 3. хэлбэрээр
- Хэсгүүдийг хоосон мөрөөр тусгаарла
- Оюутантай шууд ярьж байгаа мэт бич

Дараах бүтцээр хариулна уу:

Ерөнхий үнэлгээ:
[Оюутны гүйцэтгэлийн талаар 2-3 өгүүлбэр. Урамшуулалтай боловч үнэнч байх.]

Хамгийн сайн хэсэг:
[Аль хэсэгт хамгийн сайн гүйцэтгэл үзүүлснийг тодорхой тайлбарла.]

Сайжруулах шаардлагатай хэсэг:
[Хамгийн бага оноо авсан хэсгийг дурдаж яагаад тэгснийг тайлбарла.]

3 зөвлөмж:
1. [Тодорхой практик зөвлөмж]
2. [Тодорхой практик зөвлөмж]
3. [Тодорхой практик зөвлөмж]

Дараагийн шалгалтын бэлтгэл:
[Дараагийн оролдлогод юунд анхаарах талаар 1-2 өгүүлбэр.]

Нийт хариулт 300 үгэнд багтаа.`

  let stream
  try {
    stream = await client.messages.stream({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (e) {
    console.error('[ielts-feedback] upstream error:', e)
    return NextResponse.json({ error: 'Upstream AI error' }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (e) {
        console.error('[ielts-feedback] stream error:', e)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
