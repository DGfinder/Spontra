import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSessionFromCookies } from '@/lib/adminAuth'
import AdminClientProviders from './AdminClientProviders'

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies(cookies())

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminClientProviders session={session}>{children}</AdminClientProviders>
}
