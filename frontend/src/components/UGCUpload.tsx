'use client'

import { useState, useRef } from 'react'
import { Upload, MapPin, Clock, Star, Award, X, CheckCircle } from 'lucide-react'

interface UGCUploadProps {
  isOpen: boolean
  onClose: () => void
  activityId?: string
  destinationCode?: string
  destinationName?: string
  onUploadComplete?: (contentId: string) => void
}

interface UploadFormData {
  title: string
  description: string
  activityId: string
  destinationCode: string
  file: File | null
  gpsLocation: {
    latitude: number
    longitude: number
    accuracy: number
  } | null
}

export function UGCUpload({ 
  isOpen, 
  onClose, 
  activityId = '',
  destinationCode = '',
  destinationName = '',
  onUploadComplete 
}: UGCUploadProps) {
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    activityId,
    destinationCode,
    file: null,
    gpsLocation: null
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rewardTiers = [
    { name: 'Explorer', uploads: 1, reward: '€10 Travel Credit' },
    { name: 'Contributor', uploads: 5, reward: '€50 + Priority Support' },
    { name: 'Ambassador', uploads: 20, reward: '€200 + Exclusive Trips' },
    { name: 'Creator', bookings: 100, reward: 'Revenue Sharing' }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file')
        return
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        alert('File size must be less than 100MB')
        return
      }

      setFormData(prev => ({ ...prev, file }))
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser')
      return
    }

    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          gpsLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        }))
      },
      (error) => {
        setGpsError(`Location error: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!formData.file) {
      alert('Please select a video file')
      return
    }

    if (!formData.gpsLocation) {
      alert('GPS location is required for verification')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      // In production, this would upload to cloud storage and submit to UGC service
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadComplete(true)
      
      // Mock successful upload
      setTimeout(() => {
        onUploadComplete?.('mock-content-id')
        setIsUploading(false)
        setUploadComplete(false)
        setFormData({
          title: '',
          description: '',
          activityId,
          destinationCode,
          file: null,
          gpsLocation: null
        })
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      alert('Upload failed. Please try again.')
    }
  }

  // Don't render modal if not open
  if (!isOpen) {
    return <></>
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Share Your Experience</h2>
              <p className="text-black/80 text-sm">Join the Spontra Creator Program</p>
            </div>
            <button 
              onClick={onClose}
              className="text-black/80 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {uploadComplete ? (
          /* Success State */
          <div className="p-6 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your video is being reviewed and will be live soon. You've earned 10 reward points!
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">+€1 Travel Credit Added</p>
              <p className="text-green-600 text-sm">Plus €5 for each booking your video generates</p>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Destination Info */}
            {destinationName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin size={16} />
                  <span className="font-medium">{destinationName}</span>
                </div>
              </div>
            )}

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400 transition-colors"
              >
                {formData.file ? (
                  <div>
                    <p className="text-green-600 font-medium">{formData.file.name}</p>
                    <p className="text-gray-500 text-sm">
                      {(formData.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Choose video file</p>
                    <p className="text-gray-400 text-xs">Max 100MB • 30-90 seconds recommended</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Amazing hiking experience in the Alps!"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Share details about your experience, tips for other travelers..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            {/* GPS Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Verification
              </label>
              {formData.gpsLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle size={16} />
                    <span className="font-medium">Location Verified</span>
                  </div>
                  <p className="text-green-600 text-xs mt-1">
                    Accuracy: {formData.gpsLocation.accuracy.toFixed(0)}m
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin size={16} />
                      <span>Verify Current Location</span>
                    </div>
                  </button>
                  {gpsError && (
                    <p className="text-red-600 text-xs mt-1">{gpsError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Creator Rewards Preview */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Award size={16} className="text-yellow-600 mr-2" />
                Creator Rewards
              </h4>
              <div className="space-y-2">
                {rewardTiers.map((tier) => (
                  <div key={tier.name} className="flex justify-between text-sm">
                    <span className="text-gray-700">{tier.name}</span>
                    <span className="text-yellow-700 font-medium">{tier.reward}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !formData.file || !formData.gpsLocation}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-3 px-4 rounded-lg hover:from-yellow-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isUploading ? 'Uploading...' : 'Share Your Experience'}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By uploading, you agree to our Content Guidelines and allow Spontra to feature your content.
              You retain ownership and can earn rewards from bookings.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}