'use client'

import { useState } from 'react'

export default function CacheManagementPage() {
  const [prefix, setPrefix] = useState('destinations:')
  const [keys, setKeys] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setMessage(null)
    const res = await fetch(`/api/admin/cache/keys?prefix=${encodeURIComponent(prefix)}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || json.ok === false) { setMessage(json.error || 'Failed to load keys'); return }
    setKeys(json.data || [])
    setSelected({})
  }

  async function del() {
    const toDelete = Object.keys(selected).filter(k => selected[k])
    if (toDelete.length === 0) { setMessage('No keys selected'); return }
    const res = await fetch('/api/admin/cache/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: toDelete })
    })
    const json = await res.json()
    if (!res.ok || json.ok === false) { setMessage(json.error || 'Failed to delete'); return }
    setMessage(`Deleted ${json.deleted} keys`)
    await load()
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cache Management</h1>
        <p className="text-gray-600">List and invalidate cache keys by prefix</p>
      </div>
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Prefix</label>
          <input value={prefix} onChange={e => setPrefix(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-800 text-white rounded">List Keys</button>
        <button onClick={del} className="px-4 py-2 bg-red-600 text-white rounded">Delete Selected</button>
      </div>
      {message && <div className="text-sm text-gray-800">{message}</div>}
      <div className="bg-white border rounded p-4">
        {keys.length === 0 ? (
          <div className="text-gray-600">No keys</div>
        ) : (
          <ul className="space-y-2">
            {keys.map(k => (
              <li key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={!!selected[k]} onChange={e => setSelected(prev => ({ ...prev, [k]: e.target.checked }))} />
                <code className="text-xs">{k}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

