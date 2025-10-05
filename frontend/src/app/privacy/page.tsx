import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Privacy Policy | Spontra',
  description: 'Learn how Spontra collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPageTemplate title="Privacy Policy" lastUpdated="October 2025">
      <section className="text-white/80 space-y-6">
        <p className="text-lg">
          At Spontra, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
        </p>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white mt-8">Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Account information (email address, password)</li>
            <li>Search and booking preferences</li>
            <li>Travel history and saved destinations</li>
            <li>Device and browser information</li>
            <li>Usage data and analytics</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your travel recommendations</li>
            <li>Send you booking confirmations and updates</li>
            <li>Communicate with you about our services</li>
            <li>Analyze usage patterns and optimize performance</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share your data with:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Travel partners (airlines, hotels) to complete bookings</li>
            <li>Analytics providers to improve our services</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:privacy@spontra.com" className="text-brand-gold hover:underline">
              privacy@spontra.com
            </a>
          </p>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
