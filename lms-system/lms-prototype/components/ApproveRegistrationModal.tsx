'use client'

import React, { useState, useEffect } from 'react'
import type { Course } from '@/lib/state'

interface ApproveRegistrationModalProps {
  course: Course
  onConfirm: () => void
  onCancel: () => void
}

export default function ApproveRegistrationModal({
  course,
  onConfirm,
  onCancel,
}: ApproveRegistrationModalProps) {
  const [mounted, setMounted] = useState(false)

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
          backgroundColor: '#0097A9',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Approve Course Registration?
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
              You are about to approve the registration for this course:
            </div>
            
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#333' }}>Course:</strong>{' '}
                <span style={{ color: '#666' }}>{course.code}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#333' }}>Course Name:</strong>{' '}
                <span style={{ color: '#666' }}>{course.name}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#333' }}>Trainer:</strong>{' '}
                <span style={{ color: '#666' }}>{course.primaryTrainer || course.trainer}</span>
              </div>
              <div>
                <strong style={{ color: '#333' }}>Start Date:</strong>{' '}
                <span style={{ color: '#666' }}>{course.startDate}</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#e8f5e9',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #4caf50',
            fontSize: '14px',
            color: '#2e7d32'
          }}>
            <strong>Note:</strong> This will approve the course and allow it to proceed.
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
              onClick={onConfirm}
              className="btn-primary"
              style={{ backgroundColor: '#0097A9' }}
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

