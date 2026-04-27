import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const errorReport = {
      type: typeof body.type === 'string' ? body.type : 'unknown',
      message: typeof body.message === 'string' ? body.message.slice(0, 1000) : '',
      stack: typeof body.stack === 'string' ? body.stack.slice(0, 4000) : undefined,
      url: typeof body.url === 'string' ? body.url.slice(0, 500) : '',
      userAgent: typeof body.userAgent === 'string' ? body.userAgent.slice(0, 300) : '',
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
      digest: typeof body.digest === 'string' ? body.digest.slice(0, 100) : undefined,
    }

    console.error('client_error_report', errorReport)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('client_error_report_parse_failed', {
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
