'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare,
  Bot,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  ArrowRight,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Target,
  BarChart3,
  Users
} from 'lucide-react'

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: 'booking' | 'payment' | 'technical' | 'creator' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
  user: {
    id: string
    name: string
    email: string
    tier: string
  }
  assignedTo?: string
  createdAt: string
  lastActivity: string
  automatedResponse: {
    sent: boolean
    template: string
    confidence: number
    escalated: boolean
  }
  aiAnalysis: {
    sentiment: 'positive' | 'neutral' | 'negative'
    urgency: number
    complexity: number
    suggestedCategory: string
    confidence: number
  }
  resolution: {
    resolvedBy: 'ai' | 'human'
    timeToResolve?: number
    customerSatisfaction?: number
    resolutionType: string
  }
}

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    category?: string
    keywords: string[]
    priority?: string
    sentiment?: string
  }
  action: {
    type: 'auto_respond' | 'escalate' | 'assign' | 'categorize'
    template?: string
    assignTo?: string
    priority?: string
  }
  isActive: boolean
  successRate: number
  usageCount: number
}

interface SupportAutomationData {
  overview: {
    totalTickets: number
    resolvedByAI: number
    averageResponseTime: number
    customerSatisfactionScore: number
    automationRate: number
    escalationRate: number
  }
  ticketStats: {
    newTickets: number
    inProgress: number
    resolved: number
    customerSatisfaction: { score: number; trend: number }
    responseTimeImprovement: number
  }
  aiPerformance: {
    resolutionAccuracy: number
    sentimentAnalysisAccuracy: number
    categoryPredictionAccuracy: number
    customerFeedback: { positive: number; negative: number }
  }
  automationRules: AutomationRule[]
  recentActivity: {
    type: 'ticket_created' | 'auto_resolved' | 'escalated' | 'feedback_received'
    description: string
    timestamp: string
    automated: boolean
  }[]
}

