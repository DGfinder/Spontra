"use client"

import { useState } from 'react'
import adminService from '@/services/adminService'

export default function FlightTimesPage() {
  const [origin, setOrigin] = useState('LHR')
  const [destination, setDestination] = useState('JFK')
  const [loading, setLoading] = useState(false)
  const [routeDuration, setRouteDuration] = useState<any | null>(null)
  const [originList, setOriginList] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'destination_airport' | 'duration_minutes' | 'distance_km' | 'is_direct' | 'typical_stops'>('duration_minutes')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [stats, setStats] = useState<any | null>(null)
  const [minMinutes, setMinMinutes] = useState<number | ''>('')
  const [maxMinutes, setMaxMinutes] = useState<number | ''>('')
  const [directOnly, setDirectOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 100

  const fetchRoute = async () => {
    setLoading(true)
    try {
      const d = await adminService.getRouteDuration(origin, destination)
      setRouteDuration(d)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrigin = async () => {
    setLoading(true)
    try {
      const items = await adminService.listDurationsForOrigin(origin, pageSize, (page-1)*pageSize)
      setOriginList(items)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const s = await adminService.getRouteStats()
      setStats(s)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Flight Times</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-medium mb-2">Route Duration</h2>
          <div className="flex gap-2 mb-2">
            <input className="border p-2 rounded w-20" value={origin} onChange={e=>setOrigin(e.target.value.toUpperCase())} placeholder="Origin" />
            <input className="border p-2 rounded w-20" value={destination} onChange={e=>setDestination(e.target.value.toUpperCase())} placeholder="Dest" />
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={fetchRoute} disabled={loading}>Fetch</button>
          </div>
          {routeDuration && (
            <div className="text-sm text-slate-700">
              <div><b>{routeDuration.origin_airport}</b> → <b>{routeDuration.destination_airport}</b></div>
              <div>Duration: {routeDuration.duration_minutes} min</div>
              <div>Distance: {routeDuration.distance_km} km</div>
              <div>Direct: {routeDuration.is_direct ? 'Yes' : 'No'}</div>
              <div>Stops: {routeDuration.typical_stops}</div>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded border">
          <h2 className="font-medium mb-2">By Origin</h2>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input className="border p-2 rounded w-24" value={origin} onChange={e=>setOrigin(e.target.value.toUpperCase())} placeholder="Origin" />
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={fetchOrigin} disabled={loading}>List</button>
            <div className="text-sm text-slate-600 ml-2">or filter by duration range:</div>
            <input className="border p-2 rounded w-28" value={minMinutes} onChange={e=>setMinMinutes(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Min (min)" />
            <input className="border p-2 rounded w-28" value={maxMinutes} onChange={e=>setMaxMinutes(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Max (min)" />
            <button
              className="px-3 py-2 bg-slate-700 text-white rounded"
              onClick={async ()=>{
                setLoading(true)
                try {
                  const min = typeof minMinutes === 'number' ? minMinutes : 0
                  const max = typeof maxMinutes === 'number' ? maxMinutes : 1440
                  const items = await adminService.listByDurationRange(origin, min, max, 500)
                  setOriginList(directOnly ? items.filter((r:any)=> r.is_direct) : items)
                } finally { setLoading(false) }
              }}
              disabled={loading}
            >Apply</button>
            <label className="flex items-center gap-2 text-sm ml-2">
              <input type="checkbox" checked={directOnly} onChange={e=>{
                setDirectOnly(e.target.checked)
                setOriginList(prev => e.target.checked ? prev.filter((r:any)=> r.is_direct) : prev)
              }} />
              Direct only
            </label>
          </div>
          <div className="text-xs text-slate-500 mb-2">{originList.length} routes</div>
          {originList.length > 0 && (
            <div className="flex items-center gap-2 mb-2 text-sm">
              <label>Sort by:</label>
              <select className="border rounded px-2 py-1" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
                <option value="duration_minutes">Duration</option>
                <option value="distance_km">Distance</option>
                <option value="destination_airport">Destination</option>
                <option value="is_direct">Direct</option>
                <option value="typical_stops">Stops</option>
              </select>
              <select className="border rounded px-2 py-1" value={sortDir} onChange={e=>setSortDir(e.target.value as any)}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <button
                className="ml-auto px-2 py-1 border rounded"
                onClick={() => {
                  const headers = ['origin_airport','destination_airport','duration_minutes','distance_km','is_direct','typical_stops']
                  const rows = originList.map((r:any)=> headers.map(h=> r[h]))
                  const csv = [headers.join(','), ...rows.map(r=> r.join(','))].join('\n')
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `flight_durations_${origin}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >Export CSV</button>
            </div>
          )}
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Origin</th>
                  <th className="py-2 pr-2">Destination</th>
                  <th className="py-2 pr-2">Duration (min)</th>
                  <th className="py-2 pr-2">Distance (km)</th>
                  <th className="py-2 pr-2">Direct</th>
                  <th className="py-2 pr-2">Stops</th>
                </tr>
              </thead>
              <tbody>
                {[...originList].sort((a:any,b:any)=>{
                  const dir = sortDir === 'asc' ? 1 : -1
                  const av = a[sortBy]
                  const bv = b[sortBy]
                  if (av < bv) return -1*dir
                  if (av > bv) return 1*dir
                  return 0
                }).map((it:any)=> (
                  <tr key={it.id} className="border-b">
                    <td className="py-2 pr-2">{it.origin_airport}</td>
                    <td className="py-2 pr-2">{it.destination_airport}</td>
                    <td className="py-2 pr-2">{it.duration_minutes}</td>
                    <td className="py-2 pr-2">{it.distance_km}</td>
                    <td className="py-2 pr-2">{it.is_direct ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-2">{it.typical_stops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page===1 || loading} onClick={()=>{ setPage(p=>Math.max(1,p-1)); setTimeout(fetchOrigin,0) }}>Prev</button>
            <div>Page {page}</div>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={originList.length < pageSize || loading} onClick={()=>{ setPage(p=>p+1); setTimeout(fetchOrigin,0) }}>Next</button>
          </div>
        </div>
        <div className="bg-white p-4 rounded border">
          <h2 className="font-medium mb-2">Route Stats</h2>
          <button className="px-3 py-2 bg-blue-600 text-white rounded mb-2" onClick={fetchStats} disabled={loading}>Fetch Stats</button>
          {stats && (
            <div className="text-sm text-slate-700 space-y-1">
              <div>Total routes: {stats.total_routes}</div>
              <div>Direct routes: {stats.direct_routes}</div>
              <div>Avg duration: {Math.round(stats.avg_duration_minutes)} min</div>
              <div>Min/Max: {stats.min_duration_minutes} / {stats.max_duration_minutes} min</div>
              <div>Avg distance: {Math.round(stats.avg_distance_km)} km</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


