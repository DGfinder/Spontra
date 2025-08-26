'use client'

import { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Globe,
  Heart,
  Share2,
  MousePointer,
  Zap,
  Award,
  Settings,
  Download,
  Upload,
  Copy,
  Send,
  X,
  Save,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { marketingCampaignsService, Campaign, CampaignStats, CreateCampaignRequest } from '@/services/marketingCampaignsService'

interface ConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

interface ServiceStatus {
  campaigns: ConnectionStatus
  analytics: ConnectionStatus
}

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    campaigns: { connected: false, lastChecked: null, error: null },
    analytics: { connected: false, lastChecked: null, error: null }
  })
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'awareness' as Campaign['type'],
    priority: 'medium' as Campaign['priority'],
    startDate: '',
    endDate: '',
    budget: 0,
    destinations: [] as string[],
    channels: [] as Array<'email' | 'social' | 'push' | 'web' | 'influencer'>
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check service connection status
      const connectionStatus = await marketingCampaignsService.checkConnection()
      setServiceStatus(prev => ({
        ...prev,
        campaigns: {
          connected: connectionStatus.connected,
          lastChecked: new Date(),
          error: connectionStatus.error || null
        }
      }))

      if (connectionStatus.connected) {
        // Load campaigns and stats if service is connected
        const [campaignsData, statsData] = await Promise.all([
          marketingCampaignsService.getCampaigns({
            search: searchQuery,
            type: filterType !== 'all' ? filterType : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            sortBy,
            page: 1,
            limit: 20
          }),
          marketingCampaignsService.getCampaignStats()
        ])

        setCampaigns(campaignsData.campaigns)
        setHasMore(campaignsData.hasMore)
        setStats(statsData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign data'
      setError(errorMessage)
      console.error('Failed to load campaigns:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadData()
  }

  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true)
      const campaignRequest: CreateCampaignRequest = {
        name: newCampaign.name,
        description: newCampaign.description,
        type: newCampaign.type,
        priority: newCampaign.priority,
        startDate: newCampaign.startDate,
        endDate: newCampaign.endDate,
        budget: newCampaign.budget,
        destinations: newCampaign.destinations,
        channels: newCampaign.channels
      }

      const createdCampaign = await marketingCampaignsService.createCampaign(campaignRequest)
      setCampaigns([createdCampaign, ...campaigns])
      setShowCreateModal(false)
      
      // Reset form
      setNewCampaign({
        name: '',
        description: '',
        type: 'awareness',
        priority: 'medium',
        startDate: '',
        endDate: '',
        budget: 0,
        destinations: [],
        channels: []
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200'
      case 'scheduled': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'paused': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'completed': return 'text-gray-700 bg-gray-100 border-gray-200'
      case 'draft': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'cancelled': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'awareness': return <Eye size={16} className="text-blue-500" />
      case 'conversion': return <Target size={16} className="text-green-500" />
      case 'engagement': return <Heart size={16} className="text-purple-500" />
      case 'retention': return <Users size={16} className="text-orange-500" />
      case 'seasonal': return <Calendar size={16} className="text-red-500" />
      default: return <Megaphone size={16} className="text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const ConnectionStatusIndicator = () => (
    <div className="flex items-center space-x-2 text-sm">
      {serviceStatus.campaigns.connected ? (
        <>
          <Wifi size={16} className="text-green-500" />
          <span className="text-green-600">Service Connected</span>
          {serviceStatus.campaigns.lastChecked && (
            <span className="text-gray-500">
              • Last checked: {serviceStatus.campaigns.lastChecked.toLocaleTimeString()}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff size={16} className="text-red-500" />
          <span className="text-red-600">Service Disconnected</span>
          {serviceStatus.campaigns.error && (
            <span className="text-gray-500">
              • {serviceStatus.campaigns.error}
            </span>
          )}
        </>
      )}
    </div>
  )

  const EmptyState = () => (
    <div className="text-center py-12">
      <Megaphone size={48} className="mx-auto text-gray-400 mb-4" />
      {serviceStatus.campaigns.connected ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first marketing campaign.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <Plus size={16} className="mr-2" />
            Create Campaign
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Marketing Campaigns Service Not Connected</h3>
          <p className="text-gray-600 mb-4">Connect your marketing campaigns service to manage campaigns.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-medium text-yellow-800 mb-2">To connect campaigns service:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>1. Configure NEXT_PUBLIC_MARKETING_API_URL environment variable</li>
              <li>2. Set up marketing campaigns database/API</li>
              <li>3. Ensure authentication is properly configured</li>
            </ul>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <RefreshCw size={16} className="mr-2" />
            Check Connection
          </button>
        </>
      )}
    </div>
  )

  const LoadingState = () => (
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

  if (isLoading && campaigns.length === 0) {
    return <LoadingState />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
          <p className="text-gray-600">Manage and track marketing campaigns across all channels</p>
          <div className="mt-2">
            <ConnectionStatusIndicator />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {serviceStatus.campaigns.connected && (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download size={16} className="mr-2" />
                Export Report
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus size={16} className="mr-2" />
                New Campaign
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-red-500 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {serviceStatus.campaigns.connected && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Total Campaigns</div>
              <Megaphone size={20} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</div>
            <div className="text-sm text-blue-600">{stats.activeCampaigns} active</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Total Budget</div>
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</div>
            <div className="text-sm text-green-600">{formatCurrency(stats.totalSpent)} spent</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Average ROAS</div>
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageROAS.toFixed(1)}x</div>
            <div className="text-sm text-purple-600">Return on ad spend</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Total Conversions</div>
              <Target size={20} className="text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalConversions)}</div>
            <div className="text-sm text-orange-600">{stats.averageCTR.toFixed(1)}% avg CTR</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {campaigns.length === 0 && !isLoading ? (
        <EmptyState />
      ) : serviceStatus.campaigns.connected ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">All Campaigns</h3>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
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
                  <option value="awareness">Awareness</option>
                  <option value="conversion">Conversion</option>
                  <option value="engagement">Engagement</option>
                  <option value="retention">Retention</option>
                  <option value="seasonal">Seasonal</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name A-Z</option>
                  <option value="budget">Highest Budget</option>
                  <option value="performance">Best Performance</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Campaign List */}
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(campaign.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{campaign.description}</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Campaign Details */}
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Duration & Budget</div>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Calendar size={12} className="mr-2 text-gray-400" />
                                <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <DollarSign size={12} className="mr-2 text-gray-400" />
                                <span>{formatCurrency(campaign.budget.allocated)} allocated</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(campaign.budget.spent)} spent ({((campaign.budget.spent / campaign.budget.allocated) * 100).toFixed(0)}%)
                              </div>
                            </div>
                          </div>
                          
                          {/* Performance Metrics */}
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Performance</div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Impressions</span>
                                <span className="font-medium">{formatNumber(campaign.metrics.impressions)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">CTR</span>
                                <span className="font-medium">{campaign.metrics.ctr.toFixed(2)}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">ROAS</span>
                                <span className={`font-medium ${campaign.metrics.roas >= 3 ? 'text-green-600' : campaign.metrics.roas >= 2 ? 'text-orange-600' : 'text-red-600'}`}>
                                  {campaign.metrics.roas.toFixed(1)}x
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Targeting */}
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Targeting</div>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <MapPin size={12} className="mr-2 text-gray-400" />
                                <span>{campaign.targeting.destinations.join(', ')}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Users size={12} className="mr-2 text-gray-400" />
                                <span>{campaign.targeting.demographics.ageRange}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {campaign.targeting.channels.map((channel, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {channel}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Team */}
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Team</div>
                            <div className="space-y-1">
                              {campaign.team.slice(0, 3).map((member, index) => (
                                <div key={index} className="flex items-center text-sm">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-2">
                                    <span className="text-white text-xs font-bold">
                                      {member.name.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="text-gray-600">{member.name}</span>
                                  <span className="ml-1 text-gray-400 text-xs">({member.role})</span>
                                </div>
                              ))}
                              {campaign.team.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{campaign.team.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setShowCampaignModal(true)
                      }}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded">
                      <Edit size={16} />
                    </button>
                    {campaign.status === 'active' ? (
                      <button className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded">
                        <Pause size={16} />
                      </button>
                    ) : campaign.status === 'paused' ? (
                      <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded">
                        <Play size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Campaign Detail Modal */}
      {showCampaignModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedCampaign.type)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCampaign.name}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedCampaign.status)}`}>
                    {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                  </div>
                </div>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                  <p className="text-gray-700 mb-4">{selectedCampaign.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-medium capitalize">{selectedCampaign.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedCampaign.startDate).toLocaleDateString()} - {new Date(selectedCampaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Budget</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedCampaign.budget.allocated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Spent</span>
                      <span className="text-sm font-medium text-orange-600">
                        {formatCurrency(selectedCampaign.budget.spent)} ({((selectedCampaign.budget.spent / selectedCampaign.budget.allocated) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(selectedCampaign.metrics.impressions)}
                      </div>
                      <div className="text-sm text-gray-600">Impressions</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(selectedCampaign.metrics.clicks)}
                      </div>
                      <div className="text-sm text-gray-600">Clicks</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCampaign.metrics.ctr.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">CTR</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className={`text-2xl font-bold ${
                        selectedCampaign.metrics.roas >= 3 ? 'text-green-600' : 
                        selectedCampaign.metrics.roas >= 2 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedCampaign.metrics.roas.toFixed(1)}x
                      </div>
                      <div className="text-sm text-gray-600">ROAS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Create New Campaign</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Describe your campaign objectives and target audience"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value as Campaign['type']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="awareness">Awareness</option>
                    <option value="conversion">Conversion</option>
                    <option value="engagement">Engagement</option>
                    <option value="retention">Retention</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newCampaign.priority}
                    onChange={(e) => setNewCampaign({...newCampaign, priority: e.target.value as Campaign['priority']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget (€)</label>
                  <input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({...newCampaign, budget: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                <Save size={16} className="mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}