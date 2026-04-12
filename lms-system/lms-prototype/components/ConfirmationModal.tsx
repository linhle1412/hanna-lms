'use client'

interface ConfirmationModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger'
      case 'warning':
        return 'btn-warning'
      case 'info':
        return 'btn-primary'
      default:
        return 'btn-primary'
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <div className="modal-footer-actions">
            <button className="btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button className={getConfirmButtonClass()} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

