import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return jsonError('Email is required')

  const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
  if (!user) return jsonError('No account found with this email', 404)

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000).toISOString()

  await supabase.from('password_resets').delete().eq('email', user.email)
  await supabase.from('password_resets').insert({ email: user.email, token, expires })
  sendPasswordResetEmail(user, token).catch(() => {})

  return jsonOk({ message: 'Password reset email sent' })
}
