'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
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
  Database,
  Zap,
  Brain,
  DollarSign
} from 'lucide-react'
import { adminAuthService } from '@/services/adminAuthService'
import { AdminUser } from '@/types/admin'

interface AdminLayoutProps {
  children: ReactNode
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
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
    id: 'finance',
    label: 'Finance Automation',
    icon: DollarSign,
    href: '/admin/finance',
    permissions: ['finance.view'],
    children: [
      { id: 'finance-automation', label: 'Automation Hub', icon: Zap, href: '/admin/finance/automation' },
      { id: 'finance-reports', label: 'Financial Reports', icon: BarChart3, href: '/admin/finance/reports' }
    ]
  },
  {
    id: 'content',
    label: 'Content Intelligence',
    icon: Video,
    href: '/admin/content',
    badge: 0,
    permissions: ['content.view', 'content.moderate'],
    children: [
      { id: 'content-queue', label: 'Moderation Queue', icon: Video, href: '/admin/content/queue' },
      { id: 'content-intelligence', label: 'AI Intelligence', icon: Brain, href: '/admin/content/intelligence' }
    ]
  },
  {
    id: 'revenue',
    label: 'Revenue Optimization',
    icon: TrendingUp,
    href: '/admin/revenue',
    permissions: ['finance.view']
  },
  {
    id: 'creators',
    label: 'Creator Lifecycle',
    icon: Users,
    href: '/admin/creators',
    permissions: ['creators.view'],
    children: [
      { id: 'creators-dashboard', label: 'Creator Dashboard', icon: Users, href: '/admin/creators/dashboard' },
      { id: 'creators-lifecycle', label: 'Lifecycle Management', icon: Activity, href: '/admin/creators/lifecycle' },
      { id: 'creators-payouts', label: 'Payouts', icon: DollarSign, href: '/admin/creators/payouts', permissions: ['creators.payouts'] }
    ]
  },
  {
    id: 'support',
    label: 'Support Automation',
    icon: MessageSquare,
    href: '/admin/support',
    permissions: ['support.view'],
    children: [
      { id: 'support-automation', label: 'Automation Hub', icon: Zap, href: '/admin/support/automation' },
      { id: 'support-tickets', label: 'Tickets', icon: MessageSquare, href: '/admin/support/tickets' }
    ]
  },
  {
    id: 'intelligence',
    label: 'Business Intelligence',
    icon: Brain,
    href: '/admin/intelligence',
    permissions: ['analytics.view']
  },
  {
    id: 'destinations',
    label: 'Destinations',
    icon: MapPin,
    href: '/admin/destinations',
    permissions: ['destinations.view'],
    children: [
      { id: 'destinations-manage', label: 'Manage Cities', icon: MapPin, href: '/admin/destinations/manage' }
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
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Skip authentication check for login page
    if (pathname === '/admin/login') {
      setIsAuthChecking(false)
      return
    }

    console.log('🔍 Layout checking authentication for:', pathname)

    // Enhanced authentication check with proper timing
    const checkAuth = async () => {
      try {
        // Give some time for login to complete and store session
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const currentUser = adminAuthService.getCurrentUser()
        console.log('👤 Layout found user:', currentUser ? currentUser.email : 'none')
        
        if (!currentUser) {
          console.log('❌ No authenticated user, redirecting to login')
          router.push('/admin/login?redirect=' + encodeURIComponent(pathname))
          return
        }
        
        console.log('✅ User authenticated successfully')
        setUser(currentUser)
      } catch (error) {
        console.error('❌ Authentication check failed:', error)
        router.push('/admin/login')
      } finally {
        setIsAuthChecking(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    console.log('🚪 Logging out user')
    await adminAuthService.logout()
  }

  const filteredNavigation = user ? navigation.filter(item => {
    if (!item.permissions) return true
    return adminAuthService.hasAnyPermission(item.permissions as any[])
  }) : []

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // For login page, render children without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Show loading during authentication check
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-sm">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show loading if user not set yet
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-sm">Loading admin dashboard...</p>
        </div>
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
              <Link
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
              </Link>
              
              {/* Sub-navigation */}
              {sidebarOpen && item.children && isActive(item.href) && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link
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
                    </Link>
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
                <p className="text-slate-400 text-xs capitalize">{user.role ? user.role.replace('_', ' ') : 'Admin'}</p>
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

              {/* User Menu */}
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span className="hidden md:inline">Welcome,</span>
                <span className="font-medium">{user.fullName}</span>
              </div>
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