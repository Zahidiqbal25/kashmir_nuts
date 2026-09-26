import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendOrderCancellationEmail } from '@/lib/email'
import { jsonError, jsonOk } from '@/lib/utils'

export async function PUT(_: NextRequest, { params }: { params: { id: string } }) {
  const { data: order } = await supabase.from('orders').select('*').eq('id', Number(params.id)).single()
  if (!order) return jsonError('Order not found', 404)
  if (order.status === 'Cancelled') return jsonError('Order is already cancelled')
  if (order.status === 'Delivered') return jsonError('Delivered orders cannot be cancelled')

  await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', order.id)

  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items)
  for (const item of items) {
    const { data: product } = await supabase.from('products').select('quantity').eq('id', item.id).single()
    if (product) {
      const newQty = (product.quantity || 0) + item.qty
      await supabase.from('products').update({ quantity: newQty, inStock: true }).eq('id', item.id)
    }
  }

  sendOrderCancellationEmail(order).catch(() => {})
  return jsonOk({ message: 'Order cancelled successfully' })
}
