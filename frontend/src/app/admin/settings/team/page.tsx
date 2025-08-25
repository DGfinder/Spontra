'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Key,
  Settings,
  Lock,
  Unlock,
  UserPlus,
  Download,
  Upload
} from 'lucide-react'

interface TeamMember {
  id: string
  fullName: string
  email: string
  role: 'super_admin' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  lastLogin: string | null
  createdAt: string
  permissions: string[]
  department?: string
  avatar?: string
}

interface Permission {
  id: string
  name: string
  description: string
  category: 'content' | 'system' | 'finance' | 'users' | 'marketing'
}

interface TeamManagementData {
  members: TeamMember[]
  permissions: Permission[]
  roles: Array<{
    id: string
    name: string
    description: string
    permissions: string[]
  }>
  configured: boolean
}

export default function TeamManagement() {
  const [data, setData] = useState<TeamManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings/team')
      if (!response.ok) {
        throw new Error('Failed to load team data')
      }
      const teamData = await response.json()
      setData(teamData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="text-green-600" />
      case 'inactive': return <XCircle size={16} className="text-gray-600" />
      case 'pending': return <Clock size={16} className="text-yellow-600" />
      case 'suspended': return <AlertTriangle size={16} className="text-red-600" />
      default: return <XCircle size={16} className="text-gray-600" />
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck size={16} className="text-red-600" />
      case 'admin': return <Shield size={16} className="text-blue-600" />
      case 'editor': return <Edit size={16} className="text-green-600" />
      case 'viewer': return <User size={16} className="text-gray-600" />
      default: return <User size={16} className="text-gray-600" />
    }
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const filteredMembers = data?.members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-xl p-6">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.configured) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team & Permissions</h1>
            <p className="text-gray-600">Manage team members and access permissions</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">Team Management Not Configured</span>
              <span className="text-xs text-gray-500">• Configure user management system</span>
            </div>
          </div>
        </div>

        <EmptyTeamState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & Permissions</h1>
          <p className="text-gray-600">Manage team members and access permissions</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">Team Management Active</span>
            <span className="text-xs text-gray-500">• {data.members.length} members</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <UserPlus size={16} className="mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle size={20} className="text-red-600 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="divide-y divide-gray-200">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                        {getStatusIcon(member.status)}
                        <span className={`text-sm capitalize ${
                          member.status === 'active' ? 'text-green-600' :
                          member.status === 'pending' ? 'text-yellow-600' :
                          member.status === 'suspended' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span>{formatRole(member.role)}</span>
                        </div>
                        {member.department && (
                          <div className="flex items-center space-x-1">
                            <span>•</span>
                            <span>{member.department}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Last login: {formatDate(member.lastLogin)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>Joined: {formatDate(member.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Key size={12} />
                          <span>{member.permissions.length} permissions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-4 text-gray-400" />
              <p>No team members found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.roles.map((role) => {
          const count = data.members.filter(m => m.role === role.id).length
          return (
            <div key={role.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getRoleIcon(role.id)}
                </div>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{role.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="text-xs text-gray-500">
                {role.permissions.length} permissions
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyTeamState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Users size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Team Management Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To manage team members and permissions, configure the user management system.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">User Authentication System</div>
              <div className="text-sm text-gray-600">Set up user accounts and authentication</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Role-Based Access Control</div>
              <div className="text-sm text-gray-600">Configure permissions and role management</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Settings size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Admin Panel Integration</div>
              <div className="text-sm text-gray-600">Connect team management to admin services</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure team management.
          </div>
        </div>
      </div>
    </div>
  )
}