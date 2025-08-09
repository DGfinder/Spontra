'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MapPin, 
  Calendar,
  User,
  Flag,
  Star,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Clock
} from 'lucide-react'
import { ModerationQueue, ModerationAction } from '@/types/admin'

interface FilterState {
  status: string
  priority: string
  contentType: string
  flags: string[]
}

export default function ContentModerationQueue() {
  const [queue, setQueue] = useState<ModerationQueue[]>([])
  const [selectedContent, setSelectedContent] = useState<ModerationQueue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    priority: 'all',
    contentType: 'all',
    flags: []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Mock data - in production this would come from your moderation service
  const mockQueue: ModerationQueue[] = [
    {
      id: '1',
      contentId: 'video_001',
      contentType: 'video',
      submittedAt: '2024-01-15T10:30:00Z',
      priority: 'high',
      status: 'pending',
      flags: [
        {
          id: 'f1',
          type: 'quality_low',
          confidence: 0.78,
          description: 'Video quality below recommended threshold',
          source: 'ai'
        },
        {
          id: 'f2',
          type: 'location_mismatch',
          confidence: 0.65,
          description: 'GPS location does not match claimed destination',
          source: 'ai'
        }
      ],
      creator: {
        id: 'user_001',
        username: 'travel_enthusiast',
        tier: 'contributor',
        trustScore: 7.2
      },
      content: {
        title: 'Amazing Barcelona Nightlife Experience',
        description: 'Join me for an incredible night out in Barcelona! We visited some amazing rooftop bars and clubs.',
        videoUrl: 'https://example.com/video_001.mp4',
        thumbnailUrl: 'https://example.com/thumb_001.jpg',
        duration: 180,
        destination: 'Barcelona, Spain',
        activity: 'nightlife',
        gpsVerified: false
      }
    },
    {
      id: '2',
      contentId: 'video_002',
      contentType: 'video',
      submittedAt: '2024-01-15T09:15:00Z',
      priority: 'medium',
      status: 'pending',
      flags: [
        {
          id: 'f3',
          type: 'inappropriate_content',
          confidence: 0.45,
          description: 'Potential inappropriate language detected',
          source: 'ai'
        }
      ],
      creator: {
        id: 'user_002',
        username: 'adventure_seeker',
        tier: 'ambassador',
        trustScore: 8.9
      },
      content: {
        title: 'Epic Mountain Hiking in Swiss Alps',
        description: 'Incredible day hiking through the Swiss Alps with breathtaking views and challenging trails.',
        videoUrl: 'https://example.com/video_002.mp4',
        thumbnailUrl: 'https://example.com/thumb_002.jpg',
        duration: 240,
        destination: 'Swiss Alps, Switzerland',
        activity: 'adventure',
        gpsVerified: true
      }
    },
    {
      id: '3',
      contentId: 'video_003',
      contentType: 'video',
      submittedAt: '2024-01-15T08:45:00Z',
      priority: 'urgent',
      status: 'pending',
      flags: [
        {
          id: 'f4',
          type: 'spam',
          confidence: 0.92,
          description: 'Content appears to be promotional spam',
          source: 'user_report'
        },
        {
          id: 'f5',
          type: 'copyright',
          confidence: 0.88,
          description: 'Potential copyrighted music detected',
          source: 'ai'
        }
      ],
      creator: {
        id: 'user_003',
        username: 'promo_account',
        tier: 'explorer',
        trustScore: 3.1
      },
      content: {
        title: 'BEST DEALS IN AMSTERDAM - CLICK NOW!',
        description: 'Amazing deals and promotions for Amsterdam travel. Visit our website for exclusive offers!',
        videoUrl: 'https://example.com/video_003.mp4',
        thumbnailUrl: 'https://example.com/thumb_003.jpg',
        duration: 90,
        destination: 'Amsterdam, Netherlands',
        activity: 'shopping',
        gpsVerified: false
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setQueue(mockQueue)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleModerateContent = async (contentId: string, action: ModerationAction['action'], reason?: string) => {
    try {
      // In production, this would call your moderation API
      console.log('Moderating content:', { contentId, action, reason })
      
      // Update local state
      setQueue(prev => prev.filter(item => item.id !== contentId))
      setSelectedContent(null)
      
      // Show success message
      alert(`Content ${action}d successfully`)
    } catch (error) {
      console.error('Moderation failed:', error)
      alert('Failed to moderate content')
    }
  }

  const handleBulkModerate = async (action: ModerationAction['action']) => {
    if (selectedItems.length === 0) return
    
    try {
      // In production, this would be a bulk API call
      console.log('Bulk moderating:', { items: selectedItems, action })
      
      setQueue(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      
      alert(`${selectedItems.length} items ${action}d successfully`)
    } catch (error) {
      console.error('Bulk moderation failed:', error)
      alert('Failed to moderate content')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getFlagColor = (type: string) => {
    switch (type) {
      case 'inappropriate_content': return 'text-red-600 bg-red-100'
      case 'spam': return 'text-purple-600 bg-purple-100'
      case 'copyright': return 'text-indigo-600 bg-indigo-100'
      case 'location_mismatch': return 'text-orange-600 bg-orange-100'
      case 'quality_low': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredQueue = queue.filter(item => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false
    if (filters.contentType !== 'all' && item.contentType !== filters.contentType) return false
    if (searchQuery && !item.content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    // Sort by priority and submission time
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4
    
    if (aPriority !== bPriority) return aPriority - bPriority
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Moderation Queue</h1>
          <p className="text-gray-600">Review and approve user-generated content</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
              <button
                onClick={() => handleBulkModerate('approve')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkModerate('reject')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Reject All
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} className="mr-2" />
            Filters
            <ChevronDown size={16} className="ml-2" />
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="image">Images</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredQueue.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg border cursor-pointer transition-all ${
                selectedContent?.id === item.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedContent(item)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, item.id])
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== item.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {new Date(item.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.flags.length > 0 && (
                      <span className="flex items-center text-red-600 text-sm">
                        <Flag size={14} className="mr-1" />
                        {item.flags.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="flex space-x-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play size={16} className="text-gray-500" />
                    </div>
                  </div>
                  
                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.content.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.content.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <User size={12} className="mr-1" />
                        @{item.creator.username}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {item.content.destination}
                      </div>
                      <div className="flex items-center">
                        <Star size={12} className="mr-1" />
                        Trust: {item.creator.trustScore}/10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                {item.flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.flags.map((flag) => (
                      <span
                        key={flag.id}
                        className={`px-2 py-1 rounded-full text-xs ${getFlagColor(flag.type)}`}
                        title={flag.description}
                      >
                        {flag.type.replace('_', ' ')} ({Math.round(flag.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredQueue.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content to review</h3>
              <p className="text-gray-600">All content has been moderated. Great job!</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedContent ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Content</h3>
              
              {/* Video Preview */}
              <div className="mb-4">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                  <Play size={32} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-600">{selectedContent.content.title}</p>
              </div>

              {/* Creator Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">@{selectedContent.creator.username}</span>
                  <span className="text-xs text-gray-500 capitalize">{selectedContent.creator.tier}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Trust Score</span>
                  <span className={`font-medium ${
                    selectedContent.creator.trustScore >= 8 ? 'text-green-600' :
                    selectedContent.creator.trustScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedContent.creator.trustScore}/10
                  </span>
                </div>
              </div>

              {/* Flags */}
              {selectedContent.flags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Flags</h4>
                  <div className="space-y-2">
                    {selectedContent.flags.map((flag) => (
                      <div key={flag.id} className="p-2 bg-red-50 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-900">
                            {flag.type.replace('_', ' ')}
                          </span>
                          <span className="text-red-600">
                            {Math.round(flag.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-red-700 text-xs">{flag.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleModerateContent(selectedContent.id, 'approve')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve Content
                </button>
                
                <button
                  onClick={() => handleModerateContent(selectedContent.id, 'reject')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle size={16} className="mr-2" />
                  Reject Content
                </button>
                
                <button
                  onClick={() => handleModerateContent(selectedContent.id, 'request_changes')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Request Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Eye size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select content to review</h3>
              <p className="text-gray-600">Choose an item from the queue to see details and moderation options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}