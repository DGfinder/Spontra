import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Cookie Policy | Spontra',
  description: 'Learn about how Spontra uses cookies and similar technologies to enhance your experience.',
}

export default function CookiesPage() {
  return (
    <LegalPageTemplate title="Cookie Policy" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          This Cookie Policy explains how Spontra ("we", "us", or "our") uses cookies and similar
          tracking technologies on our website. We are committed to transparency and your privacy.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device (computer, tablet, or mobile) when you
              visit our website. They help us recognize you, remember your preferences, and provide a
              better browsing experience.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>

            <div className="space-y-4 mt-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">1. Necessary Cookies (Always Active)</h3>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Purpose:</strong> Essential for website functionality
                </p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><code className="bg-white/10 px-1 rounded">user_token</code> - Authentication cookie (7-day expiry)</li>
                  <li><code className="bg-white/10 px-1 rounded">auth_token</code> - Admin authentication (7-day expiry)</li>
                  <li>Session cookies for security and functionality</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Legal Basis:</strong> Legitimate interest (cannot be disabled as they are required for the site to work)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">2. Analytics Cookies (Optional)</h3>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Purpose:</strong> Help us understand how visitors use our site
                </p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Services:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Google Analytics 4 (GA4)</strong> - Tracks page views, user demographics, behavior flow</li>
                  <li><strong>Vercel Analytics</strong> - Performance monitoring and Core Web Vitals tracking</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Data Collected:</strong> Pages visited, time on site, browser type, device type, geographic location (city-level), referral source
                </p>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Retention:</strong> 26 months (GA4), 90 days (Vercel)
                </p>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Legal Basis:</strong> Your consent (you can opt-out via cookie settings)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">3. Marketing Cookies (Optional)</h3>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Purpose:</strong> Track affiliate link clicks and conversions
                </p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Services:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Skyscanner Affiliate Network</strong> - Tracks clicks to flight comparison</li>
                  <li><strong>KAYAK Affiliate Program</strong> - Monitors booking conversions</li>
                  <li><strong>Google Flights</strong> - Referral tracking (no personal data shared)</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Data Collected:</strong> Click timestamps, destination searched, referral parameters (we do NOT receive personal booking information)
                </p>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Retention:</strong> 30 days
                </p>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Legal Basis:</strong> Your consent (you can opt-out via cookie settings)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">4. Preference Cookies (Optional)</h3>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Purpose:</strong> Remember your personal preferences
                </p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>Home airport selection</li>
                  <li>Preferred travel themes (adventure, beach, culture, etc.)</li>
                  <li>Display settings (light/dark mode if applicable)</li>
                  <li>Language preferences</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Storage:</strong> Local storage, expires when you clear browser data
                </p>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Legal Basis:</strong> Your consent
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Cookie Choices</h2>
            <p className="mb-4">
              You have the right to choose whether to accept cookies. When you first visit Spontra, you'll
              see a cookie consent banner with the following options:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Accept All</strong> - Allows all cookie types for the best experience</li>
              <li><strong>Reject Optional</strong> - Only necessary cookies (site may have limited functionality)</li>
              <li><strong>Customize</strong> - Choose which cookie categories you accept</li>
            </ul>
            <p className="mt-4">
              You can change your cookie preferences at any time by clicking the "Cookie Settings" link in the footer.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Browser Cookie Controls</h2>
            <p className="mb-4">
              You can also control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies (may break website functionality)</li>
              <li>Delete all cookies when closing your browser</li>
            </ul>
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>⚠️ Note:</strong> Blocking all cookies will prevent you from using certain features
                of Spontra, including user accounts, saved searches, and personalized recommendations.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Cookies</h2>
            <p className="mb-4">
              When you use Spontra, you may encounter cookies from third parties. We work with the following partners:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Google Analytics</p>
                <p className="text-white/70 text-sm">
                  Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">https://policies.google.com/privacy</a><br />
                  Opt-out: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Google Analytics Opt-out Browser Add-on</a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Skyscanner</p>
                <p className="text-white/70 text-sm">
                  Privacy Policy: <a href="https://www.skyscanner.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">https://www.skyscanner.com/privacy</a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">KAYAK</p>
                <p className="text-white/70 text-sm">
                  Privacy Policy: <a href="https://www.kayak.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">https://www.kayak.com/privacy</a>
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Spontra is not responsible for the privacy practices of third-party websites. We encourage you
              to review their privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
            <p>
              Spontra does not knowingly collect information from children under 16 years of age. Our services
              are not directed to children, and we do not use cookies to target minors.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation,
              or our business practices. The "Last Updated" date at the top of this page indicates when the
              policy was last revised. Material changes will be communicated via a prominent notice on our website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white font-semibold mb-2">Spontra Privacy Team</p>
              <p className="text-white/70 text-sm">
                Email: <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a><br />
                Response Time: Within 48 hours
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>💡 Quick Summary:</strong> We use cookies to make Spontra work better for you. Essential cookies
              are always active, but you control analytics and marketing cookies. You can change your preferences
              anytime in Cookie Settings. We're transparent about who we share data with and protect your privacy.
            </p>
          </div>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
