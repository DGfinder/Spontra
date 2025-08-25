'use client'

import { useState, useEffect } from 'react'
import { 
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar,
  MessageSquare,
  Send,
  Settings,
  Filter,
  Search,
  RefreshCw,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Camera,
  Video
} from 'lucide-react'

interface CreatorProfile {
  id: string
  username: string
  email: string
  joinDate: string
  currentTier: 'explorer' | 'contributor' | 'ambassador' | 'creator'
  nextTier?: 'contributor' | 'ambassador' | 'creator'
  tierProgress: number
  trustScore: number
  performance: {
    contentCount: number
    totalViews: number
    totalBookings: number
    averageRating: number
    conversionRate: number
    revenueGenerated: number
  }
  onboarding: {
    status: 'pending' | 'in_progress' | 'completed' | 'needs_attention'
    completedSteps: number
    totalSteps: number
    nextAction: string
    lastActivity: string
  }
  automation: {
    autoTierUpgrade: boolean
    autoContentReview: boolean
    autoPayouts: boolean
    lastAutomatedAction: string
    automationScore: number
  }
  engagement: {
    lastActive: string
    responseRate: number
    contentSubmissionFrequency: string
    communityParticipation: number
  }
}

interface LifecycleAction {
  id: string
  creatorId: string
  type: 'tier_upgrade' | 'tier_downgrade' | 'onboarding_reminder' | 'performance_warning' | 'payout_processed' | 'content_feedback'
  status: 'pending' | 'completed' | 'failed'
  scheduledFor: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  automatedAction: boolean
}

interface CreatorLifecycleData {
  overview: {
    totalCreators: number
    activeCreators: number
    newThisMonth: number
    churned: number
    averageTierProgress: number
    automationEfficiency: number
  }
  tierDistribution: {
    tier: string
    count: number
    percentage: number
    monthlyGrowth: number
  }[]
  pendingActions: LifecycleAction[]
  recentGraduations: {
    creator: string
    fromTier: string
    toTier: string
    date: string
    automated: boolean
  }[]
}

