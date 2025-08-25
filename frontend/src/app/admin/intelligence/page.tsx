'use client'

import { useState, useEffect } from 'react'
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Globe,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Lightbulb,
  MapPin,
  Clock,
  Star,
  Activity
} from 'lucide-react'

interface PredictiveInsight {
  id: string
  type: 'revenue' | 'growth' | 'risk' | 'opportunity'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  timeframe: string
  predictedValue?: number
  currentValue?: number
  recommendation: string
  automatedAction?: {
    available: boolean
    description: string
    type: string
  }
}

interface MarketTrend {
  destination: string
  currentDemand: number
  predictedDemand: number
  seasonalPattern: number
  competitorActivity: number
  priceOptimization: {
    currentPrice: number
    suggestedPrice: number
    potentialIncrease: number
  }
  riskFactors: string[]
  opportunities: string[]
}

interface GrowthProjection {
  metric: string
  currentValue: number
  projections: {
    timeframe: '1M' | '3M' | '6M' | '1Y'
    value: number
    confidence: number
    factors: string[]
  }[]
}

interface BusinessIntelligenceData {
  overview: {
    intelligenceScore: number
    predictiveAccuracy: number
    automatedDecisions: number
    riskMitigation: number
    opportunitiesIdentified: number
    actionableInsights: number
  }
  predictiveInsights: PredictiveInsight[]
  marketTrends: MarketTrend[]
  growthProjections: GrowthProjection[]
  riskAnalysis: {
    overallRiskScore: number
    riskCategories: {
      category: string
      score: number
      trend: number
      factors: string[]
    }[]
    mitigationStrategies: {
      risk: string
      strategy: string
      effectiveness: number
      automated: boolean
    }[]
  }
  competitorAnalysis: {
    marketPosition: number
    competitiveAdvantages: string[]
    threats: string[]
    opportunities: string[]
    recommendedActions: string[]
  }
}

