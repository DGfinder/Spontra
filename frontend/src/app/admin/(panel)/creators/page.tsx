'use client'

import { useEffect, useState } from 'react'
import { Users, Mail, Clock, Download, RefreshCw, Search } from 'lucide-react'

interface WaitlistEntry {
  id: string
  email: string
  position: number
  status: string
  source: string
  createdAt: string
}

export default function AdminCreatorsPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, invited: 0 })

  useEffect(() => {
    fetchWaitlist()
  }, [])

  async function fetchWaitlist() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/creators/waitlist')
      const data = await res.json()
      if (data.ok) {
        setEntries(data.entries || [])
        setStats({
          total: data.entries?.length || 0,
          pending: data.entries?.filter((e: WaitlistEntry) => e.status === 'pending').length || 0,
          invited: data.entries?.filter((e: WaitlistEntry) => e.status === 'invited').length || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch waitlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = entries.filter(e => 
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportCSV = () => {
    const csv = [
      'Position,Email,Status,Source,Joined',
      ...entries.map(e => 
        `${e.position},"${e.email}",${e.status},${e.source},${new Date(e.createdAt).toISOString()}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creator-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Creator Waitlist</h1>
          <p className="text-sm text-slate-600">
            Manage signups for the creator program
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchWaitlist}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total signups</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.invited}</p>
              <p className="text-sm text-slate-500">Invited</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">Loading waitlist...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No signups yet</p>
            <p className="text-sm text-slate-400 mt-1">Share /creators to start collecting signups</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-500">{entry.position}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{entry.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      entry.status === 'invited' ? 'bg-emerald-50 text-emerald-700' :
                      entry.status === 'joined' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{entry.source}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
