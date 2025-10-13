import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Privacy Policy | Spontra',
  description: 'Learn how Spontra collects, uses, and protects your personal information.',
}

// ISR: Revalidate every 24 hours (legal content changes infrequently)
export const revalidate = 86400

export default function PrivacyPage() {
  return (
    <LegalPageTemplate title="Privacy Policy" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          At Spontra ("we", "us", or "our"), your privacy is a fundamental right. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your personal information in compliance with the General
          Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.
        </p>

        <div className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
          <p className="text-sm text-white/80">
            <strong>💡 Quick Summary:</strong> We collect minimal data necessary to provide travel discovery services.
            You have full control over your data (access, export, delete). We don't sell your personal information.
            Cookies require your consent. You can contact us anytime about your privacy.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Data Controller Information</h2>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white font-semibold mb-2">Spontra</p>
              <p className="text-white/70 text-sm">
                Email: <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a><br />
                Data Protection Officer: <a href="mailto:dpo@spontra.com" className="text-brand-blue hover:underline">dpo@spontra.com</a><br />
                Response Time: Within 48 hours for general inquiries, 30 days for GDPR/CCPA requests
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <div className="space-y-4 mt-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Account Information (When You Register)</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Email Address</strong> - For authentication and communication</li>
                  <li><strong>Password</strong> - Stored as bcrypt hash (not reversible)</li>
                  <li><strong>Account Creation Date</strong> - For audit and compliance</li>
                  <li><strong>Email Verification Status</strong> - To ensure valid contact information</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">
                  <strong>Legal Basis (GDPR):</strong> Contractual necessity (Article 6(1)(b)) - Required to provide services
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Travel Preferences & Search Data</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Departure Airport</strong> - Your selected home airport (e.g., "LAX")</li>
                  <li><strong>Travel Themes</strong> - Selected interests (adventure, beach, culture, food, nightlife, shopping)</li>
                  <li><strong>Flight Time Preferences</strong> - Min/max flight duration ranges</li>
                  <li><strong>Search History</strong> - Previous searches (if you have an account and save searches)</li>
                  <li><strong>Favorite Destinations</strong> - Bookmarked cities and locations</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">
                  <strong>Legal Basis (GDPR):</strong> Legitimate interest (Article 6(1)(f)) - To provide personalized recommendations
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Usage & Analytics Data (With Consent)</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Page Views</strong> - Pages visited, time spent on site</li>
                  <li><strong>Device Information</strong> - Browser type, operating system, screen resolution</li>
                  <li><strong>Geographic Location</strong> - City-level location (via IP address, not GPS)</li>
                  <li><strong>Referral Source</strong> - How you found Spontra (Google search, social media, direct)</li>
                  <li><strong>Click Events</strong> - Interactions with search results, destination cards, affiliate links</li>
                  <li><strong>Performance Metrics</strong> - Page load times, Core Web Vitals (via Vercel Analytics)</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">
                  <strong>Legal Basis (GDPR):</strong> Consent (Article 6(1)(a)) - You can opt-out via cookie settings<br />
                  <strong>Services Used:</strong> Google Analytics 4 (anonymized IP), Vercel Analytics
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Affiliate Click Data (With Consent)</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Click Timestamps</strong> - When you clicked a flight comparison link</li>
                  <li><strong>Destination Searched</strong> - Which destination you were interested in</li>
                  <li><strong>Referral Parameters</strong> - Anonymous tracking IDs for affiliate commission attribution</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">
                  <strong>Legal Basis (GDPR):</strong> Consent (Article 6(1)(a)) - Required for affiliate tracking<br />
                  <strong>What We DON'T Receive:</strong> Booking details, payment information, personal traveler data
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Technical & Security Data (Always Collected)</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Authentication Tokens</strong> - JWT cookies for session management (7-day expiry)</li>
                  <li><strong>IP Address</strong> - For security, fraud prevention, and rate limiting</li>
                  <li><strong>Request Logs</strong> - API requests to prevent abuse (retained 30 days)</li>
                  <li><strong>Error Logs</strong> - Debugging information when technical issues occur</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">
                  <strong>Legal Basis (GDPR):</strong> Legitimate interest (Article 6(1)(f)) - Security and fraud prevention
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🎯 Provide & Improve Services</p>
                <p className="text-white/70 text-sm">
                  Process searches, display relevant destinations, save preferences, send email notifications
                  (welcome emails, password resets, account security alerts)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">📊 Analytics & Optimization</p>
                <p className="text-white/70 text-sm">
                  Understand user behavior, improve search algorithms, optimize page performance, identify popular destinations
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">💰 Affiliate Commission Tracking</p>
                <p className="text-white/70 text-sm">
                  Track clicks to flight comparison partners (Skyscanner, KAYAK, Google Flights) to receive referral commissions
                  that fund our free service
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔒 Security & Fraud Prevention</p>
                <p className="text-white/70 text-sm">
                  Detect suspicious activity, prevent bot attacks, rate limit API requests, secure user accounts
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">⚖️ Legal Compliance</p>
                <p className="text-white/70 text-sm">
                  Respond to legal requests, enforce Terms of Service, comply with GDPR/CCPA obligations
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Retention</h2>
            <p className="mb-4">
              We retain your data only as long as necessary for the purposes outlined in this policy:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Account Data</p>
                <p className="text-white/70 text-sm">
                  Retained until you delete your account, then permanently deleted within 30 days (except where required by law)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Search History & Preferences</p>
                <p className="text-white/70 text-sm">
                  Retained for 2 years of inactivity, then automatically deleted
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Analytics Data</p>
                <p className="text-white/70 text-sm">
                  Google Analytics: 26 months (configurable), Vercel Analytics: 90 days, aggregated only
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Security Logs</p>
                <p className="text-white/70 text-sm">
                  IP addresses and request logs: 30 days, Error logs: 90 days
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Email Verification & Password Reset Tokens</p>
                <p className="text-white/70 text-sm">
                  Email verification: 24 hours, Password reset: 1 hour, then automatically deleted
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Data Sharing</h2>
            <p className="mb-4">
              <strong className="text-white">We do NOT sell your personal information.</strong> We share limited data with
              trusted partners only when necessary to provide our services:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Flight Comparison Partners (Affiliate Links)</p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Partners:</strong> Skyscanner, KAYAK, Google Flights<br />
                  <strong>Data Shared:</strong> Anonymous referral ID, destination searched, click timestamp (NO personal information)<br />
                  <strong>Purpose:</strong> Affiliate commission tracking to fund our free service<br />
                  <strong>Privacy Policies:</strong>{' '}
                  <a href="https://www.skyscanner.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Skyscanner</a>,{' '}
                  <a href="https://www.kayak.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">KAYAK</a>,{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Google</a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Analytics Providers</p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Google Analytics 4:</strong> Anonymized usage data (IP anonymization enabled)<br />
                  <strong>Vercel Analytics:</strong> Aggregated performance metrics (no PII collected)<br />
                  <strong>Purpose:</strong> Understand user behavior, improve service quality<br />
                  <strong>Your Control:</strong> Opt-out via cookie settings or{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Google Analytics Opt-out</a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Email Service Provider</p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Resend:</strong> Transactional email delivery (welcome, verification, password reset)<br />
                  <strong>Data Shared:</strong> Email address, email content (no marketing emails without consent)<br />
                  <strong>Privacy Policy:</strong>{' '}
                  <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Resend Privacy</a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Hosting & Infrastructure</p>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Vercel:</strong> Application hosting, serverless functions<br />
                  <strong>Neon:</strong> Database hosting (PostgreSQL)<br />
                  <strong>Data Location:</strong> Primarily US and EU regions<br />
                  <strong>Security:</strong> SOC 2 Type II certified, GDPR-compliant data processing agreements
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">Legal Obligations</p>
                <p className="text-white/70 text-sm mb-2">
                  We may disclose information to law enforcement, government agencies, or legal parties when required by law,
                  subpoena, court order, or to protect our rights and safety.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights (GDPR & CCPA)</h2>

            <div className="space-y-4 mt-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">🔍 Right to Access (GDPR Art. 15, CCPA)</h3>
                <p className="text-white/70 text-sm">
                  Request a copy of all personal data we hold about you in a machine-readable format (JSON/CSV).<br />
                  <strong>How to Exercise:</strong> Email <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a> with "Data Access Request"
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">✏️ Right to Rectification (GDPR Art. 16)</h3>
                <p className="text-white/70 text-sm">
                  Correct inaccurate or incomplete personal data.<br />
                  <strong>How to Exercise:</strong> Update in account settings or email us with corrections
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">🗑️ Right to Erasure / "Right to be Forgotten" (GDPR Art. 17, CCPA)</h3>
                <p className="text-white/70 text-sm">
                  Delete your account and all associated personal data (subject to legal retention requirements).<br />
                  <strong>How to Exercise:</strong> Account Settings → "Delete Account" or email <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a><br />
                  <strong>Timeframe:</strong> Permanent deletion within 30 days
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">📦 Right to Data Portability (GDPR Art. 20)</h3>
                <p className="text-white/70 text-sm">
                  Export your data in a structured, commonly-used format (JSON) to transfer to another service.<br />
                  <strong>How to Exercise:</strong> Account Settings → "Export Data" or email us
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">🚫 Right to Object (GDPR Art. 21)</h3>
                <p className="text-white/70 text-sm">
                  Object to processing based on legitimate interests (e.g., analytics, marketing).<br />
                  <strong>How to Exercise:</strong> Cookie Settings → Disable analytics/marketing cookies
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">⏸️ Right to Restriction (GDPR Art. 18)</h3>
                <p className="text-white/70 text-sm">
                  Restrict processing of your data while we investigate a dispute or verify accuracy.<br />
                  <strong>How to Exercise:</strong> Email <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a> with details
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">🏴 California Residents (CCPA)</h3>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Categories of Personal Information Collected:</strong> Identifiers (email), internet activity (searches, clicks),
                  geolocation (city-level), inferences (travel preferences)<br />
                  <strong>Business Purpose:</strong> Provide travel discovery services, affiliate monetization<br />
                  <strong>Third Parties:</strong> Analytics providers, affiliate partners (see section 5)<br />
                  <strong>Sale of Personal Information:</strong> We do NOT sell personal information<br />
                  <strong>Non-Discrimination:</strong> We will not discriminate against you for exercising CCPA rights
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-200 text-sm">
                <strong>✅ Response Timeframe:</strong> We respond to all GDPR/CCPA requests within 30 days (may extend to 60 days
                for complex requests with notification). Requests are free of charge unless excessive or repetitive.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">7. International Data Transfers</h2>
            <p className="mb-4">
              Spontra is based in [Your Country] and uses service providers in the United States and European Union.
              If you access our services from outside these regions, your data may be transferred internationally.
            </p>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm">
                <strong>Safeguards for EU Users:</strong> We rely on Standard Contractual Clauses (SCCs) approved by the
                European Commission for transfers to countries without adequacy decisions. Our hosting providers (Vercel, Neon)
                have executed Data Processing Agreements (DPAs) with SCCs.<br /><br />
                <strong>Data Storage Locations:</strong> EU region users' data is stored in EU-based data centers where possible.
                US-based services process data under GDPR-compliant agreements.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
            <p>
              Spontra is not intended for children under 16 years of age. We do not knowingly collect personal information
              from children. If you believe we have inadvertently collected data from a child, please contact us immediately
              at <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a> and
              we will delete it within 72 hours.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your data:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔐 Encryption</p>
                <p className="text-white/70 text-sm">
                  TLS 1.3 for data in transit, AES-256 encryption for data at rest (database backups)
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔑 Password Security</p>
                <p className="text-white/70 text-sm">
                  Bcrypt hashing with 12 rounds, password strength requirements enforced, no plaintext storage
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🍪 Cookie Security</p>
                <p className="text-white/70 text-sm">
                  HTTP-only cookies (not accessible via JavaScript), Secure flag in production (HTTPS only), 7-day expiration
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🛡️ Infrastructure Security</p>
                <p className="text-white/70 text-sm">
                  SOC 2 Type II certified hosting, automated security updates, regular vulnerability scanning
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">👥 Access Controls</p>
                <p className="text-white/70 text-sm">
                  Role-based access control (RBAC), minimal employee access to production data, audit logging
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                <strong>⚠️ No Security is Perfect:</strong> While we use industry best practices, no system is 100% secure.
                You are responsible for keeping your password confidential and notifying us immediately of any unauthorized access.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Data Breach Notification</h2>
            <p>
              In the unlikely event of a data breach that affects your personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-4">
              <li><strong>Notify You Within 72 Hours</strong> (GDPR requirement) via email to your registered address</li>
              <li><strong>Provide Details</strong> of what data was affected, potential risks, and remediation steps</li>
              <li><strong>Notify Authorities</strong> (Data Protection Authorities in EU, state Attorney General in California)</li>
              <li><strong>Offer Support</strong> such as credit monitoring if financial data is involved</li>
              <li><strong>Post Public Notice</strong> on our website if the breach affects a large number of users</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Cookies & Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies to provide essential functionality and enhance your experience. For detailed information about
              the cookies we use, how to manage them, and your choices, please read our{' '}
              <a href="/cookies" className="text-brand-blue hover:underline">Cookie Policy</a>.
            </p>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm">
                <strong>Quick Summary:</strong> Necessary cookies (always active) for authentication and security. Analytics and
                marketing cookies require your consent (managed via Cookie Settings in footer). You can change preferences anytime.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements,
              or business operations. Material changes will be communicated via:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-4">
              <li>Prominent notice on our website (banner notification for 30 days)</li>
              <li>Email notification to registered users (for significant changes affecting your rights)</li>
              <li>Updated "Last Updated" date at the top of this page</li>
            </ul>
            <p className="mt-4">
              <strong>Your Continued Use:</strong> By continuing to use Spontra after changes take effect, you accept the updated Privacy Policy.
              If you disagree with changes, you may delete your account.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us & File a Complaint</h2>
            <p className="mb-4">
              If you have questions, concerns, or want to exercise your privacy rights, please contact us:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Spontra Privacy Team</p>
                <p className="text-white/70 text-sm">
                  <strong>Email:</strong> <a href="mailto:privacy@spontra.com" className="text-brand-blue hover:underline">privacy@spontra.com</a><br />
                  <strong>Data Protection Officer:</strong> <a href="mailto:dpo@spontra.com" className="text-brand-blue hover:underline">dpo@spontra.com</a><br />
                  <strong>Response Time:</strong> Within 48 hours for inquiries, 30 days for GDPR/CCPA requests
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">🇪🇺 EU Residents: Right to File a Complaint</p>
                <p className="text-white/70 text-sm">
                  If you are not satisfied with our response to your privacy concerns, you have the right to file a complaint
                  with your local Data Protection Authority (DPA). Find your DPA:{' '}
                  <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    European Data Protection Board
                  </a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">🏴 California Residents: CCPA Inquiries</p>
                <p className="text-white/70 text-sm">
                  California Attorney General's Office:{' '}
                  <a href="https://oag.ca.gov/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    https://oag.ca.gov/privacy
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>💡 Thank You for Trusting Spontra</strong><br />
              Your privacy is our priority. We're committed to transparency, security, and giving you full control over your data.
              If you have any questions or feedback about this Privacy Policy, we're here to help.
            </p>
          </div>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
