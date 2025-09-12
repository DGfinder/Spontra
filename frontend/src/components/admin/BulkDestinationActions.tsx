'use client'

import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  Filter,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'

interface BulkDestinationActionsProps {
  destinations: AdminDestination[]
  selectedDestinations: string[]
  onSelectionChange: (selected: string[]) => void
  onBulkAction: (action: string, destinationIds: string[]) => Promise<void>
  onExport?: (destinations: AdminDestination[]) => void
  onImport?: (file: File) => Promise<void>
}

export function BulkDestinationActions({
  destinations,
  selectedDestinations,
  onSelectionChange,
  onBulkAction,
  onExport,
  onImport
}: BulkDestinationActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const selectedCount = selectedDestinations.length
  const totalCount = destinations.length
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(destinations.map(d => d.iataCode))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedCount === 0) return

    setIsProcessing(true)
    try {
      await onBulkAction(action, selectedDestinations)
      onSelectionChange([]) // Clear selection after action
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    if (onExport) {
      const destinationsToExport = selectedCount > 0 
        ? destinations.filter(d => selectedDestinations.includes(d.iataCode))
        : destinations
      onExport(destinationsToExport)
    }
  }

  const handleImport = async () => {
    if (importFile && onImport) {
      setIsProcessing(true)
      try {
        await onImport(importFile)
        setShowImportModal(false)
        setImportFile(null)
      } catch (error) {
        console.error('Import failed:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'activate': return <CheckCircle size={16} />
      case 'deactivate': return <XCircle size={16} />
      case 'mark_popular': return <Star size={16} />
      case 'unmark_popular': return <StarOff size={16} />
      case 'show': return <Eye size={16} />
      case 'hide': return <EyeOff size={16} />
      case 'delete': return <Trash2 size={16} />
      default: return <Filter size={16} />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'activate': return 'bg-green-100 text-green-700 hover:bg-green-200'
      case 'deactivate': return 'bg-red-100 text-red-700 hover:bg-red-200'
      case 'mark_popular': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
      case 'unmark_popular': return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      case 'show': return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'hide': return 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      case 'delete': return 'bg-red-100 text-red-700 hover:bg-red-200'
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  const bulkActions = [
    { id: 'activate', label: 'Activate', description: 'Make destinations visible to users' },
    { id: 'deactivate', label: 'Deactivate', description: 'Hide destinations from users' },
    { id: 'mark_popular', label: 'Mark Popular', description: 'Feature destinations prominently' },
    { id: 'unmark_popular', label: 'Unmark Popular', description: 'Remove featured status' },
    { id: 'show', label: 'Show in Search', description: 'Include in search results' },
    { id: 'hide', label: 'Hide from Search', description: 'Exclude from search results' },
    { id: 'delete', label: 'Delete', description: 'Permanently remove destinations' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-blue-600" />
            ) : isPartiallySelected ? (
              <CheckSquare size={16} className="text-blue-600 opacity-50" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
            <span>
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>

          {selectedCount > 0 && (
            <span className="text-sm text-gray-600">
              {selectedCount} of {totalCount} selected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onExport && (
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          )}

          {onImport && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Upload size={16} className="mr-2" />
              Import
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Bulk Actions ({selectedCount} destinations)
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleBulkAction(action.id)}
                disabled={isProcessing}
                className={`flex items-center justify-center px-3 py-2 rounded-lg font-medium transition-colors ${getActionColor(action.id)} ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={action.description}
              >
                {getActionIcon(action.id)}
                <span className="ml-2 text-sm">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Warning for destructive actions */}
          {selectedCount > 10 && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle size={16} className="text-orange-600" />
              <span className="text-sm text-orange-700">
                You're about to modify {selectedCount} destinations. This action cannot be undone.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Destinations</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>CSV format should include columns:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>iataCode, cityName, countryName</li>
                  <li>isActive, isPopular, isVisible</li>
                  <li>themeScores (JSON format)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleImport}
                disabled={!importFile || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
