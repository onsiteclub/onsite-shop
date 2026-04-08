import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyAdmin() {
  const cookieStore = cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user?.email) return null
  const { data: admin } = await authClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single()
  return admin ? user : null
}

export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) {
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

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('app_shop_reviews')
    .update(update)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
