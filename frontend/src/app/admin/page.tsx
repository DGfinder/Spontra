import { redirect } from 'next/navigation'

export default function AdminRedirect() {
  // Redirect to destinations page (main admin page)
  redirect('/admin/destinations')
}
