'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { courseAPI } from '@/lib/api'
import type { Course } from '@/lib/state'
import { getCurrentUserRole } from '@/lib/auth-utils'
import { useToast } from '@/contexts/ToastContext'

interface PendingCancelApprovalsProps {
  onApprovalComplete?: () => void
}

export default function PendingCancelApprovals({ onApprovalComplete }: PendingCancelApprovalsProps) {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approverNote, setApproverNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false)
  const [bulkNote, setBulkNote] = useState('')

  const userRole = getCurrentUserRole()

  useEffect(() => {
    loadPendingCancellations()
  }, [])

  const loadPendingCancellations = async () => {
    try {
      setLoading(true)
      const allCourses = await courseAPI.getAll({ status: 'WAITING_APPROVAL_CANCEL' })
      setCourses(allCourses)
    } catch (error) {
      console.error('Failed to load pending cancel approvals:', error)
      showToast('Failed to load pending cancellation requests', 'error')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const getDaysPending = (course: Course): number => {
    const waitingEntry = course.statusHistory?.find(h => h.status === 'WAITING_APPROVAL_CANCEL')
    if (!waitingEntry) return 0
    
    const requestDate = new Date(waitingEntry.timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - requestDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getRequestedDate = (course: Course): string => {
    const waitingEntry = course.statusHistory?.find(h => h.status === 'WAITING_APPROVAL_CANCEL')
    if (!waitingEntry) return 'N/A'
    
    const date = new Date(waitingEntry.timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCancellationReason = (course: Course): string => {
    return (course as any).cancellationReason || 'No reason provided'
  }

  const handleApprove = (course: Course) => {
    setSelectedCourse(course)
    setApproverNote('')
    setShowApproveModal(true)
  }

  const handleReject = (course: Course) => {
    setSelectedCourse(course)
    setApproverNote('')
    setShowRejectModal(true)
  }

  const confirmApprove = async () => {
    if (!selectedCourse) return

    try {
      setProcessing(true)
      
      const response = await fetch(`/api/courses/${selectedCourse.id}/approve-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          approverNote
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast('Cancellation approved successfully', 'success')
        setShowApproveModal(false)
        setSelectedCourse(null)
        setApproverNote('')
        loadPendingCancellations()
        onApprovalComplete?.()
      } else {
        showToast(data.error || 'Failed to approve cancellation', 'error')
      }
    } catch (error) {
      console.error('Error approving cancellation:', error)
      showToast('Error approving cancellation', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedCourse) return
    if (!approverNote.trim()) {
      showToast('Please provide a rejection reason', 'warning')
      return
    }

    try {
      setProcessing(true)
      
      const response = await fetch(`/api/courses/${selectedCourse.id}/approve-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          approverNote
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast('Cancellation rejected', 'success')
        setShowRejectModal(false)
        setSelectedCourse(null)
        setApproverNote('')
        loadPendingCancellations()
        onApprovalComplete?.()
      } else {
        showToast(data.error || 'Failed to reject cancellation', 'error')
      }
    } catch (error) {
      console.error('Error rejecting cancellation:', error)
      showToast('Error rejecting cancellation', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const getDaysPendingColor = (days: number): string => {
    if (days <= 2) return '#4caf50'
    if (days <= 7) return '#ff9800'
    return '#f44336'
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(courses.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (courseId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, courseId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== courseId))
    }
  }

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one request', 'warning')
      return
    }
    setBulkNote('')
    setShowBulkApproveModal(true)
  }

  const handleBulkReject = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one request', 'warning')
      return
    }
    setBulkNote('')
    setShowBulkRejectModal(true)
  }

  const confirmBulkApprove = async () => {
    try {
      setProcessing(true)
      
      const promises = selectedIds.map(courseId =>
        fetch(`/api/courses/${courseId}/approve-cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            approverNote: bulkNote
          })
        }).then(res => res.json())
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showToast(`${successCount} cancellation(s) approved successfully`, 'success')
      }
      if (failCount > 0) {
        showToast(`${failCount} cancellation(s) failed to approve`, 'error')
      }

      setShowBulkApproveModal(false)
      setBulkNote('')
      setSelectedIds([])
      loadPendingCancellations()
      onApprovalComplete?.()
    } catch (error) {
      console.error('Error bulk approving cancellations:', error)
      showToast('Error processing bulk approval', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const confirmBulkReject = async () => {
    if (!bulkNote.trim()) {
      showToast('Please provide a rejection reason', 'warning')
      return
    }

    try {
      setProcessing(true)
      
      const promises = selectedIds.map(courseId =>
        fetch(`/api/courses/${courseId}/approve-cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            approverNote: bulkNote
          })
        }).then(res => res.json())
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showToast(`${successCount} cancellation(s) rejected`, 'success')
      }
      if (failCount > 0) {
        showToast(`${failCount} cancellation(s) failed to reject`, 'error')
      }

      setShowBulkRejectModal(false)
      setBulkNote('')
      setSelectedIds([])
      loadPendingCancellations()
      onApprovalComplete?.()
    } catch (error) {
      console.error('Error bulk rejecting cancellations:', error)
      showToast('Error processing bulk rejection', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '16px' }}></i>
        <p>Loading pending cancellation requests...</p>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        <i className="fas fa-check-circle" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
        <p>No pending cancellation requests</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f7ff',
          border: '1px solid var(--color-primary)',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 600, color: '#333' }}>
            <i className="fas fa-check-square" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
            {selectedIds.length} request{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#4caf50'
              }}
              onClick={handleBulkApprove}
            >
              <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
              Approve Selected
            </button>
            <button
              className="btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#f44336'
              }}
              onClick={handleBulkReject}
            >
              <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
              Reject Selected
            </button>
            <button
              className="btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '14px'
              }}
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === courses.length && courses.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Previous Status</th>
              <th>Cancellation Reason</th>
              <th>Request Date</th>
              <th>Days Pending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const daysPending = getDaysPending(course)
              const previousStatus = course.statusHistory?.find(h => h.status === 'WAITING_APPROVAL_CANCEL')?.previousStatus || 'APPROVED'
              return (
                <tr key={course.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(course.id)}
                      onChange={(e) => handleSelectOne(course.id, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <Link href={`/courses/${course.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {course.code}
                    </Link>
                  </td>
                  <td>{course.name}</td>
                  <td>
                    <span className={`status-badge status-${previousStatus.toLowerCase()}`}>
                      {previousStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ 
                      maxWidth: '400px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}>
                      {getCancellationReason(course)}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#666' }}>
                    {getRequestedDate(course)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'white',
                      backgroundColor: getDaysPendingColor(daysPending)
                    }}>
                      {daysPending} {daysPending === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#4caf50',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => handleApprove(course)}
                      >
                        <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                        Approve
                      </button>
                      <button
                        className="btn-primary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#f44336',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => handleReject(course)}
                      >
                        <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => !processing && setShowApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Cancellation</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Approve cancellation for course <strong>{selectedCourse.code}</strong>?</p>
              <p style={{ color: '#f44336', marginTop: '10px', fontSize: '14px' }}>
                This will permanently cancel the course.
              </p>
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Cancellation Reason:</div>
                <div style={{ fontSize: '14px', color: '#333' }}>{getCancellationReason(selectedCourse)}</div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Approver Note (Optional):
                </label>
                <textarea
                  value={approverNote}
                  onChange={(e) => setApproverNote(e.target.value)}
                  placeholder="Add approval note..."
                  rows={3}
                  disabled={processing}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApproveModal(false)} disabled={processing}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmApprove}
                disabled={processing}
                style={{ backgroundColor: '#4caf50' }}
              >
                {processing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Approving...
                  </>
                ) : (
                  'Approve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => !processing && setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Cancellation</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Reject cancellation for course <strong>{selectedCourse.code}</strong>?</p>
              <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
                The course will remain active with its previous status.
              </p>
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Cancellation Reason:</div>
                <div style={{ fontSize: '14px', color: '#333' }}>{getCancellationReason(selectedCourse)}</div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Rejection Reason (Required):
                </label>
                <textarea
                  value={approverNote}
                  onChange={(e) => setApproverNote(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                  disabled={processing}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)} disabled={processing}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmReject}
                disabled={processing || !approverNote.trim()}
                style={{ backgroundColor: '#f44336' }}
              >
                {processing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {showBulkApproveModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowBulkApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Approve Cancellations</h3>
              <button className="modal-close" onClick={() => setShowBulkApproveModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Approve <strong>{selectedIds.length}</strong> cancellation{selectedIds.length > 1 ? 's' : ''}?</p>
              <p style={{ color: '#f44336', marginTop: '10px', fontSize: '14px' }}>
                This will permanently cancel the selected courses.
              </p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Approver Note (Optional):
                </label>
                <textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="Add approval note for all selected requests..."
                  rows={3}
                  disabled={processing}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkApproveModal(false)} disabled={processing}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmBulkApprove}
                disabled={processing}
                style={{ backgroundColor: '#4caf50' }}
              >
                {processing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Approving...
                  </>
                ) : (
                  `Approve ${selectedIds.length} Cancellation${selectedIds.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowBulkRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Reject Cancellations</h3>
              <button className="modal-close" onClick={() => setShowBulkRejectModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Reject <strong>{selectedIds.length}</strong> cancellation{selectedIds.length > 1 ? 's' : ''}?</p>
              <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
                The selected courses will remain active with their previous status.
              </p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Rejection Reason (Required):
                </label>
                <textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="Enter rejection reason for all selected requests..."
                  rows={3}
                  disabled={processing}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkRejectModal(false)} disabled={processing}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmBulkReject}
                disabled={processing || !bulkNote.trim()}
                style={{ backgroundColor: '#f44336' }}
              >
                {processing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Rejecting...
                  </>
                ) : (
                  `Reject ${selectedIds.length} Cancellation${selectedIds.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
