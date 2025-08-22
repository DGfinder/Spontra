'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Settings,
  RefreshCw,
  Download,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'

interface TaxCalculation {
  jurisdiction: string
  rate: number
  amount: number
  status: 'calculated' | 'pending' | 'filed'
}

interface ExpenseCategory {
  category: string
  amount: number
  count: number
  aiClassified: number
  trend: number
}

interface RevenueOptimization {
  type: 'commission_rate' | 'seasonal_pricing' | 'conversion_optimization'
  description: string
  currentValue: number
  suggestedValue: number
  potentialIncrease: number
  confidence: number
  status: 'active' | 'testing' | 'pending'
}

interface FinancialAutomationData {
  taxCalculations: {
    currentQuarter: {
      totalTax: number
      vatCollected: number
      deductions: number
      netTax: number
    }
    byJurisdiction: TaxCalculation[]
    complianceScore: number
    nextFilingDate: string
    automatedFilings: number
  }
  
  expenseManagement: {
    totalExpenses: number
    categories: ExpenseCategory[]
    aiClassificationRate: number
    pendingClassification: number
    receiptProcessingQueue: number
  }
  
  revenueOptimization: {
    activeOptimizations: RevenueOptimization[]
    totalPotentialIncrease: number
    implementedOptimizations: number
    abTestsRunning: number
    conversionImpact: number
  }
  
  profitLossAutomation: {
    currentPeriodProfit: number
    profitMargin: number
    costBreakdown: { category: string; amount: number; percentage: number }[]
    monthlyTrend: { month: string; profit: number; margin: number }[]
  }
}

