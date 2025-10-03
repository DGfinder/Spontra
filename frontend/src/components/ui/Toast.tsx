'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

    // Auto-remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, duration)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}))

// Export hook for easy access
export function useToast() {
  const { addToast } = useToastStore()

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration })
  }
}

const TOAST_CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle; bgColor: string; borderColor: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    bgColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    iconColor: '#06b6d4'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    iconColor: '#ef4444'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    iconColor: '#f59e0b'
  },
  info: {
    icon: Info,
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    iconColor: '#3b82f6'
  }
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const config = TOAST_CONFIG[toast.type]
  const Icon = config.icon

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 200) // Match animation duration
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg
        min-w-[320px] max-w-md
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-slide-in'}
      `}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      {/* Icon */}
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.iconColor }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white mb-1">{toast.title}</h4>
        {toast.message && <p className="text-sm text-white/80">{toast.message}</p>}
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  )
}
