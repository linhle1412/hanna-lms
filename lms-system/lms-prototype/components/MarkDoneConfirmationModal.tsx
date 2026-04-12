'use client'

import React, { useState, useEffect } from 'react'

interface MarkDoneConfirmationModalProps {
  stepName: string
  courseName: string
  onConfirm: (reason: string, notes?: string) => void
  onClose: () => void
}

export default function MarkDoneConfirmationModal({
  stepName,
  courseName,
  onConfirm,
  onClose
}: MarkDoneConfirmationModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = () => {
    if (!validate()) {
      return
    }

    onConfirm(reason, notes.trim() || undefined)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mark Step as Done</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div><strong>Step:</strong> {stepName}</div>
            <div><strong>Course:</strong> {courseName}</div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <strong>⚠️ Warning:</strong> This step is normally marked as done automatically by the system.
            You are manually overriding the status.
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">
              Reason for Manual Mark Done: <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`form-control ${errors.reason ? 'error' : ''}`}
              placeholder="Explain why you are manually marking this step as done..."
              rows={4}
            />
            {errors.reason && <div className="error-message">{errors.reason}</div>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Notes: (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              placeholder="Additional notes or context..."
              rows={3}
            />
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #007bff',
            borderRadius: '4px',
            marginTop: '24px'
          }}>
            <strong>This action will:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Mark the step as DONE</li>
              <li>Stop reminder emails for this step</li>
              <li>Update course progress</li>
              <li>Record this action in audit trail</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm Mark Done
          </button>
        </div>
      </div>
    </div>
  )
}

