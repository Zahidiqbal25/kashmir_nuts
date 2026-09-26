import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return jsonError('Missing payment details')

  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')

  if (expected === razorpay_signature) return jsonOk({ verified: true, paymentId: razorpay_payment_id })
  return jsonError('Payment verification failed')
}
