import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Cookie Policy | Spontra',
  description: 'Learn about how Spontra uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <LegalPageTemplate title="Cookie Policy" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          This Cookie Policy explains how Spontra uses cookies and similar tracking technologies.
        </p>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white mt-8">What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and analyzing site usage.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold text-white mt-6">1. Essential Cookies</h3>
          <p>
            Required for the website to function properly. These cookies:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Remember your login session</li>
            <li>Store your search preferences</li>
            <li>Enable security features</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-6">2. Analytics Cookies</h3>
          <p>
            Help us understand how visitors use our site. We use:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Vercel Analytics (performance monitoring)</li>
            <li>Google Analytics (usage patterns)</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-6">3. Advertising Cookies</h3>
          <p>
            Used to track affiliate conversions and measure campaign effectiveness.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
            <li><strong>Firefox:</strong> Preferences → Privacy & Security</li>
            <li><strong>Safari:</strong> Preferences → Privacy</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>
          <p className="text-yellow-200/80 mt-4">
            Note: Disabling essential cookies may affect website functionality.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">Third-Party Cookies</h2>
          <p>
            Some cookies are set by third-party services we use:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>YouTube (video embeds)</li>
            <li>Affiliate partners (conversion tracking)</li>
            <li>Analytics providers</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">Contact</h2>
          <p>
            Questions about our use of cookies? Contact:{' '}
            <a href="mailto:privacy@spontra.com" className="text-brand-gold hover:underline">
              privacy@spontra.com
            </a>
          </p>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
