'use client'

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }
    
    setToasts(prev => [...prev, newToast])

    // Auto-remove after duration with proper cleanup
    if (newToast.duration && newToast.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeToast(id)
        timeoutsRef.current.delete(id)
      }, newToast.duration)
      
      timeoutsRef.current.set(id, timeoutId)
    }
  }

  const removeToast = (id: string) => {
    // Clear any existing timeout for this toast
    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
    
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearToasts = () => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    timeoutsRef.current.clear()
    
    setToasts([])
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      timeoutsRef.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => removeToast(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-50'
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-50'
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-50'
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50 text-blue-50'
    }
  }

  return (
    <div
      className={cn(
        "relative bg-black/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-out",
        getColorClasses(),
        isVisible && !isLeaving ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full",
        isLeaving && "opacity-0 scale-95"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm opacity-90">
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium hover:underline focus:outline-none focus:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-white/20"
          style={{
            animation: `shrink ${toast.duration}ms linear forwards`
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Convenience functions for common toast types
export const toast = {
  success: (message: string, options?: Partial<Toast>) => ({
    type: 'success' as const,
    message,
    ...options
  }),
  
  error: (message: string, options?: Partial<Toast>) => ({
    type: 'error' as const,
    message,
    duration: 7000, // Longer duration for errors
    ...options
  }),
  
  warning: (message: string, options?: Partial<Toast>) => ({
    type: 'warning' as const,
    message,
    ...options
  }),
  
  info: (message: string, options?: Partial<Toast>) => ({
    type: 'info' as const,
    message,
    ...options
  })
}