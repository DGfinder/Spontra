/**
 * User Profile Page
 *
 * Account settings including:
 * - User information display
 * - Password change
 * - Data export (GDPR)
 * - Account deletion (GDPR)
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Download, Trash2, Lock, Mail } from 'lucide-react'
import { toast } from 'react-toastify'

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setIsChangingPassword(false)
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `spontra-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Data exported successfully')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Account deleted successfully')
        await logout()
      } else {
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/60">Email</label>
            <p className="text-white font-medium">{user.email}</p>
          </div>
          <div>
            <label className="text-sm text-white/60">Account Status</label>
            <p className="text-white">
              {user.isEmailVerified ? (
                <span className="text-green-400">✓ Verified</span>
              ) : (
                <span className="text-yellow-400">⚠ Not Verified</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm text-white/60">Member Since</label>
            <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Password Change */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>

        {!isChangingPassword ? (
          <Button onClick={() => setIsChangingPassword(true)} variant="secondary">
            Change Password
          </Button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                required
              />
              <p className="text-xs text-white/50 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Update Password</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Data Export (GDPR) */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </h2>
        <p className="text-white/70 mb-4">
          Download a copy of your personal data including account information, saved searches, and
          favorite destinations.
        </p>
        <Button onClick={handleExportData} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Download Data Export
        </Button>
      </section>

      {/* Account Deletion (GDPR) */}
      <section className="glass-card p-6 border-red-500/20">
        <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h2>
        <p className="text-white/70 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button onClick={() => setShowDeleteConfirm(true)} variant="danger">
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-medium mb-2">⚠️ Are you absolutely sure?</p>
              <p className="text-white/80 text-sm">
                This will permanently delete your account, saved searches, favorite destinations, and
                all personal data. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDeleteAccount} variant="danger">
                Yes, Delete My Account
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
