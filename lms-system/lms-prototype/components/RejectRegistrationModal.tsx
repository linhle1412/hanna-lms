'use client'

import React, { useState, useEffect } from 'react'
import type { Course } from '@/lib/state'

interface RejectRegistrationModalProps {
  course: Course
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function RejectRegistrationModal({
  course,
  onConfirm,
  onCancel,
}: RejectRegistrationModalProps) {
  const [mounted, setMounted] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

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
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleConfirm = () => {
    // Validate reason
    if (!reason.trim()) {
      setError('Rejection reason is required')
      return
    }
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters')
      return
    }
    if (reason.length > 500) {
      setError('Rejection reason must not exceed 500 characters')
      return
    }

    onConfirm(reason)
  }

  const handleReasonChange = (value: string) => {
    setReason(value)
    if (error) {
      setError('')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#d32f2f',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Reject Course Registration
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '16px' 
            }}>
              You are about to reject the registration for this course:
            </div>
            
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#333' }}>Course:</strong>{' '}
                <span style={{ color: '#666' }}>{course.code}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#333' }}>Course Name:</strong>{' '}
                <span style={{ color: '#666' }}>{course.name}</span>
              </div>
              <div>
                <strong style={{ color: '#333' }}>Trainer:</strong>{' '}
                <span style={{ color: '#666' }}>{course.primaryTrainer || course.trainer}</span>
              </div>
            </div>

            {/* Rejection Reason */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 500,
                color: '#333'
              }}>
                Rejection Reason <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Please provide a reason for rejecting this registration (minimum 10 characters)"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${error ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '12px'
              }}>
                <div style={{ color: error ? 'red' : '#666' }}>
                  {error || 'Minimum 10 characters required'}
                </div>
                <div style={{ color: reason.length > 500 ? 'red' : '#666' }}>
                  {reason.length}/500
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffebee',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #ef5350',
            fontSize: '14px',
            color: '#c62828'
          }}>
            <strong>Warning:</strong> This will return the course to NEW status and clear trainer assignments.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary"
              style={{ backgroundColor: '#d32f2f' }}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

