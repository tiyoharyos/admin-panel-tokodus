// context/AlertContext.jsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import Alert from '@/components/UI/Alert'
import Toast from '@/components/UI/Toast'

const AlertContext = createContext(null)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])
  const [toasts, setToasts] = useState([])

  const showAlert = useCallback((alert) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { ...alert, id }])
    
    // Auto remove after duration
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, alert.duration)
    }
  }, [])

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const showToast = useCallback((toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Alert helper functions
  const success = useCallback((message, title = 'Success') => {
    showAlert({ type: 'success', message, title })
  }, [showAlert])

  const error = useCallback((message, title = 'Error') => {
    showAlert({ type: 'danger', message, title })
  }, [showAlert])

  const warning = useCallback((message, title = 'Warning') => {
    showAlert({ type: 'warning', message, title })
  }, [showAlert])

  const info = useCallback((message, title = 'Info') => {
    showAlert({ type: 'info', message, title })
  }, [showAlert])

  // Toast helper functions
  const toastSuccess = useCallback((message) => {
    showToast({ type: 'success', message })
  }, [showToast])

  const toastError = useCallback((message) => {
    showToast({ type: 'danger', message })
  }, [showToast])

  const toastWarning = useCallback((message) => {
    showToast({ type: 'warning', message })
  }, [showToast])

  const toastInfo = useCallback((message) => {
    showToast({ type: 'info', message })
  }, [showToast])

  const confirm = useCallback((message, onConfirm, onCancel = () => {}) => {
    const confirmAlert = {
      type: 'warning',
      title: 'Confirmation Required',
      message,
      showClose: false,
      customActions: (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              removeAlert(confirmAlert.id)
              onCancel()
            }}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              removeAlert(confirmAlert.id)
              onConfirm()
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      )
    }
    
    showAlert(confirmAlert)
  }, [showAlert, removeAlert])

  return (
    <AlertContext.Provider value={{
      showAlert,
      removeAlert,
      showToast,
      removeToast,
      success,
      error,
      warning,
      info,
      toastSuccess,
      toastError,
      toastWarning,
      toastInfo,
      confirm
    }}>
      {children}
      
      {/* Global Alerts Container */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => removeAlert(alert.id)}
            duration={alert.duration}
            showClose={alert.showClose !== false}
            className="mb-2"
          >
            {alert.customActions}
          </Alert>
        ))}
      </div>
      
      {/* Global Toasts Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>
    </AlertContext.Provider>
  )
}