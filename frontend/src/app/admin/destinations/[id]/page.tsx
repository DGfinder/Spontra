'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  MapPin, 
  Save, 
  ArrowLeft, 
  Edit, 
  Eye, 
  Camera,
  Plus,
  X,
  Star,
  Activity,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Video,
  FileText,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Heart,
  Compass,
  Mountain,
  Coffee,
  TreePine,
  Zap
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'
import POIManagement from '@/components/admin/POIManagement'
import { convertActivitiesToPOIs } from '@/utils/poiMigration'
import { poiService } from '@/services/poiService'

interface ThemeDetails {
  name: string
  score: number
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  color: string
  description: string
}

interface ContentItem {
  id: string
  type: 'video' | 'photo' | 'article'
  title: string
  creator: string
  status: 'published' | 'draft' | 'pending'
  views: number
  likes: number
  createdAt: string
  thumbnailUrl?: string
}

export default function DestinationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const destinationId = params.id as string
  
  const [destination, setDestination] = useState<AdminDestination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [newHighlight, setNewHighlight] = useState('')
  const [newActivity, setNewActivity] = useState('')
  const [poiRefreshTrigger, setPOIRefreshTrigger] = useState(0)
  const [isMigrating, setIsMigrating] = useState(false)

  // Theme configuration
  const themeDetails: Record<string, ThemeDetails> = {
    vibe: {
      name: 'City Vibe',
      score: 0,
      icon: Zap,
      color: 'text-purple-600',
      description: 'Nightlife, culture, and urban energy'
    },
    adventure: {
      name: 'Adventure',
      score: 0,
      icon: Mountain,
      color: 'text-orange-600', 
      description: 'Outdoor activities and thrilling experiences'
    },
    discover: {
      name: 'Discovery',
      score: 0,
      icon: Compass,
      color: 'text-blue-600',
      description: 'Historical sites and cultural exploration'
    },
    indulge: {
      name: 'Indulgence',
      score: 0,
      icon: Coffee,
      color: 'text-amber-600',
      description: 'Fine dining, shopping, and luxury experiences'
    },
    nature: {
      name: 'Nature',
      score: 0,
      icon: TreePine,
      color: 'text-green-600',
      description: 'Natural beauty and outdoor settings'
    }
  }

  // Mock content data
  const mockContent: ContentItem[] = [
    {
      id: '1',
      type: 'video',
      title: 'Best Coffee Shops Walking Tour',
      creator: 'coffee_wanderer',
      status: 'published',
      views: 12500,
      likes: 890,
      createdAt: '2024-01-15',
      thumbnailUrl: '/images/content/coffee-tour.jpg'
    },
    {
      id: '2', 
      type: 'article',
      title: 'Hidden Gems and Local Secrets',
      creator: 'local_expert',
      status: 'published',
      views: 8200,
      likes: 654,
      createdAt: '2024-01-12'
    },
    {
      id: '3',
      type: 'photo',
      title: 'Sunrise Photography Collection',
      creator: 'photo_artist',
      status: 'pending',
      views: 0,
      likes: 0,
      createdAt: '2024-01-20'
    }
  ]

  // Mock destination data
  const mockDestination: AdminDestination = {
    iataCode: 'BCN',
    cityName: 'Barcelona',
    countryName: 'Spain',
    countryCode: 'ES',
    continent: 'Europe',
    coordinates: { lat: 41.3874, lng: 2.1686 },
    isActive: true,
    isPopular: true,
    themeScores: {
      vibe: 9.2,
      adventure: 7.8,
      discover: 8.9,
      indulge: 8.5,
      nature: 6.4
    },
    metrics: {
      totalBookings: 3456,
      totalRevenue: 287500,
      popularityScore: 9.2,
      contentCount: 89,
      averageStay: 4.2,
      creatorCount: 23
    },
    description: 'A vibrant Mediterranean city known for its stunning architecture, rich culture, and dynamic nightlife. From the Gothic Quarter to modern beaches, Barcelona offers endless discoveries.',
    highlights: [
      'Sagrada Familia Basilica',
      'Park Güell',
      'Gothic Quarter',
      'Barcelona Beaches',
      'Las Ramblas',
      'Casa Batlló'
    ],
    supportedActivities: [
      'Architecture Tours',
      'Beach Activities',
      'Tapas Tours',
      'Museums',
      'Nightlife',
      'Shopping',
      'Art Galleries',
      'Flamenco Shows'
    ],
    lastUpdated: '2024-01-20T14:22:00Z'
  }

  useEffect(() => {
    // Simulate loading destination data
    const loadDestination = async () => {
      setIsLoading(true)
      try {
        // In real implementation, fetch from API based on destinationId
        await new Promise(resolve => setTimeout(resolve, 1000))
        setDestination(mockDestination)
        
        // Update theme details with actual scores
        Object.keys(themeDetails).forEach(key => {
          if (mockDestination.themeScores[key as keyof typeof mockDestination.themeScores]) {
            themeDetails[key].score = mockDestination.themeScores[key as keyof typeof mockDestination.themeScores]
          }
        })
      } catch (error) {
        console.error('Failed to load destination:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDestination()
  }, [destinationId])

  const handleSave = async () => {
    if (!destination) return
    setIsSaving(true)
    try {
      const updates = {
        description: destination.description,
        highlights: destination.highlights,
        themeScores: destination.themeScores
      }
      const res = await fetch(`/api/admin/destinations/${destinationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Update failed')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save destination:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateThemeScore = (theme: string, score: number) => {
    if (!destination) return
    setDestination({
      ...destination,
      themeScores: {
        ...destination.themeScores,
        [theme]: Math.max(0, Math.min(10, score))
      }
    })
  }

  const addHighlight = () => {
    if (!destination || !newHighlight.trim()) return
    setDestination({
      ...destination,
      highlights: [...destination.highlights, newHighlight.trim()]
    })
    setNewHighlight('')
  }

  const removeHighlight = (index: number) => {
    if (!destination) return
    setDestination({
      ...destination,
      highlights: destination.highlights.filter((_, i) => i !== index)
    })
  }

  const addActivity = () => {
    if (!destination || !newActivity.trim()) return
    setDestination({
      ...destination,
      supportedActivities: [...destination.supportedActivities, newActivity.trim()]
    })
    setNewActivity('')
  }

  const handleMigrateActivities = async () => {
    if (!destination || destination.supportedActivities.length === 0) {
      alert('No activities found to migrate')
      return
    }

    if (!confirm(`Convert ${destination.supportedActivities.length} activities to POIs? This will create new POI entries.`)) {
      return
    }

    setIsMigrating(true)
    try {
      const migrationResult = convertActivitiesToPOIs(destination, {
        defaultCoordinates: destination.coordinates,
        generateDescriptions: true,
        defaultPriceLevel: 'moderate'
      })

      if (migrationResult.generatedPOIs.length === 0) {
        alert('No POIs could be generated from existing activities')
        return
      }

      // Create POIs via API
      let successCount = 0
      for (const poiData of migrationResult.generatedPOIs) {
        try {
          await poiService.createPOI(destinationId, poiData)
          successCount++
        } catch (error) {
          console.error('Failed to create POI:', poiData.name, error)
        }
      }

      // Refresh POI management component
      setPOIRefreshTrigger(prev => prev + 1)
      
      alert(`Migration completed! ${successCount} of ${migrationResult.generatedPOIs.length} POIs created successfully.`)
    } catch (error) {
      console.error('Migration failed:', error)
      alert('Migration failed. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  const removeActivity = (index: number) => {
    if (!destination) return
    setDestination({
      ...destination,
      supportedActivities: destination.supportedActivities.filter((_, i) => i !== index)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'draft': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />
      case 'article': return <FileText size={16} />
      case 'photo': return <Camera size={16} />
      default: return <FileText size={16} />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Destination Not Found</h2>
          <p className="text-gray-600 mb-4">The destination you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/admin/destinations/manage')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Destinations
          </button>
        </div>
      </div>
    )
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
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{destination.iataCode}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{destination.cityName}, {destination.countryName}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Popularity: {destination.metrics.popularityScore.toFixed(1)}/10</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  destination.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {destination.isActive ? 'Active' : 'Inactive'}
                </span>
                {destination.isPopular && (
                  <>
                    <span>•</span>
                    <span className="flex items-center text-yellow-600">
                      <Star size={16} className="mr-1" />
                      Popular
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? (
              <>
                <Eye size={16} className="mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Edit size={16} className="mr-2" />
                Edit Mode
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'themes', label: 'Themes', icon: Star },
            { id: 'pois', label: 'Points of Interest', icon: MapPin },
            { id: 'content', label: 'Content', icon: Video },
            { id: 'highlights', label: 'Highlights', icon: Target },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={destination.cityName}
                          onChange={(e) => setDestination({...destination, cityName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{destination.cityName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={destination.countryName}
                          onChange={(e) => setDestination({...destination, countryName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{destination.countryName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IATA Code</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={destination.iataCode}
                          onChange={(e) => setDestination({...destination, iataCode: e.target.value.toUpperCase()})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          maxLength={3}
                        />
                      ) : (
                        <p className="text-gray-900">{destination.iataCode}</p>
                      )}
                    </div>

                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    {isEditing ? (
                      <textarea
                        value={destination.description}
                        onChange={(e) => setDestination({...destination, description: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{destination.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Sidebar */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign size={16} className="text-green-600 mr-2" />
                        <span className="text-sm text-gray-600">Revenue</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(destination.metrics.totalRevenue)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users size={16} className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Bookings</span>
                      </div>
                      <span className="font-semibold text-gray-900">{destination.metrics.totalBookings.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Video size={16} className="text-purple-600 mr-2" />
                        <span className="text-sm text-gray-600">Content Items</span>
                      </div>
                      <span className="font-semibold text-gray-900">{destination.metrics.contentCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock size={16} className="text-orange-600 mr-2" />
                        <span className="text-sm text-gray-600">Avg Stay</span>
                      </div>
                      <span className="font-semibold text-gray-900">{destination.metrics.averageStay} days</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Heart size={16} className="text-red-600 mr-2" />
                        <span className="text-sm text-gray-600">Creator Count</span>
                      </div>
                      <span className="font-semibold text-gray-900">{destination.metrics.creatorCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center">
                        <Video size={16} className="text-blue-600 mr-3" />
                        <span className="text-sm font-medium">View Content</span>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
                      <div className="flex items-center">
                        <Plus size={16} className="text-green-600 mr-3" />
                        <span className="text-sm font-medium">Add Content</span>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                      <div className="flex items-center">
                        <BarChart3 size={16} className="text-orange-600 mr-3" />
                        <span className="text-sm font-medium">Analytics</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Scores</h3>
                <p className="text-gray-600">Configure how well this destination matches each theme (0-10 scale)</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(themeDetails).map(([key, theme]) => {
                  const score = destination.themeScores[key as keyof typeof destination.themeScores] || 0
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
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={score}
                            onChange={(e) => updateThemeScore(key, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0</span>
                            <span>2.5</span>
                            <span>5</span>
                            <span>7.5</span>
                            <span>10</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${
                              score >= 8 ? 'from-green-400 to-green-600' :
                              score >= 6 ? 'from-yellow-400 to-yellow-600' :
                              'from-red-400 to-red-600'
                            }`}
                            style={{ width: `${(score / 10) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'pois' && (
            <div className="space-y-6">
              {/* Migration Section */}
              {destination && destination.supportedActivities.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Activity Migration Available</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Convert {destination.supportedActivities.length} existing activities into structured POIs
                      </p>
                    </div>
                    <button
                      onClick={handleMigrateActivities}
                      disabled={isMigrating}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isMigrating ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Migrating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Migrate Activities
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              <POIManagement 
              destinationId={destinationId}
              isEditing={isEditing}
              refreshTrigger={poiRefreshTrigger}
              onPOIUpdate={(poi) => {
                console.log('POI updated:', poi)
                // Force POI component to refresh if needed
                setPOIRefreshTrigger(prev => prev + 1)
                // Could also update destination metrics here
              }}
              onPOICreate={(poi) => {
                console.log('POI created:', poi)
                // Force POI component to refresh
                setPOIRefreshTrigger(prev => prev + 1)
                // Update destination content count if available
                if (destination) {
                  setDestination({
                    ...destination,
                    metrics: {
                      ...destination.metrics,
                      contentCount: destination.metrics.contentCount + 1
                    }
                  })
                }
              }}
              onPOIDelete={(poiId) => {
                console.log('POI deleted:', poiId)
                setPOIRefreshTrigger(prev => prev + 1)
                // Update destination content count if available
                if (destination) {
                  setDestination({
                    ...destination,
                    metrics: {
                      ...destination.metrics,
                      contentCount: Math.max(0, destination.metrics.contentCount - 1)
                    }
                  })
                }
              }}
              />
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Associated Content</h3>
                  <p className="text-gray-600">Content items related to this destination</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={16} className="mr-2" />
                  Add Content
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockContent.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getContentIcon(item.type)}
                        <span className="text-sm font-medium text-gray-700 capitalize">{item.type}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">by @{item.creator}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {item.views.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Heart size={14} className="mr-1" />
                          {item.likes.toLocaleString()}
                        </div>
                      </div>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'highlights' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Highlights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        placeholder="Add new highlight..."
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                      />
                      <button
                        onClick={addHighlight}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{highlight}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeHighlight(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        placeholder="Add new activity..."
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                      />
                      <button
                        onClick={addActivity}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {destination.supportedActivities.map((activity, index) => (
                    <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{activity}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeActivity(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600">Detailed performance metrics and trends for this destination</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Revenue Trend</h4>
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(destination.metrics.totalRevenue)}</div>
                  <div className="text-sm text-green-600">+15.3% vs last month</div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Booking Conversion</h4>
                    <Target size={20} className="text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">18.5%</div>
                  <div className="text-sm text-blue-600">+2.1% vs last month</div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Content Engagement</h4>
                    <Activity size={20} className="text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">4.8/5</div>
                  <div className="text-sm text-purple-600">+0.3 vs last month</div>
                </div>
              </div>
              
              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Monthly Trends</h4>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Interactive chart would be rendered here</p>
                    <p className="text-sm text-gray-500">Showing bookings, revenue, and engagement over time</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}