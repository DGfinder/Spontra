'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { X, Settings, Cookie } from 'lucide-react'
import {
  getCookieConsent,
  saveCookieConsent,
  getDefaultConsent,
  getAcceptAllConsent,
  initializeAnalytics,
  initializeMarketing,
  type CookieConsent as CookieConsentType
} from '@/lib/cookies'

/**
 * GDPR-compliant Cookie Consent Banner
 *
 * Shows on first visit, allows users to:
 * - Accept all cookies
 * - Reject optional cookies
 * - Customize cookie preferences
 *
 * Stores consent in localStorage and initializes tracking accordingly
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsentType>(getDefaultConsent())

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = getCookieConsent()

    if (!existingConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Initialize tracking based on existing consent
      if (existingConsent.analytics) {
        initializeAnalytics()
      }
      if (existingConsent.marketing) {
        initializeMarketing()
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allConsent = getAcceptAllConsent()
    saveCookieConsent(allConsent)
    initializeAnalytics()
    initializeMarketing()
    setShowBanner(false)
  }

  const handleRejectOptional = () => {
    const minimalConsent = getDefaultConsent()
    saveCookieConsent(minimalConsent)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    saveCookieConsent(consent)

    if (consent.analytics) {
      initializeAnalytics()
    }
    if (consent.marketing) {
      initializeMarketing()
    }

    setShowBanner(false)
    setShowSettings(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[rgba(11,15,18,0.98)] to-[rgba(11,15,18,0.95)] backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Cookie className="w-6 h-6 text-brand-blue" />
                <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-white/70">
                We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
                You can customize your preferences below.
              </p>

              {/* Necessary Cookies (Always On) */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    Necessary Cookies
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Always Active</span>
                  </h3>
                </div>
                <p className="text-white/60 text-sm">
                  Required for the website to function properly. These cookies enable core functionality like security,
                  authentication, and accessibility features. Cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Analytics Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                  </label>
                </div>
                <p className="text-white/60 text-sm">
                  Help us understand how visitors interact with our website. We use Google Analytics to collect
                  anonymous data about page visits, user behavior, and performance metrics.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Marketing Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                  </label>
                </div>
                <p className="text-white/60 text-sm">
                  Used to track conversions from affiliate links and measure the effectiveness of our marketing campaigns.
                  Helps us provide you with relevant travel offers.
                </p>
              </div>

              {/* Preferences Cookies */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Preference Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.preferences}
                      onChange={(e) => setConsent({ ...consent, preferences: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                  </label>
                </div>
                <p className="text-white/60 text-sm">
                  Remember your preferences such as home airport, preferred themes, and display settings to
                  provide a personalized experience.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSavePreferences}
                variant="primary"
                className="flex-1"
              >
                Save Preferences
              </Button>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-[rgba(11,15,18,0.98)] to-[rgba(11,15,18,0.95)] backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Icon & Text */}
              <div className="flex items-start gap-4 flex-1">
                <Cookie className="w-8 h-8 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">We value your privacy</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                    By clicking "Accept All", you consent to our use of cookies.{' '}
                    <Link href="/cookies" className="text-brand-blue hover:underline">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </Button>
                <Button
                  onClick={handleRejectOptional}
                  variant="secondary"
                  size="sm"
                >
                  Reject Optional
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  variant="primary"
                  size="sm"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
