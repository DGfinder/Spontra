"use client"

import { useState } from 'react'
import adminService from '@/services/adminService'

export default function FlightTimesPage() {
  const [origin, setOrigin] = useState('LHR')
  const [destination, setDestination] = useState('JFK')
  const [loading, setLoading] = useState(false)
  const [routeDuration, setRouteDuration] = useState<any | null>(null)
  const [originList, setOriginList] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)

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
      const items = await adminService.listDurationsForOrigin(origin, 50)
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
          <div className="flex gap-2 mb-2">
            <input className="border p-2 rounded w-24" value={origin} onChange={e=>setOrigin(e.target.value.toUpperCase())} placeholder="Origin" />
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={fetchOrigin} disabled={loading}>List</button>
          </div>
          <div className="max-h-64 overflow-auto text-sm">
            {originList.map((it) => (
              <div key={it.id} className="border-b py-1">
                {it.origin_airport} → {it.destination_airport}: {it.duration_minutes} min {it.is_direct ? '(Direct)' : ''}
              </div>
            ))}
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


