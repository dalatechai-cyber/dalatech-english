// v2
'use server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

  return { success: true, tier }
}
