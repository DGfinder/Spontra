import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | Spontra',
  description: 'Learn about Spontra\'s affiliate relationships and how we earn revenue through partner commissions.',
}

export default function AffiliateDisclosurePage() {
  return (
    <LegalPageTemplate title="Affiliate Disclosure" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <div className="p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
          <p className="text-lg text-white">
            <strong>💡 In Plain English:</strong> Spontra earns money when you click our flight comparison links and book travel.
            This doesn't cost you anything extra—prices are the same (often better!) than booking directly. We're required by law
            to tell you this. Read on for full details.
          </p>
        </div>

        <div className="space-y-6 mt-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">What Is Affiliate Marketing?</h2>
            <p className="mb-4">
              Affiliate marketing is a common business model where a website (like Spontra) earns a commission by referring
              customers to other companies' products or services. When you click on a flight comparison link and complete a
              booking, the partner site (e.g., Skyscanner, KAYAK) pays us a small percentage of the transaction value.
            </p>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white font-semibold mb-2">Why We Use This Model</p>
              <p className="text-white/70 text-sm">
                Affiliate commissions allow us to offer Spontra <strong>completely free to users</strong>. You never pay subscription
                fees, account charges, or hidden costs. Our revenue comes entirely from partner commissions when you book travel—which
                means we only succeed when we help you find great destinations.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">How Spontra Earns Affiliate Commissions</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">Step-by-Step Process</h3>
                <ol className="list-decimal list-inside space-y-2 pl-4 text-white/70 text-sm">
                  <li>
                    <strong className="text-white">You Search:</strong> You use Spontra to discover destinations based on flight time,
                    budget, and travel preferences
                  </li>
                  <li>
                    <strong className="text-white">We Display Options:</strong> We show you flight options from our partner APIs
                    (Skyscanner, KAYAK, Google Flights)
                  </li>
                  <li>
                    <strong className="text-white">You Click "Compare Prices":</strong> When you click a comparison link, you're redirected
                    to a partner site through an <strong>affiliate tracking link</strong>
                  </li>
                  <li>
                    <strong className="text-white">Partner Site Takes Over:</strong> The partner site handles your booking, payment, and
                    customer service—Spontra is NOT involved in the transaction
                  </li>
                  <li>
                    <strong className="text-white">Commission (If You Book):</strong> If you complete a booking within the tracking window
                    (typically 24-48 hours), the partner pays us a commission (usually 1-5% of booking value)
                  </li>
                </ol>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-2">What We Track</h3>
                <ul className="list-disc list-inside space-y-1 pl-4 text-white/70 text-sm">
                  <li><strong>Click Timestamps:</strong> When you clicked the affiliate link</li>
                  <li><strong>Destination Searched:</strong> Which destination you were interested in</li>
                  <li><strong>Anonymous Referral ID:</strong> A unique tracking code to attribute the commission</li>
                  <li><strong>Conversion Status:</strong> Whether a booking was completed (partner reports this to us)</li>
                </ul>
                <p className="text-white/70 text-sm mt-3">
                  <strong className="text-white">What We DON'T Track:</strong> Personal booking details, payment information, passport data,
                  traveler names, flight numbers, or any personally identifiable information beyond what you voluntarily provide to Spontra.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Does This Affect You?</h2>

            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 font-semibold mb-2">✅ No Extra Cost to You</p>
                <p className="text-green-200 text-sm">
                  <strong>You pay the EXACT same price</strong> (or better) than if you went directly to Skyscanner, KAYAK, or Google Flights.
                  We do NOT add markup, fees, or surcharges. Partner sites often offer exclusive deals through affiliate links, so you may
                  actually save money.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 font-semibold mb-2">✅ No Obligation to Book</p>
                <p className="text-green-200 text-sm">
                  You're free to browse partner sites, compare options, and decide NOT to book without any obligation. We only earn
                  commissions when you complete a booking—which aligns our incentives with helping you find the best travel options.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 font-semibold mb-2">✅ Supports Our Free Service</p>
                <p className="text-green-200 text-sm">
                  Every commission helps us improve Spontra—adding more destinations, enhancing search features, and keeping the service
                  free for everyone. Thank you for supporting us by using our affiliate links!
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Our Affiliate Partners</h2>
            <p className="mb-4">
              Spontra currently participates in the following affiliate programs:
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">Skyscanner Affiliate Network</p>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Service:</strong> Flight metasearch and comparison<br />
                  <strong>Commission Model:</strong> Cost-per-acquisition (CPA) - paid when bookings complete<br />
                  <strong>Typical Commission:</strong> 1-3% of booking value<br />
                  <strong>Privacy Policy:</strong>{' '}
                  <a href="https://www.skyscanner.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    https://www.skyscanner.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">KAYAK Affiliate Program</p>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Service:</strong> Flight and travel metasearch<br />
                  <strong>Commission Model:</strong> Cost-per-acquisition (CPA)<br />
                  <strong>Typical Commission:</strong> 2-5% of booking value<br />
                  <strong>Privacy Policy:</strong>{' '}
                  <a href="https://www.kayak.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    https://www.kayak.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">Google Flights</p>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-white/70 text-sm mb-2">
                  <strong>Service:</strong> Flight comparison and booking<br />
                  <strong>Commission Model:</strong> Referral tracking (commission varies by airline)<br />
                  <strong>Typical Commission:</strong> Variable<br />
                  <strong>Privacy Policy:</strong>{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    https://policies.google.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">Future Partners</p>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Planned</span>
                </div>
                <p className="text-white/70 text-sm">
                  We may add additional partners such as Booking.com, Expedia, Hotels.com, or travel insurance providers.
                  Any new affiliate relationships will be disclosed here and in our{' '}
                  <a href="/terms" className="text-brand-blue hover:underline">Terms of Service</a>.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to Transparency</h2>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🎯 Unbiased Recommendations</p>
                <p className="text-white/70 text-sm">
                  Search results are ranked by <strong>relevance, flight duration, and user preferences</strong>—NOT by commission rates.
                  We don't favor partners that pay higher commissions. All partners are treated equally in our search algorithm.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔍 Clear Labeling</p>
                <p className="text-white/70 text-sm">
                  Affiliate links are clearly labeled as "Compare Prices" or "Book Now" buttons. We never disguise affiliate links
                  as editorial content or pretend they're organic recommendations.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">📊 Honest Content</p>
                <p className="text-white/70 text-sm">
                  Destination descriptions, YouTube videos, and travel inspiration content are curated for quality and relevance—not
                  to push specific affiliate partners. We recommend destinations we genuinely believe you'll love.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">💰 Price Accuracy</p>
                <p className="text-white/70 text-sm">
                  While we display flight prices from partner APIs, we cannot guarantee real-time accuracy due to inventory changes.
                  <strong>Always verify the final price on the partner site before booking.</strong> See our{' '}
                  <a href="/terms" className="text-brand-blue hover:underline">Terms of Service</a> for full price accuracy disclaimers.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white font-semibold">🔒 Privacy Protection</p>
                <p className="text-white/70 text-sm">
                  We only track anonymous referral data (click timestamps, destination searched). We do NOT share your personal
                  information with affiliate partners beyond what's necessary for tracking. See our{' '}
                  <a href="/privacy" className="text-brand-blue hover:underline">Privacy Policy</a> for details.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">FTC Compliance Statement</h2>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm mb-3">
                <strong>⚖️ Legal Requirement (16 CFR Part 255):</strong> The Federal Trade Commission (FTC) requires websites
                to disclose material connections between endorsers and advertisers. This includes affiliate relationships where
                we may earn commissions from product or service recommendations.
              </p>

              <p className="text-yellow-200 text-sm mb-3">
                Spontra complies with FTC guidelines by:
              </p>

              <ul className="list-disc list-inside space-y-1 pl-4 text-yellow-200 text-sm">
                <li>Clearly disclosing affiliate relationships on this page</li>
                <li>Including affiliate disclosure language in our <a href="/terms" className="text-yellow-200 underline">Terms of Service</a></li>
                <li>Labeling affiliate links appropriately ("Compare Prices", "Book Now")</li>
                <li>Ensuring recommendations are honest and unbiased regardless of commission structure</li>
                <li>Not making false or misleading claims about prices, availability, or partner services</li>
              </ul>

              <p className="text-yellow-200 text-sm mt-3">
                <strong>Reference:</strong> FTC Endorsement Guides -{' '}
                <a href="https://www.ftc.gov/legal-library/browse/rules/guides-concerning-use-endorsements-testimonials-advertising"
                   target="_blank" rel="noopener noreferrer" className="text-yellow-200 underline">
                  16 CFR Part 255
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: Do I have to use your affiliate links?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> No. You're free to search for flights on your own or go directly to airline websites. However,
                  using our links helps support Spontra's free service and doesn't cost you anything extra.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: Will prices be higher if I use your affiliate links?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> No. Partner sites pay commissions from their marketing budget—NOT by charging you more. You pay
                  the same price (often less due to exclusive deals) whether you use our links or go directly.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: Do you recommend destinations because they pay more commission?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> No. Destination recommendations are based on your search criteria (flight time, travel themes, budget).
                  We don't alter search results based on commission rates—that would violate our commitment to unbiased recommendations.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: What if I have an issue with my booking?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> Contact the partner site directly (Skyscanner, KAYAK, airline). Spontra is a referral platform—we
                  don't handle bookings, payments, refunds, or customer service for travel purchases. See our{' '}
                  <a href="/terms" className="text-brand-blue hover:underline">Terms of Service</a> for details.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: How can I opt-out of affiliate tracking?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> You can disable marketing cookies via our{' '}
                  <a href="/cookies" className="text-brand-blue hover:underline">Cookie Settings</a> (footer link). This prevents
                  affiliate click tracking but may limit functionality. You can also use private/incognito browsing mode.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-semibold mb-2">Q: Will you add more affiliate partners?</p>
                <p className="text-white/70 text-sm">
                  <strong>A:</strong> Possibly. We may partner with hotel booking sites (Booking.com, Expedia), car rentals, travel
                  insurance, or tour operators. Any new partnerships will be disclosed here and in our Terms of Service.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Disclosure</h2>
            <p className="mb-4">
              We may update this Affiliate Disclosure from time to time to reflect new partnerships, changes in FTC regulations,
              or updates to our business model. Material changes will be communicated via:
            </p>

            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Updated "Last Updated" date at the top of this page</li>
              <li>Notice in our <a href="/terms" className="text-brand-blue hover:underline">Terms of Service</a></li>
              <li>Email notification to registered users (for significant changes)</li>
            </ul>

            <p className="mt-4">
              We recommend reviewing this page periodically to stay informed about our affiliate relationships.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions about our affiliate relationships, commission structure, or this disclosure, please contact us:
            </p>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white font-semibold mb-2">Spontra Affiliate Program Team</p>
              <p className="text-white/70 text-sm">
                <strong>Email:</strong> <a href="mailto:affiliates@spontra.com" className="text-brand-blue hover:underline">affiliates@spontra.com</a><br />
                <strong>General Inquiries:</strong> <a href="mailto:hello@spontra.com" className="text-brand-blue hover:underline">hello@spontra.com</a><br />
                <strong>Legal Questions:</strong> <a href="mailto:legal@spontra.com" className="text-brand-blue hover:underline">legal@spontra.com</a><br />
                <strong>Response Time:</strong> Within 48 hours
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>💡 Thank You for Your Trust</strong><br />
              We're committed to complete transparency about how we earn revenue. Your support through affiliate links helps us
              keep Spontra free for everyone while maintaining our commitment to unbiased, high-quality travel recommendations.
              If you have feedback or concerns, we're always here to listen at{' '}
              <a href="mailto:hello@spontra.com" className="text-brand-blue hover:underline">hello@spontra.com</a>.
            </p>
          </div>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
