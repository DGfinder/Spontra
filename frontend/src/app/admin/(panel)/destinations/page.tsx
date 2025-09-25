import { redirect } from 'next/navigation'

export default function AdminDestinationsRoot() {
  redirect('/admin/destinations/manage')
}
