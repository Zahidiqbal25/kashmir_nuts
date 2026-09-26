import crypto from 'crypto'
import { NextResponse } from 'next/server'

export function hashPassword(pw: string) {
  return crypto.createHash('sha256').update(pw).digest('hex')
}

export function sanitizeUser(u: any) {
  if (!u) return null
  const { password, ...safe } = u
  return safe
}

export function jsonError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status })
}

export function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, { status })
}
