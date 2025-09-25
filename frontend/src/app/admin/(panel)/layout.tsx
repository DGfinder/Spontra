import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import AdminShell from '@/components/admin/AdminShell'
import { getSessionFromCookies } from '@/lib/adminAuth'

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies()
  const session = await getSessionFromCookies(cookieStore)

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