export default function SupportAutomationHub() {
  const [supportData, setSupportData] = useState<SupportAutomationData | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'dashboard' | 'tickets' | 'automation' | 'analytics'>('dashboard')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Mock data for support automation
  const mockSupportData: SupportAutomationData = {
    overview: {
      totalTickets: 847,
      resolvedByAI: 623,
      averageResponseTime: 2.3,
      customerSatisfactionScore: 4.6,
      automationRate: 73.6,
      escalationRate: 8.4
    },
    
    ticketStats: {
      newTickets: 34,
      inProgress: 12,
      resolved: 89,
      customerSatisfaction: { score: 4.6, trend: 0.3 },
      responseTimeImprovement: -45.2
    },
    
    aiPerformance: {
      resolutionAccuracy: 89.4,
      sentimentAnalysisAccuracy: 94.7,
      categoryPredictionAccuracy: 91.2,
      customerFeedback: { positive: 156, negative: 23 }
    },
    
    automationRules: [
      {
        id: '1',
        name: 'Booking Issue Auto-Responder',
        description: 'Automatically respond to common booking questions with relevant solutions',
        trigger: {
          category: 'booking',
          keywords: ['cancel', 'refund', 'change', 'reschedule'],
          priority: 'medium'
        },
        action: {
          type: 'auto_respond',
          template: 'booking_support_template'
        },
        isActive: true,
        successRate: 87.3,
        usageCount: 234
      },
      {
        id: '2',
        name: 'Payment Issue Escalation',
        description: 'Escalate payment-related issues to human support immediately',
        trigger: {
          category: 'payment',
          keywords: ['charge', 'fraud', 'dispute', 'unauthorized'],
          sentiment: 'negative'
        },
        action: {
          type: 'escalate',
          assignTo: 'payment_specialist'
        },
        isActive: true,
        successRate: 95.8,
        usageCount: 89
      },
      {
        id: '3',
        name: 'Creator Support Router',
        description: 'Route creator-related inquiries to appropriate specialist',
        trigger: {
          category: 'creator',
          keywords: ['commission', 'payout', 'content', 'guidelines']
        },
        action: {
          type: 'assign',
          assignTo: 'creator_success_team'
        },
        isActive: true,
        successRate: 92.1,
        usageCount: 167
      }
    ],
    
    recentActivity: [
      {
        type: 'auto_resolved',
        description: 'Booking inquiry from @traveler_mike automatically resolved',
        timestamp: '2024-01-20T15:30:00Z',
        automated: true
      },
      {
        type: 'escalated',
        description: 'Payment dispute escalated to specialist team',
        timestamp: '2024-01-20T14:45:00Z',
        automated: true
      },
      {
        type: 'feedback_received',
        description: 'Customer rated AI response 5/5 stars',
        timestamp: '2024-01-20T14:20:00Z',
        automated: false
      },
      {
        type: 'ticket_created',
        description: 'New technical issue reported and auto-categorized',
        timestamp: '2024-01-20T13:15:00Z',
        automated: true
      }
    ]
  }

  const mockTickets: SupportTicket[] = [
    {
      id: 'ticket_001',
      subject: 'Unable to complete booking for Barcelona trip',
      description: 'I\'m trying to book the Barcelona nightlife experience but the payment keeps failing. Can you help?',
      category: 'booking',
      priority: 'medium',
      status: 'new',
      user: {
        id: 'user_001',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        tier: 'Explorer'
      },
      createdAt: '2024-01-20T14:30:00Z',
      lastActivity: '2024-01-20T14:30:00Z',
      automatedResponse: {
        sent: true,
        template: 'booking_payment_help',
        confidence: 92,
        escalated: false
      },
      aiAnalysis: {
        sentiment: 'neutral',
        urgency: 6.5,
        complexity: 4.2,
        suggestedCategory: 'booking',
        confidence: 94
      },
      resolution: {
        resolvedBy: 'ai',
        timeToResolve: 4.5,
        customerSatisfaction: 5,
        resolutionType: 'automated_solution'
      }
    },
    {
      id: 'ticket_002',
      subject: 'Fraudulent charge on my account',
      description: 'I see a charge of €89 that I didn\'t authorize. This looks like fraud and I want it reversed immediately.',
      category: 'payment',
      priority: 'urgent',
      status: 'in_progress',
      user: {
        id: 'user_002',
        name: 'Mike Chen',
        email: 'mike@example.com',
        tier: 'Contributor'
      },
      assignedTo: 'payment_specialist',
      createdAt: '2024-01-20T13:45:00Z',
      lastActivity: '2024-01-20T15:20:00Z',
      automatedResponse: {
        sent: false,
        template: '',
        confidence: 0,
        escalated: true
      },
      aiAnalysis: {
        sentiment: 'negative',
        urgency: 9.2,
        complexity: 7.8,
        suggestedCategory: 'payment',
        confidence: 98
      },
      resolution: {
        resolvedBy: 'human',
        resolutionType: 'escalated_to_specialist'
      }
    },
    {
      id: 'ticket_003',
      subject: 'Question about creator commission rates',
      description: 'Hi, I\'m a new creator and want to understand how commission rates work. Are they different for different destinations?',
      category: 'creator',
      priority: 'low',
      status: 'resolved',
      user: {
        id: 'user_003',
        name: 'Lisa Travel',
        email: 'lisa@example.com',
        tier: 'Creator'
      },
      assignedTo: 'creator_success_team',
      createdAt: '2024-01-19T16:20:00Z',
      lastActivity: '2024-01-20T09:15:00Z',
      automatedResponse: {
        sent: true,
        template: 'creator_commission_info',
        confidence: 89,
        escalated: false
      },
      aiAnalysis: {
        sentiment: 'positive',
        urgency: 3.1,
        complexity: 5.2,
        suggestedCategory: 'creator',
        confidence: 91
      },
      resolution: {
        resolvedBy: 'ai',
        timeToResolve: 16.9,
        customerSatisfaction: 4,
        resolutionType: 'knowledge_base_response'
      }
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setSupportData(mockSupportData)
      setTickets(mockTickets)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-yellow-600 bg-yellow-100'
      case 'waiting_customer': return 'text-purple-600 bg-purple-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'neutral': return 'text-gray-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleAutoResolve = async (ticketId: string) => {
    setBulkProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              status: 'resolved' as const,
              resolution: {
                ...ticket.resolution,
                resolvedBy: 'ai' as const,
                timeToResolve: 2.3
              }
            }
          : ticket
      ))
      
      alert('Ticket auto-resolved successfully')
    } catch (error) {
      console.error('Auto-resolve failed:', error)
      alert('Failed to auto-resolve ticket')
    } finally {
      setBulkProcessing(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
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
          <h1 className="text-2xl font-bold text-gray-900">Support Automation Hub</h1>
          <p className="text-gray-600">AI-powered customer support with automated routing and responses</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'tickets', label: 'Tickets' },
              { id: 'automation', label: 'Rules' },
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
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <Bot size={14} className="mr-1" />
              {supportData!.overview.automationRate.toFixed(1)}% automated
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {supportData!.overview.totalTickets.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Tickets</p>
            <p className="text-xs text-gray-500 mt-1">
              {supportData!.overview.resolvedByAI} resolved by AI
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingDown size={14} className="mr-1" />
              45% faster
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {supportData!.overview.averageResponseTime.toFixed(1)}h
            </div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-xs text-gray-500 mt-1">down from 4.2h</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ThumbsUp size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <TrendingUp size={14} className="mr-1" />
              +0.3 this month
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {supportData!.overview.customerSatisfactionScore.toFixed(1)}/5
            </div>
            <p className="text-sm text-gray-600">Customer Satisfaction</p>
            <p className="text-xs text-gray-500 mt-1">from 179 responses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <Target size={14} className="mr-1" />
              {supportData!.overview.escalationRate.toFixed(1)}% escalated
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {supportData!.aiPerformance.resolutionAccuracy.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">AI Accuracy</p>
            <p className="text-xs text-gray-500 mt-1">resolution success rate</p>
          </div>
        </div>
      </div>

      {/* Main Content Based on Selected View */}
      {selectedView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI Performance Metrics</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {supportData!.aiPerformance.resolutionAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Resolution Accuracy</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {supportData!.aiPerformance.sentimentAnalysisAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-700">Sentiment Analysis</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Feedback</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Positive Feedback</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(supportData!.aiPerformance.customerFeedback.positive / (supportData!.aiPerformance.customerFeedback.positive + supportData!.aiPerformance.customerFeedback.negative)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {supportData!.aiPerformance.customerFeedback.positive}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Negative Feedback</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(supportData!.aiPerformance.customerFeedback.negative / (supportData!.aiPerformance.customerFeedback.positive + supportData!.aiPerformance.customerFeedback.negative)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {supportData!.aiPerformance.customerFeedback.negative}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {supportData!.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-1 rounded-lg ${
                      activity.type === 'auto_resolved' ? 'bg-green-100' :
                      activity.type === 'escalated' ? 'bg-red-100' :
                      activity.type === 'feedback_received' ? 'bg-purple-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.type === 'auto_resolved' && <CheckCircle size={14} className="text-green-600" />}
                      {activity.type === 'escalated' && <AlertTriangle size={14} className="text-red-600" />}
                      {activity.type === 'feedback_received' && <ThumbsUp size={14} className="text-purple-600" />}
                      {activity.type === 'ticket_created' && <MessageSquare size={14} className="text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.automated && (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-blue-600">
                              <Bot size={10} className="mr-1" />
                              Automated
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'tickets' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredTickets.length} tickets</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
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
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{ticket.user.name}</span>
                          <span>•</span>
                          <span>{ticket.user.email}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.automatedResponse.sent && (
                        <Bot size={16} className="text-blue-500" title="AI Response Sent" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="text-center">
                      <div className={`font-semibold ${getSentimentColor(ticket.aiAnalysis.sentiment)}`}>
                        {ticket.aiAnalysis.sentiment}
                      </div>
                      <div className="text-gray-600">Sentiment</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{ticket.aiAnalysis.urgency.toFixed(1)}/10</div>
                      <div className="text-gray-600">AI Urgency</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{ticket.aiAnalysis.confidence}%</div>
                      <div className="text-gray-600">AI Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 capitalize">{ticket.category}</div>
                      <div className="text-gray-600">Category</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {ticket.status === 'new' && !ticket.automatedResponse.sent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAutoResolve(ticket.id)
                          }}
                          disabled={bulkProcessing}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Bot size={14} className="mr-1" />
                          Auto-Resolve
                        </button>
                      )}
                      
                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                          Assign Human
                        </button>
                      )}
                      
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                        View Details
                      </button>
                    </div>
                    
                    {ticket.resolution?.customerSatisfaction && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 mr-2">Satisfaction:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <ThumbsUp
                              key={i}
                              size={12}
                              className={`${
                                i < ticket.resolution!.customerSatisfaction! 
                                  ? 'text-yellow-500' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'automation' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Settings size={16} className="mr-1" />
                Create Rule
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {supportData!.automationRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {rule.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Usage Count:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {rule.usageCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Action Type:</span>
                      <span className="ml-2 font-medium text-blue-600 capitalize">
                        {rule.action.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Edit Rule
                    </button>
                    <button className={`px-3 py-1 rounded text-sm ${
                      rule.isActive 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}>
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                      View Logs
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