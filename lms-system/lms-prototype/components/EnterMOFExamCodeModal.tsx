'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { courseAPI } from '@/lib/api'
import type { Course } from '@/lib/state'

interface EnterMOFExamCodeModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course | null
  onSuccess: () => void
}

export default function EnterMOFExamCodeModal({
  isOpen,
  onClose,
  course,
  onSuccess
}: EnterMOFExamCodeModalProps) {
  const { showToast } = useToast()
  const [mofExamCode, setMofExamCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && course) {
      // Load existing MOF exam code if available
      setMofExamCode(course.mofExamCode || '')
      setError('')
    }
  }, [isOpen, course])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course) {
      showToast('Course information not available', 'error')
      return
    }

    // Validate MOF exam code
    if (!mofExamCode.trim()) {
      setError('MOF exam code is required')
      return
    }

    // Basic validation: MOF exam code should be alphanumeric
    if (!/^[A-Z0-9\-_]+$/i.test(mofExamCode.trim())) {
      setError('MOF exam code can only contain letters, numbers, hyphens, and underscores')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Update course with MOF exam code
      await courseAPI.update(course.id, {
        mofExamCode: mofExamCode.trim()
      })

      showToast('MOF exam code saved successfully', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving MOF exam code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save MOF exam code'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setMofExamCode('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, color: '#2c3e50' }}>
            Enter MOF Exam Code
          </h3>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px' }}>
            {course && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Course:</div>
                <div style={{ fontWeight: 600, color: '#2c3e50' }}>{course.name}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Code: {course.code}</div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="mofExamCode">
                MOF Exam Code <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="mofExamCode"
                value={mofExamCode}
                onChange={(e) => {
                  setMofExamCode(e.target.value)
                  setError('')
                }}
                placeholder="Enter MOF exam code (e.g., MOF-2025-001)"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: error ? '2px solid #dc3545' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                autoFocus
              />
              {error && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {error}
                </small>
              )}
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Enter the official MOF exam code for this course. This code will be used for MOF registration and tracking.
              </small>
            </div>

            {course?.mofExamCode && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#2e7d32'
              }}>
                <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                Current MOF exam code: <strong>{course.mofExamCode}</strong>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{
            padding: '16px 20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !mofExamCode.trim()}
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0,
                width: 'auto',
                minWidth: 'auto'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '6px' }}></i>
                  Save MOF Exam Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

