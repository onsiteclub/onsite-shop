import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action, moderator_notes } = await req.json()

  if (!id || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'id and action (approve|reject) required' }, { status: 400 })
  }

  const update: Record<string, any> = {
    status: action === 'approve' ? 'approved' : 'rejected',
  }

  if (action === 'approve') {
    update.approved_at = new Date().toISOString()
  }

  if (moderator_notes !== undefined) {
    update.moderator_notes = moderator_notes
  }

  const { error } = await supabase
    .from('app_shop_reviews')
    .update(update)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
