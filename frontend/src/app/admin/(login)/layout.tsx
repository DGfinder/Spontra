import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSessionFromCookies } from '@/lib/adminAuth'

export default async function AdminLoginLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies(await cookies())
  if (session) {
    redirect('/admin/dashboard')
  }
  return <>{children}</>
}
