import { NextRequest } from 'next/server'
import Razorpay from 'razorpay'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    return jsonError('Online payments are not configured', 503)

  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  const { amount } = await req.json()
  if (!amount || amount < 1) return jsonError('Valid amount is required')

  try {
    const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `order_${Date.now()}` })
    return jsonOk(order)
  } catch (err: any) {
    return jsonError('Failed to create payment order', 500)
  }
}
