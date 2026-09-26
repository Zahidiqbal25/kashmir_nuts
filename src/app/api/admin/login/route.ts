import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  // Check DB password first (set via forgot password)
  const { data } = await supabase.from('settings').select('value').eq('key', 'admin_password').single()
  const dbPassword = data?.value

  if (dbPassword) {
    if (password === dbPassword) return jsonOk({ success: true })
  }

  // Fallback to env password
  if (password === process.env.ADMIN_PASSWORD) return jsonOk({ success: true })

  return jsonError('Invalid password', 401)
}
