'use client'

import { useEffect, useState } from 'react'

type ThemeKey = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

interface DestinationPreference {
  iataCode: string
  whitelisted: boolean
  themeScores: Partial<Record<ThemeKey, number>>
  updatedAt: string
}

export default function DestinationManagePage() {
  const [prefs, setPrefs] = useState<Record<string, DestinationPreference>>({})
  const [search, setSearch] = useState('')
  const [newIata, setNewIata] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/destinations/preferences', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok && json.ok) setPrefs(json.data || {})
  }

  useEffect(() => { load() }, [])

  const filtered = Object.values(prefs).filter(p => !search || p.iataCode.includes(search.toUpperCase()))

  function updateScore(iata: string, key: ThemeKey, value: number) {
    setPrefs(prev => ({
      ...prev,
      [iata]: { ...prev[iata], themeScores: { ...(prev[iata]?.themeScores || {}), [key]: Math.max(0, Math.min(10, value)) } }
    }))
  }

  async function save(iata: string) {
    const item = prefs[iata]
    const res = await fetch('/api/admin/destinations/preferences', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
    })
    const json = await res.json()
    setMessage(res.ok && json.ok ? 'Saved' : (json.error || 'Save failed'))
    await load()
  }

  function addNew() {
    const i = newIata.toUpperCase()
    if (!i || i.length !== 3) { setMessage('Enter 3-letter IATA'); return }
    setPrefs(prev => ({ ...prev, [i]: { iataCode: i, whitelisted: false, themeScores: {}, updatedAt: new Date().toISOString() } }))
    setNewIata('')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinations Management</h1>
          <p className="text-gray-600">Whitelist and theme scores (0–10) influence Explore ranking</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IATA" className="border rounded px-2 py-1" />
          <div className="flex items-center gap-2 border rounded p-1">
            <input value={newIata} onChange={e => setNewIata(e.target.value)} placeholder="Add IATA" className="px-2 py-1 outline-none" />
            <button onClick={addNew} className="px-3 py-1 bg-gray-800 text-white rounded">Add</button>
          </div>
        </div>
      </div>

      {message && <div className="text-sm text-gray-800">{message}</div>}

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">IATA</th>
              <th className="text-left p-2">Whitelisted</th>
              {(['vibe','adventure','discover','indulge','nature'] as ThemeKey[]).map(k => (
                <th key={k} className="text-left p-2 capitalize">{k}</th>
              ))}
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.iataCode} className="border-b last:border-0">
                <td className="p-2 font-medium">{p.iataCode}</td>
                <td className="p-2">
                  <input type="checkbox" checked={!!p.whitelisted} onChange={e => setPrefs(prev => ({ ...prev, [p.iataCode]: { ...prev[p.iataCode], whitelisted: e.target.checked } }))} />
                </td>
                {(['vibe','adventure','discover','indulge','nature'] as ThemeKey[]).map(k => (
                  <td key={k} className="p-2">
                    <input type="number" min={0} max={10} step={1} value={p.themeScores?.[k] ?? 0}
                      onChange={(e) => updateScore(p.iataCode, k, Number(e.target.value))}
                      className="w-16 border rounded px-2 py-1" />
                  </td>
                ))}
                <td className="p-2">
                  <button onClick={() => save(p.iataCode)} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

