'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  MousePointer,
  Share2,
  Zap,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Download,
  Copy,
  Play,
  Pause,
  Square,
  Settings,
  FileText,
  Image,
  Globe,
  Heart,
  X,
  Save,
  ArrowRight,
  MapPin,
  Star,
  Award,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { emailMarketingService, EmailCampaign, EmailStats, EmailSegment } from '@/services/emailMarketingService'

interface ConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

interface ServiceStatus {
  emailProvider: ConnectionStatus
  provider: string | null
}

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'segments' | 'templates' | 'analytics'>('campaigns')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    emailProvider: { connected: false, lastChecked: null, error: null },
    provider: null
  })
  const [error, setError] = useState<string | null>(null)

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    type: 'newsletter' as EmailCampaign['type'],
    segmentId: '',
    scheduledAt: '',
    destinations: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check service connection status
      const connectionStatus = await emailMarketingService.checkConnection()
      setServiceStatus({
        emailProvider: connectionStatus.emailProvider || { connected: false, lastChecked: null, error: null },
        provider: connectionStatus.provider || null
      })

      // Load data if email provider is connected
      if (connectionStatus.emailProvider?.connected) {
        const [statsData, campaignsData, segmentsData] = await Promise.all([
          emailMarketingService.getStats(),
          emailMarketingService.getCampaigns(),
          emailMarketingService.getSegments()
        ])

        setStats(statsData)
        setCampaigns(campaignsData)
        setSegments(segmentsData)
      } else {
        // Set empty state when no connections
        setStats({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalSubscribers: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          totalRevenue: 0,
          deliveredToday: 0,
          scheduledCampaigns: 0
        })
        setCampaigns([])
        setSegments([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load email marketing data'
      setError(errorMessage)
      console.error('Email marketing data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-700 bg-green-100 border-green-200'
      case 'scheduled': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'sending': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'draft': return 'text-gray-700 bg-gray-100 border-gray-200'
      case 'paused': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && campaign.type !== filterType) return false
    if (filterStatus !== 'all' && campaign.status !== filterStatus) return false
    return true
  })

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'openRate': return (b.metrics?.openRate || 0) - (a.metrics?.openRate || 0)
      case 'clickRate': return (b.metrics?.clickRate || 0) - (a.metrics?.clickRate || 0)
      case 'subscribers': return (b.audience?.totalRecipients || 0) - (a.audience?.totalRecipients || 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600">Create, manage, and track email campaigns</p>
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
            disabled={!serviceStatus.emailProvider.connected}
          >
            <Plus size={16} className="mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Campaigns</div>
            <Mail size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalCampaigns || 0)}</div>
          <div className="text-sm text-blue-600">{stats?.activeCampaigns || 0} active</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Subscribers</div>
            <Users size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalSubscribers || 0)}</div>
          <div className="text-sm text-green-600">Email list</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Open Rate</div>
            <Eye size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{(stats?.avgOpenRate || 0).toFixed(1)}%</div>
          <div className="text-sm text-purple-600">Industry benchmark: 21.3%</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Click Rate</div>
            <MousePointer size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{(stats?.avgClickRate || 0).toFixed(1)}%</div>
          <div className="text-sm text-orange-600">Industry benchmark: 2.6%</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
              { id: 'segments', label: 'Segments', count: segments.length },
              { id: 'templates', label: 'Templates', count: null },
              { id: 'analytics', label: 'Analytics', count: null }
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

        {/* Campaigns Tab */}
        {selectedTab === 'campaigns' && (
          <div>
            {!serviceStatus.emailProvider.connected ? (
              <EmptyState />
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Yet</h3>
                <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} className="inline mr-2" />
                  Create Campaign
                </button>
              </div>
            ) : (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
                    
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
                        <option value="newsletter">Newsletter</option>
                        <option value="promotional">Promotional</option>
                        <option value="welcome">Welcome</option>
                        <option value="abandoned_cart">Abandoned Cart</option>
                      </select>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="sent">Sent</option>
                        <option value="paused">Paused</option>
                      </select>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="openRate">Highest Open Rate</option>
                        <option value="clickRate">Highest Click Rate</option>
                        <option value="subscribers">Most Subscribers</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Campaign</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Recipients</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Open Rate</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Click Rate</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Revenue</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  campaign.type === 'newsletter' ? 'text-blue-700 bg-blue-100' :
                                  campaign.type === 'promotional' ? 'text-green-700 bg-green-100' :
                                  'text-gray-700 bg-gray-100'
                                }`}>
                                  {campaign.type}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">{campaign.subject}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {formatNumber(campaign.audience?.totalRecipients || 0)}
                            </div>
                            <div className="text-xs text-gray-500">{campaign.audience?.segmentName}</div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {campaign.metrics ? `${campaign.metrics.openRate.toFixed(1)}%` : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.metrics ? formatNumber(campaign.metrics.opened) : '0'} opens
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {campaign.metrics ? `${campaign.metrics.clickRate.toFixed(1)}%` : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.metrics ? formatNumber(campaign.metrics.clicked) : '0'} clicks
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {campaign.metrics?.revenue ? `$${formatNumber(campaign.metrics.revenue)}` : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.metrics?.conversions ? `${campaign.metrics.conversions} conversions` : '0 conversions'}
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign)
                                  setShowCampaignModal(true)
                                }}
                                className="p-1 text-blue-600 hover:text-blue-700"
                              >
                                <Eye size={16} />
                              </button>
                              <button className="p-1 text-gray-600 hover:text-gray-700">
                                <Edit size={16} />
                              </button>
                              <button className="p-1 text-green-600 hover:text-green-700">
                                <Copy size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Segments Tab */}
        {selectedTab === 'segments' && (
          <div className="p-6">
            {!serviceStatus.emailProvider.connected ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Audience Segmentation</h3>
                <p className="text-gray-600">Advanced audience segmentation coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {selectedTab === 'templates' && (
          <div className="p-6">
            {!serviceStatus.emailProvider.connected ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email Templates</h3>
                <p className="text-gray-600">Template library and editor coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="p-6">
            {!serviceStatus.emailProvider.connected ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">Detailed email performance analytics coming soon</p>
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
    if (serviceStatus.emailProvider.connected) {
      return { 
        connected: true, 
        icon: Wifi, 
        text: `Connected to ${serviceStatus.provider || 'Email Service'}`, 
        color: 'text-green-600' 
      }
    }
    return { connected: false, icon: WifiOff, text: 'Not Connected', color: 'text-red-600' }
  }

  const status = getOverallStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex items-center space-x-2 mt-1">
      <StatusIcon size={14} className={status.color} />
      <span className={`text-sm ${status.color}`}>{status.text}</span>
      {!status.connected && (
        <span className="text-xs text-gray-500">• Configure email service provider</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Mail size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Your Email Service Provider
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To send and manage email campaigns, connect an email service provider like Mailchimp, SendGrid, or Postmark.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Supported Email Providers:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Mailchimp</div>
              <div className="text-sm text-gray-600">Configure Mailchimp API credentials for campaign management</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Send size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">SendGrid</div>
              <div className="text-sm text-gray-600">Set up SendGrid API for transactional and marketing emails</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Postmark</div>
              <div className="text-sm text-gray-600">Connect Postmark for reliable email delivery</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Settings size={12} className="text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Environment Variables</div>
              <div className="text-sm text-gray-600">Add EMAIL_PROVIDER_API_KEY and EMAIL_PROVIDER_TYPE</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure email service provider integrations.
          </div>
        </div>
      </div>
    </div>
  )
}