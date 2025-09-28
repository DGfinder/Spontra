import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSessionFromCookies } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminIndex() {
  const session = await getSessionFromCookies(cookies())
  if (!session) {
    redirect('/admin/login')
  }

  redirect('/admin/dashboard')
}
