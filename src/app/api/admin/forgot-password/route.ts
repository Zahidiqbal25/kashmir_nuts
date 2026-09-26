import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/email'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return jsonError('Email is required')

    // Only allow the admin email
    if (email.toLowerCase() !== process.env.EMAIL_USER?.toLowerCase())
      return jsonError('This email is not authorized for admin reset')

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())
    await supabase.from('email_verifications').insert({ email: email.toLowerCase(), code, expires })
    await sendVerificationEmail(email, code)

    return jsonOk({ message: 'Reset code sent' })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
