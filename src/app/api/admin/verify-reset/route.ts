import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return jsonError('Email and code are required')

    const { data } = await supabase.from('email_verifications')
      .select('*').eq('email', email.toLowerCase()).eq('code', code).single()

    if (!data) return jsonError('Invalid code')
    if (new Date(data.expires) < new Date()) return jsonError('Code expired')

    return jsonOk({ verified: true })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
