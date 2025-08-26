'use client'

import { useEffect, useState } from 'react'
import { Search, User } from 'lucide-react'
import { User as AppUser, UserPreferences, PriceAlert } from '@/types'

interface UserRow extends AppUser {
  preferences?: UserPreferences
  alerts?: PriceAlert[]
}

export default function UsersAdminPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
      const json = await res.json()
      const items = (json.data?.items || []) as UserRow[]
      setResults(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { if (q.length >= 2) search(q); else setResults([]) }, 250)
    return () => clearTimeout(id)
  }, [q])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Read-only view of users, preferences, and price alerts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name..."
            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : results.length === 0 && q.length >= 2 ? (
            <div className="text-gray-600">No users found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((u) => (
                <div key={u.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                        <div className="text-sm text-gray-600">{u.email}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                    {u.preferences && (
                      <div className="mt-2">
                        <div>Currency: {u.preferences.preferredCurrency}</div>
                        <div>Language: {u.preferences.preferredLanguage}</div>
                        <div>Newsletter: {u.preferences.newsletterSubscribed ? 'Subscribed' : 'No'}</div>
                      </div>
                    )}
                    {u.alerts && u.alerts.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-gray-800 mb-1">Price Alerts</div>
                        <ul className="list-disc list-inside">
                          {u.alerts.slice(0, 3).map(a => (
                            <li key={a.id} className="text-xs text-gray-600">{a.origin} → {a.destination} · up to {a.maxPrice.amount} {a.maxPrice.currency}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


