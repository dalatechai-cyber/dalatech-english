// v2
'use server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

type RedeemResult =
  | { success: true; tier: 'book' | 'ai_only' }
  | { success: false; error: string }

const ERR_INVALID_CODE = 'Буруу код эсвэл аль хэдийн ашигласан байна'
const ERR_EMAIL_EXISTS = 'Энэ имэйл бүртгэлтэй байна'
const ERR_GENERIC = 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.'

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    const claims = JSON.parse(json) as { role?: string }
    return claims.role ?? null
  } catch {
    return null
  }
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceKey) {
    throw new Error('Supabase admin env vars missing')
  }

  const role = decodeJwtRole(serviceKey)
  console.log('DEBUG: admin JWT role claim:', role)
  if (role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is not a service_role JWT (role="${role}"). ` +
        `The deployment env var likely contains the anon key — replace it with the service_role key from Supabase project settings.`
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    },
  })
}

export async function validateAndRedeemCode(
  code: string,
  email: string,
  password: string
): Promise<RedeemResult> {
  const normalizedCode = code.trim().toUpperCase()
  if (normalizedCode.length !== 8) {
    return { success: false, error: ERR_INVALID_CODE }
  }

  console.log('DEBUG: env URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL, 'KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  let admin
  try {
    admin = getAdminClient()
  } catch (e) {
    console.error('FATAL: admin client init failed:', (e as Error).message)
    return { success: false, error: ERR_GENERIC }
  }

  const { data: codeRow, error: codeError } = await admin
    .from('access_codes')
    .select('id, tier, used')
    .eq('code', normalizedCode)
    .maybeSingle()
  console.log('DEBUG: codeRow result:', JSON.stringify(codeRow), 'error:', codeError?.message)

  if (codeError || !codeRow || codeRow.used) {
    return { success: false, error: ERR_INVALID_CODE }
  }

  const tier = codeRow.tier as 'book' | 'ai_only'

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    const msg = createError?.message?.toLowerCase() ?? ''
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return { success: false, error: ERR_EMAIL_EXISTS }
    }
    return { success: false, error: ERR_GENERIC }
  }

  const userId = created.user.id

  const { error: redeemError, data: redeemed } = await admin
    .from('access_codes')
    .update({
      used: true,
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq('id', codeRow.id)
    .eq('used', false)
    .select('id')
    .maybeSingle()

  if (redeemError || !redeemed) {
    await admin.auth.admin.deleteUser(userId)
    return { success: false, error: ERR_INVALID_CODE }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ tier })
    .eq('id', userId)

  if (profileError) {
    return { success: false, error: ERR_GENERIC }
  }

  sendWelcomeEmail(email, tier).catch((err) => {
    console.error('Welcome email failed:', (err as Error)?.message ?? err)
  })

  return { success: true, tier }
}

async function sendWelcomeEmail(email: string, tier: 'book' | 'ai_only') {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping welcome email')
    return
  }

  const resend = new Resend(apiKey)
  const tierLabel = tier === 'book' ? 'Ном + AI хичээл' : 'AI хичээл'

  const html = `<!DOCTYPE html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Core English-д тавтай морил</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e6e8ef;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0f1530;border:1px solid rgba(212,175,55,0.18);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 24px 40px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.5px;color:#d4af37;">Core English</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 8px 40px;">
                <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:600;color:#ffffff;">Тавтай морилно уу! 🎉</h2>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#c9cdd9;">
                  Та Core English-д амжилттай бүртгүүллээ. Англи хэлээ ахиулах аяллын тань эхлэл боллоо.
                </p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#c9cdd9;">
                  Таны эрхийн багц: <strong style="color:#d4af37;">${tierLabel}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 32px 40px;text-align:center;">
                <a href="https://english.dalatech.online" style="display:inline-block;padding:14px 32px;background-color:#d4af37;color:#0a0f1e;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                  Хичээлээ эхлүүлэх
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px 40px;text-align:center;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7a8094;">
                  Асуулт байвал энэ имэйлд хариу бичээрэй.<br/>
                  Амжилт хүсье — Core English баг
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  await resend.emails.send({
    from: 'hello@english.dalatech.online',
    to: email,
    subject: 'Core English-д тавтай морил! 🎉',
    html,
  })
}
