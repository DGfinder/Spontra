'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Target, 
  BarChart3, 
  Globe, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Plus,
  Filter,
  Zap,
  ExternalLink,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface SEOStats {
  totalKeywords: number
  avgPosition: number
  organicTraffic: number
  clickThroughRate: number
  impressions: number
  clicks: number
}

interface SEOPage {
  id: string
  url: string
  title: string
  type: 'destination' | 'blog' | 'product' | 'category'
  metrics: {
    position: number
    avgPosition: number
    organicTraffic: number
    impressions: number
    clicks: number
    ctr: number
  }
  issues: Array<{
    type: 'critical' | 'warning' | 'info'
    message: string
  }>
  lastCrawled: string
}

interface KeywordOpportunity {
  keyword: string
  searchVolume: number
  difficulty: number
  currentPosition: number | null
  potentialTraffic: number
}

interface ConnectionStatus {
  connected: boolean
  lastSync?: string
  error?: string
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
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    googleSearchConsole: { connected: false },
    googleAnalytics: { connected: false },
    thirdPartyTools: { connected: false }
  })

  useEffect(() => {
    loadSEOData()
  }, [])

  const loadSEOData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/marketing/seo')
      if (!response.ok) {
        throw new Error('Failed to load SEO data')
      }

      const data = await response.json()
      
      if (data.connected) {
        setStats(data.stats || null)
        setPages(data.pages || [])
        setOpportunities(data.opportunities || [])
      }
      
      setServiceStatus({
        googleSearchConsole: {
          connected: data.googleSearchConsole?.connected || false,
          lastSync: data.googleSearchConsole?.lastSync || null,
          error: data.googleSearchConsole?.error || null
        },
        googleAnalytics: {
          connected: data.googleAnalytics?.connected || false,
          lastSync: data.googleAnalytics?.lastSync || null,
          error: data.googleAnalytics?.error || null
        },
        thirdPartyTools: {
          connected: data.thirdPartyTools?.connected || false,
          lastSync: data.thirdPartyTools?.lastSync || null,
          error: data.thirdPartyTools?.error || null
        }
      })
    } catch (err) {
      console.error('SEO data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadSEOData()
  }

  const crawlSite = async () => {
    // This would trigger a site crawl
    console.log('Crawling site for SEO analysis...')
  }

  const optimizePage = async (pageId: string) => {
    // This would trigger page optimization
    console.log('Optimizing page:', pageId)
  }

  const exportReport = () => {
    // This would export SEO report
    console.log('Exporting SEO report...')
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle size={14} className="text-red-600" />
      case 'warning': return <AlertTriangle size={14} className="text-yellow-600" />
      case 'info': return <CheckCircle size={14} className="text-blue-600" />
      default: return <CheckCircle size={14} className="text-gray-600" />
    }
  }

  const getPositionChange = (current: number, previous: number) => {
    const change = previous - current // Lower position number is better
    if (change > 0) return { value: change, trend: 'up', color: 'text-green-600' }
    if (change < 0) return { value: Math.abs(change), trend: 'down', color: 'text-red-600' }
    return { value: 0, trend: 'same', color: 'text-gray-600' }
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

  // Check if SEO services are connected
  const isConnected = serviceStatus.googleSearchConsole.connected || serviceStatus.googleAnalytics.connected

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
            <p className="text-gray-600">Monitor and optimize search engine performance</p>
          </div>
        </div>

        <EmptyState />
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Monitor and optimize search engine performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          <button 
            onClick={crawlSite}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
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

      {/* SEO Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target size={20} className="text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalKeywords)}</div>
                  <p className="text-sm text-gray-600">Total Keywords</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Tracked</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(0)}
                  <span className="text-xs text-gray-500">0%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 size={20} className="text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stats.avgPosition.toFixed(1)}</div>
                  <p className="text-sm text-gray-600">Avg Position</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Overall</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(0)}
                  <span className="text-xs text-gray-500">0%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye size={20} className="text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.organicTraffic)}</div>
                  <p className="text-sm text-gray-600">Organic Traffic</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Monthly</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(0)}
                  <span className="text-xs text-gray-500">0%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target size={20} className="text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{(stats.clickThroughRate * 100).toFixed(1)}%</div>
                  <p className="text-sm text-gray-600">Click-Through Rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Average</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(0)}
                  <span className="text-xs text-gray-500">0%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages and keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="destination">Destinations</option>
                <option value="blog">Blog Posts</option>
                <option value="product">Products</option>
                <option value="category">Categories</option>
              </select>

              <select
                value={filterIssues}
                onChange={(e) => setFilterIssues(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Issues</option>
                <option value="critical">Critical Issues</option>
                <option value="warning">Warnings</option>
                <option value="clean">No Issues</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="traffic">Sort by Traffic</option>
                <option value="position">Sort by Position</option>
                <option value="ctr">Sort by CTR</option>
                <option value="issues">Sort by Issues</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pages Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traffic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <span className="truncate max-w-xs">{page.url}</span>
                        <ExternalLink size={12} />
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                        {page.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{page.metrics.avgPosition.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatNumber(page.metrics.organicTraffic)}</div>
                      <div className="text-xs text-gray-500">{formatNumber(page.metrics.impressions)} impressions</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="font-medium">{(page.metrics.ctr * 100).toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      {page.issues.length > 0 ? (
                        <>
                          {getIssueIcon(page.issues[0].type)}
                          <span className="text-sm font-medium">{page.issues.length}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-sm text-green-600">Clean</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPage(page)
                          setShowPageModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => optimizePage(page.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Optimize
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keyword Opportunities */}
      {opportunities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Keyword Opportunities</h3>
            <p className="text-sm text-gray-600">High-potential keywords to target</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map((opportunity, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{opportunity.keyword}</h4>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {formatNumber(opportunity.searchVolume)} searches
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Difficulty: {opportunity.difficulty}/100</span>
                    <span>Traffic: +{formatNumber(opportunity.potentialTraffic)}</span>
                  </div>
                  <div className="mt-2">
                    {opportunity.currentPosition ? (
                      <span className="text-xs text-gray-500">Current: #{opportunity.currentPosition}</span>
                    ) : (
                      <span className="text-xs text-blue-600">Not ranking</span>
                    )}
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

function EmptyState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Search size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        SEO Tools Not Connected
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Connect your Google Search Console and Google Analytics to start monitoring your SEO performance.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Integrations:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Google Search Console</div>
              <div className="text-sm text-gray-600">Track search performance, keywords, and indexing</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Google Analytics</div>
              <div className="text-sm text-gray-600">Monitor organic traffic and user behavior</div>
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