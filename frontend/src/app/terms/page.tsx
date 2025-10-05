import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Terms of Service | Spontra',
  description: 'Read the terms and conditions for using Spontra travel discovery platform.',
}

export default function TermsPage() {
  return (
    <LegalPageTemplate title="Terms of Service" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          Welcome to Spontra. By using our service, you agree to these Terms of Service.
        </p>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Spontra, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">2. Service Description</h2>
          <p>
            Spontra is a travel discovery platform that helps you find destinations based on flight time and travel preferences. We provide:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Flight search and comparison tools</li>
            <li>Destination recommendations</li>
            <li>Travel inspiration content</li>
            <li>Booking affiliate links to partner sites</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">3. User Responsibilities</h2>
          <p>
            You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Provide accurate information when creating an account</li>
            <li>Maintain the security of your account credentials</li>
            <li>Not use our service for illegal purposes</li>
            <li>Not attempt to circumvent security measures</li>
            <li>Respect intellectual property rights</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">4. Bookings and Third-Party Services</h2>
          <p>
            Spontra is a metasearch platform. When you book through our affiliate links:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Bookings are completed on partner sites (airlines, OTAs)</li>
            <li>Partner sites' terms and conditions apply</li>
            <li>Spontra is not responsible for booking fulfillment</li>
            <li>Price accuracy is not guaranteed</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">5. Intellectual Property</h2>
          <p>
            All content on Spontra, including text, graphics, logos, and software, is owned by Spontra or its licensors and protected by copyright and trademark laws.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">6. Limitation of Liability</h2>
          <p>
            Spontra provides information "as is" without warranties. We are not liable for:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Inaccurate flight prices or availability</li>
            <li>Booking issues with third-party partners</li>
            <li>Travel disruptions or cancellations</li>
            <li>Loss of data or service interruptions</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of Spontra constitutes acceptance of updated terms.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">Contact</h2>
          <p>
            Questions about these Terms? Contact us at:{' '}
            <a href="mailto:legal@spontra.com" className="text-brand-gold hover:underline">
              legal@spontra.com
            </a>
          </p>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
