import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'banner').single()
  return jsonOk({ banner: data ? data.value : '' })
}

export async function PUT(req: NextRequest) {
  const { banner } = await req.json()
  if (banner === undefined) return jsonError('banner is required')
  const { data: existing } = await supabase.from('settings').select('key').eq('key', 'banner').single()
  if (existing) await supabase.from('settings').update({ value: banner }).eq('key', 'banner')
  else await supabase.from('settings').insert({ key: 'banner', value: banner })
  return jsonOk({ banner })
}
