'use client'

import { useState, useEffect } from 'react'
import {
  Camera,
  Video,
  FileText,
  User,
  MapPin,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp,
  Award,
  Shield,
  Download,
  Share2,
  MoreHorizontal,
  X,
  ThumbsUp,
  ThumbsDown,
  Send,
  Edit,
  Trash2
} from 'lucide-react'

interface UGCSubmission {
  id: string
  title: string
  description: string
  type: 'video' | 'photo' | 'review' | 'story' | 'tip'
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'featured'
  submittedAt: string
  approvedAt?: string
  thumbnail?: string
  content: string // URL or text content
  creator: {
    id: string
    name: string
    username: string
    avatar?: string
    level: 'bronze' | 'silver' | 'gold' | 'diamond'
    totalSubmissions: number
    approvedSubmissions: number
    followers: number
    verified: boolean
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
    comments: number
    reports: number
    qualityScore: number // AI-generated quality score
  }
  moderation: {
    aiFlags: string[]
    humanReviewed: boolean
    reviewedBy?: string
    reviewNotes?: string
    contentWarnings?: string[]
  }
  rewards?: {
    pointsEarned: number
    badgesEarned: string[]
    featured: boolean
  }
}

interface UGCStats {
  totalSubmissions: number
  pendingReview: number
  approvedToday: number
  rejectedToday: number
  averageQualityScore: number
  topContributor: string
  submissionsByType: Record<string, number>
  submissionsByStatus: Record<string, number>
}

