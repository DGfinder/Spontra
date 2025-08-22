'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Play,
  Pause,
  Eye,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react'

interface RevenueOptimization {
  id: string
  type: 'commission_adjustment' | 'seasonal_pricing' | 'conversion_optimization' | 'inventory_pricing'
  name: string
  description: string
  currentMetric: number
  optimizedMetric: number
  potentialIncrease: number
  confidence: number
  status: 'active' | 'testing' | 'paused' | 'pending'
  testResults?: {
    startDate: string
    duration: number
    uplift: number
    significance: number
  }
}

interface DynamicPricing {
  destination: string
  currentRate: number
  suggestedRate: number
  demandFactor: number
  seasonalMultiplier: number
  competitorRate: number
  conversionRate: number
  lastUpdated: string
}

interface RevenueData {
  overview: {
    totalRevenue: number
    optimizationUplift: number
    activeOptimizations: number
    testingOptimizations: number
  }
  optimizations: RevenueOptimization[]
  dynamicPricing: DynamicPricing[]
  performanceMetrics: {
    conversionImpact: number
    revenuePerUser: number
    averageOrderValue: number
    optimizationROI: number
  }
}

export default function RevenueOptimizationDashboard() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'optimizations' | 'pricing' | 'testing'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data for revenue optimization
  const mockRevenueData: RevenueData = {
    overview: {
      totalRevenue: 487650,
      optimizationUplift: 18.4,
      activeOptimizations: 8,
      testingOptimizations: 3
    },
    
    optimizations: [
      {
        id: '1',
        type: 'commission_adjustment',
        name: 'Dynamic Commission Rates',
        description: 'Adjust commission rates based on destination performance and demand',
        currentMetric: 15.0,
        optimizedMetric: 16.8,
        potentialIncrease: 23400,
        confidence: 92,
        status: 'active',
        testResults: {
          startDate: '2024-01-15',
          duration: 14,
          uplift: 12.3,
          significance: 98.5
        }
      },
      {
        id: '2',
        type: 'seasonal_pricing',
        name: 'Seasonal Rate Optimization',
        description: 'Higher rates during peak travel seasons and events',
        currentMetric: 15.0,
        optimizedMetric: 18.5,
        potentialIncrease: 18900,
        confidence: 87,
        status: 'active',
        testResults: {
          startDate: '2024-01-01',
          duration: 30,
          uplift: 18.7,
          significance: 95.2
        }
      },
      {
        id: '3',
        type: 'conversion_optimization',
        name: 'Price Psychology Testing',
        description: 'A/B test different price displays and psychological anchors',
        currentMetric: 12.4,
        optimizedMetric: 14.1,
        potentialIncrease: 8700,
        confidence: 78,
        status: 'testing'
      },
      {
        id: '4',
        type: 'inventory_pricing',
        name: 'Inventory-Based Pricing',
        description: 'Higher rates for limited availability and exclusive content',
        currentMetric: 15.0,
        optimizedMetric: 19.2,
        potentialIncrease: 15600,
        confidence: 83,
        status: 'pending'
      }
    ],

    dynamicPricing: [
      {
        destination: 'Barcelona',
        currentRate: 15.0,
        suggestedRate: 17.5,
        demandFactor: 1.23,
        seasonalMultiplier: 1.15,
        competitorRate: 16.8,
        conversionRate: 18.4,
        lastUpdated: '2024-01-20T14:30:00Z'
      },
      {
        destination: 'Amsterdam',
        currentRate: 15.0,
        suggestedRate: 16.2,
        demandFactor: 1.12,
        seasonalMultiplier: 1.05,
        competitorRate: 15.9,
        conversionRate: 16.7,
        lastUpdated: '2024-01-20T14:30:00Z'
      },
      {
        destination: 'Rome',
        currentRate: 15.0,
        suggestedRate: 16.8,
        demandFactor: 1.18,
        seasonalMultiplier: 1.12,
        competitorRate: 16.5,
        conversionRate: 17.2,
        lastUpdated: '2024-01-20T14:30:00Z'
      }
    ],

    performanceMetrics: {
      conversionImpact: 12.7,
      revenuePerUser: 89.45,
      averageOrderValue: 234.67,
      optimizationROI: 340
    }
  }

  useEffect(() => {
    const loadData = () => {
      setTimeout(() => {
        setRevenueData(mockRevenueData)
        setIsLoading(false)
      }, 1000)
    }

    loadData()

    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadData, 5 * 60 * 1000) // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'testing': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Revenue Optimization</h1>
          <p className="text-gray-600">AI-powered pricing optimization and revenue enhancement</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'optimizations', label: 'Optimizations' },
              { id: 'pricing', label: 'Dynamic Pricing' },
              { id: 'testing', label: 'A/B Testing' }
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

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw size={16} className="mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp size={14} className="mr-1" />
              +{revenueData!.overview.optimizationUplift}%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(revenueData!.overview.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">optimization uplift: +{revenueData!.overview.optimizationUplift}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <Zap size={14} className="mr-1" />
              Active
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {revenueData!.overview.activeOptimizations}
            </div>
            <p className="text-sm text-gray-600">Active Optimizations</p>
            <p className="text-xs text-gray-500 mt-1">
              {revenueData!.overview.testingOptimizations} currently testing
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <TrendingUp size={14} className="mr-1" />
              +{revenueData!.performanceMetrics.conversionImpact}%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {revenueData!.performanceMetrics.conversionImpact}%
            </div>
            <p className="text-sm text-gray-600">Conversion Impact</p>
            <p className="text-xs text-gray-500 mt-1">from optimizations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <ArrowUpRight size={14} className="mr-1" />
              ROI
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {revenueData!.performanceMetrics.optimizationROI}%
            </div>
            <p className="text-sm text-gray-600">Optimization ROI</p>
            <p className="text-xs text-gray-500 mt-1">return on optimization investment</p>
          </div>
        </div>
      </div>

      {/* Main Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Optimizations Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Optimizations</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {revenueData!.optimizations.filter(opt => opt.status === 'active').map((optimization) => (
                  <div key={optimization.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{optimization.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(optimization.status)}`}>
                        {optimization.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{optimization.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 font-medium">{optimization.currentMetric}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Optimized:</span>
                        <span className="ml-2 font-medium text-green-600">{optimization.optimizedMetric}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Potential:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {formatCurrency(optimization.potentialIncrease)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className={`ml-2 font-medium ${getConfidenceColor(optimization.confidence)}`}>
                          {optimization.confidence}%
                        </span>
                      </div>
                    </div>

                    {optimization.testResults && (
                      <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                        <div className="font-medium text-green-800">
                          Test Results: +{optimization.testResults.uplift}% uplift
                        </div>
                        <div className="text-green-700">
                          {optimization.testResults.duration} days • {optimization.testResults.significance}% significance
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Impact</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData!.performanceMetrics.revenuePerUser)}
                  </div>
                  <div className="text-sm text-gray-600">Revenue per User</div>
                  <div className="text-xs text-green-600 mt-1">+12.4% vs baseline</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData!.performanceMetrics.averageOrderValue)}
                  </div>
                  <div className="text-sm text-gray-600">Average Order Value</div>
                  <div className="text-xs text-green-600 mt-1">+8.7% vs baseline</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Optimization Pipeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Optimizations</span>
                    <span className="font-medium text-green-600">
                      {revenueData!.optimizations.filter(o => o.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Testing Phase</span>
                    <span className="font-medium text-blue-600">
                      {revenueData!.optimizations.filter(o => o.status === 'testing').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending Implementation</span>
                    <span className="font-medium text-gray-600">
                      {revenueData!.optimizations.filter(o => o.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Target size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Next Recommendation</div>
                    <div className="text-sm text-blue-800 mt-1">
                      Implement inventory-based pricing for limited availability content. 
                      Projected impact: +{formatCurrency(15600)} monthly revenue.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'optimizations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Optimizations</h3>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Settings size={16} className="mr-1" />
                Configure
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {revenueData!.optimizations.map((optimization) => (
                <div key={optimization.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{optimization.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {optimization.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(optimization.status)}`}>
                        {optimization.status}
                      </span>
                      {optimization.status === 'active' && (
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                          <Pause size={16} />
                        </button>
                      )}
                      {optimization.status === 'paused' && (
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                          <Play size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{optimization.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-900">
                        {optimization.currentMetric}%
                      </div>
                      <div className="text-sm text-gray-600">Current Rate</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-600">
                        {optimization.optimizedMetric}%
                      </div>
                      <div className="text-sm text-gray-600">Optimized Rate</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(optimization.potentialIncrease)}
                      </div>
                      <div className="text-sm text-gray-600">Potential Increase</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className={`text-lg font-bold ${getConfidenceColor(optimization.confidence)}`}>
                        {optimization.confidence}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  </div>

                  {optimization.testResults && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="font-medium text-green-800">Test Completed</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-green-700">Duration:</span>
                          <span className="ml-2 font-medium">{optimization.testResults.duration} days</span>
                        </div>
                        <div>
                          <span className="text-green-700">Uplift:</span>
                          <span className="ml-2 font-medium">+{optimization.testResults.uplift}%</span>
                        </div>
                        <div>
                          <span className="text-green-700">Significance:</span>
                          <span className="ml-2 font-medium">{optimization.testResults.significance}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {optimization.status === 'pending' && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          Start Test
                        </button>
                      )}
                      {optimization.status === 'testing' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                          <Eye size={14} className="mr-2" />
                          View Results
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                        Configure
                      </button>
                    </div>

                    {optimization.status === 'testing' && (
                      <div className="text-sm text-gray-600">
                        <Clock size={14} className="inline mr-1" />
                        Test running for 7 days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'pricing' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dynamic Pricing</h3>
                <p className="text-sm text-gray-600">Real-time commission rate optimization by destination</p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <RefreshCw size={16} className="mr-1" />
                Update Rates
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Destination</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Current Rate</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Suggested Rate</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Demand Factor</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Conversion Rate</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {revenueData!.dynamicPricing.map((pricing, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{pricing.destination}</div>
                      <div className="text-sm text-gray-600">
                        Updated: {new Date(pricing.lastUpdated).toLocaleString()}
                      </div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="font-semibold text-gray-900">{pricing.currentRate}%</div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className={`font-semibold ${
                        pricing.suggestedRate > pricing.currentRate ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {pricing.suggestedRate}%
                      </div>
                      {pricing.suggestedRate > pricing.currentRate && (
                        <div className="text-xs text-green-600">
                          +{((pricing.suggestedRate - pricing.currentRate) / pricing.currentRate * 100).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="font-medium text-blue-600">{pricing.demandFactor.toFixed(2)}x</div>
                      <div className="text-xs text-gray-600">
                        Seasonal: {pricing.seasonalMultiplier.toFixed(2)}x
                      </div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="font-semibold text-purple-600">{pricing.conversionRate}%</div>
                      <div className="text-xs text-gray-600">
                        Competitor: {pricing.competitorRate}%
                      </div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        {pricing.suggestedRate !== pricing.currentRate && (
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                            Apply
                          </button>
                        )}
                        <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                          Details
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
  )
}