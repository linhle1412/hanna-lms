'use client'

import { useState, useEffect } from 'react'

interface MarkDoneModalProps {
  isOpen: boolean
  stepName: string
  courseName: string
  onClose: () => void
  onConfirm: (reason: string, notes?: string) => Promise<void>
}

export default function MarkDoneModal({
  isOpen,
  stepName,
  courseName,
  onClose,
  onConfirm
}: MarkDoneModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setReason('')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    try {
      setSaving(true)
      await onConfirm(reason.trim(), notes.trim() || undefined)
      onClose()
    } catch (error) {
      console.error('Error marking step as done:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Mark Step as Done</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Step:</strong> {stepName}
              </div>
              <div>
                <strong>Course:</strong> {courseName}
              </div>
            </div>

            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <strong>⚠️</strong> This step is normally marked as done automatically by the system.
              You are manually overriding the status.
            </div>

            {/* Reason */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Reason for Manual Mark Done: *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Explain why you are manually marking this step as done..."
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Notes: (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Additional notes or details..."
              />
            </div>

            {/* Action Info */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <strong>This action will:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Mark the step as DONE</li>
                <li>Stop reminder emails for this step</li>
                <li>Update course progress</li>
                <li>Record this action in audit trail</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !reason.trim()}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Saving...
                </>
              ) : (
                'Confirm Mark Done'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

