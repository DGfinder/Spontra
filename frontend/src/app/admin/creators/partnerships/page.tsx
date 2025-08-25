'use client'

import { useState, useEffect } from 'react'
import {
  Handshake,
  Plus,
  Edit,
  Eye,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Target,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Award,
  Crown,
  Gift,
  TrendingUp,
  MapPin,
  Camera,
  Video,
  FileText,
  Mail,
  Phone,
  Globe,
  X,
  Save,
  Send,
  Download,
  Upload
} from 'lucide-react'

interface Partnership {
  id: string
  name: string
  description: string
  type: 'collaboration' | 'sponsorship' | 'ambassador' | 'exclusive'
  status: 'active' | 'pending' | 'paused' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  endDate?: string
  budget: {
    allocated: number
    spent: number
    remaining: number
  }
  participants: Array<{
    creatorId: string
    name: string
    username: string
    avatar?: string
    role: 'lead' | 'collaborator' | 'contributor'
    joinedAt: string
  }>
  requirements: {
    contentTargets: Array<{
      type: 'video' | 'photo' | 'article' | 'campaign'
      quantity: number
      completed: number
    }>
    destinations: string[]
    themes: string[]
    deliveryDates: string[]
  }
  performance: {
    totalContent: number
    totalViews: number
    totalEngagement: number
    conversionRate: number
    qualityScore: number
  }
  contact: {
    manager: string
    email: string
    phone?: string
  }
  terms: {
    paymentStructure: string
    exclusivity: boolean
    contentRights: string
    revisionRounds: number
  }
}

interface PartnershipStats {
  totalPartnerships: number
  activePartnerships: number
  totalBudget: number
  spentBudget: number
  averageQuality: number
  completionRate: number
  totalCreators: number
  topPerformer: string
}

