import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()
    if (!email || !code || !newPassword) return jsonError('All fields are required')
    if (newPassword.length < 6) return jsonError('Password must be at least 6 characters')

    // Verify OTP again
    const { data } = await supabase.from('email_verifications')
      .select('*').eq('email', email.toLowerCase()).eq('code', code).single()
    if (!data) return jsonError('Invalid code')
    if (new Date(data.expires) < new Date()) return jsonError('Code expired')

    // Update admin password in settings table
    const { data: existing } = await supabase.from('settings').select('*').eq('key', 'admin_password').single()
    if (existing) {
      await supabase.from('settings').update({ value: newPassword }).eq('key', 'admin_password')
    } else {
      await supabase.from('settings').insert({ key: 'admin_password', value: newPassword })
    }

    // Clean up OTP
    await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())

    return jsonOk({ message: 'Password reset successfully' })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
