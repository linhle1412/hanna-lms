'use client'

import { useToast } from '@/contexts/ToastContext'
import { useEffect, useState } from 'react'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [visibleToasts, setVisibleToasts] = useState<string[]>([])

  useEffect(() => {
    // Add fade-in animation
    const newToastIds = toasts.map(t => t.id)
    setVisibleToasts(newToastIds)
  }, [toasts])

  const handleClose = (id: string) => {
    setVisibleToasts((prev) => prev.filter((toastId) => toastId !== id))
    setTimeout(() => removeToast(id), 300) // Wait for animation
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} ${visibleToasts.includes(toast.id) ? 'toast-show' : 'toast-hide'}`}
          onClick={() => handleClose(toast.id)}
        >
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation()
                handleClose(toast.id)
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

