'use client'

import { useEffect, useRef, useState } from 'react'
import { Plane, Search } from 'lucide-react'

import apiClient from '@/services/apiClient'

interface AirportCard {
  code: string
  name: string
  city: string
  country: string
}

export default function ManageAirportsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AirportCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const suggestions = await apiClient.getAirportSuggestions(query.trim())
        setResults(Array.isArray(suggestions) ? (suggestions as AirportCard[]) : [])
      } catch (error) {
        console.warn('Airport suggestion lookup failed', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  return (
    <div className='space-y-8'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold text-slate-900'>Airport reference</h1>
        <p className='text-sm text-slate-600'>Search the static airport dataset used throughout the admin surface.</p>
      </header>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <div className='relative max-w-xl'>
          <Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search by airport, city, or IATA code'
            className='w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          />
        </div>

        <div className='mt-6'>
          {isLoading ? (
            <p className='text-sm text-slate-500'>Searching registry...</p>
          ) : results.length === 0 ? (
            <p className='text-sm text-slate-500'>Enter at least two characters to search.</p>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {results.map((airport) => (
                <article key={airport.code} className='rounded-lg border border-slate-200 p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white'>
                        <span className='text-sm font-semibold'>{airport.code}</span>
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{airport.name}</p>
                        <p className='text-xs text-slate-500'>
                          {airport.city}, {airport.country}
                        </p>
                      </div>
                    </div>
                    <Plane size={18} className='text-blue-500' />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}