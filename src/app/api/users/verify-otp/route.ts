import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) return jsonError('Email and code are required')

  const { data: record } = await supabase.from('email_verifications').select('*').eq('email', email.toLowerCase()).single()
  if (!record) return jsonError('No verification code found. Please request a new one.')
  if (new Date(record.expires) < new Date()) {
    await supabase.from('email_verifications').delete().eq('email', email.toLowerCase())
    return jsonError('Code expired. Please request a new one.')
  }
  if (record.code !== code.trim()) return jsonError('Invalid verification code.')

  return jsonOk({ verified: true })
}
