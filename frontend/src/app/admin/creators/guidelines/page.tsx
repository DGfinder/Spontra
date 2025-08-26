'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Save,
  X,
  FileText,
  Video,
  Camera,
  Star,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  Globe,
  Clock,
  Target,
  Heart,
  Share2,
  DollarSign,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Copy,
  Send,
  Bell,
  Settings
} from 'lucide-react'

interface Guideline {
  id: string
  title: string
  description: string
  category: 'content_quality' | 'technical_specs' | 'brand_guidelines' | 'legal_compliance' | 'best_practices' | 'monetization'
  type: 'rule' | 'recommendation' | 'requirement' | 'tip'
  priority: 'low' | 'medium' | 'high' | 'critical'
  applies_to: Array<'video' | 'photo' | 'article' | 'all'>
  details: string
  examples?: Array<{
    type: 'good' | 'bad'
    description: string
    imageUrl?: string
  }>
  lastUpdated: string
  version: string
  isActive: boolean
}

interface GuidelineStats {
  totalGuidelines: number
  activeGuidelines: number
  criticalRules: number
  lastUpdated: string
  complianceRate: number
  commonViolations: Array<{
    guideline: string
    violations: number
    trend: number
  }>
}

export default function CreatorGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  const [stats, setStats] = useState<GuidelineStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null)
  const [showGuidelineModal, setShowGuidelineModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const [newGuideline, setNewGuideline] = useState({
    title: '',
    description: '',
    category: 'content_quality' as Guideline['category'],
    type: 'rule' as Guideline['type'],
    priority: 'medium' as Guideline['priority'],
    applies_to: ['all'] as Array<'video' | 'photo' | 'article' | 'all'>,
    details: '',
    examples: [] as Array<{ type: 'good' | 'bad'; description: string; imageUrl?: string }>
  })

  // Mock data
  const mockStats: GuidelineStats = {
    totalGuidelines: 47,
    activeGuidelines: 42,
    criticalRules: 8,
    lastUpdated: '2024-01-22T10:00:00Z',
    complianceRate: 87.3,
    commonViolations: [
      { guideline: 'Video Quality Standards', violations: 23, trend: -15.2 },
      { guideline: 'Brand Consistency', violations: 18, trend: 8.7 },
      { guideline: 'Content Authenticity', violations: 12, trend: -3.1 },
      { guideline: 'Location Accuracy', violations: 9, trend: -22.4 }
    ]
  }

  const mockGuidelines: Guideline[] = [
    {
      id: '1',
      title: 'Video Quality Standards',
      description: 'All videos must meet minimum resolution and production quality requirements',
      category: 'technical_specs',
      type: 'requirement',
      priority: 'critical',
      applies_to: ['video'],
      details: 'Videos must be shot in at least 1080p resolution with stable footage, clear audio, and proper lighting. Avoid shaky camera work, poor audio quality, or overly dark/bright footage.',
      examples: [
        {
          type: 'good',
          description: 'Clear 1080p footage with steady shots and crisp audio'
        },
        {
          type: 'bad',
          description: 'Blurry, shaky footage with muffled or distorted audio'
        }
      ],
      lastUpdated: '2024-01-15T09:00:00Z',
      version: '2.1',
      isActive: true
    },
    {
      id: '2',
      title: 'Authentic Experience Sharing',
      description: 'Content must reflect genuine personal experiences and honest recommendations',
      category: 'content_quality',
      type: 'rule',
      priority: 'critical',
      applies_to: ['all'],
      details: 'All content must be based on actual visits and experiences. Avoid overly promotional language or misleading information. Share both positive aspects and any limitations honestly.',
      examples: [
        {
          type: 'good',
          description: 'Honest review mentioning both highlights and minor drawbacks'
        },
        {
          type: 'bad',
          description: 'Overly promotional content that seems paid or fake'
        }
      ],
      lastUpdated: '2024-01-10T14:30:00Z',
      version: '1.8',
      isActive: true
    },
    {
      id: '3',
      title: 'Brand Voice and Tone',
      description: 'Maintain Spontra\'s friendly, informative, and inspiring brand voice',
      category: 'brand_guidelines',
      type: 'recommendation',
      priority: 'high',
      applies_to: ['all'],
      details: 'Content should be conversational, helpful, and inspire wanderlust while remaining informative and practical. Avoid overly casual language or formal academic tone.',
      examples: [
        {
          type: 'good',
          description: '"This hidden café serves the most amazing pastries I\'ve ever tasted!"'
        },
        {
          type: 'bad',
          description: '"The establishment provides adequate culinary offerings."'
        }
      ],
      lastUpdated: '2024-01-08T11:15:00Z',
      version: '1.4',
      isActive: true
    },
    {
      id: '4',
      title: 'Photo Composition Guidelines',
      description: 'Follow composition best practices for engaging travel photography',
      category: 'best_practices',
      type: 'tip',
      priority: 'medium',
      applies_to: ['photo'],
      details: 'Use rule of thirds, include people for scale when appropriate, capture golden hour lighting when possible, and ensure photos are sharp and well-exposed.',
      examples: [
        {
          type: 'good',
          description: 'Well-composed shot with interesting foreground and background elements'
        },
        {
          type: 'bad',
          description: 'Centered, cluttered composition with poor lighting'
        }
      ],
      lastUpdated: '2024-01-20T16:45:00Z',
      version: '2.3',
      isActive: true
    },
    {
      id: '5',
      title: 'Content Monetization Rules',
      description: 'Guidelines for earning through content creation and partnerships',
      category: 'monetization',
      type: 'rule',
      priority: 'high',
      applies_to: ['all'],
      details: 'Clearly disclose any sponsored content, partnerships, or affiliate relationships. Maintain editorial independence and only promote products/services you genuinely recommend.',
      examples: [
        {
          type: 'good',
          description: 'Clear disclosure: "This experience was sponsored by [Brand], but all opinions are my own"'
        },
        {
          type: 'bad',
          description: 'Hidden sponsorship without proper disclosure'
        }
      ],
      lastUpdated: '2024-01-18T13:20:00Z',
      version: '1.6',
      isActive: true
    },
    {
      id: '6',
      title: 'Privacy and Safety',
      description: 'Protect personal privacy and ensure safety in all content',
      category: 'legal_compliance',
      type: 'requirement',
      priority: 'critical',
      applies_to: ['all'],
      details: 'Never share personal information like exact addresses, private contact details, or travel plans in real-time. Respect local laws and customs.',
      examples: [
        {
          type: 'good',
          description: 'Sharing general neighborhood or district information'
        },
        {
          type: 'bad',
          description: 'Posting exact address or current location in real-time'
        }
      ],
      lastUpdated: '2024-01-12T10:30:00Z',
      version: '1.9',
      isActive: true
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setGuidelines(mockGuidelines)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to load guidelines:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content_quality': return <Star size={16} className="text-yellow-500" />
      case 'technical_specs': return <Settings size={16} className="text-blue-500" />
      case 'brand_guidelines': return <Award size={16} className="text-purple-500" />
      case 'legal_compliance': return <Shield size={16} className="text-red-500" />
      case 'best_practices': return <TrendingUp size={16} className="text-green-500" />
      case 'monetization': return <DollarSign size={16} className="text-orange-500" />
      default: return <FileText size={16} className="text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content_quality': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'technical_specs': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'brand_guidelines': return 'text-purple-700 bg-purple-100 border-purple-200'
      case 'legal_compliance': return 'text-red-700 bg-red-100 border-red-200'
      case 'best_practices': return 'text-green-700 bg-green-100 border-green-200'
      case 'monetization': return 'text-orange-700 bg-orange-100 border-orange-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rule': return <Shield size={14} className="text-red-500" />
      case 'requirement': return <AlertTriangle size={14} className="text-orange-500" />
      case 'recommendation': return <Info size={14} className="text-blue-500" />
      case 'tip': return <Zap size={14} className="text-green-500" />
      default: return <FileText size={14} className="text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-gray-700 bg-gray-100 border-gray-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const filteredGuidelines = guidelines.filter(guideline => {
    if (searchQuery && !guideline.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !guideline.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterCategory !== 'all' && guideline.category !== filterCategory) return false
    if (filterType !== 'all' && guideline.type !== filterType) return false
    if (filterPriority !== 'all' && guideline.priority !== filterPriority) return false
    return true
  })

  const handleCreateGuideline = () => {
    // In production, this would call an API
    const guideline: Guideline = {
      id: Date.now().toString(),
      ...newGuideline,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      isActive: true
    }
    setGuidelines([...guidelines, guideline])
    setShowCreateModal(false)
    setNewGuideline({
      title: '',
      description: '',
      category: 'content_quality',
      type: 'rule',
      priority: 'medium',
      applies_to: ['all'],
      details: '',
      examples: []
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Creator Guidelines</h1>
          <p className="text-gray-600">Content creation standards and best practices for creators</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Guidelines
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Guideline
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Guidelines</div>
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalGuidelines}</div>
          <div className="text-sm text-blue-600">{stats?.activeGuidelines} active</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Critical Rules</div>
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.criticalRules}</div>
          <div className="text-sm text-red-600">Must follow</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Compliance Rate</div>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.complianceRate.toFixed(1)}%</div>
          <div className="text-sm text-green-600">Overall adherence</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Last Updated</div>
            <Clock size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats ? new Date(stats.lastUpdated).toLocaleDateString() : '-'}
          </div>
          <div className="text-sm text-purple-600">Guidelines</div>
        </div>
      </div>

      {/* Common Violations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Common Violations Trends</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {stats?.commonViolations.map((violation, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{violation.guideline}</h4>
                    <p className="text-sm text-gray-600">{violation.violations} violations this month</p>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-2 ${
                  violation.trend < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {violation.trend < 0 ? (
                    <TrendingDown size={16} />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                  <span className="text-sm font-medium">
                    {violation.trend > 0 ? '+' : ''}{violation.trend.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guidelines List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">All Guidelines</h3>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guidelines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="content_quality">Content Quality</option>
                <option value="technical_specs">Technical Specs</option>
                <option value="brand_guidelines">Brand Guidelines</option>
                <option value="legal_compliance">Legal Compliance</option>
                <option value="best_practices">Best Practices</option>
                <option value="monetization">Monetization</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="rule">Rules</option>
                <option value="requirement">Requirements</option>
                <option value="recommendation">Recommendations</option>
                <option value="tip">Tips</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredGuidelines.map((guideline) => (
            <div key={guideline.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-3 mb-3">
                    {getCategoryIcon(guideline.category)}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{guideline.title}</h4>
                      <p className="text-gray-600 mb-3">{guideline.description}</p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(guideline.category)}`}>
                          {getCategoryIcon(guideline.category)}
                          <span className="capitalize">{guideline.category.replace('_', ' ')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(guideline.type)}
                          <span className="text-sm text-gray-600 capitalize">{guideline.type}</span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(guideline.priority)}`}>
                          {guideline.priority.charAt(0).toUpperCase() + guideline.priority.slice(1)} Priority
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Applies to: {guideline.applies_to.join(', ')}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Version {guideline.version} • Updated {new Date(guideline.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedGuideline(guideline)
                      setShowGuidelineModal(true)
                    }}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                  >
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Guideline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Create New Guideline</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newGuideline.title}
                  onChange={(e) => setNewGuideline({...newGuideline, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter guideline title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newGuideline.description}
                  onChange={(e) => setNewGuideline({...newGuideline, description: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Brief description of the guideline"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newGuideline.category}
                    onChange={(e) => setNewGuideline({...newGuideline, category: e.target.value as Guideline['category']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="content_quality">Content Quality</option>
                    <option value="technical_specs">Technical Specs</option>
                    <option value="brand_guidelines">Brand Guidelines</option>
                    <option value="legal_compliance">Legal Compliance</option>
                    <option value="best_practices">Best Practices</option>
                    <option value="monetization">Monetization</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newGuideline.type}
                    onChange={(e) => setNewGuideline({...newGuideline, type: e.target.value as Guideline['type']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="rule">Rule</option>
                    <option value="requirement">Requirement</option>
                    <option value="recommendation">Recommendation</option>
                    <option value="tip">Tip</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newGuideline.priority}
                    onChange={(e) => setNewGuideline({...newGuideline, priority: e.target.value as Guideline['priority']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Instructions</label>
                <textarea
                  value={newGuideline.details}
                  onChange={(e) => setNewGuideline({...newGuideline, details: e.target.value})}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Detailed explanation of the guideline"
                />
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
                onClick={handleCreateGuideline}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save size={16} className="mr-2" />
                Create Guideline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guideline Detail Modal */}
      {showGuidelineModal && selectedGuideline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(selectedGuideline.category)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedGuideline.title}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(selectedGuideline.priority)}`}>
                    {selectedGuideline.priority.charAt(0).toUpperCase() + selectedGuideline.priority.slice(1)}
                  </div>
                </div>
                <button
                  onClick={() => setShowGuidelineModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedGuideline.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Detailed Instructions</h4>
                <p className="text-gray-700 leading-relaxed">{selectedGuideline.details}</p>
              </div>
              
              {selectedGuideline.examples && selectedGuideline.examples.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Examples</h4>
                  <div className="space-y-4">
                    {selectedGuideline.examples.map((example, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        example.type === 'good' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {example.type === 'good' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <X size={16} className="text-red-600" />
                          )}
                          <span className={`font-medium text-sm ${
                            example.type === 'good' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {example.type === 'good' ? 'Good Example' : 'Bad Example'}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          example.type === 'good' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {example.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getCategoryColor(selectedGuideline.category)}`}>
                    {getCategoryIcon(selectedGuideline.category)}
                    <span className="capitalize">{selectedGuideline.category.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTypeIcon(selectedGuideline.type)}
                    <span className="capitalize">{selectedGuideline.type}</span>
                  </div>
                  <span>Applies to: {selectedGuideline.applies_to.join(', ')}</span>
                </div>
                
                <div className="text-sm text-gray-500">
                  Version {selectedGuideline.version} • {new Date(selectedGuideline.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}