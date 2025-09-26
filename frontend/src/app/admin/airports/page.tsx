import { redirect } from 'next/navigation'

export default function AdminAirportsRoot() {
  redirect('/admin/airports/manage')
}