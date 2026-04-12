'use client'

import React, { useState, useEffect } from 'react'
import type { Course, Participant } from '@/lib/state'
import { participantAPI } from '@/lib/api'

interface ConfirmPassedParticipantsModalProps {
  isOpen: boolean
  course: Course | null
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmPassedParticipantsModal({
  isOpen,
  course,
  onConfirm,
  onClose
}: ConfirmPassedParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [includeAttachment, setIncludeAttachment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && course) {
      loadParticipants()
      // For SHINE courses, attachment is required
      if (course.courseType?.toLowerCase() === 'shine') {
        setIncludeAttachment(true)
      }
    } else {
      // Reset state when modal closes
      setAttachment(null)
      setIncludeAttachment(false)
    }
  }, [isOpen, course])

  const loadParticipants = async () => {
    if (!course) return

    try {
      setLoading(true)
      const allParticipants = await participantAPI.getAll()
      const courseParticipants = allParticipants.filter(p =>
        course.participantIds?.includes(p.id)
      )
      
      // Filter passed participants (for now, we'll show all participants)
      // In production, this would filter by final result = passed
      setParticipants(courseParticipants)
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
      const fileName = file.name.toLowerCase()
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext))
      
      if (!isValidFile) {
        alert('Invalid file type. Please select a PDF, Word document, or image file.')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.')
        return
      }
      
      setAttachment(file)
    }
  }

  const handleConfirm = async () => {
    if (!course) return

    // Validate attachment for SHINE courses
    if (course.courseType?.toLowerCase() === 'shine' && includeAttachment && !attachment) {
      alert('Attachment is required for SHINE courses.')
      return
    }

    if (!confirm('Are you sure you want to confirm passed participants? This action will mark the checklist step as done.')) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // TODO: In production, this would:
      // 1. Upload attachment if provided
      // 2. Send confirmation email to AA Admin or channel email
      // 3. Update participant final results
      // 4. Mark checklist step as done
      
      // For now, just call onConfirm callback
      onConfirm()
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error confirming passed participants:', error)
      alert('Failed to confirm passed participants. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isSHINECourse = course?.courseType?.toLowerCase() === 'shine'
  const passedCount = participants.length // In production, filter by final result = passed
  const totalCount = participants.length

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Confirm Passed Participants
          </h2>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#0097A9' }}></i>
            <p style={{ marginTop: '16px', color: '#666' }}>Loading participants...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Participants to confirm:</strong> {passedCount} passed out of {totalCount}
              </p>
              {totalCount === 0 && (
                <p style={{ fontSize: '14px', color: '#f44336', marginTop: '8px' }}>
                  No participants found in this course.
                </p>
              )}
            </div>

            {isSHINECourse && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeAttachment}
                    onChange={(e) => {
                      setIncludeAttachment(e.target.checked)
                      if (!e.target.checked) {
                        setAttachment(null)
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Include attachment <span style={{ color: '#f44336' }}>(required for SHINE courses)</span>
                  </span>
                </label>

                {includeAttachment && (
                  <div style={{ marginLeft: '26px' }}>
                    <input
                      type="file"
                      id="attachment-upload"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="attachment-upload"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    >
                      <i className="fas fa-paperclip"></i>
                      {attachment ? attachment.name : 'Upload Attachment'}
                    </label>
                    {attachment && (
                      <span style={{ marginLeft: '12px', fontSize: '14px', color: '#4caf50' }}>
                        ✓ {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                      Accepted formats: PDF, Word document, or image (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                <strong>Email will be sent to:</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#333', marginTop: '4px', marginBottom: 0 }}>
                {isSHINECourse ? 'AA Admin' : 'Channel Email'}
                {isSHINECourse && ', management@company.com'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  color: '#666',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || totalCount === 0 || (isSHINECourse && includeAttachment && !attachment)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: isSubmitting || totalCount === 0 || (isSHINECourse && includeAttachment && !attachment)
                    ? '#ccc'
                    : '#0097A9',
                  cursor: isSubmitting || totalCount === 0 || (isSHINECourse && includeAttachment && !attachment)
                    ? 'not-allowed'
                    : 'pointer',
                  color: 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && totalCount > 0 && !(isSHINECourse && includeAttachment && !attachment)) {
                    e.currentTarget.style.backgroundColor = '#007a8a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting && totalCount > 0 && !(isSHINECourse && includeAttachment && !attachment)) {
                    e.currentTarget.style.backgroundColor = '#0097A9'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Confirming...
                  </>
                ) : (
                  'Confirm Passed Participants'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

