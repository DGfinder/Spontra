'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
  ExternalLink,
  Award,
  Zap,
  Globe,
  CreditCard,
  PieChart,
  FileText,
  Download,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Percent,
  Wifi,
  WifiOff
} from 'lucide-react'
import { RevenueDashboard } from '@/components/RevenueDashboard'

interface FinancialMetrics {
  totalRevenue: number
  totalCommissions: number
  totalBookings: number
  averageBookingValue: number
  conversionRate: number
  revenueGrowth: number
  commissionsGrowth: number
  bookingsGrowth: number
  topPerformingDestinations: Array<{
    destination: string
    revenue: number
    bookings: number
    commissions: number
  }>
  partnerPerformance: Array<{
    partnerId: string
    partnerName: string
    revenue: number
    commissions: number
    conversionRate: number
    bookings: number
    status: 'active' | 'inactive' | 'pending'
  }>
  monthlyTrends: Array<{
    month: string
    revenue: number
    commissions: number
    bookings: number
  }>
  connectionStatus: {
    analytics: boolean
    affiliateNetworks: boolean
    paymentProcessors: boolean
    lastSynced: string | null
    errors: string[]
  }
}

interface ConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

interface ServiceStatus {
  analytics: ConnectionStatus
  affiliateNetworks: ConnectionStatus
  paymentProcessors: ConnectionStatus
}

