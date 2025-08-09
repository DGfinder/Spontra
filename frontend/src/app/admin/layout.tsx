'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Shield, 
  Users, 
  Video, 
  MapPin, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  LogOut,
  User,
  Activity,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Database
} from 'lucide-react'
import { adminAuthService } from '@/services/adminAuthService'
import { AdminUser } from '@/types/admin'

interface AdminLayoutProps {
  children: ReactNode
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  badge?: number
  permissions?: string[]
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    href: '/admin'
  },
  {
    id: 'content',
    label: 'Content Moderation',
    icon: Video,
    href: '/admin/content',
    badge: 0, // Will be updated with pending count
    permissions: ['content.view', 'content.moderate'],
    children: [
      { id: 'content-queue', label: 'Moderation Queue', icon: Video, href: '/admin/content/queue' },
      { id: 'content-approved', label: 'Approved Content', icon: Video, href: '/admin/content/approved' },
      { id: 'content-rejected', label: 'Rejected Content', icon: Video, href: '/admin/content/rejected' }
    ]
  },
  {
    id: 'creators',
    label: 'Creator Program',
    icon: Users,
    href: '/admin/creators',
    permissions: ['creators.view'],
    children: [
      { id: 'creators-dashboard', label: 'Creator Dashboard', icon: Users, href: '/admin/creators/dashboard' },
      { id: 'creators-payouts', label: 'Payouts', icon: TrendingUp, href: '/admin/creators/payouts', permissions: ['creators.payouts'] },
      { id: 'creators-analytics', label: 'Analytics', icon: BarChart3, href: '/admin/creators/analytics' }
    ]
  },
  {
    id: 'destinations',
    label: 'Destinations',
    icon: MapPin,
    href: '/admin/destinations',
    permissions: ['destinations.view'],
    children: [
      { id: 'destinations-manage', label: 'Manage Cities', icon: MapPin, href: '/admin/destinations/manage' },
      { id: 'destinations-themes', label: 'Theme Scoring', icon: Database, href: '/admin/destinations/themes' },
      { id: 'destinations-analytics', label: 'Performance', icon: BarChart3, href: '/admin/destinations/analytics' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    permissions: ['analytics.view'],
    children: [
      { id: 'analytics-revenue', label: 'Revenue', icon: TrendingUp, href: '/admin/analytics/revenue' },
      { id: 'analytics-users', label: 'Users', icon: Users, href: '/admin/analytics/users' },
      { id: 'analytics-bookings', label: 'Bookings', icon: Activity, href: '/admin/analytics/bookings' }
    ]
  },
  {
    id: 'support',
    label: 'Customer Support',
    icon: MessageSquare,
    href: '/admin/support',
    permissions: ['support.view'],
    children: [
      { id: 'support-tickets', label: 'Tickets', icon: MessageSquare, href: '/admin/support/tickets' },
      { id: 'support-live', label: 'Live Chat', icon: MessageSquare, href: '/admin/support/live' }
    ]
  },
  {
    id: 'system',
    label: 'System Monitor',
    icon: Activity,
    href: '/admin/system',
    permissions: ['system.monitor']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    permissions: ['system.configure']
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Check authentication and get user data
    const currentUser = adminAuthService.getCurrentUser()
    if (!currentUser) {
      router.push('/admin/login')
      return
    }
    
    setUser(currentUser)
  }, [router])

  const handleLogout = async () => {
    await adminAuthService.logout()
  }

  const filteredNavigation = navigation.filter(item => {
    if (!item.permissions) return true
    return adminAuthService.hasAnyPermission(item.permissions as any[])
  })

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 transition-all duration-300 flex-shrink-0 hidden lg:flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-black" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-bold text-lg">Spontra</h1>
                <p className="text-slate-400 text-xs">Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {filteredNavigation.map((item) => (
            <div key={item.id}>
              <a
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && (
                  <>
                    <span className="ml-3 font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </a>
              
              {/* Sub-navigation */}
              {sidebarOpen && item.children && isActive(item.href) && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <a
                      key={child.id}
                      href={child.href}
                      className={`flex items-center px-3 py-1 rounded text-sm transition-colors ${
                        pathname === child.href
                          ? 'text-blue-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <child.icon size={16} className="mr-2" />
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-slate-400 text-xs capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="ml-3 text-sm">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-slate-900 w-64 h-full">
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center space-x-3">
                <Shield size={20} className="text-yellow-400" />
                <h1 className="text-white font-bold">Spontra Admin</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {/* Mobile navigation would go here */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-600 hover:text-slate-900 lg:block hidden"
              >
                <Menu size={20} />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-slate-600 hover:text-slate-900 lg:hidden"
              >
                <Menu size={20} />
              </button>

              {/* Search */}
              <div className="relative hidden md:block">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admin panel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900">
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Help */}
              <button className="p-2 text-slate-600 hover:text-slate-900">
                <HelpCircle size={20} />
              </button>

              {/* Toggle Sidebar (desktop) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hidden lg:block"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}