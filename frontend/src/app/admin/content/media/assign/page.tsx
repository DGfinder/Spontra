'use client'

import { useEffect, useState } from 'react'

interface VideoItem { id: string; title: string; url: string; thumbnail?: string; channelTitle?: string }

export default function MediaAssignPage() {
  const [destination, setDestination] = useState('')
  const [activity, setActivity] = useState('')
  const [curated, setCurated] = useState<VideoItem[]>([])
  const [pois, setPois] = useState<any[]>([])
  const [assignments, setAssignments] = useState<Record<string, Record<string, VideoItem[]>>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function loadCurated() {
    if (!destination) return
    const params = new URLSearchParams({ destination })
    if (activity) params.set('activity', activity)
    const res = await fetch(`/api/admin/media/videos?${params.toString()}`, { cache: 'no-store' })
    const json = await res.json()
    setCurated(json?.data || [])
  }

  async function loadPOIs() {
    if (!destination) return
    const res = await fetch(`/api/admin/destinations/${encodeURIComponent(destination)}/pois?limit=100`, { cache: 'no-store' })
    const json = await res.json()
    setPois(json?.data?.pois || json?.pois || [])
  }

  async function loadAssignments() {
    if (!destination) return
    const res = await fetch(`/api/admin/media/assign?destination=${encodeURIComponent(destination)}`, { cache: 'no-store' })
    const json = await res.json()
    setAssignments(json?.data || {})
  }

  async function save() {
    setMessage(null)
    const res = await fetch('/api/admin/media/assign', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, assignments })
    })
    const json = await res.json()
    if (!res.ok || json.ok === false) { setMessage(json.error || 'Failed to save'); return }
    setMessage('Saved')
  }

  useEffect(() => { if (destination) { loadCurated(); loadPOIs(); loadAssignments() } }, [destination])

  function addAssignment(poiId: string, theme: string, video: VideoItem) {
    setAssignments(prev => {
      const next = { ...prev }
      next[poiId] = next[poiId] || {}
      next[poiId][theme] = next[poiId][theme] || []
      if (!next[poiId][theme].some(v => v.id === video.id)) next[poiId][theme].push(video)
      return next
    })
  }

  function removeAssignment(poiId: string, theme: string, videoId: string) {
    setAssignments(prev => {
      const next = { ...prev }
      if (next[poiId] && next[poiId][theme]) next[poiId][theme] = next[poiId][theme].filter(v => v.id !== videoId)
      return next
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Media to POIs</h1>
        <p className="text-gray-600">Link curated short videos to points of interest by theme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border rounded-lg">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Destination (IATA)</label>
          <input className="w-full border rounded px-2 py-1" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Theme (for curated fetch)</label>
          <input className="w-full border rounded px-2 py-1" value={activity} onChange={e => setActivity(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={() => { loadCurated(); loadPOIs(); loadAssignments() }} className="px-4 py-2 bg-gray-800 text-white rounded">Load</button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save Assignments</button>
        </div>
      </div>

      {message && <div className="text-sm text-gray-800">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="font-semibold mb-3">Curated Videos</div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {curated.map(v => (
              <div key={v.id} className="border rounded p-2">
                <div className="font-medium">{v.title}</div>
                <div className="text-xs text-gray-600 mb-2">{v.url}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pois.map(poi => (
                    <div key={poi.id} className="flex items-center justify-between border rounded p-2">
                      <div className="text-sm text-gray-800 truncate mr-2">{poi.name}</div>
                      <div className="flex items-center gap-2">
                        <input placeholder="theme" className="w-28 border rounded px-1 py-0.5 text-sm" defaultValue={activity}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const theme = (e.currentTarget as HTMLInputElement).value || ''
                              addAssignment(String(poi.id), theme.toLowerCase(), v)
                            }
                          }} />
                        <button className="px-2 py-1 border rounded text-sm" onClick={() => addAssignment(String(poi.id), (activity || '').toLowerCase(), v)}>Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="font-semibold mb-3">Current Assignments</div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {Object.entries(assignments).map(([poiId, themes]) => (
              <div key={poiId} className="border rounded p-2">
                <div className="text-sm font-semibold mb-2">POI: {poiId}</div>
                {Object.entries(themes as Record<string, VideoItem[]>).map(([theme, items]) => (
                  <div key={poiId+theme} className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Theme: {theme || 'general'}</div>
                    <ul className="space-y-1">
                      {items.map(v => (
                        <li key={v.id} className="flex items-center justify-between text-sm">
                          <span className="truncate mr-2">{v.title}</span>
                          <button className="px-2 py-1 border rounded" onClick={() => removeAssignment(poiId, theme, v.id)}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