export default function CreatorLifecycleAutomation() {
  const [lifecycleData, setLifecycleData] = useState<CreatorLifecycleData | null>(null)
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'creators' | 'actions' | 'analytics'>('overview')
  const [filterTier, setFilterTier] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Mock data for creator lifecycle management
  const mockLifecycleData: CreatorLifecycleData = {
    overview: {
      totalCreators: 1247,
      activeCreators: 892,
      newThisMonth: 89,
      churned: 23,
      averageTierProgress: 67.3,
      automationEfficiency: 94.2
    },
    
    tierDistribution: [
      { tier: 'Explorer', count: 734, percentage: 58.9, monthlyGrowth: 12.4 },
      { tier: 'Contributor', count: 398, percentage: 31.9, monthlyGrowth: 8.7 },
      { tier: 'Ambassador', count: 89, percentage: 7.1, monthlyGrowth: 15.2 },
      { tier: 'Creator', count: 26, percentage: 2.1, monthlyGrowth: 23.1 }
    ],
    
    pendingActions: [
      {
        id: '1',
        creatorId: 'user_001',
        type: 'tier_upgrade',
        status: 'pending',
        scheduledFor: '2024-01-22T10:00:00Z',
        priority: 'high',
        description: 'Auto-upgrade @travel_enthusiast to Contributor tier',
        automatedAction: true
      },
      {
        id: '2',
        creatorId: 'user_002',
        type: 'onboarding_reminder',
        status: 'pending',
        scheduledFor: '2024-01-21T15:30:00Z',
        priority: 'medium',
        description: 'Send onboarding reminder to @new_traveler (step 3/5)',
        automatedAction: true
      },
      {
        id: '3',
        creatorId: 'user_003',
        type: 'performance_warning',
        status: 'pending',
        scheduledFor: '2024-01-21T14:00:00Z',
        priority: 'urgent',
        description: 'Performance review required for @content_creator',
        automatedAction: false
      }
    ],
    
    recentGraduations: [
      { creator: '@mountain_explorer', fromTier: 'Explorer', toTier: 'Contributor', date: '2024-01-20', automated: true },
      { creator: '@food_adventurer', fromTier: 'Contributor', toTier: 'Ambassador', date: '2024-01-19', automated: true },
      { creator: '@city_guide', fromTier: 'Explorer', toTier: 'Contributor', date: '2024-01-18', automated: true }
    ]
  }

  const mockCreators: CreatorProfile[] = [
    {
      id: 'user_001',
      username: 'travel_enthusiast',
      email: 'travel@example.com',
      joinDate: '2023-11-15',
      currentTier: 'explorer',
      nextTier: 'contributor',
      tierProgress: 94.2,
      trustScore: 8.7,
      performance: {
        contentCount: 15,
        totalViews: 12500,
        totalBookings: 89,
        averageRating: 4.6,
        conversionRate: 7.1,
        revenueGenerated: 2340
      },
      onboarding: {
        status: 'completed',
        completedSteps: 5,
        totalSteps: 5,
        nextAction: 'Ready for tier upgrade evaluation',
        lastActivity: '2024-01-20T14:30:00Z'
      },
      automation: {
        autoTierUpgrade: true,
        autoContentReview: true,
        autoPayouts: true,
        lastAutomatedAction: 'Content auto-approved',
        automationScore: 9.2
      },
      engagement: {
        lastActive: '2024-01-20T16:45:00Z',
        responseRate: 89.5,
        contentSubmissionFrequency: 'weekly',
        communityParticipation: 78
      }
    },
    {
      id: 'user_002',
      username: 'adventure_seeker',
      email: 'adventure@example.com',
      joinDate: '2023-12-01',
      currentTier: 'contributor',
      nextTier: 'ambassador',
      tierProgress: 67.8,
      trustScore: 9.1,
      performance: {
        contentCount: 28,
        totalViews: 34500,
        totalBookings: 167,
        averageRating: 4.8,
        conversionRate: 4.8,
        revenueGenerated: 5670
      },
      onboarding: {
        status: 'completed',
        completedSteps: 5,
        totalSteps: 5,
        nextAction: 'Performance tracking active',
        lastActivity: '2024-01-20T11:20:00Z'
      },
      automation: {
        autoTierUpgrade: true,
        autoContentReview: true,
        autoPayouts: true,
        lastAutomatedAction: 'Weekly payout processed',
        automationScore: 9.8
      },
      engagement: {
        lastActive: '2024-01-20T18:30:00Z',
        responseRate: 94.2,
        contentSubmissionFrequency: 'bi-weekly',
        communityParticipation: 92
      }
    },
    {
      id: 'user_003',
      username: 'new_traveler',
      email: 'newbie@example.com',
      joinDate: '2024-01-10',
      currentTier: 'explorer',
      tierProgress: 23.4,
      trustScore: 6.8,
      performance: {
        contentCount: 3,
        totalViews: 890,
        totalBookings: 5,
        averageRating: 4.2,
        conversionRate: 5.6,
        revenueGenerated: 120
      },
      onboarding: {
        status: 'in_progress',
        completedSteps: 2,
        totalSteps: 5,
        nextAction: 'Upload first video content',
        lastActivity: '2024-01-18T09:15:00Z'
      },
      automation: {
        autoTierUpgrade: false,
        autoContentReview: false,
        autoPayouts: false,
        lastAutomatedAction: 'Welcome email sent',
        automationScore: 4.1
      },
      engagement: {
        lastActive: '2024-01-18T10:00:00Z',
        responseRate: 67.3,
        contentSubmissionFrequency: 'sporadic',
        communityParticipation: 34
      }
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setLifecycleData(mockLifecycleData)
      setCreators(mockCreators)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'explorer': return 'text-gray-600 bg-gray-100'
      case 'contributor': return 'text-blue-600 bg-blue-100'
      case 'ambassador': return 'text-purple-600 bg-purple-100'
      case 'creator': return 'text-gold-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'needs_attention': return 'text-red-600 bg-red-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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

  const handleAutomatedAction = async (actionId: string) => {
    setBulkProcessing(true)
    try {
      // Simulate API call for automated action
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setLifecycleData(prev => prev ? {
        ...prev,
        pendingActions: prev.pendingActions.map(action =>
          action.id === actionId 
            ? { ...action, status: 'completed' as const }
            : action
        )
      } : null)
      
      alert('Automated action completed successfully')
    } catch (error) {
      console.error('Automated action failed:', error)
      alert('Failed to execute automated action')
    } finally {
      setBulkProcessing(false)
    }
  }

  const filteredCreators = creators.filter(creator => {
    if (filterTier !== 'all' && creator.currentTier !== filterTier) return false
    if (searchQuery && !creator.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
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
          <h1 className="text-2xl font-bold text-gray-900">Creator Lifecycle Automation</h1>
          <p className="text-gray-600">Automated creator onboarding, tier management, and performance optimization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'creators', label: 'Creators' },
              { id: 'actions', label: 'Actions' },
              { id: 'analytics', label: 'Analytics' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp size={14} className="mr-1" />
              +{lifecycleData!.overview.newThisMonth}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {lifecycleData!.overview.totalCreators.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Creators</p>
            <p className="text-xs text-gray-500 mt-1">
              {lifecycleData!.overview.activeCreators} active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle size={14} className="mr-1" />
              {lifecycleData!.overview.averageTierProgress.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {lifecycleData!.overview.averageTierProgress.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Avg Tier Progress</p>
            <p className="text-xs text-gray-500 mt-1">across all creators</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <Zap size={14} className="mr-1" />
              {lifecycleData!.overview.automationEfficiency.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {lifecycleData!.overview.automationEfficiency.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Automation Efficiency</p>
            <p className="text-xs text-gray-500 mt-1">automated actions success rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <AlertTriangle size={14} className="mr-1" />
              {lifecycleData!.pendingActions.filter(a => a.status === 'pending').length}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {lifecycleData!.pendingActions.length}
            </div>
            <p className="text-sm text-gray-600">Pending Actions</p>
            <p className="text-xs text-gray-500 mt-1">automated lifecycle tasks</p>
          </div>
        </div>
      </div>

      {/* Main Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Creator Tier Distribution</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {lifecycleData!.tierDistribution.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(tier.tier)}`}>
                        {tier.tier}
                      </span>
                      <span className="text-sm text-gray-900">{tier.count} creators</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${tier.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {tier.percentage.toFixed(1)}%
                      </span>
                      <div className={`flex items-center text-xs ${
                        tier.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tier.monthlyGrowth >= 0 ? (
                          <TrendingUp size={12} className="mr-1" />
                        ) : (
                          <TrendingDown size={12} className="mr-1" />
                        )}
                        {Math.abs(tier.monthlyGrowth).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Tier Graduations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tier Graduations</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {lifecycleData!.recentGraduations.map((graduation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowUp size={16} className="text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{graduation.creator}</div>
                        <div className="text-sm text-gray-600">
                          {graduation.fromTier} → {graduation.toTier}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(graduation.date).toLocaleDateString()}
                      </div>
                      {graduation.automated && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <Zap size={12} className="mr-1" />
                          Auto
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'creators' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Creator Management</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredCreators.length} creators</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Tiers</option>
                <option value="explorer">Explorer</option>
                <option value="contributor">Contributor</option>
                <option value="ambassador">Ambassador</option>
                <option value="creator">Creator</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedCreator?.id === creator.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCreator(creator)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">@{creator.username}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{creator.email}</span>
                          <span>•</span>
                          <span>Joined {new Date(creator.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(creator.currentTier)}`}>
                        {creator.currentTier.charAt(0).toUpperCase() + creator.currentTier.slice(1)}
                      </span>
                      
                      {creator.nextTier && (
                        <div className="text-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${creator.tierProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{creator.tierProgress.toFixed(1)}%</span>
                        </div>
                      )}
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(creator.onboarding.status)}`}>
                        {creator.onboarding.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{creator.performance.contentCount}</div>
                      <div className="text-gray-600">Content</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{creator.performance.totalViews.toLocaleString()}</div>
                      <div className="text-gray-600">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{creator.performance.totalBookings}</div>
                      <div className="text-gray-600">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">€{creator.performance.revenueGenerated.toLocaleString()}</div>
                      <div className="text-gray-600">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${creator.trustScore >= 8 ? 'text-green-600' : creator.trustScore >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {creator.trustScore.toFixed(1)}
                      </div>
                      <div className="text-gray-600">Trust Score</div>
                    </div>
                  </div>

                  {creator.automation.autoTierUpgrade && (
                    <div className="mt-3 flex items-center text-xs text-blue-600">
                      <Zap size={12} className="mr-1" />
                      Automation enabled • Score: {creator.automation.automationScore.toFixed(1)}/10
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'actions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pending Lifecycle Actions</h3>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <RefreshCw size={16} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {lifecycleData!.pendingActions.map((action) => (
                <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        action.type === 'tier_upgrade' ? 'bg-green-100' :
                        action.type === 'tier_downgrade' ? 'bg-red-100' :
                        action.type === 'onboarding_reminder' ? 'bg-blue-100' :
                        action.type === 'performance_warning' ? 'bg-yellow-100' :
                        action.type === 'payout_processed' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        {action.type === 'tier_upgrade' && <ArrowUp size={16} className="text-green-600" />}
                        {action.type === 'tier_downgrade' && <ArrowDown size={16} className="text-red-600" />}
                        {action.type === 'onboarding_reminder' && <Clock size={16} className="text-blue-600" />}
                        {action.type === 'performance_warning' && <AlertTriangle size={16} className="text-yellow-600" />}
                        {action.type === 'payout_processed' && <CheckCircle size={16} className="text-purple-600" />}
                        {action.type === 'content_feedback' && <MessageSquare size={16} className="text-gray-600" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{action.description}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Scheduled: {new Date(action.scheduledFor).toLocaleString()}</span>
                          {action.automatedAction && (
                            <>
                              <span>•</span>
                              <span className="flex items-center text-blue-600">
                                <Zap size={12} className="mr-1" />
                                Automated
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {action.status === 'pending' && action.automatedAction && (
                      <button
                        onClick={() => handleAutomatedAction(action.id)}
                        disabled={bulkProcessing}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Execute Now
                      </button>
                    )}
                    
                    {action.status === 'pending' && !action.automatedAction && (
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        Review
                      </button>
                    )}
                    
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}