import Link from 'next/link'
import { Plane, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="relative mb-8">
          <Plane className="w-24 h-24 text-white/20 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white">404</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Flight not found
        </h1>
        
        <p className="text-white/60 mb-8">
          Looks like this destination doesn't exist. Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/flights"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
          >
            <Search className="w-4 h-4" />
            Search flights
          </Link>
        </div>
      </div>
    </div>
  )
}
