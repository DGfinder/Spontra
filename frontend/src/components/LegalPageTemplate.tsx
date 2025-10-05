import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LegalPageTemplateProps {
  title: string
  lastUpdated?: string
  children: React.ReactNode
}

/**
 * Reusable template for legal/company pages
 * Maintains brand consistency with glassmorphism design
 */
export function LegalPageTemplate({ title, lastUpdated, children }: LegalPageTemplateProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          {lastUpdated && (
            <p className="text-white/60 text-sm mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <div className="prose prose-invert prose-lg max-w-none">
            {children}
          </div>
        </article>
      </main>
    </div>
  )
}
