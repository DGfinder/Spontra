'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  MapPin, 
  Globe, 
  Phone, 
  Clock, 
  DollarSign,
  Tag,
  Camera,
  Zap,
  Mountain,
  Compass,
  Coffee,
  TreePine,
  AlertTriangle
} from 'lucide-react'
import { 
  PointOfInterest,
  CreatePOIRequest,
  ThemeType,
  POIStatus,
  POIPriceLevel,
  DEFAULT_POI_CATEGORIES
} from '@/types/pois'

interface POIFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePOIRequest | Partial<PointOfInterest>) => void
  poi?: PointOfInterest // For editing
  destinationId: string
  isEditing?: boolean
}

const themeConfig = {
  vibe: { icon: Zap, color: 'purple', label: 'City Vibe' },
  adventure: { icon: Mountain, color: 'orange', label: 'Adventure' },
  discover: { icon: Compass, color: 'blue', label: 'Discovery' },
  indulge: { icon: Coffee, color: 'amber', label: 'Indulgence' },
  nature: { icon: TreePine, color: 'green', label: 'Nature' }
}

const priceLabels: Record<POIPriceLevel, string> = {
  'free': 'Free',
  'budget': 'Budget (€)',
  'moderate': 'Moderate (€€)',
  'expensive': 'Expensive (€€€)',
  'luxury': 'Luxury (€€€€)'
}

export default function POIFormModal({
  isOpen,
  onClose,
  onSubmit,
  poi,
  destinationId,
  isEditing = false
}: POIFormModalProps) {
  const [formData, setFormData] = useState<CreatePOIRequest>({
    name: '',
    description: '',
    shortDescription: '',
    coordinates: { lat: 0, lng: 0 },
    theme: 'discover',
    categoryId: 'cultural_experiences',
    tags: [],
    priceLevel: 'moderate',
    isIndoor: false,
    isOutdoor: true,
    status: 'draft'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with POI data if editing
  useEffect(() => {
    if (poi) {
      setFormData({
        name: poi.name,
        description: poi.description,
        shortDescription: poi.shortDescription || '',
        coordinates: poi.coordinates,
        theme: poi.theme,
        categoryId: poi.categoryId,
        tags: poi.tags,
        priceLevel: poi.priceLevel,
        isIndoor: poi.isIndoor,
        isOutdoor: poi.isOutdoor,
        status: poi.status
      })
    } else {
      // Reset form for new POI
      setFormData({
        name: '',
        description: '',
        shortDescription: '',
        coordinates: { lat: 0, lng: 0 },
        theme: 'discover',
        categoryId: 'cultural_experiences',
        tags: [],
        priceLevel: 'moderate',
        isIndoor: false,
        isOutdoor: true,
        status: 'draft'
      })
    }
    setErrors({})
  }, [poi, isOpen])

  // Get categories for selected theme
  const availableCategories = DEFAULT_POI_CATEGORIES[formData.theme] || []

  // Ensure selected category is valid for current theme
  useEffect(() => {
    const validCategory = availableCategories.find(cat => cat.id === formData.categoryId)
    if (!validCategory && availableCategories.length > 0) {
      setFormData(prev => ({
        ...prev,
        categoryId: availableCategories[0].id
      }))
    }
  }, [formData.theme, availableCategories])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'POI name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (!formData.coordinates.lat || !formData.coordinates.lng) {
      newErrors.coordinates = 'Valid coordinates are required'
    }

    if (Math.abs(formData.coordinates.lat) > 90) {
      newErrors.coordinates = 'Latitude must be between -90 and 90'
    }

    if (Math.abs(formData.coordinates.lng) > 180) {
      newErrors.coordinates = 'Longitude must be between -180 and 180'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to submit POI:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: numValue
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {poi ? 'Edit POI' : 'Create New POI'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POI Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter POI name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief one-line description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the POI"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lat}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.coordinates ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="41.4036"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lng}
                  onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.coordinates ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="2.1744"
                />
              </div>
            </div>
            {errors.coordinates && (
              <p className="text-sm text-red-600">{errors.coordinates}</p>
            )}
          </div>

          {/* Theme & Category */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Theme & Category</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(themeConfig) as ThemeType[]).map((theme) => {
                  const config = themeConfig[theme]
                  const isSelected = formData.theme === theme
                  
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, theme }))}
                      className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                        isSelected 
                          ? `border-${config.color}-500 bg-${config.color}-50 text-${config.color}-700`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <config.icon size={20} className="mb-1" />
                      <span className="text-xs font-medium capitalize">{theme}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Level
              </label>
              <select
                value={formData.priceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, priceLevel: e.target.value as POIPriceLevel }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(priceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isIndoor}
                  onChange={(e) => setFormData(prev => ({ ...prev, isIndoor: e.target.checked }))}
                  className="mr-2 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Indoor Activity</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isOutdoor}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOutdoor: e.target.checked }))}
                  className="mr-2 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Outdoor Activity</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as POIStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {poi ? 'Update POI' : 'Create POI'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}