export default function FinancialAutomationDashboard() {
  const [financialData, setFinancialData] = useState<FinancialAutomationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current_quarter')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data for financial automation
  const mockFinancialData: FinancialAutomationData = {
    taxCalculations: {
      currentQuarter: {
        totalTax: 23456,
        vatCollected: 18234,
        deductions: 3200,
        netTax: 20256
      },
      byJurisdiction: [
        { jurisdiction: 'EU (VAT)', rate: 21, amount: 12456, status: 'calculated' },
        { jurisdiction: 'UK (VAT)', rate: 20, amount: 5678, status: 'calculated' },
        { jurisdiction: 'US (Sales Tax)', rate: 8.5, amount: 2322, status: 'pending' }
      ],
      complianceScore: 98,
      nextFilingDate: '2024-02-15T00:00:00Z',
      automatedFilings: 12
    },
    
    expenseManagement: {
      totalExpenses: 45678,
      categories: [
        { category: 'hosting_costs', amount: 12000, count: 24, aiClassified: 24, trend: 5.2 },
        { category: 'api_fees', amount: 8500, count: 156, aiClassified: 156, trend: -2.1 },
        { category: 'marketing_spend', amount: 15000, count: 89, aiClassified: 87, trend: 12.8 },
        { category: 'creator_commissions', amount: 7800, count: 234, aiClassified: 234, trend: 18.5 },
        { category: 'payment_processing', amount: 2378, count: 1890, aiClassified: 1890, trend: 3.7 }
      ],
      aiClassificationRate: 97.8,
      pendingClassification: 8,
      receiptProcessingQueue: 12
    },
    
    revenueOptimization: {
      activeOptimizations: [
        {
          type: 'commission_rate',
          description: 'Dynamic commission rates based on destination performance',
          currentValue: 15,
          suggestedValue: 16.5,
          potentialIncrease: 12340,
          confidence: 89,
          status: 'testing'
        },
        {
          type: 'seasonal_pricing',
          description: 'Higher rates during peak travel seasons',
          currentValue: 15,
          suggestedValue: 18,
          potentialIncrease: 8900,
          confidence: 92,
          status: 'active'
        },
        {
          type: 'conversion_optimization',
          description: 'Pricing psychology optimization',
          currentValue: 2.3,
          suggestedValue: 2.8,
          potentialIncrease: 5600,
          confidence: 78,
          status: 'pending'
        }
      ],
      totalPotentialIncrease: 26840,
      implementedOptimizations: 8,
      abTestsRunning: 3,
      conversionImpact: 12.3
    },
    
    profitLossAutomation: {
      currentPeriodProfit: 89750,
      profitMargin: 32.4,
      costBreakdown: [
        { category: 'Creator Commissions', amount: 67800, percentage: 48.2 },
        { category: 'Infrastructure', amount: 20500, percentage: 14.6 },
        { category: 'Marketing', amount: 15000, percentage: 10.7 },
        { category: 'API Costs', amount: 8500, percentage: 6.1 },
        { category: 'Payment Processing', amount: 12000, percentage: 8.5 },
        { category: 'Other', amount: 16700, percentage: 11.9 }
      ],
      monthlyTrend: [
        { month: 'Oct 2023', profit: 67500, margin: 28.9 },
        { month: 'Nov 2023', profit: 75300, margin: 30.1 },
        { month: 'Dec 2023', profit: 82100, margin: 31.2 },
        { month: 'Jan 2024', profit: 89750, margin: 32.4 }
      ]
    }
  }

  useEffect(() => {
    const loadFinancialData = () => {
      setTimeout(() => {
        setFinancialData(mockFinancialData)
        setIsLoading(false)
      }, 1000)
    }

    loadFinancialData()

    // Auto-refresh every 5 minutes
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadFinancialData, 5 * 60 * 1000)
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
      case 'calculated': case 'active': return 'text-green-600 bg-green-100'
      case 'testing': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'filed': return 'text-gray-600 bg-gray-100'
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
          <h1 className="text-2xl font-bold text-gray-900">Financial Automation</h1>
          <p className="text-gray-600">Automated tax calculation, expense management, and revenue optimization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="current_quarter">Current Quarter</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="year_to_date">Year to Date</option>
          </select>
          
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
            Export Reports
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calculator size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle size={14} className="mr-1" />
              {financialData!.taxCalculations.complianceScore}% compliant
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(financialData!.taxCalculations.currentQuarter.netTax)}
            </div>
            <p className="text-sm text-gray-600">Net Tax Liability</p>
            <p className="text-xs text-gray-500 mt-1">
              Next filing: {new Date(financialData!.taxCalculations.nextFilingDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <Zap size={14} className="mr-1" />
              {financialData!.expenseManagement.aiClassificationRate}% AI classified
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(financialData!.expenseManagement.totalExpenses)}
            </div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xs text-gray-500 mt-1">
              {financialData!.expenseManagement.pendingClassification} pending classification
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <TrendingUp size={14} className="mr-1" />
              {financialData!.revenueOptimization.abTestsRunning} active tests
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(financialData!.revenueOptimization.totalPotentialIncrease)}
            </div>
            <p className="text-sm text-gray-600">Potential Revenue Increase</p>
            <p className="text-xs text-gray-500 mt-1">
              {financialData!.revenueOptimization.implementedOptimizations} optimizations active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <TrendingUp size={14} className="mr-1" />
              {financialData!.profitLossAutomation.profitMargin.toFixed(1)}% margin
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(financialData!.profitLossAutomation.currentPeriodProfit)}
            </div>
            <p className="text-sm text-gray-600">Current Period Profit</p>
            <p className="text-xs text-gray-500 mt-1">automated P&L</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Calculations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tax Automation</h3>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Settings size={16} className="mr-1" />
                Configure
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Current Quarter Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Current Quarter Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(financialData!.taxCalculations.currentQuarter.totalTax)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">VAT Collected:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(financialData!.taxCalculations.currentQuarter.vatCollected)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Deductions:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    -{formatCurrency(financialData!.taxCalculations.currentQuarter.deductions)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Net Tax:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(financialData!.taxCalculations.currentQuarter.netTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* By Jurisdiction */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">By Jurisdiction</h4>
              <div className="space-y-2">
                {financialData!.taxCalculations.byJurisdiction.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{tax.jurisdiction}</div>
                      <div className="text-sm text-gray-600">{tax.rate}% rate</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(tax.amount)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tax.status)}`}>
                        {tax.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <FileText size={14} className="mr-2" />
                Generate Tax Report
              </button>
              <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                <Calendar size={14} className="mr-2" />
                Schedule Filing
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Optimization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Optimization</h3>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Target size={16} className="mr-1" />
                View All
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {financialData!.revenueOptimization.activeOptimizations.map((optimization, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{optimization.description}</h4>
                    <p className="text-sm text-gray-600 capitalize">{optimization.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(optimization.status)}`}>
                    {optimization.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Current:</span>
                    <span className="ml-2 font-medium">
                      {optimization.type === 'conversion_optimization' 
                        ? `${optimization.currentValue}%` 
                        : `${optimization.currentValue}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Suggested:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {optimization.type === 'conversion_optimization' 
                        ? `${optimization.suggestedValue}%` 
                        : `${optimization.suggestedValue}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Potential Increase:</span>
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

                <div className="flex space-x-2">
                  {optimization.status === 'pending' && (
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Implement
                    </button>
                  )}
                  {optimization.status === 'testing' && (
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      View Results
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

      {/* Expense Management & P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Expense Management</h3>
            <p className="text-sm text-gray-600">AI-powered expense classification and tracking</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {financialData!.expenseManagement.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{category.count} items</span>
                        {category.aiClassified === category.count && (
                          <CheckCircle size={12} className="text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                      <div className={`flex items-center text-xs ${
                        category.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.trend >= 0 ? (
                          <TrendingUp size={12} className="mr-1" />
                        ) : (
                          <TrendingDown size={12} className="mr-1" />
                        )}
                        {Math.abs(category.trend).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {financialData!.expenseManagement.pendingClassification > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    {financialData!.expenseManagement.pendingClassification} expenses need classification
                  </span>
                  <button className="ml-auto text-sm text-yellow-700 font-medium hover:text-yellow-800">
                    Review →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profit & Loss */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Automation</h3>
            <p className="text-sm text-gray-600">Real-time P&L with automated cost allocation</p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Current Period Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Current Period</h4>
                <span className="text-sm text-gray-600">Profit Margin: {financialData!.profitLossAutomation.profitMargin}%</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialData!.profitLossAutomation.currentPeriodProfit)}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
              <div className="space-y-2">
                {financialData!.profitLossAutomation.costBreakdown.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{cost.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatCurrency(cost.amount)}</span>
                      <span className="text-gray-500">({cost.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Monthly Trend</h4>
              <div className="space-y-2">
                {financialData!.profitLossAutomation.monthlyTrend.map((month, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{month.month}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatCurrency(month.profit)}</span>
                      <span className="text-gray-500">({month.margin}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}