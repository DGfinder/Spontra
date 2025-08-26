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
  Plane,
  Zap,
  Brain,
  DollarSign,
  Calendar,
  FileText,
  Camera,
  Star,
  Target,
  Globe,
  Mail,
  Share2,
  PieChart,
  UserCheck,
  BookOpen,
  AlertTriangle,
  CreditCard,
  Receipt,
  FileBarChart,
  Shield as Security,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock
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
  isSection?: boolean
  isExpanded?: boolean
  section?: 'primary' | 'secondary' | 'administrative'
}

const navigation: NavigationItem[] = [
  // PRIMARY SECTION
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    href: '/admin',
    section: 'primary'
  },
  {
    id: 'destinations',
    label: 'Destinations',
    icon: MapPin,
    href: '/admin/destinations',
    section: 'primary',
    isExpanded: true,
    permissions: ['destinations.view'],
    children: [
      { id: 'destinations-browse', label: 'Browse Destinations', icon: MapPin, href: '/admin/destinations/manage' },
      { id: 'destinations-add', label: 'Add New Destination', icon: Plus, href: '/admin/destinations/add' },
      { id: 'destinations-themes', label: 'Themes & Categories', icon: Star, href: '/admin/destinations/themes' },
      { id: 'destinations-featured', label: 'Featured Cities', icon: Target, href: '/admin/destinations/featured' },
      { id: 'destinations-seasonal', label: 'Seasonal Collections', icon: Calendar, href: '/admin/destinations/seasonal' },
      { id: 'destinations-cache', label: 'Recommendations Cache', icon: Database, href: '/admin/destinations/cache' },
      { id: 'airports', label: 'Airports (Read-only)', icon: Globe, href: '/admin/airports' }
    ]
  },
  {
    id: 'operations',
    label: 'Flight Reference',
    icon: Globe,
    href: '/admin/ops',
    section: 'primary',
    children: [
      { id: 'airlines', label: 'Airlines (Read-only)', icon: Plane, href: '/admin/airlines' },
      { id: 'aircraft', label: 'Aircraft Types (Read-only)', icon: Database, href: '/admin/aircraft' },
      { id: 'flight-times', label: 'Flight Times', icon: Clock, href: '/admin/flight-times' }
    ]
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: FileText,
    href: '/admin/content',
    section: 'primary',
    badge: 0,
    permissions: ['content.view'],
    children: [
      { id: 'content-library', label: 'Video Library', icon: Video, href: '/admin/content/library' },
      { id: 'content-moderation', label: 'Content Moderation', icon: Shield, href: '/admin/content/queue' },
      { id: 'content-ugc', label: 'User Generated Content', icon: Camera, href: '/admin/content/ugc' },
      { id: 'content-calendar', label: 'Editorial Calendar', icon: Calendar, href: '/admin/content/calendar' },
      { id: 'content-performance', label: 'Content Performance', icon: TrendingUp, href: '/admin/content/performance' }
    ]
  },
  {
    id: 'creator-tools',
    label: 'Creator Tools',
    icon: Users,
    href: '/admin/creators',
    section: 'primary',
    permissions: ['creators.view'],
    children: [
      { id: 'creator-profiles', label: 'Creator Profiles', icon: User, href: '/admin/creators/dashboard' },
      { id: 'creator-analytics', label: 'Creator Analytics', icon: PieChart, href: '/admin/creators/analytics' },
      { id: 'creator-partnerships', label: 'Partnership Programs', icon: Share2, href: '/admin/creators/partnerships' },
      { id: 'creator-guidelines', label: 'Content Guidelines', icon: BookOpen, href: '/admin/creators/guidelines' }
    ]
  },
  
  // SECONDARY SECTION
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Target,
    href: '/admin/marketing',
    section: 'secondary',
    permissions: ['marketing.view'],
    children: [
      { id: 'marketing-campaigns', label: 'Campaigns', icon: Zap, href: '/admin/marketing/campaigns' },
      { id: 'marketing-seo', label: 'SEO & Discovery', icon: Search, href: '/admin/marketing/seo' },
      { id: 'marketing-email', label: 'Email Marketing', icon: Mail, href: '/admin/marketing/email' },
      { id: 'marketing-social', label: 'Social Media', icon: Share2, href: '/admin/marketing/social' },
      { id: 'marketing-analytics', label: 'Analytics & Reports', icon: BarChart3, href: '/admin/marketing/analytics' }
    ]
  },
  {
    id: 'community',
    label: 'Users & Community',
    icon: UserCheck,
    href: '/admin/community',
    section: 'secondary',
    permissions: ['users.view'],
    children: [
      { id: 'community-users', label: 'User Management', icon: Users, href: '/admin/community/users' },
      { id: 'community-segments', label: 'User Segments', icon: PieChart, href: '/admin/community/segments' },
      { id: 'community-reviews', label: 'Reviews & Ratings', icon: Star, href: '/admin/community/reviews' },
      { id: 'community-guidelines', label: 'Community Guidelines', icon: BookOpen, href: '/admin/community/guidelines' },
      { id: 'community-support', label: 'Support Tickets', icon: MessageSquare, href: '/admin/support/automation' }
    ]
  },

  // ADMINISTRATIVE SECTION
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    href: '/admin/finance',
    section: 'administrative',
    permissions: ['finance.view'],
    children: [
      { id: 'finance-dashboard', label: 'Revenue Dashboard', icon: BarChart3, href: '/admin/financial' },
      { id: 'finance-processing', label: 'Payment Processing', icon: CreditCard, href: '/admin/finance/payments' },
      { id: 'finance-invoicing', label: 'Invoicing', icon: Receipt, href: '/admin/finance/invoicing' },
      { id: 'finance-tax', label: 'Tax Management', icon: FileBarChart, href: '/admin/finance/tax' },
      { id: 'finance-reports', label: 'Financial Reports', icon: FileText, href: '/admin/finance/automation' },
      { id: 'finance-budgets', label: 'Budgets & Forecasting', icon: TrendingUp, href: '/admin/finance/budgets' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    section: 'administrative',
    permissions: ['system.configure'],
    children: [
      { id: 'settings-general', label: 'General Settings', icon: Settings, href: '/admin/settings/general' },
      { id: 'settings-team', label: 'Team & Permissions', icon: Users, href: '/admin/settings/team' },
      { id: 'settings-api', label: 'API & Integrations', icon: Zap, href: '/admin/settings/api' },
      { id: 'settings-security', label: 'Security', icon: Security, href: '/admin/settings/security' },
      { id: 'settings-audit', label: 'Audit Logs', icon: FileText, href: '/admin/settings/audit' }
    ]
  },
  {
    id: 'system',
    label: 'System Monitor',
    icon: Activity,
    href: '/admin/system',
    section: 'administrative',
    permissions: ['system.monitor'],
    children: [
      { id: 'system-performance', label: 'Performance Metrics', icon: TrendingUp, href: '/admin/system/performance' },
      { id: 'system-errors', label: 'Error Tracking', icon: AlertTriangle, href: '/admin/system/errors' },
      { id: 'system-uptime', label: 'Uptime Status', icon: Activity, href: '/admin/system/uptime' },
      { id: 'system-database', label: 'Database Health', icon: Database, href: '/admin/system' }
    ]
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    destinations: true, // Destinations expanded by default per requirements
    content: false,
    'creator-tools': false,
    marketing: false,
    community: false,
    finance: false,
    settings: false,
    system: false
  })

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Group navigation items by section
  const primaryItems = navigation.filter(item => item.section === 'primary')
  const secondaryItems = navigation.filter(item => item.section === 'secondary')
  const administrativeItems = navigation.filter(item => item.section === 'administrative')

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
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {/* PRIMARY SECTION */}
          <div className="mb-6">
            {sidebarOpen && (
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Content & Destinations
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {primaryItems.filter(item => {
                if (!item.permissions) return true
                return adminAuthService.hasAnyPermission(item.permissions as any[])
              }).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`flex-1 flex items-center px-3 py-2 rounded-lg transition-colors ${
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
                    
                    {/* Expand/Collapse Button */}
                    {sidebarOpen && item.children && (
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="ml-1 p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {expandedSections[item.id] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Sub-navigation */}
                  {sidebarOpen && item.children && expandedSections[item.id] && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                            pathname === child.href
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
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
            </div>
          </div>

          {/* SECONDARY SECTION */}
          <div className="mb-6">
            {sidebarOpen && (
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Marketing & Community
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {secondaryItems.filter(item => {
                if (!item.permissions) return true
                return adminAuthService.hasAnyPermission(item.permissions as any[])
              }).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`flex-1 flex items-center px-3 py-2 rounded-lg transition-colors ${
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
                    
                    {/* Expand/Collapse Button */}
                    {sidebarOpen && item.children && (
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="ml-1 p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {expandedSections[item.id] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Sub-navigation */}
                  {sidebarOpen && item.children && expandedSections[item.id] && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                            pathname === child.href
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
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
            </div>
          </div>

          {/* ADMINISTRATIVE SECTION */}
          <div className="border-t border-slate-800 pt-4">
            {sidebarOpen && (
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Administration
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {administrativeItems.filter(item => {
                if (!item.permissions) return true
                return adminAuthService.hasAnyPermission(item.permissions as any[])
              }).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`flex-1 flex items-center px-3 py-2 rounded-lg transition-colors ${
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
                    
                    {/* Expand/Collapse Button */}
                    {sidebarOpen && item.children && (
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="ml-1 p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {expandedSections[item.id] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Sub-navigation */}
                  {sidebarOpen && item.children && expandedSections[item.id] && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                            pathname === child.href
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
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
            </div>
          </div>
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