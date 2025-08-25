'use client'

import { useState, useEffect } from 'react'
import {
  Video,
  Camera,
  FileText,
  Play,
  Pause,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  Heart,
  Download,
  Upload,
  Calendar,
  MapPin,
  User,
  Tag,
  Clock,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  X,
  MoreHorizontal,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  description: string
  type: 'video' | 'photo' | 'article' | 'gallery'
  status: 'published' | 'draft' | 'pending' | 'archived'
  thumbnail: string
  url?: string
  duration?: number // in seconds for videos
  fileSize?: string
  resolution?: string
  creator: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  destination: {
    iataCode: string
    cityName: string
    countryName: string
  }
  tags: string[]
  themes: string[]
  metrics: {
    views: number
    likes: number
    shares: number
    saves: number
    comments: number
    rating: number
  }
  createdAt: string
  updatedAt: string
  publishedAt?: string
  scheduledFor?: string
}

interface LibraryStats {
  totalItems: number
  totalViews: number
  totalLikes: number
  averageRating: number
  storageUsed: string
  itemsByType: Record<string, number>
  itemsByStatus: Record<string, number>
}

export default function ContentLibraryPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDestination, setFilterDestination] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Mock data
  const mockStats: LibraryStats = {
    totalItems: 1247,
    totalViews: 2560000,
    totalLikes: 89750,
    averageRating: 4.3,
    storageUsed: '45.8 GB',
    itemsByType: {
      video: 567,
      photo: 489,
      article: 156,
      gallery: 35
    },
    itemsByStatus: {
      published: 892,
      draft: 234,
      pending: 89,
      archived: 32
    }
  }

  const mockContentItems: ContentItem[] = [
    {
      id: '1',
      title: 'Barcelona Street Art Walking Tour',
      description: 'Discover the vibrant street art scene in Barcelona\'s Gothic Quarter and El Raval neighborhoods.',
      type: 'video',
      status: 'published',
      thumbnail: '/images/content/barcelona-street-art.jpg',
      url: 'https://example.com/video/1',
      duration: 892, // 14:52
      fileSize: '245 MB',
      resolution: '1920x1080',
      creator: {
        id: '1',
        name: 'Maria Santos',
        username: 'art_wanderer',
        avatar: '/images/creators/maria.jpg'
      },
      destination: {
        iataCode: 'BCN',
        cityName: 'Barcelona',
        countryName: 'Spain'
      },
      tags: ['street art', 'walking tour', 'culture', 'neighborhoods'],
      themes: ['vibe', 'discover'],
      metrics: {
        views: 125000,
        likes: 8950,
        shares: 1200,
        saves: 3400,
        comments: 456,
        rating: 4.8
      },
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T09:30:00Z',
      publishedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Hidden Gems of Prague',
      description: 'Stunning photography collection showcasing lesser-known spots in Prague.',
      type: 'gallery',
      status: 'published',
      thumbnail: '/images/content/prague-gems.jpg',
      fileSize: '89 MB',
      creator: {
        id: '2',
        name: 'David Novak',
        username: 'prague_lens',
        avatar: '/images/creators/david.jpg'
      },
      destination: {
        iataCode: 'PRG',
        cityName: 'Prague',
        countryName: 'Czech Republic'
      },
      tags: ['photography', 'hidden gems', 'architecture', 'historic'],
      themes: ['discover', 'nature'],
      metrics: {
        views: 67000,
        likes: 4200,
        shares: 890,
        saves: 2100,
        comments: 123,
        rating: 4.6
      },
      createdAt: '2024-01-12T14:20:00Z',
      updatedAt: '2024-01-12T14:20:00Z',
      publishedAt: '2024-01-12T15:00:00Z'
    },
    {
      id: '3',
      title: 'Amsterdam Coffee Culture Guide',
      description: 'Complete guide to Amsterdam\'s best coffee shops and local coffee culture.',
      type: 'article',
      status: 'draft',
      thumbnail: '/images/content/amsterdam-coffee.jpg',
      creator: {
        id: '3',
        name: 'Emma Johnson',
        username: 'coffee_nomad',
        avatar: '/images/creators/emma.jpg'
      },
      destination: {
        iataCode: 'AMS',
        cityName: 'Amsterdam',
        countryName: 'Netherlands'
      },
      tags: ['coffee', 'food', 'culture', 'guide'],
      themes: ['indulge', 'vibe'],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        saves: 0,
        comments: 0,
        rating: 0
      },
      createdAt: '2024-01-20T11:45:00Z',
      updatedAt: '2024-01-22T16:30:00Z'
    },
    {
      id: '4',
      title: 'Rome Sunrise Photography',
      description: 'Golden hour photography at Rome\'s most iconic landmarks.',
      type: 'photo',
      status: 'pending',
      thumbnail: '/images/content/rome-sunrise.jpg',
      fileSize: '24 MB',
      resolution: '4032x3024',
      creator: {
        id: '4',
        name: 'Alessandro Rossi',
        username: 'roman_photographer',
        avatar: '/images/creators/alessandro.jpg'
      },
      destination: {
        iataCode: 'ROM',
        cityName: 'Rome',
        countryName: 'Italy'
      },
      tags: ['photography', 'sunrise', 'landmarks', 'golden hour'],
      themes: ['discover', 'nature'],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        saves: 0,
        comments: 0,
        rating: 0
      },
      createdAt: '2024-01-18T06:30:00Z',
      updatedAt: '2024-01-18T06:30:00Z'
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setContentItems(mockContentItems)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to load content library:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />
      case 'photo': return <Camera size={16} />
      case 'article': return <FileText size={16} />
      case 'gallery': return <Grid size={16} />
      default: return <FileText size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100'
      case 'draft': return 'text-gray-600 bg-gray-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'archived': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const filteredItems = contentItems.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && item.type !== filterType) return false
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterDestination !== 'all' && item.destination.iataCode !== filterDestination) return false
    return true
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'most_viewed': return b.metrics.views - a.metrics.views
      case 'highest_rated': return b.metrics.rating - a.metrics.rating
      case 'title': return a.title.localeCompare(b.title)
      default: return 0
    }
  })

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = sortedItems.map(item => item.id)
    setSelectedItems(visibleIds)
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const bulkUpdateStatus = (status: string) => {
    setContentItems(contentItems.map(item => 
      selectedItems.includes(item.id) ? { ...item, status: status as any } : item
    ))
    setSelectedItems([])
  }

  const deleteSelectedItems = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`)) {
      setContentItems(contentItems.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
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
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600">Manage all content across your platform</p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Upload size={16} className="mr-2" />
          Upload Content
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Content</div>
            <FileText size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalItems.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{stats?.storageUsed} storage used</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Views</div>
            <Eye size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalViews || 0)}</div>
          <div className="text-sm text-green-600">+15% vs last month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Engagement</div>
            <Heart size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalLikes || 0)}</div>
          <div className="text-sm text-purple-600">+8% vs last month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Rating</div>
            <Star size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.averageRating.toFixed(1)}/5</div>
          <div className="text-sm text-orange-600">+0.2 vs last month</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="photo">Photos</option>
              <option value="article">Articles</option>
              <option value="gallery">Galleries</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{sortedItems.length} items</span>
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.length} items selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => bulkUpdateStatus('published')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => bulkUpdateStatus('draft')}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Draft
              </button>
              <button
                onClick={() => bulkUpdateStatus('archived')}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Archive
              </button>
              <button
                onClick={deleteSelectedItems}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Grid/List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    selectedItems.includes(item.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedContent(item)
                    setShowDetailsModal(true)
                  }}
                >
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 relative">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className={`p-1 rounded ${item.type === 'video' ? 'bg-red-500' : item.type === 'photo' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}>
                          {getTypeIcon(item.type)}
                        </div>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleItemSelection(item.id)
                          }}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          <span>{item.creator.username}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          <span>{item.destination.iataCode}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-gray-600">
                            <Eye size={14} className="mr-1" />
                            <span>{formatNumber(item.metrics.views)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Heart size={14} className="mr-1" />
                            <span>{formatNumber(item.metrics.likes)}</span>
                          </div>
                          {item.metrics.rating > 0 && (
                            <div className="flex items-center text-gray-600">
                              <Star size={14} className="mr-1" />
                              <span>{item.metrics.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllVisible()
                    } else {
                      clearSelection()
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </div>
            </div>
            
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                  selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItemSelection(item.id)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
                
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getTypeIcon(item.type)}
                    <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{item.description}</p>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 flex-shrink-0">
                  <div>@{item.creator.username}</div>
                  <div>{item.destination.iataCode}</div>
                  <div className="flex items-center">
                    <Eye size={14} className="mr-1" />
                    {formatNumber(item.metrics.views)}
                  </div>
                  <div className="flex items-center">
                    <Heart size={14} className="mr-1" />
                    {formatNumber(item.metrics.likes)}
                  </div>
                  <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedContent(item)
                    setShowDetailsModal(true)
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upload Content</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="text-center py-12">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload New Content</h4>
              <p className="text-gray-600 mb-6">Drag and drop files here or click to browse</p>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Video size={16} className="mr-2" />
                  Upload Video
                </button>
                <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center">
                  <Camera size={16} className="mr-2" />
                  Upload Photos
                </button>
                <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center">
                  <FileText size={16} className="mr-2" />
                  Create Article
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Details Modal */}
      {showDetailsModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedContent.type)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedContent.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedContent.status)}`}>
                    {selectedContent.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Thumbnail */}
              {selectedContent.thumbnail && (
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedContent.thumbnail}
                    alt={selectedContent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Creator:</span>
                      <span className="ml-2 text-gray-900">{selectedContent.creator.name} (@{selectedContent.creator.username})</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Destination:</span>
                      <span className="ml-2 text-gray-900">{selectedContent.destination.cityName}, {selectedContent.destination.countryName}</span>
                    </div>
                    {selectedContent.duration && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 text-gray-900">{formatDuration(selectedContent.duration)}</span>
                      </div>
                    )}
                    {selectedContent.fileSize && (
                      <div>
                        <span className="text-gray-500">File Size:</span>
                        <span className="ml-2 text-gray-900">{selectedContent.fileSize}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedContent.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Views:</span>
                      <span className="text-gray-900 font-medium">{selectedContent.metrics.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Likes:</span>
                      <span className="text-gray-900 font-medium">{selectedContent.metrics.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Shares:</span>
                      <span className="text-gray-900 font-medium">{selectedContent.metrics.shares.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Comments:</span>
                      <span className="text-gray-900 font-medium">{selectedContent.metrics.comments.toLocaleString()}</span>
                    </div>
                    {selectedContent.metrics.rating > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Rating:</span>
                        <span className="text-gray-900 font-medium">{selectedContent.metrics.rating.toFixed(1)}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedContent.description}</p>
              </div>
              
              {/* Tags and Themes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.themes.map((theme, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Edit size={16} className="mr-2" />
                  Edit Content
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
                {selectedContent.url && (
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center">
                    <ExternalLink size={16} className="mr-2" />
                    View Original
                  </button>
                )}
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}