'use client'

import { useState } from 'react'
import type { Course } from '@/lib/state'
import { courseAPI } from '@/lib/api'
import { getCurrentUserRole } from '@/lib/auth-utils'
import { useToast } from '@/contexts/ToastContext'

interface CourseRegistrationModalProps {
  course: Course | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CourseRegistrationModal({ 
  course, 
  isOpen, 
  onClose, 
  onSuccess 
}: CourseRegistrationModalProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const { showToast } = useToast()

  if (!isOpen || !course) return null

  // Get user role for role-based messaging
  const userRole = getCurrentUserRole()

  const handleConfirmRegister = async () => {
    if (!course) return

    setIsRegistering(true)
    try {
      const userName = typeof window !== 'undefined' 
        ? sessionStorage.getItem('currentUserName') || 'Trainer'
        : 'Trainer'
      const userRole = getCurrentUserRole()
      
      // Get current trainer name for primary trainer assignment
      const trainerName = userName
      
      // Determine if auto-approval applies (Head Channel only)
      const isAutoApproved = userRole === 'head_channel'
      const finalStatus = isAutoApproved ? 'APPROVED' : 'REGISTERED'
      
      // Update course status and set primary trainer
      await courseAPI.update(course.id, {
        status: finalStatus,
        primaryTrainer: trainerName,
        trainer: trainerName
      }, {
        editReason: isAutoApproved 
          ? 'Head Channel registered for course (auto-approved)'
          : `${userRole} registered for course`,
        userRole,
        userName,
        requiresApproval: !isAutoApproved
      })

      setIsRegistering(false)
      onClose()
      
      // Show appropriate success message based on role
      const successMessage = isAutoApproved
        ? 'Course registered and approved successfully!'
        : 'Course registered successfully! Waiting for approval.'
      showToast(successMessage, 'success')
      
      onSuccess?.()
    } catch (error) {
      setIsRegistering(false)
      console.error('Failed to register course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to register course'
      showToast(errorMessage, 'error')
    }
  }

  const handleCancel = () => {
    if (isRegistering) return
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Register for Course</h3>
          <button className="modal-close" onClick={handleCancel} disabled={isRegistering}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Course Code</label>
              <input type="text" value={course.code} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div className="form-group">
              <label>Course Name</label>
              <input type="text" value={course.name} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div className="form-group">
              <label>Program</label>
              <input type="text" value={course.program} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div className="form-group">
              <label>Channel</label>
              <input type="text" value={course.channel} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div className="form-group">
              <label>Region</label>
              <input type="text" value={course.region} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="text" 
                value={course.startDate ? new Date(course.startDate).toLocaleDateString('en-GB') : 'N/A'} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }} 
              />
            </div>
            
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="text" 
                value={course.endDate ? new Date(course.endDate).toLocaleDateString('en-GB') : 'N/A'} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }} 
              />
            </div>
            
            <div className="form-group">
              <label>Venue</label>
              <input type="text" value={course.venue || course.venueAddress || 'N/A'} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '14px',
            color: '#856404',
            marginTop: '20px'
          }}>
            <strong>ℹ️ Note:</strong> {
              userRole === 'head_channel'
                ? 'By registering, you will become the primary trainer for this course. The course will be automatically approved.'
                : userRole === 'lead_region'
                ? 'By registering, you will become the primary trainer for this course. The course will be submitted for approval by your Head Channel.'
                : 'By registering, you will become the primary trainer for this course. The course will be submitted for approval by your Head/Lead.'
            }
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button 
              className="btn-secondary" 
              onClick={handleCancel}
              disabled={isRegistering}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleConfirmRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

