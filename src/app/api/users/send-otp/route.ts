import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/email'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return jsonError('Email is required')

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single()
    if (existing) return jsonError('Email already registered. Please login.', 409)

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())
    await supabase.from('email_verifications').insert({ email: email.toLowerCase(), code, expires })
    await sendVerificationEmail(email, code)

    return jsonOk({ message: 'Verification code sent' })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
