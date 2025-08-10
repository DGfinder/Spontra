'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Download, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  Building,
  Eye,
  FileText,
  TrendingUp,
  RefreshCw,
  MoreHorizontal,
  Send
} from 'lucide-react'
import { PayoutRequest } from '@/types/admin'

interface PayoutStats {
  totalPending: number
  totalPendingAmount: number
  averagePayoutAmount: number
  payoutsThisMonth: number
  payoutsProcessedToday: number
  nextPayoutDate: string
}

export default function CreatorPayouts() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [processingPayout, setProcessingPayout] = useState(false)

  // Mock data
  const mockStats: PayoutStats = {
    totalPending: 47,
    totalPendingAmount: 23456.78,
    averagePayoutAmount: 498.23,
    payoutsThisMonth: 156,
    payoutsProcessedToday: 8,
    nextPayoutDate: '2024-01-16T10:00:00Z'
  }

  const mockPayouts: PayoutRequest[] = [
    {
      id: 'payout_001',
      creatorId: 'creator_001',
      creator: {
        username: 'travel_enthusiast',
        email: 'mike@example.com',
        tier: 'ambassador',
        totalEarnings: 4567.89
      },
      amount: 234.56,
      currency: 'EUR',
      status: 'pending',
      paymentMethod: {
        type: 'bank_transfer',
        details: {
          accountName: 'Michael Travel',
          bankName: 'Deutsche Bank',
          accountNumber: '****1234'
        }
      },
      requestedAt: '2024-01-14T15:30:00Z',
      scheduledFor: '2024-01-16T10:00:00Z',
      metadata: {
        period: '2024-01',
        bookingsCount: 45,
        commissionsEarned: 234.56,
        taxesWithheld: 0,
        fees: 0
      },
      notes: null
    },
    {
      id: 'payout_002',
      creatorId: 'creator_002',
      creator: {
        username: 'city_explorer',
        email: 'sarah@example.com',
        tier: 'creator',
        totalEarnings: 6789.12
      },
      amount: 456.78,
      currency: 'EUR',
      status: 'pending',
      paymentMethod: {
        type: 'paypal',
        details: {
          email: 'sarah@example.com'
        }
      },
      requestedAt: '2024-01-14T12:15:00Z',
      scheduledFor: '2024-01-16T10:00:00Z',
      metadata: {
        period: '2024-01',
        bookingsCount: 78,
        commissionsEarned: 456.78,
        taxesWithheld: 0,
        fees: 0
      },
      notes: null
    },
    {
      id: 'payout_003',
      creatorId: 'creator_003',
      creator: {
        username: 'adventure_seeker',
        email: 'alex@example.com',
        tier: 'contributor',
        totalEarnings: 1234.56
      },
      amount: 89.45,
      currency: 'EUR',
      status: 'requires_review',
      paymentMethod: {
        type: 'bank_transfer',
        details: {
          accountName: 'Alex Adventure',
          bankName: 'ING Bank',
          accountNumber: '****5678'
        }
      },
      requestedAt: '2024-01-13T09:20:00Z',
      scheduledFor: '2024-01-16T10:00:00Z',
      metadata: {
        period: '2024-01',
        bookingsCount: 12,
        commissionsEarned: 89.45,
        taxesWithheld: 0,
        fees: 0
      },
      notes: 'Creator has incomplete tax information'
    },
    {
      id: 'payout_004',
      creatorId: 'creator_004',
      creator: {
        username: 'foodie_traveler',
        email: 'julia@example.com',
        tier: 'ambassador',
        totalEarnings: 3456.78
      },
      amount: 567.89,
      currency: 'EUR',
      status: 'processed',
      paymentMethod: {
        type: 'paypal',
        details: {
          email: 'julia@example.com'
        }
      },
      requestedAt: '2024-01-12T14:45:00Z',
      scheduledFor: '2024-01-15T10:00:00Z',
      processedAt: '2024-01-15T10:15:00Z',
      metadata: {
        period: '2023-12',
        bookingsCount: 89,
        commissionsEarned: 567.89,
        taxesWithheld: 0,
        fees: 2.50
      },
      notes: null
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setStats(mockStats)
      setPayouts(mockPayouts)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'requires_review': return 'text-orange-600 bg-orange-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'processed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer': return <Building size={16} />
      case 'paypal': return <CreditCard size={16} />
      default: return <DollarSign size={16} />
    }
  }

  const handleProcessPayout = async (payoutId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingPayout(true)
    try {
      // In production, call admin service
      console.log('Processing payout:', { payoutId, action, reason })
      
      // Update local state
      setPayouts(prev => prev.map(p => 
        p.id === payoutId 
          ? { ...p, status: action === 'approve' ? 'processing' : 'cancelled' }
          : p
      ))
      
      setShowPayoutModal(false)
      setSelectedPayout(null)
      alert(`Payout ${action}d successfully`)
    } catch (error) {
      console.error('Failed to process payout:', error)
      alert('Failed to process payout')
    } finally {
      setProcessingPayout(false)
    }
  }

  const handleBulkProcess = async (action: 'approve' | 'reject') => {
    if (selectedPayouts.length === 0) return
    
    try {
      console.log('Bulk processing payouts:', { payouts: selectedPayouts, action })
      
      setPayouts(prev => prev.map(p => 
        selectedPayouts.includes(p.id) 
          ? { ...p, status: action === 'approve' ? 'processing' : 'cancelled' }
          : p
      ))
      
      setSelectedPayouts([])
      alert(`${selectedPayouts.length} payouts ${action}d successfully`)
    } catch (error) {
      console.error('Failed to bulk process payouts:', error)
      alert('Failed to process payouts')
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    if (filterStatus !== 'all' && payout.status !== filterStatus) return false
    if (filterPaymentMethod !== 'all' && payout.paymentMethod.type !== filterPaymentMethod) return false
    if (searchQuery && !payout.creator.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Creator Payouts</h1>
          <p className="text-gray-600">Manage creator payments and commission payouts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedPayouts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedPayouts.length} selected</span>
              <button
                onClick={() => handleBulkProcess('approve')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkProcess('reject')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Reject All
              </button>
            </div>
          )}
          
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div className="text-sm text-yellow-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +15%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.totalPending}
            </div>
            <p className="text-sm text-gray-600">Pending Payouts</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats!.totalPendingAmount)} total</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +8.2%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats!.averagePayoutAmount)}
            </div>
            <p className="text-sm text-gray-600">Average Payout</p>
            <p className="text-xs text-gray-500 mt-1">per creator</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send size={20} className="text-blue-600" />
            </div>
            <div className="text-sm text-blue-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +{stats!.payoutsProcessedToday}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.payoutsThisMonth}
            </div>
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-xs text-gray-500 mt-1">{stats!.payoutsProcessedToday} processed today</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600 flex items-center">
              <Calendar size={14} className="mr-1" />
              Scheduled
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {new Date(stats!.nextPayoutDate).toLocaleDateString()}
            </div>
            <p className="text-sm text-gray-600">Next Batch</p>
            <p className="text-xs text-gray-500 mt-1">at 10:00 AM</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payout Requests</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{filteredPayouts.length} of {payouts.length}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="requires_review">Requires Review</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>

        {/* Payout Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayouts(filteredPayouts.map(p => p.id))
                      } else {
                        setSelectedPayouts([])
                      }
                    }}
                  />
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Creator</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Amount</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Method</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Requested</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.includes(payout.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayouts(prev => [...prev, payout.id])
                        } else {
                          setSelectedPayouts(prev => prev.filter(id => id !== payout.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {payout.creator.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">@{payout.creator.username}</div>
                        <div className="text-sm text-gray-600 capitalize">{payout.creator.tier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payout.metadata.bookingsCount} bookings
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="flex items-center justify-center">
                      {getPaymentMethodIcon(payout.paymentMethod.type)}
                      <span className="ml-2 text-sm capitalize">
                        {payout.paymentMethod.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="text-sm text-gray-900">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(payout.requestedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayout(payout)
                          setShowPayoutModal(true)
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        <Eye size={14} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Detail Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Payout Request Details</h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Creator Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Creator Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedPayout.creator.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">@{selectedPayout.creator.username}</div>
                      <div className="text-sm text-gray-600">{selectedPayout.creator.email}</div>
                      <div className="text-sm text-gray-600 capitalize">{selectedPayout.creator.tier} tier</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedPayout.creator.totalEarnings)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Payout Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-semibold text-green-600">{formatCurrency(selectedPayout.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Period:</span>
                    <span className="ml-2 font-medium">{selectedPayout.metadata.period}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bookings:</span>
                    <span className="ml-2 font-medium">{selectedPayout.metadata.bookingsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="ml-2 font-medium">15%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested:</span>
                    <span className="ml-2 font-medium">{new Date(selectedPayout.requestedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Scheduled:</span>
                    <span className="ml-2 font-medium">{new Date(selectedPayout.scheduledFor).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {getPaymentMethodIcon(selectedPayout.paymentMethod.type)}
                    <span className="ml-2 font-medium capitalize">
                      {selectedPayout.paymentMethod.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedPayout.paymentMethod.type === 'bank_transfer' ? (
                      <>
                        <div>Account: {selectedPayout.paymentMethod.details.accountNumber}</div>
                        <div>Bank: {selectedPayout.paymentMethod.details.bankName}</div>
                        <div>Name: {selectedPayout.paymentMethod.details.accountName}</div>
                      </>
                    ) : (
                      <div>Email: {selectedPayout.paymentMethod.details.email}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPayout.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle size={16} className="text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-orange-800">{selectedPayout.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedPayout.status === 'pending' || selectedPayout.status === 'requires_review' ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProcessPayout(selectedPayout.id, 'approve')}
                    disabled={processingPayout}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve Payout
                  </button>
                  <button
                    onClick={() => handleProcessPayout(selectedPayout.id, 'reject', 'Manual review required')}
                    disabled={processingPayout}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject Payout
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedPayout.status)}`}>
                    {selectedPayout.status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}