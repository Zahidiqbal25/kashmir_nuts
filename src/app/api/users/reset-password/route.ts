import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()
  if (!token || !newPassword) return jsonError('Token and new password are required')
  if (newPassword.length < 6) return jsonError('Password must be at least 6 characters')

  const { data: record } = await supabase.from('password_resets').select('*').eq('token', token).single()
  if (!record) return jsonError('Invalid or expired reset link')
  if (new Date(record.expires) < new Date()) {
    await supabase.from('password_resets').delete().eq('token', token)
    return jsonError('Reset link has expired. Please request a new one.')
  }

  await supabase.from('users').update({ password: hashPassword(newPassword) }).eq('email', record.email)
  await supabase.from('password_resets').delete().eq('token', token)
  return jsonOk({ message: 'Password reset successfully' })
}
