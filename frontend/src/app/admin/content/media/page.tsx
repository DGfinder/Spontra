'use client'

import { useEffect, useState } from 'react'

interface VideoItem { id: string; title: string; url: string; thumbnail?: string; channelTitle?: string }

export default function MediaManagementPage() {
  const [destination, setDestination] = useState('')
  const [activity, setActivity] = useState('')
  const [searchResults, setSearchResults] = useState<VideoItem[]>([])
  const [approved, setApproved] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function search() {
    if (!destination) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ destination })
      if (activity) params.set('activity', activity)
      const res = await fetch(`/api/youtube/videos?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to search')
      setSearchResults(json.data || [])
    } catch (e: any) {
      setMessage(e.message)
    } finally { setLoading(false) }
  }

  async function loadApproved() {
    if (!destination) return
    const params = new URLSearchParams({ destination })
    if (activity) params.set('activity', activity)
    const res = await fetch(`/api/admin/media/videos?${params.toString()}`, { cache: 'no-store' })
    const json = await res.json()
    if (res.ok && json.ok) setApproved(json.data || [])
  }

  async function saveApproved() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/media/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, activity, videos: approved })
      })
      const json = await res.json()
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to save')
      setMessage('Saved')
    } catch (e: any) { setMessage(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadApproved() }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Management</h1>
        <p className="text-gray-600">Curate short videos by destination and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border rounded-lg">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Destination (IATA)</label>
          <input className="w-full border rounded px-2 py-1" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Activity (optional)</label>
          <input className="w-full border rounded px-2 py-1" value={activity} onChange={e => setActivity(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={search} className="px-4 py-2 bg-gray-800 text-white rounded">Search</button>
          <button onClick={loadApproved} className="px-4 py-2 border rounded">Load Approved</button>
          <button onClick={saveApproved} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Save</button>
        </div>
      </div>

      {message && <div className="text-sm text-gray-800">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="font-semibold mb-3">Search Results</div>
          <div className="space-y-2">
            {searchResults.map(v => (
              <div key={v.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-3">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt={v.title} className="w-16 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-10 bg-gray-200 rounded" />
                  )}
                  <div>
                    <div className="font-medium truncate max-w-xs" title={v.title}>{v.title}</div>
                    <div className="text-xs text-gray-600 truncate max-w-xs">{v.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={v.url} target="_blank" className="px-3 py-1 border rounded text-sm">Preview</a>
                  <button className="px-3 py-1 border rounded text-sm" onClick={() => setApproved(prev => [...prev, v])}>Approve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="font-semibold mb-3">Approved Videos</div>
          <div className="space-y-2">
            {approved.map((v, i) => (
              <div key={v.id + i} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-3">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt={v.title} className="w-16 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-10 bg-gray-200 rounded" />
                  )}
                  <div>
                    <div className="font-medium truncate max-w-xs" title={v.title}>{v.title}</div>
                    <div className="text-xs text-gray-600 truncate max-w-xs">{v.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={v.url} target="_blank" className="px-3 py-1 border rounded text-sm">Preview</a>
                  <button className="px-3 py-1 border rounded text-sm" onClick={() => setApproved(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
