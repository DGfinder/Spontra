'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Download,
  Eye,
  EyeOff,
  Filter,
  Square,
  Star,
  StarOff,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { AdminDestination } from '@/types/admin'

interface BulkDestinationActionsProps {
  destinations: AdminDestination[]
  selectedDestinations: string[]
  onSelectionChange: (selected: string[]) => void
  onBulkAction: (action: BulkActionId, destinationIds: string[]) => Promise<void>
  onExport?: (destinations: AdminDestination[]) => void
  onImport?: (file: File) => Promise<void>
}

type BulkActionId =
  | 'activate'
  | 'deactivate'
  | 'mark_popular'
  | 'unmark_popular'
  | 'show'
  | 'hide'
  | 'delete'

interface BulkActionDefinition {
  id: BulkActionId
  label: string
  description: string
  icon: LucideIcon
  tone: 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'orange'
}

const ACTIONS: BulkActionDefinition[] = [
  { id: 'activate', label: 'Activate', description: 'Make destinations visible to travellers', icon: CheckCircle, tone: 'green' },
  { id: 'deactivate', label: 'Deactivate', description: 'Temporarily hide destinations', icon: XCircle, tone: 'red' },
  { id: 'mark_popular', label: 'Mark popular', description: 'Feature in curated lists', icon: Star, tone: 'yellow' },
  { id: 'unmark_popular', label: 'Unmark popular', description: 'Remove featured status', icon: StarOff, tone: 'gray' },
  { id: 'show', label: 'Show in search', description: 'Include in search results', icon: Eye, tone: 'blue' },
  { id: 'hide', label: 'Hide from search', description: 'Exclude from search results', icon: EyeOff, tone: 'orange' },
  { id: 'delete', label: 'Delete', description: 'Remove destinations permanently', icon: Trash2, tone: 'red' },
]

const toneClasses: Record<BulkActionDefinition['tone'], string> = {
  green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
  red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  gray: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
}

const CSV_HEADERS = ['iataCode', 'cityName', 'countryName', 'isActive', 'isPopular', 'isVisible']

export function BulkDestinationActions({
  destinations,
  selectedDestinations,
  onSelectionChange,
  onBulkAction,
  onExport,
  onImport,
}: BulkDestinationActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  const totalCount = destinations.length
  const selectedCount = selectedDestinations.length
  const isAllSelected = totalCount > 0 && selectedCount === totalCount

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
      return
    }

    onSelectionChange(destinations.map((destination) => destination.iataCode))
  }

  const handleBulkAction = async (action: BulkActionId) => {
    if (selectedCount === 0) return
    setIsProcessing(true)
    try {
      await onBulkAction(action, selectedDestinations)
      onSelectionChange([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    if (!onExport) return
    const payload = selectedCount > 0
      ? destinations.filter((destination) => selectedDestinations.includes(destination.iataCode))
      : destinations
    onExport(payload)
  }

  const downloadableCsv = useMemo(() => {
    if (selectedCount === 0) return ''
    const rows = destinations
      .filter((destination) => selectedDestinations.includes(destination.iataCode))
      .map((destination) => [
        destination.iataCode,
        destination.cityName,
        destination.countryName,
        String(destination.isActive),
        String(destination.isPopular),
        String(destination.isVisible !== false),
      ].join(','))
    return [CSV_HEADERS.join(','), ...rows].join('\\n')
  }, [destinations, selectedDestinations, selectedCount])

  const handleImport = async () => {
    if (!onImport || !importFile) return
    setIsProcessing(true)
    try {
      await onImport(importFile)
      setImportFile(null)
      setShowImportModal(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={handleToggleSelectAll}
            className='inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
          >
            {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{isAllSelected ? 'Deselect all' : 'Select all'}</span>
          </button>
          {selectedCount > 0 ? (
            <span className='text-sm text-slate-600'>{selectedCount} of {totalCount} selected</span>
          ) : (
            <span className='text-sm text-slate-500'>No destinations selected</span>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {onExport ? (
            <button
              type='button'
              onClick={handleExport}
              className='inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100'
            >
              <Download size={16} />
              Export
            </button>
          ) : null}
          {onImport ? (
            <button
              type='button'
              onClick={() => setShowImportModal(true)}
              className='inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100'
            >
              <Upload size={16} />
              Import
            </button>
          ) : null}
        </div>
      </header>

      {selectedCount > 0 ? (
        <div className='mt-6 space-y-4'>
          <div className='flex items-center gap-2 text-sm font-medium text-slate-700'>
            <Filter size={16} />
            <span>Bulk actions</span>
          </div>
          <div className='grid gap-2 md:grid-cols-3 xl:grid-cols-4'>
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type='button'
                onClick={() => handleBulkAction(action.id)}
                disabled={isProcessing}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${toneClasses[action.tone]} ${isProcessing ? 'opacity-50' : ''}`}
                title={action.description}
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {selectedCount > 10 ? (
            <div className='flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700'>
              <AlertTriangle size={16} />
              <span>You are about to update {selectedCount} destinations. Double-check before continuing.</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {showImportModal ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl'>
            <header className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900'>Import destinations</h2>
                <p className='text-sm text-slate-500'>Upload a CSV seed to hydrate the admin grid.</p>
              </div>
              <button
                type='button'
                onClick={() => setShowImportModal(false)}
                className='rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:bg-slate-50'
              >
                Close
              </button>
            </header>

            <div className='mt-4 space-y-4 text-sm text-slate-600'>
              <div>
                <label className='block text-xs font-medium text-slate-500'>CSV file</label>
                <input
                  type='file'
                  accept='.csv'
                  onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                  className='mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div>
                <p className='font-medium text-slate-700'>Expected columns</p>
                <ul className='mt-2 list-inside list-disc text-slate-500'>
                  <li>iataCode, cityName, countryName</li>
                  <li>isActive, isPopular, isVisible</li>
                  <li>themeScores (JSON)</li>
                </ul>
              </div>
              {downloadableCsv ? (
                <div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
                  <p className='text-xs font-medium text-slate-600'>Tip: copy the selected destinations sample</p>
                  <pre className='mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-slate-500'>{downloadableCsv}</pre>
                </div>
              ) : null}
            </div>

            <footer className='mt-6 flex items-center justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowImportModal(false)}
                className='rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleImport}
                disabled={isProcessing || !importFile}
                className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
              >
                {isProcessing ? 'Importing...' : 'Import'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  )
}