import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
  return NextResponse.json({ valid: true })
}
