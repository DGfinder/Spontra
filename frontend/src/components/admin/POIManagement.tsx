'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Eye, 
  Heart, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp,
  Users,
  Calendar,
  Camera,
  BarChart3,
  Zap,
  Mountain,
  Compass,
  Coffee,
  TreePine,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { 
  PointOfInterest, 
  ThemeType, 
  POICategory, 
  POIStatus, 
  POIFilterOptions,
  DEFAULT_POI_CATEGORIES
} from '@/types/pois'
import { poiService } from '@/services/poiService'
import POIFormModal from './POIFormModal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '../ui/Toast'

interface POIManagementProps {
  destinationId: string
  isEditing: boolean
  refreshTrigger?: number
  onPOIUpdate?: (poi: PointOfInterest) => void
  onPOICreate?: (poi: PointOfInterest) => void
  onPOIDelete?: (poiId: string) => void
}

// Component will now use real POI data from props or API

const themeConfig = {
  vibe: { icon: Zap, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  adventure: { icon: Mountain, color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  discover: { icon: Compass, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  indulge: { icon: Coffee, color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  nature: { icon: TreePine, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' }
}

export default function POIManagement({ 
  destinationId, 
  isEditing, 
  refreshTrigger,
  onPOIUpdate, 
  onPOICreate, 
  onPOIDelete 
}: POIManagementProps) {
  const [pois, setPOIs] = useState<PointOfInterest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('discover')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<POIFilterOptions>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Toast notifications
  const { toasts, toast, removeToast } = useToast()

  // Load POIs from API
  useEffect(() => {
    loadPOIs()
  }, [destinationId])

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadPOIs()
    }
  }, [refreshTrigger])

  const loadPOIs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await poiService.listPOIs(destinationId)
      setPOIs(response.pois)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load POIs'
      setError(errorMessage)
      toast.error('Failed to Load POIs', errorMessage)
      console.error('Failed to load POIs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter POIs by selected theme and search query
  const filteredPOIs = useMemo(() => {
    let filtered = pois.filter(poi => poi.theme === selectedTheme)
    
    if (searchQuery) {
      filtered = filtered.filter(poi => 
        poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poi.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poi.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    return filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return b.popularityScore - a.popularityScore
    })
  }, [pois, selectedTheme, searchQuery])

  // Get theme statistics
  const getThemeStats = (theme: ThemeType) => {
    const themePOIs = pois.filter(poi => poi.theme === theme)
    const activeCount = themePOIs.filter(poi => poi.status === 'active').length
    const avgRating = themePOIs.reduce((sum, poi) => sum + poi.rating, 0) / themePOIs.length || 0
    const totalViews = themePOIs.reduce((sum, poi) => sum + (poi.analytics?.totalViews || 0), 0)
    
    return {
      total: themePOIs.length,
      active: activeCount,
      avgRating: avgRating,
      totalViews: totalViews
    }
  }

  const handleCreatePOI = () => {
    setSelectedPOI(null) // Clear any selected POI
    setIsCreateModalOpen(true)
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedPOI) {
        // Update existing POI
        const updatedPOI = await poiService.patchPOI(destinationId, selectedPOI.id, formData)
        setPOIs(prev => prev.map(p => p.id === selectedPOI.id ? updatedPOI : p))
        toast.success('POI Updated', `${formData.name} has been updated successfully`)
        onPOIUpdate?.(updatedPOI)
      } else {
        // Create new POI
        const newPOI = await poiService.createPOI(destinationId, formData)
        setPOIs(prev => [...prev, newPOI])
        toast.success('POI Created', `${formData.name} has been created successfully`)
        onPOICreate?.(newPOI)
      }
      setIsCreateModalOpen(false)
      setSelectedPOI(null)
      setError(null) // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : selectedPOI ? 'Failed to update POI' : 'Failed to create POI'
      setError(errorMessage)
      toast.error(selectedPOI ? 'Update Failed' : 'Creation Failed', errorMessage)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleEditPOI = (poi: PointOfInterest) => {
    setSelectedPOI(poi)
    setIsCreateModalOpen(true) // Use same modal for editing
  }

  const handleDeletePOI = async (poiId: string) => {
    const poi = pois.find(p => p.id === poiId)
    const poiName = poi?.name || 'POI'
    
    if (confirm(`Are you sure you want to delete "${poiName}"? This action cannot be undone.`)) {
      try {
        await poiService.deletePOI(destinationId, poiId)
        setPOIs(prev => prev.filter(poi => poi.id !== poiId))
        toast.success('POI Deleted', `${poiName} has been deleted successfully`)
        onPOIDelete?.(poiId)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete POI'
        setError(errorMessage)
        toast.error('Delete Failed', errorMessage)
      }
    }
  }

  const getPriceDisplay = (poi: PointOfInterest) => {
    if (poi.priceLevel === 'free') return 'Free'
    if (poi.priceRange) {
      return `${poi.priceRange.min}-${poi.priceRange.max} ${poi.priceRange.currency}`
    }
    return poi.priceLevel.charAt(0).toUpperCase() + poi.priceLevel.slice(1)
  }

  const getDurationDisplay = (poi: PointOfInterest) => {
    if (!poi.duration) return null
    const { min, max, unit } = poi.duration
    const unitLabel = unit === 'minutes' ? 'min' : unit === 'hours' ? 'hr' : 'days'
    return min === max ? `${min} ${unitLabel}` : `${min}-${max} ${unitLabel}`
  }

  const POICard = ({ poi }: { poi: PointOfInterest }) => {
    const theme = themeConfig[poi.theme]
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* POI Image */}
        <div className="relative h-48 bg-gray-200">
          {poi.featuredImage ? (
            <img 
              src={poi.featuredImage} 
              alt={poi.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera size={48} className="text-gray-400" />
            </div>
          )}
          
          {/* Status badges */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            {poi.isFeatured && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full">
                Featured
              </span>
            )}
            {poi.isPromoted && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                Promoted
              </span>
            )}
          </div>

          {/* Actions menu */}
          <div className="absolute top-3 right-3">
            <div className="relative group">
              <button className="p-1 bg-white/80 hover:bg-white rounded-full transition-colors">
                <MoreVertical size={16} />
              </button>
              
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleEditPOI(poi)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                  >
                    <Edit size={14} className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(poi.id)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                  >
                    <Copy size={14} className="mr-2" />
                    Copy ID
                  </button>
                  {poi.website && (
                    <a
                      href={poi.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                    >
                      <ExternalLink size={14} className="mr-2" />
                      Visit Website
                    </a>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => handleDeletePOI(poi.id)}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POI Content */}
        <div className="p-4">
          {/* Header with rating */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{poi.name}</h3>
            <div className="flex items-center ml-2">
              <Star size={14} className="text-yellow-400 mr-1" />
              <span className="text-sm font-medium">{poi.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Short description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {poi.shortDescription || poi.description}
          </p>

          {/* Theme and category */}
          <div className="flex items-center mb-3">
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme.bgColor} ${theme.textColor}`}>
              <theme.icon size={12} className="mr-1" />
              {poi.theme}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {DEFAULT_POI_CATEGORIES[poi.theme]?.find(cat => cat.id === poi.categoryId)?.name}
            </span>
          </div>

          {/* Key info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={14} className="mr-2 text-gray-400" />
              {poi.address?.split(',')[0] || 'Location not specified'}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <DollarSign size={14} className="mr-1 text-gray-400" />
                {getPriceDisplay(poi)}
              </div>
              
              {getDurationDisplay(poi) && (
                <div className="flex items-center text-gray-600">
                  <Clock size={14} className="mr-1 text-gray-400" />
                  {getDurationDisplay(poi)}
                </div>
              )}
            </div>
          </div>

          {/* Analytics quick view */}
          {poi.analytics && (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Eye size={12} className="mr-1" />
                  {poi.analytics.totalViews.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <Users size={12} className="mr-1" />
                  {poi.analytics.bookingsGenerated.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  {poi.analytics.conversionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with theme tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Points of Interest</h2>
            <p className="text-gray-600 text-sm">Manage attractions and activities by theme</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List size={16} />
              </button>
            </div>
            
            <button
              onClick={handleCreatePOI}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Add POI
            </button>
          </div>
        </div>

        {/* Theme tabs */}
        <div className="flex space-x-1">
          {(Object.keys(themeConfig) as ThemeType[]).map((theme) => {
            const config = themeConfig[theme]
            const stats = getThemeStats(theme)
            const isActive = selectedTheme === theme
            
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`flex items-center px-4 py-3 rounded-t-lg transition-colors relative ${
                  isActive 
                    ? `bg-white border-b-2 border-${config.color}-500 ${config.textColor}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <config.icon size={16} className="mr-2" />
                <span className="font-medium capitalize">{theme}</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {stats.total}
                </span>
                {stats.total > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search POIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter size={16} className="mr-2" />
          Filters
        </button>
      </div>

      {/* Theme statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const stats = getThemeStats(selectedTheme)
          const theme = themeConfig[selectedTheme]
          
          return (
            <>
              <div className={`${theme.bgColor} ${theme.borderColor} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total POIs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <theme.icon size={24} className={theme.textColor} />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                  </div>
                  <Star size={24} className="text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye size={24} className="text-blue-500" />
                </div>
              </div>
            </>
          )
        })()}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-red-500 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading POIs</h3>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadPOIs}
                className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POI Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPOIs.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No POIs match your search' : 
             pois.length === 0 ? 'No POIs found' :
             `No ${selectedTheme} POIs yet`}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms or filters'
              : pois.length === 0 
              ? 'Start by adding points of interest to this destination'
              : `Start by adding some ${selectedTheme}-themed points of interest`
            }
          </p>
          <button
            onClick={handleCreatePOI}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isEditing === false}
          >
            {pois.length === 0 ? 'Add Your First POI' : `Add ${selectedTheme} POI`}
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredPOIs.map((poi) => (
            <POICard key={poi.id} poi={poi} />
          ))}
        </div>
      )}

      {/* POI Form Modal */}
      <POIFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedPOI(null)
        }}
        onSubmit={handleFormSubmit}
        poi={selectedPOI || undefined}
        destinationId={destinationId}
        isEditing={isEditing}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}