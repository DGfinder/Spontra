'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState, useTransition } from 'react'

import type { AdminSessionPayload } from '@/lib/adminAuth'
import { adminAuthService } from '@/services/adminAuthService'
import { ADMIN_LOCATION_DATA } from '@/data/adminLocations'

const PRIMARY_NAVIGATION = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/destinations/manage', label: 'Destinations' },
  { href: '/admin/airports/manage', label: 'Airports' },
  { href: '/admin/moderation', label: 'Moderation' },
]

interface AdminShellProps {
  session: AdminSessionPayload
  children: ReactNode
}

const COUNTRY_OPTIONS = ADMIN_LOCATION_DATA
  .filter((entry) => entry.cities.length > 0)
  .map((entry) => ({
    label: entry.country,
    value: entry.countryCode.toUpperCase(),
    cityCount: entry.cities.length,
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

export default function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  const cityOptions = useMemo(() => {
    if (!selectedCountry) return []
    const match = ADMIN_LOCATION_DATA.find(
      (country) => country.countryCode.toUpperCase() === selectedCountry
    )
    if (!match) return []
    return match.cities.map((city) => ({
      label: city.city,
      value: city.city,
      airportCount: city.airports.length,
    }))
  }, [selectedCountry])

  const handleLogout = () => {
    startTransition(async () => {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      adminAuthService.clearStaleSession()
      router.replace('/admin/login')
    })
  }

  const handleNavigate = () => {
    if (!selectedCountry) return
    const params = new URLSearchParams()
    params.set('country', selectedCountry)
    if (selectedCity) {
      params.set('city', selectedCity)
    }
    router.push(`/admin/destinations/manage?${params.toString()}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/admin/dashboard" className="text-lg font-semibold text-blue-600">
            Spontra Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            {PRIMARY_NAVIGATION.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'rounded-md px-3 py-2 transition-colors ' +
                    (isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100')
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <select
                value={selectedCountry}
                onChange={(event) => {
                  setSelectedCountry(event.target.value)
                  setSelectedCity('')
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Country</option>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.cityCount})
                  </option>
                ))}
              </select>
              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                disabled={!selectedCountry || cityOptions.length === 0}
                className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">City</option>
                {cityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.airportCount})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNavigate}
                disabled={!selectedCountry}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Go
              </button>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              {session.email ? <span className="hidden sm:inline">{session.email}</span> : null}
              <button
                onClick={handleLogout}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  )
}