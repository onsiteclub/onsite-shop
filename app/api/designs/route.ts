import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'designs'

// GET — list all design thumbnails
export async function GET() {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const designs = (data || [])
    .filter((f) => f.name.startsWith('OSC') && f.name.endsWith('.jpg'))
    .map((f) => {
      const num = f.name.replace('OSC', '').replace('.jpg', '')
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name)
      return { num, url: urlData.publicUrl, name: f.name }
    })
    .sort((a, b) => a.num.localeCompare(b.num))

  return NextResponse.json({ designs })
}

// POST — upload a new design thumbnail (admin only)
export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const numParam = formData.get('num') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Determine the design number
  let num: string
  if (numParam) {
    num = numParam.padStart(3, '0')
  } else {
    // Auto-assign next number
    const { data: existing } = await supabase.storage.from(BUCKET).list('', {
      sortBy: { column: 'name', order: 'asc' },
    })
    const nums = (existing || [])
      .filter((f) => f.name.startsWith('OSC') && f.name.endsWith('.jpg'))
      .map((f) => parseInt(f.name.replace('OSC', '').replace('.jpg', ''), 10))
      .filter((n) => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    num = String(next).padStart(3, '0')
  }

  const fileName = `OSC${num}.jpg`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upsert: remove existing if present, then upload
  await supabase.storage.from(BUCKET).remove([fileName])
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  return NextResponse.json({ num, url: urlData.publicUrl, name: fileName })
}