export default function BusinessIntelligenceEngine() {
  const [businessData, setBusinessData] = useState<BusinessIntelligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'insights' | 'trends' | 'projections' | 'risks'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Mock data for business intelligence
  const mockBusinessData: BusinessIntelligenceData = {
    overview: {
      intelligenceScore: 94.2,
      predictiveAccuracy: 87.8,
      automatedDecisions: 156,
      riskMitigation: 89.3,
      opportunitiesIdentified: 23,
      actionableInsights: 12
    },
    
    predictiveInsights: [
      {
        id: '1',
        type: 'revenue',
        title: 'Q2 Revenue Surge Predicted',
        description: 'Barcelona bookings expected to increase 34% in Q2 due to festival season and improved content quality',
        confidence: 92,
        impact: 'high',
        timeframe: '3 months',
        predictedValue: 67800,
        currentValue: 50600,
        recommendation: 'Increase Barcelona creator outreach and content production. Consider premium pricing strategy.',
        automatedAction: {
          available: true,
          description: 'Auto-adjust commission rates and creator incentives',
          type: 'revenue_optimization'
        }
      },
      {
        id: '2',
        type: 'risk',
        title: 'Amsterdam Market Saturation Risk',
        description: 'Competition increasing rapidly with 3 new platforms entering Amsterdam market. Market share at risk.',
        confidence: 78,
        impact: 'medium',
        timeframe: '6 months',
        currentValue: 23,
        predictedValue: 18,
        recommendation: 'Diversify to underserved Dutch cities (Utrecht, Den Haag). Enhance creator loyalty programs.',
        automatedAction: {
          available: false,
          description: 'Manual strategic planning required',
          type: 'market_expansion'
        }
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'AI Content Optimization Impact',
        description: 'Recent AI improvements showing 23% better conversion on auto-optimized content. Scale potential high.',
        confidence: 94,
        impact: 'critical',
        timeframe: '1 month',
        currentValue: 15.2,
        predictedValue: 18.7,
        recommendation: 'Enable AI optimization for all new content. Implement auto-enhancement pipeline.',
        automatedAction: {
          available: true,
          description: 'Auto-enable AI optimization for qualifying creators',
          type: 'content_optimization'
        }
      },
      {
        id: '4',
        type: 'growth',
        title: 'Creator Tier Graduation Acceleration',
        description: 'Automated tier system showing 45% faster creator growth. Expansion to new tiers recommended.',
        confidence: 89,
        impact: 'high',
        timeframe: '2 months',
        currentValue: 847,
        predictedValue: 1230,
        recommendation: 'Launch "Elite Creator" tier. Implement advanced automation for top performers.',
        automatedAction: {
          available: true,
          description: 'Auto-identify and invite top creators to Elite tier',
          type: 'creator_management'
        }
      }
    ],
    
    marketTrends: [
      {
        destination: 'Barcelona',
        currentDemand: 8.7,
        predictedDemand: 11.6,
        seasonalPattern: 1.34,
        competitorActivity: 6.2,
        priceOptimization: {
          currentPrice: 15.0,
          suggestedPrice: 17.5,
          potentialIncrease: 12340
        },
        riskFactors: ['High competition', 'Seasonal dependency'],
        opportunities: ['Festival season', 'Premium experiences', 'Local partnerships']
      },
      {
        destination: 'Amsterdam',
        currentDemand: 7.2,
        predictedDemand: 6.8,
        seasonalPattern: 0.95,
        competitorActivity: 8.9,
        priceOptimization: {
          currentPrice: 15.0,
          suggestedPrice: 14.2,
          potentialIncrease: -890
        },
        riskFactors: ['Market saturation', 'New competitors', 'Price pressure'],
        opportunities: ['Quality differentiation', 'Niche experiences', 'Creator exclusivity']
      },
      {
        destination: 'Rome',
        currentDemand: 6.1,
        predictedDemand: 7.8,
        seasonalPattern: 1.28,
        competitorActivity: 4.3,
        priceOptimization: {
          currentPrice: 15.0,
          suggestedPrice: 16.8,
          potentialIncrease: 8700
        },
        riskFactors: ['Infrastructure challenges', 'Language barriers'],
        opportunities: ['Underserved market', 'Cultural experiences', 'Food tourism growth']
      }
    ],
    
    growthProjections: [
      {
        metric: 'Monthly Revenue',
        currentValue: 87500,
        projections: [
          { timeframe: '1M', value: 94200, confidence: 94, factors: ['Seasonal uptick', 'New creators'] },
          { timeframe: '3M', value: 112800, confidence: 87, factors: ['Festival season', 'AI optimization'] },
          { timeframe: '6M', value: 134500, confidence: 78, factors: ['Market expansion', 'Premium tier launch'] },
          { timeframe: '1Y', value: 189300, confidence: 67, factors: ['Full automation benefits', 'International expansion'] }
        ]
      },
      {
        metric: 'Active Creators',
        currentValue: 892,
        projections: [
          { timeframe: '1M', value: 934, confidence: 96, factors: ['Improved onboarding'] },
          { timeframe: '3M', value: 1156, confidence: 89, factors: ['Referral program', 'Enhanced tools'] },
          { timeframe: '6M', value: 1423, confidence: 82, factors: ['Market expansion', 'Creator incentives'] },
          { timeframe: '1Y', value: 2103, confidence: 71, factors: ['Global expansion', 'Platform maturity'] }
        ]
      },
      {
        metric: 'Customer Bookings',
        currentValue: 1890,
        projections: [
          { timeframe: '1M', value: 2034, confidence: 93, factors: ['Content quality improvement'] },
          { timeframe: '3M', value: 2567, confidence: 86, factors: ['Seasonal demand', 'New destinations'] },
          { timeframe: '6M', value: 3289, confidence: 79, factors: ['Enhanced discovery', 'Mobile optimization'] },
          { timeframe: '1Y', value: 4876, confidence: 68, factors: ['Market leadership', 'Network effects'] }
        ]
      }
    ],
    
    riskAnalysis: {
      overallRiskScore: 23.4,
      riskCategories: [
        {
          category: 'Market Competition',
          score: 67,
          trend: 12.3,
          factors: ['New entrants', 'Price competition', 'Feature parity']
        },
        {
          category: 'Operational Risk',
          score: 34,
          trend: -8.7,
          factors: ['System reliability', 'Creator dependencies', 'Quality control']
        },
        {
          category: 'Financial Risk',
          score: 18,
          trend: -15.2,
          factors: ['Revenue concentration', 'Payment processing', 'Currency fluctuation']
        },
        {
          category: 'Regulatory Risk',
          score: 12,
          trend: 2.1,
          factors: ['Travel regulations', 'Data privacy', 'Content moderation']
        }
      ],
      mitigationStrategies: [
        {
          risk: 'Market Competition',
          strategy: 'Focus on creator quality and unique experiences. Implement loyalty programs.',
          effectiveness: 78,
          automated: false
        },
        {
          risk: 'Operational Risk',
          strategy: 'Automated monitoring and redundancy systems. Creator diversification.',
          effectiveness: 89,
          automated: true
        },
        {
          risk: 'Financial Risk',
          strategy: 'Automated revenue diversification and hedging strategies.',
          effectiveness: 82,
          automated: true
        }
      ]
    },
    
    competitorAnalysis: {
      marketPosition: 78.3,
      competitiveAdvantages: [
        'AI-powered content optimization',
        'Automated creator lifecycle management',
        'Superior user experience',
        'Strong creator community'
      ],
      threats: [
        'Well-funded competitors entering market',
        'Platform-specific creator exclusivity',
        'Price competition on commission rates'
      ],
      opportunities: [
        'Geographic expansion to underserved markets',
        'Premium tier for luxury experiences',
        'B2B partnerships with travel companies',
        'AI-driven personalization at scale'
      ],
      recommendedActions: [
        'Accelerate creator acquisition in key markets',
        'Implement premium experience tier',
        'Develop strategic partnerships',
        'Enhance mobile experience'
      ]
    }
  }

  useEffect(() => {
    const loadData = () => {
      setTimeout(() => {
        setBusinessData(mockBusinessData)
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'text-green-600 bg-green-100'
      case 'growth': return 'text-blue-600 bg-blue-100'
      case 'risk': return 'text-red-600 bg-red-100'
      case 'opportunity': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleAutomatedAction = async (insightId: string) => {
    setBulkProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setBusinessData(prev => prev ? {
        ...prev,
        overview: {
          ...prev.overview,
          automatedDecisions: prev.overview.automatedDecisions + 1
        }
      } : null)
      
      alert('Automated action executed successfully')
    } catch (error) {
      console.error('Automated action failed:', error)
      alert('Failed to execute automated action')
    } finally {
      setBulkProcessing(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Engine</h1>
          <p className="text-gray-600">AI-powered predictive analytics and strategic insights for autonomous decision-making</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'insights', label: 'Insights' },
              { id: 'trends', label: 'Market Trends' },
              { id: 'projections', label: 'Projections' },
              { id: 'risks', label: 'Risk Analysis' }
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

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <Zap size={14} className="mr-1" />
              AI-Powered
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {businessData!.overview.intelligenceScore.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Intelligence Score</p>
            <p className="text-xs text-gray-500 mt-1">business intelligence maturity</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle size={14} className="mr-1" />
              {businessData!.overview.predictiveAccuracy.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {businessData!.overview.predictiveAccuracy.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Predictive Accuracy</p>
            <p className="text-xs text-gray-500 mt-1">forecast precision rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <ArrowUp size={14} className="mr-1" />
              +{businessData!.overview.automatedDecisions}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {businessData!.overview.automatedDecisions}
            </div>
            <p className="text-sm text-gray-600">Automated Decisions</p>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <Eye size={14} className="mr-1" />
              {businessData!.overview.actionableInsights}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {businessData!.overview.opportunitiesIdentified}
            </div>
            <p className="text-sm text-gray-600">Opportunities Found</p>
            <p className="text-xs text-gray-500 mt-1">
              {businessData!.overview.actionableInsights} actionable
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Strategic Insights</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {businessData!.predictiveInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInsightTypeColor(insight.type)}`}>
                      {insight.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Confidence: {insight.confidence}%</span>
                    <span className="text-gray-500">{insight.timeframe}</span>
                  </div>

                  {insight.automatedAction?.available && (
                    <button
                      onClick={() => handleAutomatedAction(insight.id)}
                      disabled={bulkProcessing}
                      className="mt-2 w-full flex items-center justify-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Zap size={14} className="mr-1" />
                      Execute Auto-Action
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  businessData!.riskAnalysis.overallRiskScore <= 30 ? 'text-green-600 bg-green-100' :
                  businessData!.riskAnalysis.overallRiskScore <= 60 ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                }`}>
                  Risk Score: {businessData!.riskAnalysis.overallRiskScore.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {businessData!.riskAnalysis.riskCategories.map((risk, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{risk.category}</span>
                      <span className="text-sm text-gray-600">{risk.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          risk.score <= 30 ? 'bg-green-500' :
                          risk.score <= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${risk.score}%` }}
                      ></div>
                    </div>
                    <div className={`flex items-center text-xs mt-1 ${
                      risk.trend >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {risk.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      <span className="ml-1">{Math.abs(risk.trend).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'insights' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Predictive Insights & Recommendations</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{businessData!.predictiveInsights.length} insights</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {businessData!.predictiveInsights.map((insight) => (
                <div key={insight.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInsightTypeColor(insight.type)}`}>
                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="text-lg font-semibold text-gray-900">{insight.confidence}%</div>
                    </div>
                  </div>

                  <h4 className="text-xl font-semibold text-gray-900 mb-3">{insight.title}</h4>
                  <p className="text-gray-600 mb-4">{insight.description}</p>

                  {insight.predictedValue && insight.currentValue && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-600">Current Value</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {insight.type === 'revenue' ? `€${insight.currentValue.toLocaleString()}` : insight.currentValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Predicted Value</div>
                        <div className={`text-lg font-semibold ${
                          insight.predictedValue > insight.currentValue ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {insight.type === 'revenue' ? `€${insight.predictedValue.toLocaleString()}` : insight.predictedValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Recommendation</div>
                        <div className="text-sm text-blue-800 mt-1">{insight.recommendation}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Timeframe: {insight.timeframe}</span>
                    <div className="flex space-x-2">
                      {insight.automatedAction?.available ? (
                        <button
                          onClick={() => handleAutomatedAction(insight.id)}
                          disabled={bulkProcessing}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          <Zap size={14} className="mr-2" />
                          {bulkProcessing ? 'Executing...' : 'Execute Auto-Action'}
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                          Manual Action Required
                        </span>
                      )}
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Market Trends Analysis</h3>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Settings size={16} className="mr-1" />
                Configure Markets
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {businessData!.marketTrends.map((trend, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{trend.destination}</h4>
                    </div>
                    <div className={`flex items-center text-sm ${
                      trend.predictedDemand > trend.currentDemand ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.predictedDemand > trend.currentDemand ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="ml-1">
                        {((trend.predictedDemand - trend.currentDemand) / trend.currentDemand * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{trend.currentDemand}</div>
                      <div className="text-sm text-gray-600">Current Demand</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        trend.predictedDemand > trend.currentDemand ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trend.predictedDemand}
                      </div>
                      <div className="text-sm text-gray-600">Predicted Demand</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{trend.competitorActivity}</div>
                      <div className="text-sm text-gray-600">Competitor Activity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{trend.seasonalPattern.toFixed(2)}x</div>
                      <div className="text-sm text-gray-600">Seasonal Pattern</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Price Optimization</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Price:</span>
                        <span className="ml-2 font-semibold">{trend.priceOptimization.currentPrice}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Suggested Price:</span>
                        <span className={`ml-2 font-semibold ${
                          trend.priceOptimization.suggestedPrice > trend.priceOptimization.currentPrice 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trend.priceOptimization.suggestedPrice}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue Impact:</span>
                        <span className={`ml-2 font-semibold ${
                          trend.priceOptimization.potentialIncrease > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          €{trend.priceOptimization.potentialIncrease.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Risk Factors</h5>
                      <ul className="space-y-1">
                        {trend.riskFactors.map((risk, idx) => (
                          <li key={idx} className="flex items-center text-sm text-red-600">
                            <AlertTriangle size={12} className="mr-2" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Opportunities</h5>
                      <ul className="space-y-1">
                        {trend.opportunities.map((opportunity, idx) => (
                          <li key={idx} className="flex items-center text-sm text-green-600">
                            <CheckCircle size={12} className="mr-2" />
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'projections' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Growth Projections</h3>
            <p className="text-sm text-gray-600">AI-powered forecasts based on current trends and patterns</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-8">
              {businessData!.growthProjections.map((projection, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">{projection.metric}</h4>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Current Value</div>
                      <div className="text-xl font-bold text-gray-900">
                        {projection.metric.includes('Revenue') 
                          ? `€${projection.currentValue.toLocaleString()}`
                          : projection.currentValue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {projection.projections.map((proj, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{proj.timeframe}</span>
                          <span className="text-xs text-gray-600">{proj.confidence}% confidence</span>
                        </div>
                        
                        <div className="text-lg font-bold text-blue-600 mb-2">
                          {projection.metric.includes('Revenue') 
                            ? `€${proj.value.toLocaleString()}`
                            : proj.value.toLocaleString()}
                        </div>
                        
                        <div className={`flex items-center text-sm mb-3 ${
                          proj.value > projection.currentValue ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {proj.value > projection.currentValue ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          <span className="ml-1">
                            {((proj.value - projection.currentValue) / projection.currentValue * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          {proj.factors.slice(0, 2).map((factor, factorIdx) => (
                            <div key={factorIdx} className="text-xs text-gray-600">
                              • {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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