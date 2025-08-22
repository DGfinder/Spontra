'use client'

import { useState, useEffect } from 'react'
import { 
  Brain,
  Eye,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  FileText,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Search,
  Grid,
  BarChart3,
  Settings,
  Wand2,
  Globe,
  Camera
} from 'lucide-react'

interface ContentAnalysis {
  id: string
  contentId: string
  type: 'image' | 'video' | 'text'
  title: string
  creator: string
  destination: string
  aiScores: {
    imageQuality: number
    locationVerification: number
    brandCompliance: number
    contentAuthenticity: number
    overallScore: number
  }
  flags: {
    type: 'quality' | 'location' | 'brand' | 'authenticity' | 'safety'
    severity: 'low' | 'medium' | 'high'
    description: string
    aiConfidence: number
  }[]
  status: 'approved' | 'rejected' | 'flagged' | 'processing'
  automatedAction: boolean
  submittedAt: string
}

interface ContentGap {
  destination: string
  activityType: string
  missingCount: number
  demandScore: number
  competitorCoverage: number
  priority: 'high' | 'medium' | 'low'
  seasonalRelevance: number
  suggestedCreators: string[]
}

interface ContentIntelligenceData {
  aiModeration: {
    totalProcessed: number
    autoApproved: number
    flaggedForReview: number
    averageProcessingTime: number
    accuracyRate: number
    topFlags: { type: string; count: number }[]
  }
  
  qualityAnalysis: {
    averageQualityScore: number
    qualityDistribution: { range: string; count: number }[]
    improvementSuggestions: number
    qualityTrends: { date: string; score: number }[]
  }
  
  contentGaps: {
    totalGaps: number
    highPriorityGaps: number
    gapsByDestination: ContentGap[]
    contentCoverageScore: number
    seasonalGaps: number
  }
  
  performanceInsights: {
    topPerformingContent: { id: string; title: string; score: number; bookings: number }[]
    contentConversionRates: { type: string; rate: number }[]
    creatorPerformanceFactors: { factor: string; impact: number }[]
  }
}

