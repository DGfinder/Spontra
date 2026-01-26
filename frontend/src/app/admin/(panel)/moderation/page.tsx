'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Inbox, Shield, RefreshCw, Eye, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'

interface ModerationItem {
  id: string
  title: string
  description?: string
  videoUrl?: string
  thumbnailUrl?: string
  destinationCode: string
  status: string
  qualityScore?: number
  creatorEmail?: string
  createdAt: string
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [filter])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/moderation?status=${filter}`)
      const data = await res.json()
      if (data.ok) {
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch moderation items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id)
    try {
      await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      // Remove from list after action
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to update item:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const filterTabs = [
    { key: 'pending', label: 'Pending', icon: AlertTriangle },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
    { key: 'all', label: 'All', icon: Inbox },
  ] as const

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Moderation Queue</h1>
          <p className="text-sm text-slate-600">Review and approve creator content submissions</p>
        </div>
        <button
          onClick={fetchItems}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Inbox size={28} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No items to moderate</h2>
          <p className="mt-2 text-sm text-slate-600">
            {filter === 'pending' 
              ? 'All caught up! No pending content to review.'
              : `No ${filter} items found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative">
                {item.thumbnailUrl ? (
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Eye className="h-12 w-12" />
                  </div>
                )}
                {item.qualityScore && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                    Score: {item.qualityScore}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.destinationCode}</p>
                </div>

                {item.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.creatorEmail || 'Unknown creator'}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                {item.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAction(item.id, 'approved')}
                      disabled={actionLoading === item.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'rejected')}
                      disabled={actionLoading === item.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}

                {item.videoUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View video
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Info Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <Shield size={20} className="text-blue-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">AI Pre-screening</h3>
          <p className="mt-2 text-sm text-slate-600">
            Content is automatically scanned for policy violations before reaching this queue.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <AlertTriangle size={20} className="text-amber-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">Review Guidelines</h3>
          <p className="mt-2 text-sm text-slate-600">
            Check for authenticity, appropriate content, and GPS verification accuracy.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <CheckCircle size={20} className="text-emerald-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">Quality Standards</h3>
          <p className="mt-2 text-sm text-slate-600">
            Approved content becomes visible to travelers and earns creator rewards.
          </p>
        </article>
      </section>
    </div>
  )
}
