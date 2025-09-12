'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader, Save, AlertCircle, Zap, Mountain, Compass, Coffee, TreePine } from 'lucide-react'

type ThemeKey = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

interface AirportItem {
  code: string
  name: string
  city: string
  country: string
  latitude?: number | null
  longitude?: number | null
}

export default function QuickAddDestinationPage() {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AirportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AirportItem | null>(null)

  const [enabledThemes, setEnabledThemes] = useState<Record<ThemeKey, boolean>>({
    vibe: false,
    adventure: false,
    discover: false,
    indulge: false,
    nature: false,
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    let cancel = false
    const run = async () => {
      setError(null)
      if (!query || query.length < 2) { setResults([]); return }
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/reference/airports?q=${encodeURIComponent(query)}&limit=20`)
        const json = await res.json()
        if (!cancel) {
          if (json?.ok) setResults(json.items || [])
          else setError(json?.error || 'Search failed')
        }
      } catch (e: any) {
        if (!cancel) setError(e?.message || 'Search failed')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    const t = setTimeout(run, 250)
    return () => { cancel = true; clearTimeout(t) }
  }, [query])

  const themeDefs: Array<{ key: ThemeKey, name: string, icon: any }> = useMemo(() => ([
    { key: 'vibe', name: 'City Vibe', icon: Zap },
    { key: 'adventure', name: 'Adventure', icon: Mountain },
    { key: 'discover', name: 'Discovery', icon: Compass },
    { key: 'indulge', name: 'Indulgence', icon: Coffee },
    { key: 'nature', name: 'Nature', icon: TreePine },
  ]), [])

  const toggleTheme = (key: ThemeKey) => setEnabledThemes((m) => ({ ...m, [key]: !m[key] }))

  const handleSave = async () => {
    setSaveError(null)
    if (!selected?.code) { setSaveError('Select a city or airport'); return }
    setSaving(true)
    try {
      // Convert enabled themes to numeric scores (10 = enabled, 0 = disabled)
      const themeScores: Record<string, number> = {}
      ;(Object.keys(enabledThemes) as ThemeKey[]).forEach((k) => { themeScores[k] = enabledThemes[k] ? 10 : 0 })

      const res = await fetch('/api/admin/destinations/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iataCode: selected.code, whitelisted: true, themeScores })
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save')
      router.push(`/admin/destinations/${encodeURIComponent(selected.code)}`)
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push('/admin/destinations/manage')} className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Add Destination</h1>
            <p className="text-gray-600">Pick a city/airport and enable themes. POIs can be added next.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Search City or Airport</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type city, airport name, code, or country"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-700 mb-2">Results</div>
            <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-gray-500 text-sm flex items-center"><Loader size={16} className="animate-spin mr-2"/>Searching…</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm">No results</div>
              ) : (
                results.map((r) => (
                  <button key={`${r.code}-${r.name}`} onClick={() => setSelected(r)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${selected?.code === r.code ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.city} ({r.code})</div>
                        <div className="text-xs text-gray-600">{r.name} · {r.country}</div>
                      </div>
                      <div className="text-xs text-gray-500">{r.latitude && r.longitude ? `${r.latitude.toFixed(2)}, ${r.longitude.toFixed(2)}` : ''}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-700 mb-2">Selected</div>
            <div className="border border-gray-200 rounded-lg p-4 h-full">
              {selected ? (
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{selected.city} ({selected.code})</div>
                  <div className="text-sm text-gray-600">{selected.name}</div>
                  <div className="text-sm text-gray-600">{selected.country}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Choose a result to continue.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Enable Themes (shows this city for selected user themes)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {themeDefs.map(({ key, name, icon: Icon }) => (
              <label key={key} className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer ${enabledThemes[key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <input type="checkbox" className="hidden" checked={enabledThemes[key]} onChange={() => toggleTheme(key)} />
                <Icon size={18} className={enabledThemes[key] ? 'text-blue-600' : 'text-gray-500'} />
                <span className="text-sm">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">This saves preferences (whitelist + enabled themes). Add POIs on the next page.</div>
          <button onClick={handleSave} disabled={!selected || saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center">
            {saving ? (<><Loader size={16} className="animate-spin mr-2"/>Saving…</>) : (<><Save size={16} className="mr-2"/>Create & Manage POIs</>)}
          </button>
        </div>

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center">
            <AlertCircle size={16} className="mr-2" /> {saveError}
          </div>
        )}
      </div>
    </div>
  )
}