export default function FinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30d')
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    analytics: { connected: false, lastChecked: null, error: null },
    affiliateNetworks: { connected: false, lastChecked: null, error: null },
    paymentProcessors: { connected: false, lastChecked: null, error: null }
  })

  useEffect(() => {
    loadFinancialData()
  }, [timeframe, selectedPartner])

  const loadFinancialData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check service connections first
      const [analyticsStatus, affiliateStatus, paymentStatus] = await Promise.allSettled([
        checkAnalyticsConnection(),
        checkAffiliateConnection(), 
        checkPaymentConnection()
      ])

      setServiceStatus({
        analytics: analyticsStatus.status === 'fulfilled' ? analyticsStatus.value : { connected: false, lastChecked: new Date(), error: 'Connection failed' },
        affiliateNetworks: affiliateStatus.status === 'fulfilled' ? affiliateStatus.value : { connected: false, lastChecked: new Date(), error: 'Connection failed' },
        paymentProcessors: paymentStatus.status === 'fulfilled' ? paymentStatus.value : { connected: false, lastChecked: new Date(), error: 'Connection failed' }
      })

      // Load financial data if any services are connected
      const hasConnection = (
        (analyticsStatus.status === 'fulfilled' && analyticsStatus.value.connected) ||
        (affiliateStatus.status === 'fulfilled' && affiliateStatus.value.connected) ||
        (paymentStatus.status === 'fulfilled' && paymentStatus.value.connected)
      )

      if (hasConnection) {
        const response = await fetch(`/api/admin/financial?timeframe=${timeframe}${selectedPartner ? `&partner=${selectedPartner}` : ''}`)
        
        if (!response.ok) {
          throw new Error('Failed to load financial data')
        }

        const data = await response.json()
        setMetrics(data)
      } else {
        // Set empty metrics when no services connected
        setMetrics({
          totalRevenue: 0,
          totalCommissions: 0,
          totalBookings: 0,
          averageBookingValue: 0,
          conversionRate: 0,
          revenueGrowth: 0,
          commissionsGrowth: 0,
          bookingsGrowth: 0,
          topPerformingDestinations: [],
          partnerPerformance: [],
          monthlyTrends: [],
          connectionStatus: {
            analytics: false,
            affiliateNetworks: false,
            paymentProcessors: false,
            lastSynced: null,
            errors: ['No financial data services connected']
          }
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load financial data'
      setError(errorMessage)
      console.error('Financial data loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnalyticsConnection = async (): Promise<ConnectionStatus> => {
    try {
      const response = await fetch('/api/admin/financial/analytics/status')
      const data = await response.json()
      return {
        connected: data.connected || false,
        lastChecked: new Date(),
        error: data.error || null
      }
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date(),
        error: 'Analytics service unavailable'
      }
    }
  }

  const checkAffiliateConnection = async (): Promise<ConnectionStatus> => {
    try {
      const response = await fetch('/api/admin/financial/affiliates/status')
      const data = await response.json()
      return {
        connected: data.connected || false,
        lastChecked: new Date(),
        error: data.error || null
      }
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date(),
        error: 'Affiliate network connections unavailable'
      }
    }
  }

  const checkPaymentConnection = async (): Promise<ConnectionStatus> => {
    try {
      const response = await fetch('/api/admin/financial/payments/status')
      const data = await response.json()
      return {
        connected: data.connected || false,
        lastChecked: new Date(),
        error: data.error || null
      }
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date(),
        error: 'Payment processor connections unavailable'
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUp size={14} className="mr-1" />
          +{growth.toFixed(1)}%
        </div>
      )
    } else if (growth < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDown size={14} className="mr-1" />
          {growth.toFixed(1)}%
        </div>
      )
    }
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <Activity size={14} className="mr-1" />
        0.0%
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

  const hasConnections = serviceStatus.analytics.connected || serviceStatus.affiliateNetworks.connected || serviceStatus.paymentProcessors.connected

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Revenue analytics and affiliate performance</p>
          <ConnectionStatusIndicator serviceStatus={serviceStatus} />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={loadFinancialData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={!hasConnections}
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {!hasConnections ? (
        <EmptyState />
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Total Revenue</div>
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.totalRevenue ? formatCurrency(metrics.totalRevenue) : '€0.00'}
              </div>
              {metrics && getGrowthIndicator(metrics.revenueGrowth)}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Commissions</div>
                <Award size={20} className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.totalCommissions ? formatCurrency(metrics.totalCommissions) : '€0.00'}
              </div>
              {metrics && getGrowthIndicator(metrics.commissionsGrowth)}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Total Bookings</div>
                <Target size={20} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.totalBookings ? formatNumber(metrics.totalBookings) : '0'}
              </div>
              {metrics && getGrowthIndicator(metrics.bookingsGrowth)}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Avg Booking Value</div>
                <BarChart3 size={20} className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.averageBookingValue ? formatCurrency(metrics.averageBookingValue) : '€0.00'}
              </div>
              <div className="text-sm text-purple-600">
                {metrics?.conversionRate ? `${metrics.conversionRate.toFixed(1)}%` : '0.0%'} conversion rate
              </div>
            </div>
          </div>

          {/* Revenue Analytics Component */}
          <RevenueDashboard className="w-full" />

          {/* Partner Performance & Top Destinations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Partner Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Partner Performance</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
              </div>
              
              {metrics?.partnerPerformance && metrics.partnerPerformance.length > 0 ? (
                <div className="space-y-4">
                  {metrics.partnerPerformance.slice(0, 5).map((partner, index) => (
                    <div key={partner.partnerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <ExternalLink size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{partner.partnerName}</div>
                          <div className="text-sm text-gray-600">{partner.bookings} bookings</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(partner.commissions)}</div>
                        <div className="text-sm text-gray-500">{partner.conversionRate.toFixed(1)}% CR</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExternalLink size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No partner data available</p>
                </div>
              )}
            </div>

            {/* Top Performing Destinations */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Destinations</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
              </div>
              
              {metrics?.topPerformingDestinations && metrics.topPerformingDestinations.length > 0 ? (
                <div className="space-y-4">
                  {metrics.topPerformingDestinations.slice(0, 5).map((destination, index) => (
                    <div key={destination.destination} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Globe size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{destination.destination}</div>
                          <div className="text-sm text-gray-600">{destination.bookings} bookings</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(destination.revenue)}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(destination.commissions)} commission</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Globe size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No destination data available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ConnectionStatusIndicator({ serviceStatus }: { serviceStatus: ServiceStatus }) {
  const connectedServices = [
    serviceStatus.analytics.connected && 'Analytics',
    serviceStatus.affiliateNetworks.connected && 'Affiliate Networks', 
    serviceStatus.paymentProcessors.connected && 'Payment Processors'
  ].filter(Boolean)

  const getOverallStatus = () => {
    if (connectedServices.length > 0) {
      return { 
        connected: true, 
        icon: Wifi, 
        text: `${connectedServices.length}/3 services connected`, 
        color: 'text-green-600' 
      }
    }
    return { connected: false, icon: WifiOff, text: 'No services connected', color: 'text-red-600' }
  }

  const status = getOverallStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex items-center space-x-2 mt-1">
      <StatusIcon size={14} className={status.color} />
      <span className={`text-sm ${status.color}`}>{status.text}</span>
      {!status.connected && (
        <span className="text-xs text-gray-500">• Configure financial data sources</span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <DollarSign size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Financial Data Sources
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To view revenue analytics and financial metrics, connect your analytics, affiliate networks, and payment processors.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Connections:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Analytics Services</div>
              <div className="text-sm text-gray-600">Google Analytics, Adobe Analytics, or custom tracking</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <ExternalLink size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Affiliate Networks</div>
              <div className="text-sm text-gray-600">Commission Junction, ShareASale, Impact, or direct partnerships</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CreditCard size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Payment Processors</div>
              <div className="text-sm text-gray-600">Stripe, PayPal, Adyen for transaction data</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award size={12} className="text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Environment Variables</div>
              <div className="text-sm text-gray-600">Configure API keys and connection strings</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure financial data source integrations.
          </div>
        </div>
      </div>
    </div>
  )
}