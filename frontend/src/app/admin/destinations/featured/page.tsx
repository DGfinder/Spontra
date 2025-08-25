'use client'

import { useState, useEffect } from 'react'
import {
  Star,
  Plus,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Flag,
  Globe,
  Search,
  Filter,
  Grid,
  List,
  Settings,
  Copy,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface FeaturedDestination {
  id: string
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  isVisible: boolean
  order: number
  category: 'homepage' | 'trending' | 'seasonal' | 'editor_pick'
  featuredUntil?: string
  thumbnailUrl?: string
  description: string
  highlights: string[]
  stats: {
    views: number
    bookings: number
    revenue: number
    engagement: number
  }
  createdAt: string
  updatedAt: string
}

interface FeaturedCollection {
  id: string
  name: string
  description: string
  isActive: boolean
  displayOrder: number
  destinations: FeaturedDestination[]
  startDate?: string
  endDate?: string
  category: 'homepage' | 'trending' | 'seasonal' | 'editor_pick'
}

export default function FeaturedCitiesPage() {
  const [collections, setCollections] = useState<FeaturedCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<FeaturedCollection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddDestinationModal, setShowAddDestinationModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    category: 'homepage' as 'homepage' | 'trending' | 'seasonal' | 'editor_pick',
    startDate: '',
    endDate: ''
  })

  // Mock data
  const mockCollections: FeaturedCollection[] = [
    {
      id: '1',
      name: 'Homepage Heroes',
      description: 'Premium destinations featured on the main homepage',
      isActive: true,
      displayOrder: 1,
      category: 'homepage',
      destinations: [
        {
          id: '1',
          iataCode: 'BCN',
          cityName: 'Barcelona',
          countryName: 'Spain',
          countryCode: 'ES',
          isVisible: true,
          order: 1,
          category: 'homepage',
          featuredUntil: '2024-03-01',
          description: 'Stunning architecture and vibrant culture',
          highlights: ['Sagrada Familia', 'Park Güell', 'Gothic Quarter'],
          stats: { views: 125000, bookings: 3456, revenue: 287500, engagement: 8.9 },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15'
        },
        {
          id: '2',
          iataCode: 'ROM',
          cityName: 'Rome',
          countryName: 'Italy',
          countryCode: 'IT',
          isVisible: true,
          order: 2,
          category: 'homepage',
          description: 'Ancient history meets modern charm',
          highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain'],
          stats: { views: 98000, bookings: 2890, revenue: 234500, engagement: 9.2 },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-12'
        }
      ]
    },
    {
      id: '2',
      name: 'Winter Wonderlands',
      description: 'Perfect destinations for winter travel',
      isActive: true,
      displayOrder: 2,
      category: 'seasonal',
      startDate: '2023-12-01',
      endDate: '2024-02-29',
      destinations: [
        {
          id: '3',
          iataCode: 'VIE',
          cityName: 'Vienna',
          countryName: 'Austria',
          countryCode: 'AT',
          isVisible: true,
          order: 1,
          category: 'seasonal',
          description: 'Christmas markets and imperial grandeur',
          highlights: ['Schönbrunn Palace', 'Christmas Markets', 'Hofburg'],
          stats: { views: 67000, bookings: 1234, revenue: 156000, engagement: 8.1 },
          createdAt: '2023-11-15',
          updatedAt: '2024-01-08'
        }
      ]
    },
    {
      id: '3',
      name: 'Trending Now',
      description: 'Currently popular destinations based on user interest',
      isActive: true,
      displayOrder: 3,
      category: 'trending',
      destinations: [
        {
          id: '4',
          iataCode: 'LIS',
          cityName: 'Lisbon',
          countryName: 'Portugal',
          countryCode: 'PT',
          isVisible: true,
          order: 1,
          category: 'trending',
          description: 'Colorful tiles and coastal charm',
          highlights: ['Jerónimos Monastery', 'Tram 28', 'Belém Tower'],
          stats: { views: 89000, bookings: 2100, revenue: 189000, engagement: 8.7 },
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18'
        }
      ]
    },
    {
      id: '4',
      name: 'Editor\'s Picks',
      description: 'Hand-selected destinations by our travel experts',
      isActive: false,
      displayOrder: 4,
      category: 'editor_pick',
      destinations: []
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        setCollections(mockCollections)
        setSelectedCollection(mockCollections[0])
      } catch (error) {
        console.error('Failed to load featured collections:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'homepage': return <Star className="text-yellow-500" size={16} />
      case 'trending': return <TrendingUp className="text-green-500" size={16} />
      case 'seasonal': return <Calendar className="text-blue-500" size={16} />
      case 'editor_pick': return <Flag className="text-purple-500" size={16} />
      default: return <MapPin className="text-gray-500" size={16} />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'homepage': return 'Homepage'
      case 'trending': return 'Trending'
      case 'seasonal': return 'Seasonal'
      case 'editor_pick': return 'Editor\'s Pick'
      default: return category
    }
  }

  const filteredCollections = collections.filter(collection => {
    if (searchQuery && !collection.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterCategory !== 'all' && collection.category !== filterCategory) return false
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  const toggleDestinationVisibility = (destinationId: string) => {
    if (!selectedCollection) return
    
    const updatedDestinations = selectedCollection.destinations.map(dest =>
      dest.id === destinationId ? { ...dest, isVisible: !dest.isVisible } : dest
    )
    
    setSelectedCollection({
      ...selectedCollection,
      destinations: updatedDestinations
    })
  }

  const moveDestination = (fromIndex: number, toIndex: number) => {
    if (!selectedCollection) return
    
    const destinations = [...selectedCollection.destinations]
    const [movedItem] = destinations.splice(fromIndex, 1)
    destinations.splice(toIndex, 0, movedItem)
    
    // Update order numbers
    destinations.forEach((dest, index) => {
      dest.order = index + 1
    })
    
    setSelectedCollection({
      ...selectedCollection,
      destinations
    })
  }

  const removeDestination = (destinationId: string) => {
    if (!selectedCollection) return
    
    const updatedDestinations = selectedCollection.destinations.filter(dest => dest.id !== destinationId)
    setSelectedCollection({
      ...selectedCollection,
      destinations: updatedDestinations
    })
  }

  const toggleCollectionStatus = (collectionId: string) => {
    setCollections(collections.map(collection =>
      collection.id === collectionId
        ? { ...collection, isActive: !collection.isActive }
        : collection
    ))
  }

  const createCollection = () => {
    const collection: FeaturedCollection = {
      id: Date.now().toString(),
      name: newCollection.name,
      description: newCollection.description,
      isActive: true,
      displayOrder: collections.length + 1,
      category: newCollection.category,
      destinations: [],
      startDate: newCollection.startDate || undefined,
      endDate: newCollection.endDate || undefined
    }
    
    setCollections([...collections, collection])
    setShowCreateModal(false)
    setNewCollection({
      name: '',
      description: '',
      category: 'homepage',
      startDate: '',
      endDate: ''
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Cities</h1>
          <p className="text-gray-600">Manage featured destination collections and homepage displays</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Create Collection
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Collections</div>
            <Globe size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{collections.length}</div>
          <div className="text-sm text-gray-500">{collections.filter(c => c.isActive).length} active</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Featured Destinations</div>
            <MapPin size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{collections.reduce((acc, c) => acc + c.destinations.length, 0)}</div>
          <div className="text-sm text-green-600">+3 this week</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Views</div>
            <Eye size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">379K</div>
          <div className="text-sm text-purple-600">+12% vs last month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Conversion Rate</div>
            <TrendingUp size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">18.7%</div>
          <div className="text-sm text-orange-600">+2.1% vs last month</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Collections List */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Collections</h3>
              <span className="text-sm text-gray-500">{filteredCollections.length} collections</span>
            </div>
            
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="homepage">Homepage</option>
                <option value="trending">Trending</option>
                <option value="seasonal">Seasonal</option>
                <option value="editor_pick">Editor's Pick</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                onClick={() => setSelectedCollection(collection)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedCollection?.id === collection.id 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(collection.category)}
                    <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    collection.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {collection.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{collection.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{collection.destinations.length} destinations</span>
                  <span className="text-gray-500">Order #{collection.displayOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Details */}
        <div className="xl:col-span-2">
          {selectedCollection ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Collection Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(selectedCollection.category)}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedCollection.name}</h3>
                      <p className="text-gray-600">{getCategoryLabel(selectedCollection.category)} • {selectedCollection.destinations.length} destinations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                    </button>
                    
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => toggleCollectionStatus(selectedCollection.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedCollection.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedCollection.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    <button
                      onClick={() => setShowAddDestinationModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Destination
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{selectedCollection.description}</p>

                {(selectedCollection.startDate || selectedCollection.endDate) && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {selectedCollection.startDate && (
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>Start: {selectedCollection.startDate}</span>
                      </div>
                    )}
                    {selectedCollection.endDate && (
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>End: {selectedCollection.endDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Destinations */}
              <div className="p-6">
                {selectedCollection.destinations.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Destinations Yet</h4>
                    <p className="text-gray-600 mb-4">Start building this collection by adding destinations.</p>
                    <button
                      onClick={() => setShowAddDestinationModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add First Destination
                    </button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                    {selectedCollection.destinations
                      .sort((a, b) => a.order - b.order)
                      .map((destination, index) => (
                        <div
                          key={destination.id}
                          className={`border rounded-lg p-4 transition-all ${
                            destination.isVisible ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{destination.iataCode}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{destination.cityName}</h4>
                                <p className="text-sm text-gray-600">{destination.countryName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">#{destination.order}</span>
                              
                              <button
                                onClick={() => toggleDestinationVisibility(destination.id)}
                                className={`p-1 rounded ${destination.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                                title={destination.isVisible ? 'Hide destination' : 'Show destination'}
                              >
                                {destination.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              
                              <div className="flex flex-col">
                                <button
                                  onClick={() => moveDestination(index, Math.max(0, index - 1))}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => moveDestination(index, Math.min(selectedCollection.destinations.length - 1, index + 1))}
                                  disabled={index === selectedCollection.destinations.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeDestination(destination.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{destination.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Views:</span>
                              <span className="ml-2 font-medium">{destination.stats.views.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Bookings:</span>
                              <span className="ml-2 font-medium">{destination.stats.bookings.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Revenue:</span>
                              <span className="ml-2 font-medium">{formatCurrency(destination.stats.revenue)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Rating:</span>
                              <span className="ml-2 font-medium">{destination.stats.engagement}/10</span>
                            </div>
                          </div>
                          
                          {destination.featuredUntil && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <div className="flex items-center text-yellow-800">
                                <AlertTriangle size={14} className="mr-1" />
                                Featured until {destination.featuredUntil}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Star size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Collection</h3>
              <p className="text-gray-600">Choose a featured collection from the list to view and manage its destinations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Collection</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g. Summer Escapes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Describe this collection..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newCollection.category}
                  onChange={(e) => setNewCollection({...newCollection, category: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="homepage">Homepage</option>
                  <option value="trending">Trending</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="editor_pick">Editor's Pick</option>
                </select>
              </div>
              
              {newCollection.category === 'seasonal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newCollection.startDate}
                      onChange={(e) => setNewCollection({...newCollection, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newCollection.endDate}
                      onChange={(e) => setNewCollection({...newCollection, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={createCollection}
                disabled={!newCollection.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Collection
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Destination Modal */}
      {showAddDestinationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Destination</h3>
              <button
                onClick={() => setShowAddDestinationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="text-center py-8">
              <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Search and select destinations from your destination library to add to this collection.</p>
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  This would integrate with your destination search API
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddDestinationModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}