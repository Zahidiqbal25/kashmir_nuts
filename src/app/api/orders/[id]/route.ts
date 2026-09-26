import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const valid = ['Pending', 'Confirmed', 'Shipped', 'Dispatched', 'Delivered', 'Cancelled']
  if (!valid.includes(status)) return jsonError('Invalid status')

  const { data: existing } = await supabase.from('orders').select('id').eq('id', Number(params.id)).single()
  if (!existing) return jsonError('Order not found', 404)

  const { data: updated } = await supabase.from('orders').update({ status }).eq('id', Number(params.id)).select().single()
  return jsonOk(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase.from('orders').select('id').eq('id', Number(params.id)).single()
  if (!data) return jsonError('Order not found', 404)
  await supabase.from('orders').delete().eq('id', Number(params.id))
  return jsonOk({ message: 'Order deleted' })
}