export default function PartnershipsPage() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [stats, setStats] = useState<PartnershipStats | null>(null)
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const [newPartnership, setNewPartnership] = useState({
    name: '',
    description: '',
    type: 'collaboration' as Partnership['type'],
    budget: 0,
    startDate: '',
    endDate: '',
    destinations: [] as string[],
    contentTargets: [] as any[]
  })

  // Mock data
  const mockStats: PartnershipStats = {
    totalPartnerships: 42,
    activePartnerships: 18,
    totalBudget: 125000,
    spentBudget: 78500,
    averageQuality: 8.7,
    completionRate: 89.5,
    totalCreators: 156,
    topPerformer: 'Barcelona Summer Campaign'
  }

  const mockPartnerships: Partnership[] = [
    {
      id: '1',
      name: 'Barcelona Summer Campaign 2024',
      description: 'Comprehensive summer campaign showcasing Barcelona beach culture, nightlife, and local experiences.',
      type: 'sponsorship',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-03-31T23:59:59Z',
      budget: {
        allocated: 15000,
        spent: 9500,
        remaining: 5500
      },
      participants: [
        {
          creatorId: '1',
          name: 'Sarah Johnson',
          username: 'travel_sarah',
          avatar: '/images/creators/sarah.jpg',
          role: 'lead',
          joinedAt: '2024-01-15T00:00:00Z'
        },
        {
          creatorId: '2',
          name: 'David Novak',
          username: 'prague_lens',
          avatar: '/images/creators/david.jpg',
          role: 'collaborator',
          joinedAt: '2024-01-20T00:00:00Z'
        },
        {
          creatorId: '3',
          name: 'Emma Chen',
          username: 'food_wanderer',
          role: 'contributor',
          joinedAt: '2024-01-25T00:00:00Z'
        }
      ],
      requirements: {
        contentTargets: [
          { type: 'video', quantity: 8, completed: 5 },
          { type: 'photo', quantity: 20, completed: 16 },
          { type: 'article', quantity: 4, completed: 3 }
        ],
        destinations: ['Barcelona', 'Sitges', 'Girona'],
        themes: ['beach', 'nightlife', 'food', 'culture'],
        deliveryDates: ['2024-02-15', '2024-03-01', '2024-03-20']
      },
      performance: {
        totalContent: 24,
        totalViews: 2456789,
        totalEngagement: 456789,
        conversionRate: 18.7,
        qualityScore: 9.1
      },
      contact: {
        manager: 'Maria Rodriguez',
        email: 'maria@spontra.com',
        phone: '+34 123 456 789'
      },
      terms: {
        paymentStructure: 'Milestone-based',
        exclusivity: true,
        contentRights: 'Shared ownership',
        revisionRounds: 2
      }
    },
    {
      id: '2',
      name: 'Prague Winter Stories',
      description: 'Authentic winter experiences in Prague focusing on Christmas markets, local culture, and cozy indoor activities.',
      type: 'collaboration',
      status: 'completed',
      priority: 'medium',
      startDate: '2023-11-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      budget: {
        allocated: 8500,
        spent: 8200,
        remaining: 300
      },
      participants: [
        {
          creatorId: '4',
          name: 'Jan Svoboda',
          username: 'prague_local',
          role: 'lead',
          joinedAt: '2023-11-01T00:00:00Z'
        },
        {
          creatorId: '5',
          name: 'Anna Mueller',
          username: 'winter_wanderer',
          role: 'collaborator',
          joinedAt: '2023-11-05T00:00:00Z'
        }
      ],
      requirements: {
        contentTargets: [
          { type: 'video', quantity: 4, completed: 4 },
          { type: 'photo', quantity: 15, completed: 18 },
          { type: 'article', quantity: 6, completed: 6 }
        ],
        destinations: ['Prague', 'Cesky Krumlov'],
        themes: ['winter', 'christmas', 'culture', 'food'],
        deliveryDates: ['2023-12-01', '2023-12-20', '2024-01-15']
      },
      performance: {
        totalContent: 28,
        totalViews: 1234567,
        totalEngagement: 234567,
        conversionRate: 15.2,
        qualityScore: 8.9
      },
      contact: {
        manager: 'Peter Novak',
        email: 'peter@spontra.com'
      },
      terms: {
        paymentStructure: 'Per deliverable',
        exclusivity: false,
        contentRights: 'Platform exclusive',
        revisionRounds: 1
      }
    },
    {
      id: '3',
      name: 'Amsterdam Food Ambassador Program',
      description: 'Long-term ambassador program featuring Amsterdam\'s diverse food scene and culinary innovations.',
      type: 'ambassador',
      status: 'pending',
      priority: 'high',
      startDate: '2024-02-01T00:00:00Z',
      endDate: '2024-08-31T23:59:59Z',
      budget: {
        allocated: 22000,
        spent: 0,
        remaining: 22000
      },
      participants: [
        {
          creatorId: '6',
          name: 'Lucas Van Der Berg',
          username: 'amsterdam_eats',
          role: 'lead',
          joinedAt: '2024-01-20T00:00:00Z'
        }
      ],
      requirements: {
        contentTargets: [
          { type: 'video', quantity: 12, completed: 0 },
          { type: 'photo', quantity: 30, completed: 0 },
          { type: 'article', quantity: 8, completed: 0 }
        ],
        destinations: ['Amsterdam', 'Haarlem', 'Utrecht'],
        themes: ['food', 'restaurants', 'local cuisine', 'innovation'],
        deliveryDates: ['2024-03-15', '2024-05-01', '2024-07-01']
      },
      performance: {
        totalContent: 0,
        totalViews: 0,
        totalEngagement: 0,
        conversionRate: 0,
        qualityScore: 0
      },
      contact: {
        manager: 'Sophie Williams',
        email: 'sophie@spontra.com',
        phone: '+31 20 123 4567'
      },
      terms: {
        paymentStructure: 'Monthly retainer + bonuses',
        exclusivity: true,
        contentRights: 'Full platform rights',
        revisionRounds: 3
      }
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPartnerships(mockPartnerships)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to load partnerships data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collaboration': return <Users size={16} className="text-blue-500" />
      case 'sponsorship': return <Target size={16} className="text-green-500" />
      case 'ambassador': return <Crown size={16} className="text-purple-500" />
      case 'exclusive': return <Star size={16} className="text-yellow-500" />
      default: return <Handshake size={16} className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'paused': return 'text-orange-600 bg-orange-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-700 bg-green-100 border-green-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getContentProgress = (partnership: Partnership) => {
    const total = partnership.requirements.contentTargets.reduce((sum, target) => sum + target.quantity, 0)
    const completed = partnership.requirements.contentTargets.reduce((sum, target) => sum + target.completed, 0)
    return total > 0 ? (completed / total) * 100 : 0
  }

  const filteredPartnerships = partnerships.filter(partnership => {
    if (searchQuery && !partnership.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !partnership.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && partnership.type !== filterType) return false
    if (filterStatus !== 'all' && partnership.status !== filterStatus) return false
    return true
  })

  const updatePartnershipStatus = (partnershipId: string, newStatus: Partnership['status']) => {
    setPartnerships(partnerships.map(partnership =>
      partnership.id === partnershipId 
        ? { ...partnership, status: newStatus }
        : partnership
    ))
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
          <h1 className="text-2xl font-bold text-gray-900">Partnership Programs</h1>
          <p className="text-gray-600">Manage creator partnerships and collaboration campaigns</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Partnership
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active Partnerships</div>
            <Handshake size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.activePartnerships}</div>
          <div className="text-sm text-gray-500">of {stats?.totalPartnerships} total</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Budget Allocated</div>
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalBudget || 0)}</div>
          <div className="text-sm text-orange-600">
            {formatCurrency(stats?.spentBudget || 0)} spent ({((stats?.spentBudget || 0) / (stats?.totalBudget || 1) * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Completion Rate</div>
            <CheckCircle size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.completionRate.toFixed(1)}%</div>
          <div className="text-sm text-purple-600">On-time delivery</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Quality</div>
            <Star size={20} className="text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.averageQuality.toFixed(1)}/10</div>
          <div className="text-sm text-yellow-600">Content quality</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search partnerships..."
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
              <option value="collaboration">Collaboration</option>
              <option value="sponsorship">Sponsorship</option>
              <option value="ambassador">Ambassador</option>
              <option value="exclusive">Exclusive</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{filteredPartnerships.length} partnerships</span>
          </div>
        </div>
      </div>

      {/* Partnerships Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredPartnerships.map((partnership) => {
          const progress = getContentProgress(partnership)
          const budgetUsed = (partnership.budget.spent / partnership.budget.allocated) * 100

          return (
            <div
              key={partnership.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(partnership.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{partnership.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{partnership.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(partnership.status)}`}>
                      {partnership.status}
                    </span>
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(partnership.priority)}`}>
                      {partnership.priority}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(partnership.startDate).toLocaleDateString()}</span>
                    {partnership.endDate && (
                      <>
                        <span className="mx-2">→</span>
                        <span>{new Date(partnership.endDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Budget */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Budget Usage</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(partnership.budget.spent)} / {formatCurrency(partnership.budget.allocated)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${budgetUsed}%` }}
                    ></div>
                  </div>
                </div>

                {/* Content Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Content Progress</span>
                    <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {partnership.requirements.contentTargets.reduce((sum, target) => sum + target.completed, 0)} / {partnership.requirements.contentTargets.reduce((sum, target) => sum + target.quantity, 0)} items
                    </span>
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Participants</span>
                    <span className="text-xs text-gray-500">{partnership.participants.length} creators</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {partnership.participants.slice(0, 4).map((participant, index) => (
                      <div key={index} className="relative">
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                            <Users size={12} className="text-gray-400" />
                          </div>
                        )}
                        {participant.role === 'lead' && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                            <Crown size={8} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {partnership.participants.length > 4 && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white text-xs text-gray-600">
                        +{partnership.participants.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {partnership.performance.totalContent > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{formatNumber(partnership.performance.totalViews)}</div>
                        <div className="text-gray-600">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{partnership.performance.conversionRate.toFixed(1)}%</div>
                        <div className="text-gray-600">Conversion</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{partnership.performance.qualityScore.toFixed(1)}</div>
                        <div className="text-gray-600">Quality</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span>{partnership.participants.length}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      <span>{partnership.requirements.destinations.length} cities</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPartnership(partnership)
                        setShowDetailsModal(true)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-800">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Partnership Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Partnership</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Name</label>
                  <input
                    type="text"
                    value={newPartnership.name}
                    onChange={(e) => setNewPartnership({...newPartnership, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g. Summer Barcelona Campaign"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type</label>
                  <select
                    value={newPartnership.type}
                    onChange={(e) => setNewPartnership({...newPartnership, type: e.target.value as Partnership['type']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="collaboration">Collaboration</option>
                    <option value="sponsorship">Sponsorship</option>
                    <option value="ambassador">Ambassador Program</option>
                    <option value="exclusive">Exclusive Partnership</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newPartnership.description}
                  onChange={(e) => setNewPartnership({...newPartnership, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Describe the partnership goals, requirements, and expected outcomes..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget (EUR)</label>
                  <input
                    type="number"
                    value={newPartnership.budget}
                    onChange={(e) => setNewPartnership({...newPartnership, budget: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="15000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newPartnership.startDate}
                    onChange={(e) => setNewPartnership({...newPartnership, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newPartnership.endDate}
                    onChange={(e) => setNewPartnership({...newPartnership, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-6 border-t border-gray-200">
              <button
                disabled={!newPartnership.name || !newPartnership.startDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save size={16} className="mr-2" />
                Create Partnership
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partnership Details Modal */}
      {showDetailsModal && selectedPartnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedPartnership.type)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedPartnership.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedPartnership.status)}`}>
                        {selectedPartnership.status}
                      </span>
                      <span className={`px-2 py-1 rounded border text-sm font-medium ${getPriorityColor(selectedPartnership.priority)}`}>
                        {selectedPartnership.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedPartnership.description}</p>
              </div>
              
              {/* Budget and Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Budget & Timeline</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Allocated:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(selectedPartnership.budget.allocated)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Spent:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(selectedPartnership.budget.spent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(selectedPartnership.budget.remaining)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="text-gray-900">
                          {new Date(selectedPartnership.startDate).toLocaleDateString()} - {' '}
                          {selectedPartnership.endDate ? new Date(selectedPartnership.endDate).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Content Requirements</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {selectedPartnership.requirements.contentTargets.map((target, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {target.type === 'video' && <Video size={16} className="text-red-500" />}
                          {target.type === 'photo' && <Camera size={16} className="text-blue-500" />}
                          {target.type === 'article' && <FileText size={16} className="text-green-500" />}
                          {target.type === 'campaign' && <Target size={16} className="text-purple-500" />}
                          <span className="text-sm capitalize">{target.type}s</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {target.completed}/{target.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Participants */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Partnership Team</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPartnership.participants.map((participant, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{participant.name}</span>
                          {participant.role === 'lead' && <Crown size={14} className="text-yellow-500" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">@{participant.username}</span>
                          <span className="text-xs text-gray-500 capitalize">({participant.role})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance */}
              {selectedPartnership.performance.totalContent > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="font-semibold text-gray-900">{selectedPartnership.performance.totalContent}</div>
                      <div className="text-sm text-gray-600">Content Items</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="font-semibold text-gray-900">{formatNumber(selectedPartnership.performance.totalViews)}</div>
                      <div className="text-sm text-gray-600">Total Views</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="font-semibold text-gray-900">{selectedPartnership.performance.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Conversion</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="font-semibold text-gray-900">{selectedPartnership.performance.qualityScore.toFixed(1)}/10</div>
                      <div className="text-sm text-gray-600">Quality Score</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Contact & Terms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedPartnership.contact.manager}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-blue-600">{selectedPartnership.contact.email}</span>
                    </div>
                    {selectedPartnership.contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedPartnership.contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Terms & Conditions</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Payment:</span>
                      <span className="ml-2 text-gray-900">{selectedPartnership.terms.paymentStructure}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Exclusivity:</span>
                      <span className="ml-2 text-gray-900">{selectedPartnership.terms.exclusivity ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Content Rights:</span>
                      <span className="ml-2 text-gray-900">{selectedPartnership.terms.contentRights}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Revisions:</span>
                      <span className="ml-2 text-gray-900">{selectedPartnership.terms.revisionRounds} rounds</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Edit size={16} className="mr-2" />
                  Edit Partnership
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                  <Send size={16} className="mr-2" />
                  Send Update
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center">
                  <Gift size={16} className="mr-2" />
                  Add Bonus
                </button>
                <button
                  onClick={() => updatePartnershipStatus(selectedPartnership.id, 'paused')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Pause
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}