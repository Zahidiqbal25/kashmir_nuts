import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'
import { hashPassword, sanitizeUser, jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, address, city, pincode } = await req.json()
    if (!name || !email || !phone || !password)
      return jsonError('Name, email, phone and password are required')

    const { data: verification } = await supabase.from('email_verifications').select('*').eq('email', email.toLowerCase()).single()
    if (!verification) return jsonError('Email not verified. Please verify your email first.', 403)
    if (new Date(verification.expires) < new Date()) {
      await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())
      return jsonError('Verification expired. Please verify your email again.', 403)
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single()
    if (existing) return jsonError('Email already registered. Please login.', 409)

    const { data: user, error } = await supabase.from('users')
      .insert({ name, email: email.toLowerCase(), phone, password: hashPassword(password), address: address || '', city: city || '', pincode: pincode || '' })
      .select().single()
    if (error) throw error

    await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())
    sendWelcomeEmail(user).catch(() => {})

    return jsonOk(sanitizeUser(user), 201)
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
