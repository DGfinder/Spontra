import Link from 'next/link'

interface FooterMinimalProps {
  theme?: string
  className?: string
}

/**
 * Minimal footer for immersive POI pages
 * - Subtle glassmorphism (doesn't break flow)
 * - Just logo + essential legal links
 * - 60px height, theme-adaptive
 */
export function FooterMinimal({ theme, className = '' }: FooterMinimalProps) {
  return (
    <footer
      className={`
        mt-auto border-t border-white/10
        bg-gradient-to-t from-[rgba(11,15,18,0.95)] to-[rgba(11,15,18,0.85)]
        backdrop-blur-md
        ${className}
      `}
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-white font-bold text-lg hover:opacity-80 transition-opacity"
          >
            Spontra
          </Link>

          {/* Legal Links */}
          <nav className="flex items-center gap-6" aria-label="Legal navigation">
            <Link
              href="/privacy"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Cookies
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-white/40 text-xs hidden sm:block">
            © {new Date().getFullYear()} Spontra
          </p>
        </div>
      </div>
    </footer>
  )
}