export default function ContentIntelligenceDashboard() {
  const [contentData, setContentData] = useState<ContentIntelligenceData | null>(null)
  const [recentAnalysis, setRecentAnalysis] = useState<ContentAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'analysis' | 'gaps' | 'insights'>('overview')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for content intelligence
  const mockContentData: ContentIntelligenceData = {
    aiModeration: {
      totalProcessed: 1456,
      autoApproved: 1289,
      flaggedForReview: 167,
      averageProcessingTime: 2.3,
      accuracyRate: 96.7,
      topFlags: [
        { type: 'Image Quality', count: 89 },
        { type: 'Location Mismatch', count: 34 },
        { type: 'Brand Safety', count: 28 },
        { type: 'Authenticity', count: 16 }
      ]
    },
    
    qualityAnalysis: {
      averageQualityScore: 8.4,
      qualityDistribution: [
        { range: '9.0-10.0', count: 456 },
        { range: '8.0-8.9', count: 634 },
        { range: '7.0-7.9', count: 278 },
        { range: '6.0-6.9', count: 88 }
      ],
      improvementSuggestions: 234,
      qualityTrends: [
        { date: '2024-01-01', score: 8.1 },
        { date: '2024-01-08', score: 8.2 },
        { date: '2024-01-15', score: 8.4 },
        { date: '2024-01-22', score: 8.3 }
      ]
    },
    
    contentGaps: {
      totalGaps: 47,
      highPriorityGaps: 12,
      gapsByDestination: [
        {
          destination: 'Barcelona',
          activityType: 'spa_treatments',
          missingCount: 8,
          demandScore: 87,
          competitorCoverage: 92,
          priority: 'high',
          seasonalRelevance: 78,
          suggestedCreators: ['wellness_guru', 'travel_luxury', 'spa_seeker']
        },
        {
          destination: 'Amsterdam',
          activityType: 'cooking_classes',
          missingCount: 6,
          demandScore: 82,
          competitorCoverage: 85,
          priority: 'high',
          seasonalRelevance: 90,
          suggestedCreators: ['foodie_traveler', 'culinary_adventures']
        },
        {
          destination: 'Rome',
          activityType: 'luxury_shopping',
          missingCount: 5,
          demandScore: 75,
          competitorCoverage: 88,
          priority: 'medium',
          seasonalRelevance: 65,
          suggestedCreators: ['fashion_travel', 'luxury_lifestyle']
        }
      ],
      contentCoverageScore: 78,
      seasonalGaps: 15
    },
    
    performanceInsights: {
      topPerformingContent: [
        { id: '1', title: 'Barcelona Rooftop Bars Guide', score: 9.4, bookings: 156 },
        { id: '2', title: 'Amsterdam Canal Food Tour', score: 9.2, bookings: 134 },
        { id: '3', title: 'Rome Hidden Gems Walking', score: 9.1, bookings: 123 }
      ],
      contentConversionRates: [
        { type: 'Video Tours', rate: 15.7 },
        { type: 'Photo Stories', rate: 12.3 },
        { type: 'Activity Guides', rate: 18.2 },
        { type: 'Restaurant Reviews', rate: 11.8 }
      ],
      creatorPerformanceFactors: [
        { factor: 'High-quality images', impact: 23.4 },
        { factor: 'Accurate location data', impact: 18.9 },
        { factor: 'Engaging descriptions', impact: 16.7 },
        { factor: 'Optimal posting time', impact: 12.3 }
      ]
    }
  }

  const mockRecentAnalysis: ContentAnalysis[] = [
    {
      id: '1',
      contentId: 'content_001',
      type: 'image',
      title: 'Sagrada Familia Sunset Views',
      creator: 'travel_photographer',
      destination: 'Barcelona',
      aiScores: {
        imageQuality: 9.2,
        locationVerification: 9.8,
        brandCompliance: 8.7,
        contentAuthenticity: 9.1,
        overallScore: 9.2
      },
      flags: [],
      status: 'approved',
      automatedAction: true,
      submittedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      contentId: 'content_002',
      type: 'video',
      title: 'Amsterdam Food Market Tour',
      creator: 'foodie_explorer',
      destination: 'Amsterdam',
      aiScores: {
        imageQuality: 7.8,
        locationVerification: 9.5,
        brandCompliance: 9.0,
        contentAuthenticity: 8.9,
        overallScore: 8.8
      },
      flags: [
        {
          type: 'quality',
          severity: 'low',
          description: 'Some footage appears slightly shaky',
          aiConfidence: 72
        }
      ],
      status: 'flagged',
      automatedAction: false,
      submittedAt: '2024-01-20T13:15:00Z'
    },
    {
      id: '3',
      contentId: 'content_003',
      type: 'image',
      title: 'Rome Colosseum Night Photo',
      creator: 'night_photographer',
      destination: 'Rome',
      aiScores: {
        imageQuality: 6.2,
        locationVerification: 8.9,
        brandCompliance: 8.5,
        contentAuthenticity: 5.8,
        overallScore: 7.4
      },
      flags: [
        {
          type: 'quality',
          severity: 'medium',
          description: 'Image quality below recommended threshold',
          aiConfidence: 89
        },
        {
          type: 'authenticity',
          severity: 'medium',
          description: 'Possible heavy post-processing detected',
          aiConfidence: 76
        }
      ],
      status: 'rejected',
      automatedAction: true,
      submittedAt: '2024-01-20T12:45:00Z'
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setContentData(mockContentData)
      setRecentAnalysis(mockRecentAnalysis)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'flagged': return 'text-yellow-600 bg-yellow-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600'
    if (score >= 7.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredAnalysis = recentAnalysis.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Content Intelligence</h1>
          <p className="text-gray-600">AI-powered content analysis, quality control, and gap identification</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Grid },
              { id: 'analysis', label: 'Analysis', icon: Brain },
              { id: 'gaps', label: 'Gaps', icon: Target },
              { id: 'insights', label: 'Insights', icon: BarChart3 }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as any)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <view.icon size={16} className="mr-2" />
                {view.label}
              </button>
            ))}
          </div>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw size={16} className="mr-2" />
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle size={14} className="mr-1" />
              {contentData!.aiModeration.accuracyRate}% accurate
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contentData!.aiModeration.totalProcessed.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">AI Processed Content</p>
            <p className="text-xs text-gray-500 mt-1">
              {contentData!.aiModeration.autoApproved} auto-approved
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp size={14} className="mr-1" />
              +0.3 vs last week
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contentData!.qualityAnalysis.averageQualityScore.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Average Quality Score</p>
            <p className="text-xs text-gray-500 mt-1">
              {contentData!.qualityAnalysis.improvementSuggestions} suggestions generated
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <AlertTriangle size={14} className="mr-1" />
              {contentData!.contentGaps.highPriorityGaps} high priority
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contentData!.contentGaps.totalGaps}
            </div>
            <p className="text-sm text-gray-600">Content Gaps Identified</p>
            <p className="text-xs text-gray-500 mt-1">
              {contentData!.contentGaps.contentCoverageScore}% coverage score
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <Zap size={14} className="mr-1" />
              {contentData!.aiModeration.averageProcessingTime}s avg
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contentData!.aiModeration.flaggedForReview}
            </div>
            <p className="text-sm text-gray-600">Flagged for Review</p>
            <p className="text-xs text-gray-500 mt-1">requiring human attention</p>
          </div>
        </div>
      </div>

      {/* Main Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Moderation Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI Moderation Status</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {contentData!.aiModeration.autoApproved}
                  </div>
                  <div className="text-sm text-green-700">Auto-approved</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {contentData!.aiModeration.flaggedForReview}
                  </div>
                  <div className="text-sm text-yellow-700">Flagged for review</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Top Flag Reasons</h4>
                <div className="space-y-2">
                  {contentData!.aiModeration.topFlags.map((flag, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{flag.type}</span>
                      <span className="text-sm font-medium text-gray-900">{flag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quality Distribution</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {contentData!.qualityAnalysis.qualityDistribution.map((range, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{range.range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${(range.count / Math.max(...contentData!.qualityAnalysis.qualityDistribution.map(r => r.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {range.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'analysis' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Content Analysis</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredAnalysis.length} items</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredAnalysis.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {analysis.type === 'image' ? <ImageIcon size={16} /> :
                         analysis.type === 'video' ? <Video size={16} /> :
                         <FileText size={16} />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{analysis.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>@{analysis.creator}</span>
                          <span>•</span>
                          <span>{analysis.destination}</span>
                          <span>•</span>
                          <span>{new Date(analysis.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                        {analysis.status}
                      </span>
                      {analysis.automatedAction && (
                        <Zap size={14} className="text-blue-500" title="Automated decision" />
                      )}
                    </div>
                  </div>

                  {/* AI Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    {Object.entries(analysis.aiScores).map(([key, score]) => (
                      <div key={key} className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                          {score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flags */}
                  {analysis.flags.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-900">Flags</h5>
                      {analysis.flags.map((flag, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 rounded">
                          <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm text-yellow-800">{flag.description}</div>
                            <div className="text-xs text-yellow-600">
                              {flag.severity} severity • {flag.aiConfidence}% confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {analysis.status === 'flagged' && (
                        <>
                          <button className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                            <CheckCircle size={14} className="mr-1" />
                            Approve
                          </button>
                          <button className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                            <XCircle size={14} className="mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                        Details
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Overall Score: <span className={`font-medium ${getScoreColor(analysis.aiScores.overallScore)}`}>
                        {analysis.aiScores.overallScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'gaps' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Content Gap Analysis</h3>
                <p className="text-sm text-gray-600">Identified opportunities for content creation</p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Settings size={16} className="mr-1" />
                Configure
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {contentData!.contentGaps.gapsByDestination.map((gap, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <MapPin size={16} className="text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{gap.destination}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {gap.activityType.replace('_', ' ')} activities
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                      {gap.priority} priority
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{gap.missingCount}</div>
                      <div className="text-xs text-gray-600">Missing Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{gap.demandScore}</div>
                      <div className="text-xs text-gray-600">Demand Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{gap.competitorCoverage}%</div>
                      <div className="text-xs text-gray-600">Competitor Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{gap.seasonalRelevance}%</div>
                      <div className="text-xs text-gray-600">Seasonal Relevance</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Suggested Creators:</div>
                      <div className="flex flex-wrap gap-1">
                        {gap.suggestedCreators.map((creator, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            @{creator}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      <Wand2 size={14} className="mr-2" />
                      Create Content Brief
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Top Performing Content */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Top Performing Content</h4>
                <div className="space-y-2">
                  {contentData!.performanceInsights.topPerformingContent.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{content.title}</div>
                        <div className="text-sm text-gray-600">{content.bookings} bookings</div>
                      </div>
                      <div className={`text-lg font-bold ${getScoreColor(content.score)}`}>
                        {content.score.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Rates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Content Conversion Rates</h4>
                <div className="space-y-2">
                  {contentData!.performanceInsights.contentConversionRates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{rate.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${(rate.rate / 20) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {rate.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Creator Performance Factors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Creator Performance Factors</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {contentData!.performanceInsights.creatorPerformanceFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{factor.factor}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                          style={{ width: `${(factor.impact / 25) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-purple-600 w-12">
                        +{factor.impact.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Target size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">AI Recommendation</div>
                    <div className="text-sm text-blue-800 mt-1">
                      Focus on creator training for image quality and location accuracy. 
                      These factors show the highest correlation with booking conversions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}