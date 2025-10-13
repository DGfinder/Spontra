import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Terms of Service | Spontra',
  description: 'Read the terms and conditions for using Spontra travel discovery platform.',
}

// ISR: Revalidate every 24 hours (legal content changes infrequently)
export const revalidate = 86400

export default function TermsPage() {
  return (
    <LegalPageTemplate title="Terms of Service" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          Welcome to Spontra ("we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of
          the Spontra website, mobile applications, and related services (collectively, the "Service"). By accessing or
          using Spontra, you agree to be bound by these Terms and our{' '}
          <a href="/privacy" className="text-brand-blue hover:underline">Privacy Policy</a>.
        </p>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            <strong>⚠️ IMPORTANT - Affiliate Disclosure (FTC Compliance):</strong> Spontra is an affiliate marketing platform.
            We earn commissions when you click on flight comparison links and complete bookings with our partners (Skyscanner, KAYAK, Google Flights, etc.).
            This does NOT affect the price you pay—prices are the same or better than booking directly. Our recommendations are unbiased
            and based on search relevance, not commission rates. See{' '}
            <a href="/affiliate-disclosure" className="text-yellow-200 underline">full affiliate disclosure</a>.
          </p>
        </div>

        <div className="space-y-6 mt-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Spontra, you acknowledge that you have read, understood, and agree to be bound by these
              Terms and all applicable laws and regulations. If you do not agree to these Terms, you must not use our Service.
            </p>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm">
                <strong>Who Can Use Spontra:</strong> You must be at least 16 years old to create an account. If you are under 18,
                you represent that you have permission from a parent or guardian to use the Service.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
            <p className="mb-4">
              Spontra is a <strong>travel discovery and metasearch platform</strong> that helps you find destinations based on
              flight time, budget, and travel preferences. Our Service includes:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">✈️ Flight Discovery Engine</p>
                <p className="text-white/70 text-sm">
                  Search destinations by flight duration ranges, themes (adventure, beach, culture, food, nightlife, shopping),
                  and departure airport preferences
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔗 Metasearch Comparison</p>
                <p className="text-white/70 text-sm">
                  Compare flight prices across multiple providers (Skyscanner, KAYAK, Google Flights) via affiliate links.
                  We do NOT sell flights directly—all bookings are completed on partner sites.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🎥 Destination Content</p>
                <p className="text-white/70 text-sm">
                  YouTube videos, destination descriptions, points of interest, and travel inspiration curated for each location
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">📌 User Features (Account Required)</p>
                <p className="text-white/70 text-sm">
                  Save searches, bookmark favorite destinations, manage travel preferences, export data
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 text-sm">
                <strong>Service Availability:</strong> Spontra is provided "as is" and "as available". We do not guarantee
                uninterrupted access, and may modify or discontinue features at any time without notice.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Affiliate Relationships & Revenue Disclosure</h2>
            <p className="mb-4">
              <strong className="text-white">Spontra is an affiliate marketing platform.</strong> We earn commissions
              when you click on flight comparison links and complete purchases with our partner sites. This is how we
              fund our free service.
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">How Affiliate Commissions Work</p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>When You Click:</strong> Affiliate links redirect you to partner sites (Skyscanner, KAYAK, etc.)</li>
                  <li><strong>If You Book:</strong> The partner site pays us a small commission (typically 1-5% of booking value)</li>
                  <li><strong>Your Price:</strong> You pay the same price as booking directly—often better due to partner promotions</li>
                  <li><strong>No Hidden Fees:</strong> We do NOT add markup, fees, or surcharges to displayed prices</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Our Commitment to Transparency</p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Unbiased Recommendations:</strong> Search results are ranked by relevance, travel time, and user preferences—NOT commission rates</li>
                  <li><strong>Price Accuracy:</strong> We display prices from partner APIs but cannot guarantee real-time accuracy (see Section 5)</li>
                  <li><strong>Clear Disclosure:</strong> Affiliate links are clearly marked with "Compare Prices" language</li>
                  <li><strong>No Preference:</strong> We don't favor partners with higher commissions—all partners are treated equally in search results</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Partner Networks</p>
                <p className="text-white/70 text-sm mb-2">
                  Spontra participates in the following affiliate programs:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Skyscanner Affiliate Network</strong> - Flight metasearch</li>
                  <li><strong>KAYAK Affiliate Program</strong> - Flight and travel metasearch</li>
                  <li><strong>Google Flights</strong> - Flight comparison (referral tracking)</li>
                  <li><strong>Future Partners:</strong> We may add additional partners (Booking.com, Expedia, etc.) with notice</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              <strong>FTC Compliance:</strong> This disclosure is required by the Federal Trade Commission (FTC) 16 CFR Part 255
              (Guides Concerning the Use of Endorsements and Testimonials in Advertising). For full details, see our{' '}
              <a href="/affiliate-disclosure" className="text-brand-blue hover:underline">Affiliate Disclosure page</a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Accounts</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Account Creation</h3>
                <p className="text-white/70 text-sm mb-2">
                  To access certain features (saved searches, favorites, preferences), you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and update your account information to keep it accurate</li>
                  <li>Use a strong password and keep it confidential</li>
                  <li>Notify us immediately of any unauthorized account access (<a href="mailto:security@spontra.com" className="text-brand-blue hover:underline">security@spontra.com</a>)</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Account Termination</h3>
                <p className="text-white/70 text-sm mb-2">
                  You may delete your account at any time via Account Settings or by emailing <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a>.
                  We reserve the right to suspend or terminate accounts that violate these Terms, including:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>Providing false or misleading information</li>
                  <li>Using automated tools (bots, scrapers) without permission</li>
                  <li>Abusing or manipulating our Service (fake reviews, spam)</li>
                  <li>Violating intellectual property rights</li>
                  <li>Engaging in illegal or fraudulent activity</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Data Retention:</strong> Upon account deletion, your personal data will be permanently deleted within 30 days
                  (see <a href="/privacy" className="text-brand-blue hover:underline">Privacy Policy</a> for details).
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Bookings & Price Accuracy</h2>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 text-sm">
                <strong>⚠️ CRITICAL NOTICE:</strong> Spontra is a <strong>metasearch platform ONLY</strong>. We do NOT sell flights,
                hotels, or travel services. All bookings are completed on third-party partner sites (airlines, OTAs, travel agencies).
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">How Bookings Work</h3>
                <ol className="list-decimal list-inside space-y-2 pl-4 text-white/70 text-sm">
                  <li>You search for destinations on Spontra</li>
                  <li>We display flight options from partner APIs (Skyscanner, KAYAK, etc.)</li>
                  <li>You click "Compare Prices" → redirected to partner site (affiliate link)</li>
                  <li><strong>Partner site handles booking, payment, confirmation, customer service</strong></li>
                  <li>We receive affiliate commission if booking completes (typically 1-5%)</li>
                </ol>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Price Accuracy Disclaimer</h3>
                <p className="text-white/70 text-sm mb-2">
                  We display flight prices from partner APIs in near real-time, but <strong>prices can change rapidly</strong> due to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>High demand (seats selling out)</li>
                  <li>Currency exchange rate fluctuations</li>
                  <li>Airline pricing algorithm updates</li>
                  <li>Caching delays (we cache prices for 30-60 minutes to reduce API load)</li>
                  <li>Partner site promotions or sales ending</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Final Price Responsibility:</strong> The price displayed on the <strong>partner site at checkout</strong> is
                  the authoritative price—not the price shown on Spontra. Always verify the final price before completing your booking.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Partner Terms Apply</h3>
                <p className="text-white/70 text-sm">
                  When you book through a partner site, you agree to their terms and conditions, cancellation policies, privacy policies,
                  and customer service procedures. Spontra is NOT a party to your booking contract. Contact the partner site directly for:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm mt-2">
                  <li>Booking modifications or cancellations</li>
                  <li>Refund requests</li>
                  <li>Flight delays, cancellations, or disruptions</li>
                  <li>Baggage issues or seat assignments</li>
                  <li>Customer service inquiries</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Uses</h2>
            <p className="mb-4">
              You agree NOT to use the Service for any of the following purposes:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">❌ Illegal Activity</p>
                <p className="text-white/70 text-sm">
                  Violating any local, state, national, or international law or regulation
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🤖 Automated Access</p>
                <p className="text-white/70 text-sm">
                  Using bots, scrapers, crawlers, or automated tools to access the Service without written permission
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔓 Security Violations</p>
                <p className="text-white/70 text-sm">
                  Attempting to bypass security measures, access restricted areas, or exploit vulnerabilities (report security issues to{' '}
                  <a href="mailto:security@spontra.com" className="text-brand-blue hover:underline">security@spontra.com</a>)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">📋 Content Scraping</p>
                <p className="text-white/70 text-sm">
                  Copying, reproducing, or redistributing our destination content, flight data, or proprietary algorithms for commercial purposes
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">💸 Affiliate Manipulation</p>
                <p className="text-white/70 text-sm">
                  Manipulating affiliate links, cookie stuffing, or fraudulent referral activity (results in immediate account termination and legal action)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">📧 Spam & Abuse</p>
                <p className="text-white/70 text-sm">
                  Sending unsolicited communications, phishing attempts, or abusive content to other users or Spontra staff
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property Rights</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Spontra-Owned Content</h3>
                <p className="text-white/70 text-sm mb-2">
                  All content on Spontra, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>Text, graphics, logos, icons, images, videos, and audio clips</li>
                  <li>Software, source code, algorithms, and user interface design</li>
                  <li>Trademarks, service marks, and trade names ("Spontra", logo, taglines)</li>
                  <li>Database compilations and data structures</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  ...is owned by Spontra or its licensors and protected by United States and international copyright, trademark,
                  patent, trade secret, and other intellectual property laws.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Limited License</h3>
                <p className="text-white/70 text-sm">
                  We grant you a limited, non-exclusive, non-transferable, revocable license to access and use Spontra for personal,
                  non-commercial purposes. This license does NOT permit you to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm mt-2">
                  <li>Modify, copy, distribute, or create derivative works</li>
                  <li>Reverse engineer, decompile, or disassemble our software</li>
                  <li>Remove copyright notices, trademarks, or proprietary markings</li>
                  <li>Use our content for commercial purposes without written permission</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Third-Party Content</h3>
                <p className="text-white/70 text-sm">
                  Spontra displays content from third parties (YouTube videos, flight data from Amadeus API, destination images from Unsplash).
                  This content is owned by respective copyright holders and subject to their licensing terms. We do NOT claim ownership of third-party content.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">DMCA Takedown Requests</h3>
                <p className="text-white/70 text-sm">
                  If you believe content on Spontra infringes your copyright, please submit a DMCA notice to{' '}
                  <a href="mailto:legal@spontra.com" className="text-brand-blue hover:underline">legal@spontra.com</a> with:
                  (1) Description of copyrighted work, (2) URL of infringing content, (3) Your contact information,
                  (4) Statement of good faith belief, (5) Electronic signature.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimers of Warranties</h2>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-200 text-sm uppercase font-semibold mb-2">
                IMPORTANT LEGAL NOTICE - READ CAREFULLY
              </p>
              <p className="text-red-200 text-sm">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
                AND NON-INFRINGEMENT.
              </p>
            </div>

            <p className="mb-4">
              Spontra makes NO warranties or representations that:
            </p>

            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Flight prices displayed are accurate or current (see Section 5)</li>
              <li>Search results are complete or comprehensive</li>
              <li>Destination information is accurate, up-to-date, or suitable for your travel needs</li>
              <li>Third-party partner sites will honor bookings or provide satisfactory service</li>
              <li>Your data will be free from loss, corruption, or unauthorized access</li>
            </ul>

            <p className="mt-4 text-white/60 text-sm">
              Some jurisdictions do not allow exclusion of implied warranties, so the above exclusions may not apply to you.
              You may have additional rights under local law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-200 text-sm uppercase font-semibold mb-2">
                LIMITATION OF DAMAGES
              </p>
              <p className="text-red-200 text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SPONTRA, ITS AFFILIATES, DIRECTORS, EMPLOYEES,
                OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
            </div>

            <ul className="list-disc list-inside space-y-2 pl-4 mb-4">
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Travel delays, cancellations, or disruptions</li>
              <li>Incorrect flight prices or booking failures</li>
              <li>Service interruptions or technical errors</li>
              <li>Unauthorized access to your account or data breaches</li>
              <li>Reliance on inaccurate destination information</li>
              <li>Third-party partner site failures or disputes</li>
            </ul>

            <p className="mb-4">
              <strong className="text-white">Maximum Liability Cap:</strong> If Spontra is found liable for any damages,
              our total liability shall not exceed the <strong>greater of (a) $100 USD or (b) amounts paid by you to Spontra
              in the 12 months preceding the claim</strong>. Since Spontra is a free service, this typically means $100 USD maximum.
            </p>

            <p className="text-white/60 text-sm">
              Some jurisdictions do not allow limitation of liability for incidental or consequential damages, so the above
              limitations may not apply to you.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="mb-4">
              You agree to <strong>indemnify, defend, and hold harmless</strong> Spontra, its affiliates, directors, employees,
              agents, and partners from any claims, liabilities, damages, losses, or expenses (including reasonable attorney fees)
              arising from:
            </p>

            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Your violation of these Terms of Service</li>
              <li>Your violation of any third-party rights (copyright, privacy, etc.)</li>
              <li>Your misuse of the Service or unauthorized access</li>
              <li>Your bookings or interactions with third-party partner sites</li>
              <li>False, inaccurate, or misleading information you provide</li>
              <li>Your negligent or willful misconduct</li>
            </ul>

            <p className="mt-4 text-white/60 text-sm">
              This indemnification obligation survives termination of your account and these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Dispute Resolution & Arbitration</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Informal Resolution First</h3>
                <p className="text-white/70 text-sm">
                  If you have a dispute with Spontra, please contact us first at{' '}
                  <a href="mailto:legal@spontra.com" className="text-brand-blue hover:underline">legal@spontra.com</a> to
                  attempt informal resolution. We're committed to resolving issues fairly and quickly.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Binding Arbitration (US Users)</h3>
                <p className="text-white/70 text-sm mb-2">
                  If informal resolution fails, <strong>you agree that any dispute arising from these Terms or your use of Spontra
                  shall be resolved through binding arbitration</strong> under the rules of the American Arbitration Association (AAA),
                  rather than in court, except:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li>You may bring claims in small claims court if they qualify</li>
                  <li>Either party may seek injunctive relief in court for intellectual property violations</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">
                  <strong>Class Action Waiver:</strong> You agree to arbitrate disputes on an individual basis only—NOT as a class action,
                  consolidated action, or representative action. You waive the right to participate in class action lawsuits.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">EU Users - Right to Judicial Remedy</h3>
                <p className="text-white/70 text-sm">
                  If you are a consumer in the European Union, you retain the right to bring disputes before the courts of your
                  member state, in accordance with EU consumer protection laws. The arbitration clause above does NOT apply to EU residents.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law & Jurisdiction</h2>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm">
                These Terms are governed by the laws of <strong>[Your State/Country]</strong>, without regard to conflict of law principles.
                For non-arbitrable disputes (see Section 11), you agree to submit to the exclusive jurisdiction of courts located in
                <strong>[Your City/County, State]</strong>.
              </p>
            </div>

            <p className="mt-4 text-white/60 text-sm">
              <strong>International Users:</strong> If you access Spontra from outside <strong>[Your Country]</strong>, you are responsible
              for compliance with local laws. We make no representation that the Service is appropriate or available for use in other jurisdictions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time to reflect changes in our Service, legal requirements, or business practices.
              Material changes will be communicated via:
            </p>

            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Prominent notice on our website (banner notification for 30 days)</li>
              <li>Email notification to registered users (for significant changes)</li>
              <li>Updated "Last Updated" date at the top of this page</li>
            </ul>

            <p className="mt-4">
              <strong>Your Continued Use:</strong> By continuing to use Spontra after changes take effect, you accept the updated Terms.
              If you disagree with changes, you must stop using the Service and may delete your account.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Severability & Entire Agreement</h2>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Severability</p>
                <p className="text-white/70 text-sm">
                  If any provision of these Terms is found to be invalid or unenforceable by a court, the remaining provisions
                  will remain in full force and effect. The invalid provision will be modified to the minimum extent necessary
                  to make it valid and enforceable.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Entire Agreement</p>
                <p className="text-white/70 text-sm">
                  These Terms, together with our <a href="/privacy" className="text-brand-blue hover:underline">Privacy Policy</a>,{' '}
                  <a href="/cookies" className="text-brand-blue hover:underline">Cookie Policy</a>, and{' '}
                  <a href="/affiliate-disclosure" className="text-brand-blue hover:underline">Affiliate Disclosure</a>,
                  constitute the entire agreement between you and Spontra regarding use of the Service, superseding any prior agreements.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Waiver</p>
                <p className="text-white/70 text-sm">
                  Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right
                  to enforce it in the future.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact & Legal Notices</h2>
            <p className="mb-4">
              If you have questions, concerns, or legal inquiries regarding these Terms, please contact us:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Spontra Legal Team</p>
                <p className="text-white/70 text-sm">
                  <strong>Email:</strong> <a href="mailto:legal@spontra.com" className="text-brand-blue hover:underline">legal@spontra.com</a><br />
                  <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a><br />
                  <strong>Security Issues:</strong> <a href="mailto:security@spontra.com" className="text-brand-blue hover:underline">security@spontra.com</a><br />
                  <strong>Response Time:</strong> Within 48 hours for general inquiries, 5-7 business days for legal matters
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Legal Notices</p>
                <p className="text-white/70 text-sm">
                  For DMCA takedown notices, legal demands, subpoenas, or court orders, send to <a href="mailto:legal@spontra.com" className="text-brand-blue hover:underline">legal@spontra.com</a> with
                  subject line "LEGAL NOTICE - [Type]" and include all required documentation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>💡 Thank You for Using Spontra</strong><br />
              We're committed to providing a transparent, fair, and user-friendly travel discovery experience. If you have feedback
              about these Terms or our Service, we'd love to hear from you at{' '}
              <a href="mailto:hello@spontra.com" className="text-brand-blue hover:underline">hello@spontra.com</a>.
            </p>
          </div>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
