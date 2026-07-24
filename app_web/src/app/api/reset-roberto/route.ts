import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const { data: users } = await admin.auth.admin.listUsers()
  const user = users?.users?.find((u) => u.email === 'roberto@chefonline.es')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: 'Roberto2024',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: 'Password updated to Roberto2024' })
}
