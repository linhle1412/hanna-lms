'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { courseAPI } from '@/lib/api'
import type { Course } from '@/lib/state'
import { getCurrentUserRole, getCurrentUserChannel, getCurrentUserRegion, canApproveRegistration } from '@/lib/auth-utils'
import { useToast } from '@/contexts/ToastContext'
import ApproveRegistrationModal from './ApproveRegistrationModal'
import RejectRegistrationModal from './RejectRegistrationModal'

interface PendingRegistrationsProps {
  onApprovalComplete?: () => void
}

export default function PendingRegistrations({ onApprovalComplete }: PendingRegistrationsProps) {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    trainer: '',
    courseType: '',
    region: '',
    search: ''
  })
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false)
  const [bulkNote, setBulkNote] = useState('')

  const userRole = getCurrentUserRole()
  const userChannel = getCurrentUserChannel()
  const userRegion = getCurrentUserRegion()

  useEffect(() => {
    loadPendingRegistrations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [courses, filters])

  const loadPendingRegistrations = async () => {
    try {
      setLoading(true)
      // Get all courses with REGISTERED status
      const allCourses = await courseAPI.getAll({ status: 'REGISTERED' })
      
      // Filter by authorization scope
      const authorizedCourses = allCourses.filter(course => {
        const { canApprove } = canApproveRegistration(course, userRole)
        return canApprove
      })

      setCourses(authorizedCourses)
    } catch (error) {
      console.error('Failed to load pending registrations:', error)
      showToast('Failed to load pending registrations', 'error')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...courses]

    // Filter by trainer
    if (filters.trainer) {
      filtered = filtered.filter(c => 
        (c.primaryTrainer || c.trainer || '').toLowerCase().includes(filters.trainer.toLowerCase())
      )
    }

    // Filter by course type
    if (filters.courseType) {
      filtered = filtered.filter(c => c.courseType === filters.courseType)
    }

    // Filter by region
    if (filters.region) {
      filtered = filtered.filter(c => c.region === filters.region)
    }

    // Search by course code or name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower)
      )
    }

    setFilteredCourses(filtered)
  }

  const getDaysPending = (course: Course): number => {
    const registeredEntry = course.statusHistory?.find(h => h.status === 'REGISTERED')
    if (!registeredEntry) return 0
    
    const registeredDate = new Date(registeredEntry.timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - registeredDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getRegisteredDate = (course: Course): string => {
    const registeredEntry = course.statusHistory?.find(h => h.status === 'REGISTERED')
    if (!registeredEntry) return 'N/A'
    
    const date = new Date(registeredEntry.timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRegistrationNote = (course: Course): string => {
    const registeredEntry = course.statusHistory?.find(h => h.status === 'REGISTERED')
    return registeredEntry?.reason || registeredEntry?.note || 'No note provided'
  }

  const getRegisteredBy = (course: Course): string => {
    const registeredEntry = course.statusHistory?.find(h => h.status === 'REGISTERED')
    return registeredEntry?.performedBy || 'Unknown'
  }

  const handleApprove = (course: Course) => {
    setSelectedCourse(course)
    setShowApproveModal(true)
  }

  const handleReject = (course: Course) => {
    setSelectedCourse(course)
    setShowRejectModal(true)
  }

  const confirmApprove = async () => {
    if (!selectedCourse) return

    try {
      setProcessing(true)
      const userName = sessionStorage.getItem('userName') || 'System'
      
      await fetch(`/api/courses/${selectedCourse.id}/approve-registration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          userRole,
          userName
        })
      })

      showToast('Course registration approved successfully', 'success')
      setShowApproveModal(false)
      setSelectedCourse(null)
      loadPendingRegistrations() // Reload the list
      onApprovalComplete?.() // Notify parent to update counts
    } catch (error) {
      console.error('Failed to approve registration:', error)
      showToast('Failed to approve registration', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const confirmReject = async (reason: string) => {
    if (!selectedCourse) return

    try {
      setProcessing(true)
      const userName = sessionStorage.getItem('userName') || 'System'
      
      await fetch(`/api/courses/${selectedCourse.id}/approve-registration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason,
          userRole,
          userName
        })
      })

      showToast('Course registration rejected', 'success')
      setShowRejectModal(false)
      setSelectedCourse(null)
      loadPendingRegistrations() // Reload the list
      onApprovalComplete?.() // Notify parent to update counts
    } catch (error) {
      console.error('Failed to reject registration:', error)
      showToast('Failed to reject registration', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCourses.map(c => c.id))
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
      const userName = sessionStorage.getItem('userName') || 'System'
      
      const promises = selectedIds.map(courseId =>
        fetch(`/api/courses/${courseId}/approve-registration`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            userRole,
            userName,
            reason: bulkNote
          })
        }).then(res => res.json())
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showToast(`${successCount} registration(s) approved successfully`, 'success')
      }
      if (failCount > 0) {
        showToast(`${failCount} registration(s) failed to approve`, 'error')
      }

      setShowBulkApproveModal(false)
      setBulkNote('')
      setSelectedIds([])
      loadPendingRegistrations()
      onApprovalComplete?.()
    } catch (error) {
      console.error('Error bulk approving registrations:', error)
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
      const userName = sessionStorage.getItem('userName') || 'System'
      
      const promises = selectedIds.map(courseId =>
        fetch(`/api/courses/${courseId}/approve-registration`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            reason: bulkNote,
            userRole,
            userName
          })
        }).then(res => res.json())
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showToast(`${successCount} registration(s) rejected`, 'success')
      }
      if (failCount > 0) {
        showToast(`${failCount} registration(s) failed to reject`, 'error')
      }

      setShowBulkRejectModal(false)
      setBulkNote('')
      setSelectedIds([])
      loadPendingRegistrations()
      onApprovalComplete?.()
    } catch (error) {
      console.error('Error bulk rejecting registrations:', error)
      showToast('Error processing bulk rejection', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading pending registrations...
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Course code or name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
            Trainer
          </label>
          <input
            type="text"
            placeholder="Filter by trainer..."
            value={filters.trainer}
            onChange={(e) => setFilters({ ...filters, trainer: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
            Course Type
          </label>
          <select
            value={filters.courseType}
            onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Types</option>
            <option value="SHINE">SHINE</option>
            <option value="Product">Product</option>
            <option value="Skill">Skill</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="Central">Central</option>
            <option value="Nationwide">Nationwide</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
        Showing {filteredCourses.length} of {courses.length} pending registration{courses.length !== 1 ? 's' : ''}
      </div>

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
            {selectedIds.length} registration{selectedIds.length > 1 ? 's' : ''} selected
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

      {/* Table */}
      {filteredCourses.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '5px' }}>
            No pending registrations
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {courses.length === 0 
              ? 'There are no courses waiting for approval'
              : 'No courses match your current filters'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredCourses.length && filteredCourses.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Type</th>
                <th>Primary Trainer</th>
                <th>Registered By</th>
                <th>Registration Note</th>
                <th>Start Date</th>
                <th>Region</th>
                <th>Registered Date</th>
                <th>Days Pending</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(course.id)}
                      onChange={(e) => handleSelectOne(course.id, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <Link 
                      href={`/courses/${course.id}`} 
                      style={{ 
                        color: '#0097A9', 
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {course.code}
                    </Link>
                  </td>
                  <td>{course.name}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: course.courseType === 'SHINE' ? '#e3f2fd' : course.courseType === 'Product' ? '#fff3e0' : '#f3e5f5',
                      color: course.courseType === 'SHINE' ? '#1976d2' : course.courseType === 'Product' ? '#f57c00' : '#7b1fa2'
                    }}>
                      {course.courseType}
                    </span>
                  </td>
                  <td>{course.primaryTrainer || course.trainer}</td>
                  <td style={{ fontSize: '13px' }}>{getRegisteredBy(course)}</td>
                  <td>
                    <div style={{ 
                      maxWidth: '300px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      fontSize: '13px'
                    }}>
                      {getRegistrationNote(course)}
                    </div>
                  </td>
                  <td>{course.startDate}</td>
                  <td>{course.region}</td>
                  <td style={{ fontSize: '13px' }}>{getRegisteredDate(course)}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: getDaysPending(course) > 3 ? '#ffebee' : '#e8f5e9',
                      color: getDaysPending(course) > 3 ? '#c62828' : '#2e7d32'
                    }}>
                      {getDaysPending(course)} day{getDaysPending(course) !== 1 ? 's' : ''}
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
                        disabled={processing}
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
                        disabled={processing}
                      >
                        <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showApproveModal && selectedCourse && (
        <ApproveRegistrationModal
          course={selectedCourse}
          onConfirm={confirmApprove}
          onCancel={() => {
            setShowApproveModal(false)
            setSelectedCourse(null)
          }}
        />
      )}

      {showRejectModal && selectedCourse && (
        <RejectRegistrationModal
          course={selectedCourse}
          onConfirm={confirmReject}
          onCancel={() => {
            setShowRejectModal(false)
            setSelectedCourse(null)
          }}
        />
      )}

      {/* Bulk Approve Modal */}
      {showBulkApproveModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowBulkApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Approve Registrations</h3>
              <button className="modal-close" onClick={() => setShowBulkApproveModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Approve <strong>{selectedIds.length}</strong> registration{selectedIds.length > 1 ? 's' : ''}?</p>
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
                  `Approve ${selectedIds.length} Registration${selectedIds.length > 1 ? 's' : ''}`
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
              <h3>Bulk Reject Registrations</h3>
              <button className="modal-close" onClick={() => setShowBulkRejectModal(false)} disabled={processing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Reject <strong>{selectedIds.length}</strong> registration{selectedIds.length > 1 ? 's' : ''}?</p>
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
                  `Reject ${selectedIds.length} Registration${selectedIds.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

