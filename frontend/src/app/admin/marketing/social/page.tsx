'use client'

import { useState, useEffect } from 'react'
import {
  Share2,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageCircle,
  Eye,
  Users,
  BarChart3,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Search,
  Filter,
  ExternalLink,
  Play,
  Image,
  Video,
  FileText,
  Hash,
  AtSign,
  MapPin,
  Clock,
  Target,
  Zap,
  Award,
  Activity,
  MousePointer,
  Star,
  Settings,
  Copy,
  Send,
  X,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { socialMediaService, SocialPost, SocialStats, ContentIdea } from '@/services/socialMediaService'

interface ConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

interface PlatformStatus {
  [key: string]: ConnectionStatus
}

interface ServiceStatus {
  platforms: PlatformStatus
  connectedCount: number
  totalPlatforms: number
}

export default function SocialMediaPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedTab, setSelectedTab] = useState<'posts' | 'analytics' | 'ideas' | 'calendar'>('posts')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    platforms: {
      instagram: { connected: false, lastChecked: null, error: null },
      facebook: { connected: false, lastChecked: null, error: null },
      twitter: { connected: false, lastChecked: null, error: null },
      youtube: { connected: false, lastChecked: null, error: null },
      linkedin: { connected: false, lastChecked: null, error: null },
      tiktok: { connected: false, lastChecked: null, error: null }
    },
    connectedCount: 0,
    totalPlatforms: 6
  })
  const [error, setError] = useState<string | null>(null)

  const [newPost, setNewPost] = useState({
    platforms: [] as string[],
    content: '',
    mediaType: 'image' as SocialPost['content']['mediaType'],
    hashtags: [] as string[],
    scheduledAt: '',
    destination: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check service connection status
      const connectionStatus = await socialMediaService.checkConnections()
      const platformsObj = (connectionStatus.platforms || []).reduce((acc: any, platform: any) => {
        acc[platform.platform] = platform
        return acc
      }, {})
      const connectedCount = Object.values(platformsObj).filter((p: any) => p.connected).length
      
      setServiceStatus({
        platforms: platformsObj,
        connectedCount,
        totalPlatforms: 6
      })

      // Load data if any platforms are connected
      if (connectedCount > 0) {
        const [statsData, postsData, ideasData] = await Promise.all([
          socialMediaService.getSocialStats(),
          socialMediaService.getPosts({}),
          socialMediaService.getContentIdeas({})
        ])

        setStats(statsData)
        setPosts(postsData.posts || [])
        setContentIdeas(ideasData || [])
      } else {
        // Set empty state when no connections
        setStats({
          totalPosts: 0,
          totalFollowers: 0,
          totalImpressions: 0,
          avgEngagementRate: 0,
          topPerformingPost: '',
          growthRate: 0,
          platformBreakdown: []
        })
        setPosts([])
        setContentIdeas([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load social media data'
      setError(errorMessage)
      console.error('Social media data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram size={16} className="text-pink-600" />
      case 'facebook': return <Facebook size={16} className="text-blue-600" />
      case 'twitter': return <Twitter size={16} className="text-sky-500" />
      case 'youtube': return <Youtube size={16} className="text-red-600" />
      case 'linkedin': return <Linkedin size={16} className="text-blue-700" />
      case 'tiktok': return <Video size={16} className="text-black" />
      default: return <Share2 size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-700 bg-green-100 border-green-200'
      case 'scheduled': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'draft': return 'text-gray-700 bg-gray-100 border-gray-200'
      case 'failed': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const filteredPosts = posts.filter(post => {
    if (searchQuery && !post.content.text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterPlatform !== 'all' && post.platform !== filterPlatform) return false
    if (filterStatus !== 'all' && post.status !== filterStatus) return false
    return true
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'engagement': return (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0)
      case 'reach': return (b.metrics?.reach || 0) - (a.metrics?.reach || 0)
      case 'likes': return (b.metrics?.likes || 0) - (a.metrics?.likes || 0)
      default: return 0
    }
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
          <p className="text-gray-600">Manage content across all social platforms</p>
          <ConnectionStatusIndicator serviceStatus={serviceStatus} />
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={serviceStatus.connectedCount === 0}
          >
            <Plus size={16} className="mr-2" />
            Create Post
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Posts</div>
            <Share2 size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalPosts || 0)}</div>
          <div className="text-sm text-blue-600">Across {serviceStatus.connectedCount} platforms</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Followers</div>
            <Users size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalFollowers || 0)}</div>
          <div className="text-sm text-green-600">Combined audience</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Impressions</div>
            <Eye size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalImpressions || 0)}</div>
          <div className="text-sm text-purple-600">This month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Engagement</div>
            <Heart size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{(stats?.avgEngagementRate || 0).toFixed(1)}%</div>
          <div className="text-sm text-red-600">
            {stats?.growthRate && stats.growthRate > 0 ? 
              <span className="flex items-center"><TrendingUp size={12} className="mr-1" />+{stats.growthRate.toFixed(1)}%</span> :
              <span className="flex items-center"><TrendingDown size={12} className="mr-1" />{stats?.growthRate?.toFixed(1) || 0}%</span>
            }
          </div>
        </div>
      </div>

      {/* Platform Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(serviceStatus.platforms).map(([platform, status]) => (
            <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(platform)}
                <span className="text-sm font-medium capitalize">{platform}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'posts', label: 'Posts', count: posts.length },
              { id: 'analytics', label: 'Analytics', count: null },
              { id: 'ideas', label: 'Content Ideas', count: contentIdeas.length },
              { id: 'calendar', label: 'Calendar', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formatNumber(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Posts Tab */}
        {selectedTab === 'posts' && (
          <div>
            {serviceStatus.connectedCount === 0 ? (
              <EmptyState />
            ) : posts.length === 0 ? (
              <div className="p-12 text-center">
                <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600 mb-6">Create your first social media post to get started</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} className="inline mr-2" />
                  Create Post
                </button>
              </div>
            ) : (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Social Media Posts</h3>
                    
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search posts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-3 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                      
                      <select
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="all">All Platforms</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter</option>
                        <option value="youtube">YouTube</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                        <option value="failed">Failed</option>
                      </select>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="engagement">Highest Engagement</option>
                        <option value="reach">Highest Reach</option>
                        <option value="likes">Most Likes</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {sortedPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(post.platform)}
                          <span className="text-sm font-medium capitalize">{post.platform}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-900 line-clamp-3">{post.content.text}</p>
                        {post.content.hashtags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.content.hashtags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs text-blue-600">#{tag}</span>
                            ))}
                            {post.content.hashtags.length > 3 && (
                              <span className="text-xs text-gray-500">+{post.content.hashtags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {post.metrics && (
                        <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{formatNumber(post.metrics.likes)}</div>
                            <div className="text-gray-500">Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{formatNumber(post.metrics.comments)}</div>
                            <div className="text-gray-500">Comments</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{post.metrics.engagementRate.toFixed(1)}%</div>
                            <div className="text-gray-500">Engagement</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPost(post)
                              setShowPostModal(true)
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Eye size={14} />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-700">
                            <Edit size={14} />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-700">
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="p-6">
            {serviceStatus.connectedCount === 0 ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">Detailed social media analytics coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Content Ideas Tab */}
        {selectedTab === 'ideas' && (
          <div className="p-6">
            {serviceStatus.connectedCount === 0 ? (
              <EmptyState />
            ) : contentIdeas.length === 0 ? (
              <div className="text-center py-12">
                <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Ideas</h3>
                <p className="text-gray-600">AI-powered content ideas will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contentIdeas.map((idea, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{idea.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{idea.contentType}</span>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Use Idea</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {selectedTab === 'calendar' && (
          <div className="p-6">
            {serviceStatus.connectedCount === 0 ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Content Calendar</h3>
                <p className="text-gray-600">Schedule and organize your content coming soon</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ConnectionStatusIndicator({ serviceStatus }: { serviceStatus: ServiceStatus }) {
  const getOverallStatus = () => {
    if (serviceStatus.connectedCount > 0) {
      return { 
        connected: true, 
        icon: Wifi, 
        text: `${serviceStatus.connectedCount}/${serviceStatus.totalPlatforms} platforms connected`, 
        color: 'text-green-600' 
      }
    }
    return { connected: false, icon: WifiOff, text: 'No platforms connected', color: 'text-red-600' }
  }

  const status = getOverallStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex items-center space-x-2 mt-1">
      <StatusIcon size={14} className={status.color} />
      <span className={`text-sm ${status.color}`}>{status.text}</span>
      {!status.connected && (
        <span className="text-xs text-gray-500">• Connect social media accounts</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Share2 size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Your Social Media Accounts
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To manage social media content, connect your accounts from various platforms.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Supported Platforms:</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Instagram size={12} className="text-pink-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Instagram</div>
              <div className="text-sm text-gray-600">Posts, Stories, Reels</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Facebook size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Facebook</div>
              <div className="text-sm text-gray-600">Posts, Pages, Stories</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Twitter size={12} className="text-sky-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Twitter</div>
              <div className="text-sm text-gray-600">Tweets, Threads</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Youtube size={12} className="text-red-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">YouTube</div>
              <div className="text-sm text-gray-600">Videos, Shorts, Community</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Linkedin size={12} className="text-blue-700" />
            </div>
            <div>
              <div className="font-medium text-gray-900">LinkedIn</div>
              <div className="text-sm text-gray-600">Posts, Articles, Company</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Video size={12} className="text-gray-700" />
            </div>
            <div>
              <div className="font-medium text-gray-900">TikTok</div>
              <div className="text-sm text-gray-600">Videos, Trends</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure social media platform integrations.
          </div>
        </div>
      </div>
    </div>
  )
}