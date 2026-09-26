import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, jsonError, jsonOk } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: user } = await supabase.from('users').select('*').eq('id', Number(params.id)).single()
  if (!user) return jsonError('User not found', 404)

  const { currentPassword, newPassword, code, action } = await req.json()

  // Step 1: Verify current password and send OTP
  if (action === 'send-otp') {
    if (!currentPassword) return jsonError('Current password is required')
    if (user.password !== hashPassword(currentPassword)) return jsonError('Current password is incorrect', 401)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('email_verifications').delete().eq('email', user.email)
    await supabase.from('email_verifications').insert({ email: user.email, code: otp, expires })
    await sendVerificationEmail(user.email, otp)

    return jsonOk({ message: 'Verification code sent to your email' })
  }

  // Step 2: Verify OTP and update password
  if (!currentPassword || !newPassword || !code) return jsonError('All fields are required')
  if (user.password !== hashPassword(currentPassword)) return jsonError('Current password is incorrect', 401)
  if (newPassword.length < 6) return jsonError('New password must be at least 6 characters')

  const { data: verification } = await supabase.from('email_verifications')
    .select('*').eq('email', user.email).eq('code', code).single()

  if (!verification) return jsonError('Invalid verification code')
  if (new Date(verification.expires) < new Date()) return jsonError('Code expired')

  await supabase.from('users').update({ password: hashPassword(newPassword) }).eq('id', user.id)
  await supabase.from('email_verifications').delete().eq('email', user.email)

  return jsonOk({ message: 'Password updated successfully' })
}
