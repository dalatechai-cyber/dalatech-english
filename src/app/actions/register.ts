'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type RedeemResult =
  | { success: true; tier: 'book' | 'ai_only' }
  | { success: false; error: string }

const ERR_INVALID_CODE = 'Буруу код эсвэл аль хэдийн ашигласан байна'
const ERR_EMAIL_EXISTS = 'Энэ имэйл бүртгэлтэй байна'
const ERR_GENERIC = 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
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

  const admin = getAdminClient()

  // 1. Validate access code is unredeemed.
  const { data: codeRow, error: codeError } = await admin
    .from('access_codes')
    .select('id, tier, used')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (codeError || !codeRow || codeRow.used) {
    return { success: false, error: ERR_INVALID_CODE }
  }

  const tier = codeRow.tier as 'book' | 'ai_only'

  // 2. Create the auth user (auto-confirmed so they can sign in immediately).
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

  // 3. Mark the access code as redeemed. Guarded by `used = false` so a second
  //    redeemer racing past the read above cannot double-spend the code.
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
    // Race lost: roll back the freshly-created user so the email can be reused.
    await admin.auth.admin.deleteUser(userId)
    return { success: false, error: ERR_INVALID_CODE }
  }

  // 4. Apply the redeemed tier to the auto-provisioned profile (the
  //    handle_new_user trigger inserted the row with the default 'ai_only').
  const { error: profileError } = await admin
    .from('profiles')
    .update({ tier })
    .eq('id', userId)

  if (profileError) {
    return { success: false, error: ERR_GENERIC }
  }

  return { success: true, tier }
}
