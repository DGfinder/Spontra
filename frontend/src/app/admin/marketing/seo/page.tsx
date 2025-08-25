'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  Eye,
  MousePointer,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  FileText,
  Users,
  MapPin,
  Star,
  Zap,
  Award,
  Activity,
  Filter,
  Settings,
  X,
  Save,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wifi,
  WifiOff
} from 'lucide-react'
import { seoService, SEOStats, SEOPage, KeywordOpportunity } from '@/services/seoService'

interface ConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

interface ServiceStatus {
  googleSearchConsole: ConnectionStatus
  googleAnalytics: ConnectionStatus
  thirdPartyTools: ConnectionStatus
}

export default function SEOManagementPage() {
  const [pages, setPages] = useState<SEOPage[]>([])
  const [stats, setStats] = useState<SEOStats | null>(null)
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<SEOPage | null>(null)
  const [showPageModal, setShowPageModal] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterIssues, setFilterIssues] = useState('all')
  const [sortBy, setSortBy] = useState('traffic')
  const [selectedTab, setSelectedTab] = useState<'pages' | 'keywords' | 'opportunities' | 'issues'>('pages')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    googleSearchConsole: { connected: false, lastChecked: null, error: null },
    googleAnalytics: { connected: false, lastChecked: null, error: null },
    thirdPartyTools: { connected: false, lastChecked: null, error: null }
  })
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check service connection status
      const connectionStatus = await seoService.checkConnection()
      setServiceStatus({
        googleSearchConsole: connectionStatus.googleSearchConsole || { connected: false, lastChecked: null, error: null },
        googleAnalytics: connectionStatus.googleAnalytics || { connected: false, lastChecked: null, error: null },
        thirdPartyTools: connectionStatus.thirdPartyTools || { connected: false, lastChecked: null, error: null }
      })

      // Load data if services are connected
      if (connectionStatus.googleSearchConsole?.connected || connectionStatus.googleAnalytics?.connected) {
        const [statsData, pagesData, opportunitiesData] = await Promise.all([
          seoService.getStats(),
          seoService.getPages(),
          seoService.getOpportunities()
        ])

        setStats(statsData)
        setPages(pagesData)
        setOpportunities(opportunitiesData)
      } else {
        // Set empty state when no connections
        setStats({
          totalPages: 0,
          organicTraffic: 0,
          avgPosition: 0,
          totalKeywords: 0,
          rankingKeywords: 0,
          criticalIssues: 0,
          opportunityScore: 0,
          monthlyGrowth: 0
        })
        setPages([])
        setOpportunities([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SEO data'
      setError(errorMessage)
      console.error('SEO data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'warning': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'info': return 'text-blue-700 bg-blue-100 border-blue-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={14} className="text-red-500" />
      case 'warning': return <Clock size={14} className="text-orange-500" />
      case 'info': return <CheckCircle size={14} className="text-blue-500" />
      default: return <AlertTriangle size={14} className="text-gray-500" />
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp size={14} className="text-green-500" />
    if (trend < 0) return <TrendingDown size={14} className="text-red-500" />
    return <Minus size={14} className="text-gray-500" />
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const filteredPages = pages.filter(page => {
    if (searchQuery && !page.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !page.url.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && page.type !== filterType) return false
    if (filterIssues !== 'all') {
      if (filterIssues === 'critical' && !page.issues.some(issue => issue.type === 'critical')) return false
      if (filterIssues === 'warning' && !page.issues.some(issue => issue.type === 'warning')) return false
      if (filterIssues === 'clean' && page.issues.length > 0) return false
    }
    return true
  })

  const sortedPages = [...filteredPages].sort((a, b) => {
    switch (sortBy) {
      case 'traffic': return b.metrics.organicTraffic - a.metrics.organicTraffic
      case 'position': return a.metrics.avgPosition - b.metrics.avgPosition
      case 'ctr': return b.metrics.ctr - a.metrics.ctr
      case 'issues': return b.issues.length - a.issues.length
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
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Monitor and optimize search engine performance</p>
          <ConnectionStatusIndicator serviceStatus={serviceStatus} />
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
            <RefreshCw size={16} className="mr-2" />
            Crawl Site
          </button>
          <button 
            onClick={() => setShowOptimizeModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Zap size={16} className="mr-2" />
            Auto-Optimize
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Organic Traffic</div>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.organicTraffic || 0)}</div>
          <div className="text-sm text-green-600">+{stats?.monthlyGrowth.toFixed(1)}% this month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Position</div>
            <Target size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.avgPosition.toFixed(1)}</div>
          <div className="text-sm text-blue-600">Search ranking</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Keywords</div>
            <Search size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalKeywords || 0)}</div>
          <div className="text-sm text-purple-600">{formatNumber(stats?.rankingKeywords || 0)} ranking</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Opportunity Score</div>
            <Award size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.opportunityScore.toFixed(0)}/100</div>
          <div className="text-sm text-orange-600">{stats?.criticalIssues} critical issues</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'pages', label: 'Pages', count: pages.length },
              { id: 'keywords', label: 'Keywords', count: stats?.totalKeywords },
              { id: 'opportunities', label: 'Opportunities', count: opportunities.length },
              { id: 'issues', label: 'Issues', count: stats?.criticalIssues }
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
                {tab.count && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {typeof tab.count === 'number' ? formatNumber(tab.count) : tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Pages Tab */}
        {selectedTab === 'pages' && (
          <div>
            {!serviceStatus.googleSearchConsole.connected && !serviceStatus.googleAnalytics.connected ? (
              <EmptyState />
            ) : (
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">Page Performance</h3>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search pages..."
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
                    <option value="destination">Destinations</option>
                    <option value="experience">Experiences</option>
                    <option value="blog">Blog</option>
                    <option value="category">Categories</option>
                    <option value="home">Home</option>
                  </select>
                  
                  <select
                    value={filterIssues}
                    onChange={(e) => setFilterIssues(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="all">All Pages</option>
                    <option value="critical">Critical Issues</option>
                    <option value="warning">Warnings</option>
                    <option value="clean">No Issues</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="traffic">Most Traffic</option>
                    <option value="position">Best Position</option>
                    <option value="ctr">Highest CTR</option>
                    <option value="issues">Most Issues</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Page</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Traffic</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Position</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">CTR</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Issues</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Keywords</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate max-w-md">{page.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              page.type === 'destination' ? 'text-blue-700 bg-blue-100' :
                              page.type === 'blog' ? 'text-green-700 bg-green-100' :
                              'text-gray-700 bg-gray-100'
                            }`}>
                              {page.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 truncate max-w-md">{page.url}</div>
                          {page.destination && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin size={10} className="mr-1" />
                              {page.destination.cityName}, {page.destination.countryName}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{formatNumber(page.metrics.organicTraffic)}</div>
                          <div className="text-xs text-gray-500">{formatNumber(page.metrics.impressions)} impressions</div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className={`font-semibold ${
                          page.metrics.avgPosition <= 5 ? 'text-green-600' :
                          page.metrics.avgPosition <= 10 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          #{page.metrics.avgPosition.toFixed(1)}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{page.metrics.ctr.toFixed(2)}%</div>
                          <div className="text-xs text-gray-500">{formatNumber(page.metrics.clicks)} clicks</div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {page.issues.map((issue, index) => (
                            <div key={index} className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getIssueColor(issue.type)}`}>
                              {getIssueIcon(issue.type)}
                              <span>{issue.type}</span>
                            </div>
                          ))}
                          {page.issues.length === 0 && (
                            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs border text-green-700 bg-green-100 border-green-200">
                              <CheckCircle size={12} />
                              <span>Clean</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{page.keywords.length}</div>
                        <div className="text-xs text-gray-500">
                          Top: {page.keywords[0]?.keyword.slice(0, 20)}...
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPage(page)
                              setShowPageModal(true)
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-700">
                            <Edit size={16} />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-700">
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* Keywords Tab */}
        {selectedTab === 'keywords' && (
          <div className="p-6">
            {!serviceStatus.googleSearchConsole.connected ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keyword Research</h3>
                <p className="text-gray-600">Detailed keyword analysis and tracking coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {selectedTab === 'opportunities' && (
          <div>
            {!serviceStatus.googleSearchConsole.connected ? (
              <EmptyState />
            ) : opportunities.length === 0 ? (
              <div className="p-6">
                <div className="text-center py-12">
                  <Target size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
                  <p className="text-gray-600">We're analyzing your data to find keyword opportunities</p>
                </div>
              </div>
            ) : (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Keyword Opportunities</h3>
              <p className="text-gray-600">Potential keywords to target for improved rankings</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {opportunities.map((opportunity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{opportunity.keyword}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {formatNumber(opportunity.volume)} searches/mo
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          opportunity.difficulty <= 30 ? 'bg-green-100 text-green-700' :
                          opportunity.difficulty <= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {opportunity.difficulty}% difficulty
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Current:</span>
                          <span className="font-medium">
                            {opportunity.currentPosition ? `#${opportunity.currentPosition}` : 'Not ranking'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-medium text-green-600">#{opportunity.targetPosition}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Est. Traffic:</span>
                          <span className="font-medium text-blue-600">+{formatNumber(opportunity.estimatedTraffic)}/mo</span>
                        </div>
                        {opportunity.competitorUrl && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Competitor:</span>
                            <span className="font-medium text-orange-600">{opportunity.competitorUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        Target
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-700">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Issues Tab */}
        {selectedTab === 'issues' && (
          <div className="p-6">
            {!serviceStatus.googleSearchConsole.connected ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">SEO Issues</h3>
                <p className="text-gray-600">Site-wide SEO audit and issue tracking coming soon</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page Detail Modal */}
      {showPageModal && selectedPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Page SEO Details</h3>
                <button
                  onClick={() => setShowPageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Page Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div><strong>URL:</strong> {selectedPage.url}</div>
                      <div><strong>Title:</strong> {selectedPage.title}</div>
                      <div><strong>Meta Description:</strong> {selectedPage.metaDescription}</div>
                      <div><strong>Type:</strong> <span className="capitalize">{selectedPage.type}</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Organic Traffic</span>
                        <span className="font-medium">{formatNumber(selectedPage.metrics.organicTraffic)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Position</span>
                        <span className="font-medium">#{selectedPage.metrics.avgPosition.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CTR</span>
                        <span className="font-medium">{selectedPage.metrics.ctr.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions</span>
                        <span className="font-medium">{selectedPage.metrics.conversions}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Keywords</h4>
                    <div className="space-y-2">
                      {selectedPage.keywords.map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium text-sm">{keyword.keyword}</div>
                            <div className="text-xs text-gray-500">
                              {formatNumber(keyword.volume)} searches • {keyword.intent}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">#{keyword.position}</span>
                            {getTrendIcon(keyword.trend)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedPage.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">SEO Issues</h4>
                    <div className="space-y-3">
                      {selectedPage.issues.map((issue, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${getIssueColor(issue.type)}`}>
                          <div className="flex items-start space-x-3">
                            {getIssueIcon(issue.type)}
                            <div className="flex-1">
                              <div className="font-medium mb-1">{issue.description}</div>
                              <div className="text-sm opacity-90">{issue.recommendation}</div>
                              <div className="text-xs opacity-75 mt-1 capitalize">{issue.category} • {issue.type}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConnectionStatusIndicator({ serviceStatus }: { serviceStatus: ServiceStatus }) {
  const getOverallStatus = () => {
    if (serviceStatus.googleSearchConsole.connected || serviceStatus.googleAnalytics.connected) {
      return { connected: true, icon: Wifi, text: 'Connected', color: 'text-green-600' }
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
        <span className="text-xs text-gray-500">• Configure Google APIs to get started</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Search size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Your SEO Data Sources
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To view SEO performance data, connect Google Search Console and Google Analytics.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Setup Requirements:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Google Search Console</div>
              <div className="text-sm text-gray-600">Configure OAuth credentials and verify domain ownership</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Google Analytics</div>
              <div className="text-sm text-gray-600">Set up Analytics API access for traffic data</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Settings size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Environment Variables</div>
              <div className="text-sm text-gray-600">Add GOOGLE_SEARCH_CONSOLE_CLIENT_ID and GOOGLE_ANALYTICS_CLIENT_ID</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure these integrations.
          </div>
        </div>
      </div>
    </div>
  )
}