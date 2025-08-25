'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  MapPin,
  Globe,
  Clock,
  Thermometer,
  CreditCard,
  Languages,
  Star,
  Mountain,
  Coffee,
  TreePine,
  Zap,
  Compass,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

interface NewDestination {
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  coordinates: {
    lat: number | null
    lng: number | null
  }
  description: string
  themeScores: {
    vibe: number
    adventure: number
    discover: number
    indulge: number
    nature: number
  }
  highlights: string[]
  activities: string[]
  bestTimeToVisit: string
  averageTemperature: string
  primaryLanguage: string
  currency: string
  timeZone: string
  images: File[]
}

interface ThemeConfig {
  name: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  color: string
  description: string
}

export default function AddDestinationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [newHighlight, setNewHighlight] = useState('')
  const [newActivity, setNewActivity] = useState('')

  const [destination, setDestination] = useState<NewDestination>({
    iataCode: '',
    cityName: '',
    countryName: '',
    countryCode: '',
    coordinates: {
      lat: null,
      lng: null
    },
    description: '',
    themeScores: {
      vibe: 5.0,
      adventure: 5.0,
      discover: 5.0,
      indulge: 5.0,
      nature: 5.0
    },
    highlights: [],
    activities: [],
    bestTimeToVisit: '',
    averageTemperature: '',
    primaryLanguage: '',
    currency: '',
    timeZone: '',
    images: []
  })

  const themeConfig: Record<string, ThemeConfig> = {
    vibe: {
      name: 'City Vibe',
      icon: Zap,
      color: 'text-purple-600',
      description: 'Nightlife, culture, and urban energy'
    },
    adventure: {
      name: 'Adventure',
      icon: Mountain,
      color: 'text-orange-600',
      description: 'Outdoor activities and thrilling experiences'
    },
    discover: {
      name: 'Discovery',
      icon: Compass,
      color: 'text-blue-600',
      description: 'Historical sites and cultural exploration'
    },
    indulge: {
      name: 'Indulgence',
      icon: Coffee,
      color: 'text-amber-600',
      description: 'Fine dining, shopping, and luxury experiences'
    },
    nature: {
      name: 'Nature',
      icon: TreePine,
      color: 'text-green-600',
      description: 'Natural beauty and outdoor settings'
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!destination.iataCode) newErrors.iataCode = 'IATA code is required'
      else if (destination.iataCode.length !== 3) newErrors.iataCode = 'IATA code must be 3 characters'
      
      if (!destination.cityName) newErrors.cityName = 'City name is required'
      if (!destination.countryName) newErrors.countryName = 'Country name is required'
      if (!destination.countryCode) newErrors.countryCode = 'Country code is required'
      
      if (!destination.coordinates.lat) newErrors.lat = 'Latitude is required'
      if (!destination.coordinates.lng) newErrors.lng = 'Longitude is required'
    }

    if (step === 2) {
      if (!destination.description) newErrors.description = 'Description is required'
      else if (destination.description.length < 50) newErrors.description = 'Description must be at least 50 characters'
    }

    if (step === 4) {
      if (destination.highlights.length === 0) newErrors.highlights = 'At least one highlight is required'
      if (destination.activities.length === 0) newErrors.activities = 'At least one activity is required'
    }

    if (step === 5) {
      if (!destination.bestTimeToVisit) newErrors.bestTimeToVisit = 'Best time to visit is required'
      if (!destination.primaryLanguage) newErrors.primaryLanguage = 'Primary language is required'
      if (!destination.currency) newErrors.currency = 'Currency is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, make API call to create destination
      console.log('Creating destination:', destination)
      
      // Redirect to destination detail page or manage page
      router.push('/admin/destinations/manage')
    } catch (error) {
      console.error('Failed to create destination:', error)
      setErrors({ submit: 'Failed to create destination. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setDestination({
        ...destination,
        highlights: [...destination.highlights, newHighlight.trim()]
      })
      setNewHighlight('')
    }
  }

  const removeHighlight = (index: number) => {
    setDestination({
      ...destination,
      highlights: destination.highlights.filter((_, i) => i !== index)
    })
  }

  const addActivity = () => {
    if (newActivity.trim()) {
      setDestination({
        ...destination,
        activities: [...destination.activities, newActivity.trim()]
      })
      setNewActivity('')
    }
  }

  const removeActivity = (index: number) => {
    setDestination({
      ...destination,
      activities: destination.activities.filter((_, i) => i !== index)
    })
  }

  const updateThemeScore = (theme: string, score: number) => {
    setDestination({
      ...destination,
      themeScores: {
        ...destination.themeScores,
        [theme]: Math.max(0, Math.min(10, score))
      }
    })
  }

  const handleImageUpload = (files: FileList) => {
    const newImages = Array.from(files)
    setDestination({
      ...destination,
      images: [...destination.images, ...newImages].slice(0, 10) // Limit to 10 images
    })
  }

  const removeImage = (index: number) => {
    setDestination({
      ...destination,
      images: destination.images.filter((_, i) => i !== index)
    })
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Basic Information'
      case 2: return 'Description'
      case 3: return 'Theme Scores'
      case 4: return 'Highlights & Activities'
      case 5: return 'Travel Information'
      case 6: return 'Images'
      default: return 'Add Destination'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/destinations/manage')}
            className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Destination</h1>
            <p className="text-gray-600">Step {currentStep} of 6: {getStepTitle(currentStep)}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle size={16} /> : step}
              </div>
              {step < 6 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IATA Code *
                  <span className="text-xs text-gray-500 ml-2">(3 characters)</span>
                </label>
                <input
                  type="text"
                  value={destination.iataCode}
                  onChange={(e) => setDestination({...destination, iataCode: e.target.value.toUpperCase()})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.iataCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={3}
                  placeholder="e.g. NYC"
                />
                {errors.iataCode && <p className="text-red-500 text-xs mt-1">{errors.iataCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City Name *</label>
                <input
                  type="text"
                  value={destination.cityName}
                  onChange={(e) => setDestination({...destination, cityName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.cityName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Barcelona"
                />
                {errors.cityName && <p className="text-red-500 text-xs mt-1">{errors.cityName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Name *</label>
                <input
                  type="text"
                  value={destination.countryName}
                  onChange={(e) => setDestination({...destination, countryName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.countryName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Spain"
                />
                {errors.countryName && <p className="text-red-500 text-xs mt-1">{errors.countryName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Code *</label>
                <input
                  type="text"
                  value={destination.countryCode}
                  onChange={(e) => setDestination({...destination, countryCode: e.target.value.toUpperCase()})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.countryCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={2}
                  placeholder="e.g. ES"
                />
                {errors.countryCode && <p className="text-red-500 text-xs mt-1">{errors.countryCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={destination.coordinates.lat || ''}
                  onChange={(e) => setDestination({
                    ...destination, 
                    coordinates: {...destination.coordinates, lat: parseFloat(e.target.value) || null}
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.lat ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 41.3874"
                />
                {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={destination.coordinates.lng || ''}
                  onChange={(e) => setDestination({
                    ...destination, 
                    coordinates: {...destination.coordinates, lng: parseFloat(e.target.value) || null}
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.lng ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 2.1686"
                />
                {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Description</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Description *
                <span className="text-xs text-gray-500 ml-2">(minimum 50 characters)</span>
              </label>
              <textarea
                value={destination.description}
                onChange={(e) => setDestination({...destination, description: e.target.value})}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe what makes this destination special. Include key attractions, culture, atmosphere, and what travelers can expect..."
              />
              <div className="flex items-center justify-between mt-2">
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                <p className="text-xs text-gray-500">{destination.description.length} characters</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Scores</h3>
              <p className="text-gray-600">Rate how well this destination matches each theme (0-10 scale)</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(themeConfig).map(([key, theme]) => {
                const score = destination.themeScores[key as keyof typeof destination.themeScores]
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${theme.color} bg-opacity-10`}>
                          <theme.icon size={20} className={theme.color} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                          <p className="text-sm text-gray-600">{theme.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</div>
                        <div className="text-sm text-gray-600">/ 10</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={score}
                        onChange={(e) => updateThemeScore(key, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>2.5</span>
                        <span>5</span>
                        <span>7.5</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Highlights & Activities</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Highlights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Key Highlights *</h4>
                  <span className="text-xs text-gray-500">{destination.highlights.length} highlights</span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      placeholder="Add a highlight (e.g. Sagrada Familia)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                    />
                    <button
                      onClick={addHighlight}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {errors.highlights && <p className="text-red-500 text-xs">{errors.highlights}</p>}
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{highlight}</span>
                      <button
                        onClick={() => removeHighlight(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Activities *</h4>
                  <span className="text-xs text-gray-500">{destination.activities.length} activities</span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value)}
                      placeholder="Add an activity (e.g. Architecture Tours)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                    />
                    <button
                      onClick={addActivity}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {errors.activities && <p className="text-red-500 text-xs">{errors.activities}</p>}
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {destination.activities.map((activity, index) => (
                    <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{activity}</span>
                      <button
                        onClick={() => removeActivity(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Travel Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Best Time to Visit *
                </label>
                <input
                  type="text"
                  value={destination.bestTimeToVisit}
                  onChange={(e) => setDestination({...destination, bestTimeToVisit: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.bestTimeToVisit ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. April to June, September to October"
                />
                {errors.bestTimeToVisit && <p className="text-red-500 text-xs mt-1">{errors.bestTimeToVisit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer size={16} className="inline mr-2" />
                  Average Temperature
                </label>
                <input
                  type="text"
                  value={destination.averageTemperature}
                  onChange={(e) => setDestination({...destination, averageTemperature: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g. 15-25°C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Languages size={16} className="inline mr-2" />
                  Primary Language *
                </label>
                <input
                  type="text"
                  value={destination.primaryLanguage}
                  onChange={(e) => setDestination({...destination, primaryLanguage: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.primaryLanguage ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Spanish/Catalan"
                />
                {errors.primaryLanguage && <p className="text-red-500 text-xs mt-1">{errors.primaryLanguage}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard size={16} className="inline mr-2" />
                  Currency *
                </label>
                <input
                  type="text"
                  value={destination.currency}
                  onChange={(e) => setDestination({...destination, currency: e.target.value.toUpperCase()})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.currency ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={3}
                  placeholder="e.g. EUR"
                />
                {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe size={16} className="inline mr-2" />
                  Time Zone
                </label>
                <input
                  type="text"
                  value={destination.timeZone}
                  onChange={(e) => setDestination({...destination, timeZone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g. CET (Central European Time)"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Images (Optional)</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload destination images</h4>
              <p className="text-gray-600 mb-4">
                Add photos that showcase your destination (max 10 images, 5MB each)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Plus size={16} className="mr-2" />
                Choose Images
              </label>
            </div>

            {destination.images.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Uploaded Images ({destination.images.length}/10)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {destination.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of 6
          </div>

          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Create Destination
                </>
              )}
            </button>
          )}
        </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle size={16} className="text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}
      </div>
    </div>
  )
}