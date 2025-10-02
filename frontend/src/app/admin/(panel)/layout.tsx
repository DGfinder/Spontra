import Link from 'next/link'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple via-brand-blue to-brand-teal">
      {/* Admin Navigation */}
      <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-white font-bold text-xl">
                Spontra Admin
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/admin/countries"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Countries
                </Link>
                <Link
                  href="/admin/destinations"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Destinations
                </Link>
                <Link
                  href="/admin/routes"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Flight Routes
                </Link>
              </div>
            </div>
            <Link
              href="/"
              className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
