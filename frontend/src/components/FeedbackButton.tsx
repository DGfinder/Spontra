'use client'

import { useState, Fragment } from 'react'
import { MessageSquare, X, Send, Loader2, CheckCircle } from 'lucide-react'

type FeedbackType = 'bug' | 'feature' | 'general' | 'complaint'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')
  
  const [form, setForm] = useState({
    type: 'general' as FeedbackType,
    subject: '',
    message: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          url: window.location.href,
        }),
      })
      
      const data = await res.json()
      if (data.ok) {
        setTicketId(data.ticketId)
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug Report' },
    { value: 'feature', label: '💡 Feature Request' },
    { value: 'general', label: '💬 General Feedback' },
    { value: 'complaint', label: '😤 Complaint' },
  ]

  const resetForm = () => {
    setForm({ type: 'general', subject: '', message: '', email: '' })
    setSubmitted(false)
    setTicketId('')
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                {submitted ? 'Feedback Submitted!' : 'Send Feedback'}
              </h2>
              <button
                onClick={() => { setIsOpen(false); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Thank you!</h3>
                  <p className="text-slate-600 mb-4">
                    Your feedback has been submitted. We read every message.
                  </p>
                  <p className="text-sm text-slate-500">
                    Reference: <span className="font-mono">{ticketId}</span>
                  </p>
                  <button
                    onClick={() => { setIsOpen(false); resetForm(); }}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Feedback Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {feedbackTypes.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, type: value as FeedbackType }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            form.type === value
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="Brief description"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={4}
                      placeholder="Tell us more..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email <span className="text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Include if you'd like a response
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
