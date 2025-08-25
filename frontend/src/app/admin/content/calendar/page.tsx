'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin,
  User,
  Video,
  Camera,
  FileText,
  Star,
  Flag,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Settings,
  Download,
  Upload,
  Bell,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Target,
  TrendingUp
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description: string
  type: 'content_publish' | 'campaign_launch' | 'seasonal_push' | 'creator_deadline' | 'review_cycle'
  status: 'planned' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  endDate?: string
  destination?: {
    iataCode: string
    cityName: string
    countryName: string
  }
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  content?: {
    type: 'video' | 'photo' | 'article' | 'campaign'
    count: number
  }
  tags: string[]
  progress?: number // 0-100
  reminders: string[]
  createdAt: string
  updatedAt: string
}

interface CalendarStats {
  totalEvents: number
  activeEvents: number
  completedThisMonth: number
  overdueTasks: number
  upcomingDeadlines: number
}

export default function EditorialCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'content_publish' as CalendarEvent['type'],
    priority: 'medium' as CalendarEvent['priority'],
    startDate: '',
    endDate: '',
    destination: '',
    assignee: '',
    tags: [] as string[],
    reminders: [] as string[]
  })

  // Mock data
  const mockStats: CalendarStats = {
    totalEvents: 156,
    activeEvents: 34,
    completedThisMonth: 28,
    overdueTasks: 3,
    upcomingDeadlines: 12
  }

  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Barcelona Summer Campaign Launch',
      description: 'Launch summer campaign featuring Barcelona beach activities and nightlife content',
      type: 'campaign_launch',
      status: 'planned',
      priority: 'high',
      startDate: '2024-01-25T09:00:00Z',
      endDate: '2024-01-30T18:00:00Z',
      destination: {
        iataCode: 'BCN',
        cityName: 'Barcelona',
        countryName: 'Spain'
      },
      assignee: {
        id: '1',
        name: 'Maria Santos',
        avatar: '/images/team/maria.jpg'
      },
      content: {
        type: 'campaign',
        count: 15
      },
      tags: ['summer', 'beach', 'nightlife', 'campaign'],
      progress: 65,
      reminders: ['24h', '1h'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-22T14:30:00Z'
    },
    {
      id: '2',
      title: 'Prague Winter Content Review',
      description: 'Review and approve winter-themed content for Prague destinations',
      type: 'review_cycle',
      status: 'in_progress',
      priority: 'medium',
      startDate: '2024-01-23T08:00:00Z',
      endDate: '2024-01-26T17:00:00Z',
      destination: {
        iataCode: 'PRG',
        cityName: 'Prague',
        countryName: 'Czech Republic'
      },
      assignee: {
        id: '2',
        name: 'David Novak',
        avatar: '/images/team/david.jpg'
      },
      content: {
        type: 'video',
        count: 8
      },
      tags: ['winter', 'review', 'content'],
      progress: 40,
      reminders: ['daily'],
      createdAt: '2024-01-20T09:15:00Z',
      updatedAt: '2024-01-22T16:45:00Z'
    },
    {
      id: '3',
      title: 'Rome Food Content Deadline',
      description: 'Creator submission deadline for Rome food and dining experiences',
      type: 'creator_deadline',
      status: 'overdue',
      priority: 'critical',
      startDate: '2024-01-20T23:59:00Z',
      destination: {
        iataCode: 'ROM',
        cityName: 'Rome',
        countryName: 'Italy'
      },
      content: {
        type: 'photo',
        count: 12
      },
      tags: ['food', 'creators', 'deadline'],
      progress: 25,
      reminders: ['overdue'],
      createdAt: '2024-01-10T11:20:00Z',
      updatedAt: '2024-01-20T08:30:00Z'
    },
    {
      id: '4',
      title: 'Amsterdam Canal Content Publish',
      description: 'Publish new Amsterdam canal cruise and waterway content',
      type: 'content_publish',
      status: 'completed',
      priority: 'low',
      startDate: '2024-01-18T12:00:00Z',
      destination: {
        iataCode: 'AMS',
        cityName: 'Amsterdam',
        countryName: 'Netherlands'
      },
      content: {
        type: 'article',
        count: 5
      },
      tags: ['canals', 'boats', 'published'],
      progress: 100,
      reminders: [],
      createdAt: '2024-01-12T15:45:00Z',
      updatedAt: '2024-01-18T12:30:00Z'
    },
    {
      id: '5',
      title: 'Spring Travel Season Push',
      description: 'Seasonal content push for spring travel destinations across Europe',
      type: 'seasonal_push',
      status: 'planned',
      priority: 'high',
      startDate: '2024-03-01T00:00:00Z',
      endDate: '2024-03-31T23:59:00Z',
      content: {
        type: 'campaign',
        count: 25
      },
      tags: ['spring', 'seasonal', 'europe'],
      progress: 0,
      reminders: ['1week', '1day'],
      createdAt: '2024-01-22T10:00:00Z',
      updatedAt: '2024-01-22T10:00:00Z'
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        setEvents(mockEvents)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to load calendar data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_publish': return <FileText size={16} className="text-blue-500" />
      case 'campaign_launch': return <Target size={16} className="text-purple-500" />
      case 'seasonal_push': return <Calendar size={16} className="text-green-500" />
      case 'creator_deadline': return <User size={16} className="text-orange-500" />
      case 'review_cycle': return <Eye size={16} className="text-gray-500" />
      default: return <Calendar size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'planned': return 'text-gray-600 bg-gray-100'
      case 'overdue': return 'text-red-600 bg-red-100'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    if (!date) return []
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
      
      return date >= eventStart.toDateString() === date.toDateString() ||
             (date >= eventStart && date <= eventEnd)
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && event.type !== filterType) return false
    if (filterStatus !== 'all' && event.status !== filterStatus) return false
    return true
  })

  const createEvent = () => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type,
      status: 'planned',
      priority: newEvent.priority,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate || undefined,
      tags: newEvent.tags,
      reminders: newEvent.reminders,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setEvents([...events, event])
    setShowCreateModal(false)
    setNewEvent({
      title: '',
      description: '',
      type: 'content_publish',
      priority: 'medium',
      startDate: '',
      endDate: '',
      destination: '',
      assignee: '',
      tags: [],
      reminders: []
    })
  }

  const updateEventProgress = (eventId: string, progress: number) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            progress,
            status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planned',
            updatedAt: new Date().toISOString()
          }
        : event
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
          <h1 className="text-2xl font-bold text-gray-900">Editorial Calendar</h1>
          <p className="text-gray-600">Plan and schedule content across destinations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Events</div>
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalEvents}</div>
          <div className="text-sm text-gray-500">Across all time</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active Events</div>
            <Clock size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.activeEvents}</div>
          <div className="text-sm text-orange-600">In progress</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Completed</div>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.completedThisMonth}</div>
          <div className="text-sm text-green-600">This month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.overdueTasks}</div>
          <div className="text-sm text-red-600">Need attention</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Upcoming</div>
            <Bell size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.upcomingDeadlines}</div>
          <div className="text-sm text-purple-600">Next 7 days</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* View Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
            
            {viewMode === 'month' && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
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
              <option value="content_publish">Content Publish</option>
              <option value="campaign_launch">Campaign Launch</option>
              <option value="seasonal_push">Seasonal Push</option>
              <option value="creator_deadline">Creator Deadline</option>
              <option value="review_cycle">Review Cycle</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar/List View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : []
                const isToday = date && date.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-100 ${
                      date 
                        ? isToday 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowEventModal(true)
                              }}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${getStatusColor(event.status)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(event.type)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          <span>{formatDate(event.startDate)}</span>
                          {event.endDate && <span> - {formatDate(event.endDate)}</span>}
                        </div>
                        {event.destination && (
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            <span>{event.destination.iataCode}</span>
                          </div>
                        )}
                        {event.assignee && (
                          <div className="flex items-center">
                            <User size={12} className="mr-1" />
                            <span>{event.assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {event.progress !== undefined && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${event.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 min-w-[3rem]">{event.progress}%</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventModal(true)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Enter event title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as CalendarEvent['type']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="content_publish">Content Publish</option>
                    <option value="campaign_launch">Campaign Launch</option>
                    <option value="seasonal_push">Seasonal Push</option>
                    <option value="creator_deadline">Creator Deadline</option>
                    <option value="review_cycle">Review Cycle</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Event description..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as CalendarEvent['priority']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={createEvent}
                disabled={!newEvent.title || !newEvent.startDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Event
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

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedEvent.type)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Event Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900 capitalize">{selectedEvent.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedEvent.priority)}`}>
                        {selectedEvent.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Start:</span>
                      <span className="text-gray-900">{formatDate(selectedEvent.startDate)}</span>
                    </div>
                    {selectedEvent.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="text-gray-900">{formatDate(selectedEvent.endDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Progress & Assignment</h4>
                  <div className="space-y-3">
                    {selectedEvent.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm text-gray-900">{selectedEvent.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedEvent.progress}%` }}
                          ></div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedEvent.progress}
                          onChange={(e) => updateEventProgress(selectedEvent.id, parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    {selectedEvent.assignee && (
                      <div className="flex items-center space-x-2">
                        {selectedEvent.assignee.avatar && (
                          <img
                            src={selectedEvent.assignee.avatar}
                            alt={selectedEvent.assignee.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{selectedEvent.assignee.name}</div>
                          <div className="text-xs text-gray-600">Assigned</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedEvent.destination && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Destination</h4>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-600" />
                    <span className="text-gray-900">
                      {selectedEvent.destination.cityName}, {selectedEvent.destination.countryName} ({selectedEvent.destination.iataCode})
                    </span>
                  </div>
                </div>
              )}
              
              {selectedEvent.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Edit size={16} className="mr-2" />
                  Edit Event
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center">
                  <Bell size={16} className="mr-2" />
                  Set Reminder
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}