export default function UGCManagementPage() {
  const [submissions, setSubmissions] = useState<UGCSubmission[]>([])
  const [stats, setStats] = useState<UGCStats | null>(null)
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [filterQuality, setFilterQuality] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedSubmission, setSelectedSubmission] = useState<UGCSubmission | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')

  // Mock data
  const mockStats: UGCStats = {
    totalSubmissions: 3247,
    pendingReview: 89,
    approvedToday: 23,
    rejectedToday: 7,
    averageQualityScore: 7.8,
    topContributor: 'travel_sarah',
    submissionsByType: {
      photo: 1456,
      video: 892,
      review: 567,
      story: 234,
      tip: 98
    },
    submissionsByStatus: {
      approved: 2234,
      pending: 89,
      rejected: 456,
      flagged: 23,
      featured: 445
    }
  }

  const mockSubmissions: UGCSubmission[] = [
    {
      id: '1',
      title: 'Hidden rooftop bar in Barcelona',
      description: 'Found this amazing rooftop bar with incredible views of Sagrada Familia! The sunset here is absolutely magical.',
      type: 'photo',
      status: 'pending',
      submittedAt: '2024-01-22T14:30:00Z',
      thumbnail: '/images/ugc/barcelona-rooftop.jpg',
      content: '/images/ugc/barcelona-rooftop-full.jpg',
      creator: {
        id: '1',
        name: 'Sarah Johnson',
        username: 'travel_sarah',
        avatar: '/images/creators/sarah.jpg',
        level: 'gold',
        totalSubmissions: 47,
        approvedSubmissions: 42,
        followers: 1250,
        verified: true
      },
      destination: {
        iataCode: 'BCN',
        cityName: 'Barcelona',
        countryName: 'Spain'
      },
      tags: ['rooftop', 'bar', 'sunset', 'views', 'hidden gem'],
      themes: ['vibe', 'indulge'],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        reports: 0,
        qualityScore: 8.7
      },
      moderation: {
        aiFlags: [],
        humanReviewed: false,
        contentWarnings: []
      }
    },
    {
      id: '2',
      title: 'Prague Castle at Golden Hour',
      description: 'Captured this stunning video of Prague Castle during golden hour. The light was absolutely perfect!',
      type: 'video',
      status: 'pending',
      submittedAt: '2024-01-22T10:15:00Z',
      thumbnail: '/images/ugc/prague-castle-thumb.jpg',
      content: '/videos/ugc/prague-castle.mp4',
      creator: {
        id: '2',
        name: 'David Novak',
        username: 'prague_explorer',
        avatar: '/images/creators/david.jpg',
        level: 'silver',
        totalSubmissions: 23,
        approvedSubmissions: 19,
        followers: 680,
        verified: false
      },
      destination: {
        iataCode: 'PRG',
        cityName: 'Prague',
        countryName: 'Czech Republic'
      },
      tags: ['castle', 'golden hour', 'architecture', 'historic'],
      themes: ['discover', 'nature'],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        reports: 0,
        qualityScore: 9.1
      },
      moderation: {
        aiFlags: [],
        humanReviewed: false,
        contentWarnings: []
      }
    },
    {
      id: '3',
      title: 'Best gelato in Rome - comprehensive review',
      description: 'After trying 15+ gelaterias in Rome, here\'s my definitive ranking of the best authentic gelato spots locals actually go to.',
      type: 'review',
      status: 'flagged',
      submittedAt: '2024-01-21T16:45:00Z',
      content: 'Long review text content...',
      creator: {
        id: '3',
        name: 'Marco Rossi',
        username: 'gelato_critic',
        level: 'bronze',
        totalSubmissions: 8,
        approvedSubmissions: 5,
        followers: 234,
        verified: false
      },
      destination: {
        iataCode: 'ROM',
        cityName: 'Rome',
        countryName: 'Italy'
      },
      tags: ['gelato', 'food', 'local', 'authentic', 'review'],
      themes: ['indulge', 'discover'],
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        reports: 2,
        qualityScore: 6.8
      },
      moderation: {
        aiFlags: ['potential-spam', 'promotional-content'],
        humanReviewed: false,
        contentWarnings: ['May contain promotional content']
      }
    },
    {
      id: '4',
      title: 'Amsterdam canal cruise tips',
      description: 'Local insider tips for getting the most out of your Amsterdam canal cruise experience.',
      type: 'tip',
      status: 'approved',
      submittedAt: '2024-01-20T09:20:00Z',
      approvedAt: '2024-01-21T11:30:00Z',
      creator: {
        id: '4',
        name: 'Emma Van Der Berg',
        username: 'amsterdam_local',
        avatar: '/images/creators/emma.jpg',
        level: 'diamond',
        totalSubmissions: 156,
        approvedSubmissions: 142,
        followers: 3400,
        verified: true
      },
      destination: {
        iataCode: 'AMS',
        cityName: 'Amsterdam',
        countryName: 'Netherlands'
      },
      tags: ['canal cruise', 'tips', 'local advice', 'boats'],
      themes: ['discover', 'vibe'],
      metrics: {
        views: 2340,
        likes: 187,
        shares: 43,
        comments: 29,
        reports: 0,
        qualityScore: 9.3
      },
      moderation: {
        aiFlags: [],
        humanReviewed: true,
        reviewedBy: 'admin_user',
        reviewNotes: 'High quality local content, approved for featuring.',
        contentWarnings: []
      },
      rewards: {
        pointsEarned: 150,
        badgesEarned: ['Local Expert', 'Quality Contributor'],
        featured: true
      }
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSubmissions(mockSubmissions)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to load UGC data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-red-500" />
      case 'photo': return <Camera size={16} className="text-blue-500" />
      case 'review': return <Star size={16} className="text-yellow-500" />
      case 'story': return <FileText size={16} className="text-green-500" />
      case 'tip': return <Award size={16} className="text-purple-500" />
      default: return <FileText size={16} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-500" />
      case 'rejected': return <XCircle size={16} className="text-red-500" />
      case 'flagged': return <Flag size={16} className="text-orange-500" />
      case 'featured': return <Star size={16} className="text-yellow-500" />
      case 'pending': return <Clock size={16} className="text-gray-500" />
      default: return <Clock size={16} className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'flagged': return 'text-orange-600 bg-orange-100'
      case 'featured': return 'text-yellow-600 bg-yellow-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUserLevelBadge = (level: string) => {
    const colors = {
      bronze: 'text-orange-700 bg-orange-100',
      silver: 'text-gray-700 bg-gray-100',
      gold: 'text-yellow-700 bg-yellow-100',
      diamond: 'text-blue-700 bg-blue-100'
    }
    return colors[level as keyof typeof colors] || colors.bronze
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (searchQuery && !submission.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !submission.creator.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && submission.type !== filterType) return false
    if (filterStatus !== 'all' && submission.status !== filterStatus) return false
    if (filterQuality === 'high' && submission.metrics.qualityScore < 8) return false
    if (filterQuality === 'low' && submission.metrics.qualityScore >= 6) return false
    return true
  })

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      case 'oldest': return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      case 'quality': return b.metrics.qualityScore - a.metrics.qualityScore
      case 'reports': return b.metrics.reports - a.metrics.reports
      default: return 0
    }
  })

  const handleApproval = async (submissionId: string, approved: boolean) => {
    setSubmissions(submissions.map(sub =>
      sub.id === submissionId
        ? {
            ...sub,
            status: approved ? 'approved' : 'rejected',
            approvedAt: approved ? new Date().toISOString() : undefined,
            moderation: {
              ...sub.moderation,
              humanReviewed: true,
              reviewedBy: 'current_admin',
              reviewNotes: reviewNotes
            }
          }
        : sub
    ))
    
    setReviewNotes('')
    setSelectedSubmission(null)
    setShowDetailsModal(false)
  }

  const handleFeature = (submissionId: string) => {
    setSubmissions(submissions.map(sub =>
      sub.id === submissionId
        ? {
            ...sub,
            status: 'featured',
            rewards: {
              ...sub.rewards,
              pointsEarned: (sub.rewards?.pointsEarned || 0) + 100,
              badgesEarned: [...(sub.rewards?.badgesEarned || []), 'Featured Content'],
              featured: true
            }
          }
        : sub
    ))
  }

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    )
  }

  const bulkApprove = () => {
    setSubmissions(submissions.map(sub =>
      selectedSubmissions.includes(sub.id)
        ? { ...sub, status: 'approved', approvedAt: new Date().toISOString() }
        : sub
    ))
    setSelectedSubmissions([])
  }

  const bulkReject = () => {
    setSubmissions(submissions.map(sub =>
      selectedSubmissions.includes(sub.id)
        ? { ...sub, status: 'rejected' }
        : sub
    ))
    setSelectedSubmissions([])
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
          <h1 className="text-2xl font-bold text-gray-900">User Generated Content</h1>
          <p className="text-gray-600">Review and manage community submissions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Award size={16} className="mr-2" />
            Creator Rewards
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Shield size={16} className="mr-2" />
            Content Guidelines
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Pending Review</div>
            <Clock size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.pendingReview}</div>
          <div className="text-sm text-orange-600">Requires attention</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Approved Today</div>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.approvedToday}</div>
          <div className="text-sm text-green-600">+{((stats?.approvedToday || 0) / (stats?.rejectedToday || 1) * 100).toFixed(0)}% approval rate</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Quality Score</div>
            <Star size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.averageQualityScore.toFixed(1)}/10</div>
          <div className="text-sm text-purple-600">+0.3 vs last week</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Top Contributor</div>
            <User size={20} className="text-blue-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">@{stats?.topContributor}</div>
          <div className="text-sm text-blue-600">142 approved submissions</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <Video size={24} className="mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.submissionsByType.video}</div>
            <div className="text-sm text-gray-600">Videos</div>
          </div>
          <div className="text-center">
            <Camera size={24} className="mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.submissionsByType.photo}</div>
            <div className="text-sm text-gray-600">Photos</div>
          </div>
          <div className="text-center">
            <Star size={24} className="mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.submissionsByType.review}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <FileText size={24} className="mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.submissionsByType.story}</div>
            <div className="text-sm text-gray-600">Stories</div>
          </div>
          <div className="text-center">
            <Award size={24} className="mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.submissionsByType.tip}</div>
            <div className="text-sm text-gray-600">Tips</div>
          </div>
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
                placeholder="Search submissions..."
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
              <option value="review">Reviews</option>
              <option value="story">Stories</option>
              <option value="tip">Tips</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
              <option value="featured">Featured</option>
            </select>

            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Quality</option>
              <option value="high">High Quality (8+)</option>
              <option value="low">Needs Review (&lt;6)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="quality">Quality Score</option>
              <option value="reports">Most Reports</option>
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{sortedSubmissions.length} submissions</span>
            
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
        {selectedSubmissions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedSubmissions.length} submissions selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={bulkApprove}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <CheckCircle size={14} className="mr-1" />
                Approve All
              </button>
              <button
                onClick={bulkReject}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <XCircle size={14} className="mr-1" />
                Reject All
              </button>
              <button
                onClick={() => setSelectedSubmissions([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submissions Grid/List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    selectedSubmissions.includes(submission.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="relative">
                    {submission.thumbnail ? (
                      <div className="aspect-video bg-gray-200 relative">
                        <img
                          src={submission.thumbnail}
                          alt={submission.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        {getTypeIcon(submission.type)}
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => toggleSubmissionSelection(submission.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      {getTypeIcon(submission.type)}
                      {submission.moderation.aiFlags.length > 0 && (
                        <Flag size={16} className="text-orange-500" />
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-black bg-opacity-75 text-white`}>
                        Score: <span className={getQualityScoreColor(submission.metrics.qualityScore)}>
                          {submission.metrics.qualityScore.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{submission.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{submission.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {submission.creator.avatar && (
                          <img
                            src={submission.creator.avatar}
                            alt={submission.creator.username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-900">@{submission.creator.username}</span>
                          {submission.creator.verified && (
                            <CheckCircle size={12} className="text-blue-500" />
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getUserLevelBadge(submission.creator.level)}`}>
                          {submission.creator.level}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={12} className="mr-1" />
                        <span>{submission.destination.iataCode}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3 text-gray-600">
                        {submission.metrics.views > 0 && (
                          <div className="flex items-center">
                            <Eye size={12} className="mr-1" />
                            <span>{submission.metrics.views}</span>
                          </div>
                        )}
                        {submission.metrics.likes > 0 && (
                          <div className="flex items-center">
                            <Heart size={12} className="mr-1" />
                            <span>{submission.metrics.likes}</span>
                          </div>
                        )}
                        {submission.metrics.reports > 0 && (
                          <div className="flex items-center text-orange-600">
                            <Flag size={12} className="mr-1" />
                            <span>{submission.metrics.reports}</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="p-4 bg-gray-50 flex items-center space-x-4">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSubmissions(sortedSubmissions.map(s => s.id))
                  } else {
                    setSelectedSubmissions([])
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 flex-1">Select All</span>
            </div>
            
            {sortedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                  selectedSubmissions.includes(submission.id) ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSubmissions.includes(submission.id)}
                  onChange={() => toggleSubmissionSelection(submission.id)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
                
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {submission.thumbnail && (
                    <img
                      src={submission.thumbnail}
                      alt={submission.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getTypeIcon(submission.type)}
                    <h3 className="font-medium text-gray-900 truncate">{submission.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                    {submission.moderation.aiFlags.length > 0 && (
                      <Flag size={16} className="text-orange-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>@{submission.creator.username}</span>
                    <span>{submission.destination.iataCode}</span>
                    <span className={getQualityScoreColor(submission.metrics.qualityScore)}>
                      Score: {submission.metrics.qualityScore.toFixed(1)}
                    </span>
                    <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedSubmission(submission)
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

      {/* Review Modal */}
      {showDetailsModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedSubmission.type)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedSubmission.title}</h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status}
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
              {/* Content Preview */}
              {selectedSubmission.thumbnail && (
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedSubmission.thumbnail}
                    alt={selectedSubmission.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedSubmission.description}</p>
              </div>
              
              {/* Creator Info and Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Creator Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {selectedSubmission.creator.avatar && (
                        <img
                          src={selectedSubmission.creator.avatar}
                          alt={selectedSubmission.creator.username}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{selectedSubmission.creator.name}</span>
                          {selectedSubmission.creator.verified && (
                            <CheckCircle size={16} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">@{selectedSubmission.creator.username}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getUserLevelBadge(selectedSubmission.creator.level)}`}>
                            {selectedSubmission.creator.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{selectedSubmission.creator.totalSubmissions}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{selectedSubmission.creator.approvedSubmissions}</div>
                        <div className="text-gray-600">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{selectedSubmission.creator.followers}</div>
                        <div className="text-gray-600">Followers</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Quality & Moderation</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Score:</span>
                      <span className={`font-semibold ${getQualityScoreColor(selectedSubmission.metrics.qualityScore)}`}>
                        {selectedSubmission.metrics.qualityScore.toFixed(1)}/10
                      </span>
                    </div>
                    
                    {selectedSubmission.moderation.aiFlags.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">AI Flags:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedSubmission.moderation.aiFlags.map((flag, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedSubmission.metrics.reports > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reports:</span>
                        <span className="font-semibold text-red-600">{selectedSubmission.metrics.reports}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tags and Themes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.themes.map((theme, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Review Notes */}
              {selectedSubmission.status === 'pending' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Review Notes (Optional)</h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Add notes about your review decision..."
                  />
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="text-sm text-gray-900">{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {selectedSubmission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproval(selectedSubmission.id, false)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                      >
                        <ThumbsDown size={16} className="mr-2" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproval(selectedSubmission.id, true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                      >
                        <ThumbsUp size={16} className="mr-2" />
                        Approve
                      </button>
                    </>
                  )}
                  
                  {selectedSubmission.status === 'approved' && (
                    <button
                      onClick={() => handleFeature(selectedSubmission.id)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                    >
                      <Star size={16} className="mr-2" />
                      Feature Content
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}