'use client'

import { useEffect, useState, useMemo } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { courseAPI, trainerAPI, userAPI } from '@/lib/api'
import type { Course, Trainer, User } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import MultiSelect from '@/components/MultiSelect'
import CourseCreationModal from '@/components/CourseCreationModal'

export default function CourseListPage() {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({
    search: '',
    channel: '',
    region: '',
    status: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean
    course: Course | null
  }>({ isOpen: false, course: null })
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadCourses()
    loadTrainers()
    loadUsers()
  }, [filters])

  const loadTrainers = async () => {
    try {
      const data = await trainerAPI.getAll()
      setTrainers(data)
    } catch (error) {
      console.error('Failed to load trainers:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll()
      // Filter users with Admin role
      const adminUsers = data.filter(user => user.roles.includes('Admin'))
      setUsers(adminUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadCourses = async () => {
    try {
      const data = await courseAPI.getAll(filters)
      setCourses(data)
    } catch (error) {
      console.error('Failed to load courses:', error)
      setCourses([])
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase().replace(' ', '-')
    return `status-${statusLower}`
  }

  // Authorization helper functions based on FRS Section 8.2.5
  const getUserRoles = (): string[] => {
    if (typeof window === 'undefined') return []
    const rolesStr = sessionStorage.getItem('userRoles') || '[]'
    const roles = JSON.parse(rolesStr)
    console.log('getUserRoles:', roles) // Debug log
    return roles
  }

  // Check if user can register course (only Trainers on NEW courses)
  const canRegisterCourse = (course: Course): boolean => {
    const userRoles = getUserRoles()
    const canRegister = userRoles.includes('Trainer') && course.status === 'NEW'
    console.log(`canRegisterCourse (${course.code}):`, canRegister, 'roles:', userRoles, 'status:', course.status)
    return canRegister
  }

  // Check if user can edit course based on role and authorization matrix
  const canEditCourse = (course: Course): boolean => {
    const userRoles = getUserRoles()
    
    // Master Role can always edit
    if (userRoles.includes('Master Role')) {
      return true
    }
    
    // Admin can edit with conditions (except FINISHED courses)
    if (userRoles.includes('Admin')) {
      return course.status !== 'FINISHED'
    }
    
    // Trainer, Lead, Head can edit with conditions (NEW, REGISTERED, APPROVED)
    if (userRoles.includes('Trainer') || userRoles.includes('Lead Region') || userRoles.includes('Head Channel')) {
      return ['NEW', 'REGISTERED', 'APPROVED'].includes(course.status)
    }
    
    console.log(`canEditCourse (${course.code}): false - no matching role`)
    return false
  }

  // Check if user can cancel course based on role and authorization matrix
  const canCancelCourse = (course: Course): boolean => {
    const userRoles = getUserRoles()
    
    // Master Role can always cancel
    if (userRoles.includes('Master Role')) {
      return true
    }
    
    // Admin cannot cancel
    if (userRoles.includes('Admin')) {
      return false
    }
    
    // Trainer, Lead, Head can cancel with conditions (REGISTERED, APPROVED, IN_PROGRESS)
    if (userRoles.includes('Trainer') || userRoles.includes('Lead Region') || userRoles.includes('Head Channel')) {
      return ['REGISTERED', 'APPROVED', 'IN_PROGRESS'].includes(course.status)
    }
    
    return false
  }

  // Check if user can delete course based on role and authorization matrix
  const canDeleteCourse = (course: Course): boolean => {
    const userRoles = getUserRoles()
    
    // Admin and Master Role can always delete
    if (userRoles.includes('Admin') || userRoles.includes('Master Role')) {
      return true
    }
    
    // Trainer, Lead, Head can delete with conditions (only NEW or REGISTERED)
    if (userRoles.includes('Trainer') || userRoles.includes('Lead Region') || userRoles.includes('Head Channel')) {
      return ['NEW', 'REGISTERED'].includes(course.status)
    }
    
    return false
  }

  // Handle delete course
  // Action handlers
  const handleRegisterCourse = (course: Course) => {
    // Navigate to course details page which has the registration workflow
    window.location.href = `/courses/${course.id}`
  }

  const handleEditCourse = (course: Course) => {
    // Navigate to course edit page
    window.location.href = `/courses/${course.id}/edit`
  }

  const handleCancelCourse = (course: Course) => {
    // For now, navigate to course details page which has cancel functionality
    // In future, can implement cancel modal here
    window.location.href = `/courses/${course.id}`
  }

  const handleDeleteCourse = (course: Course) => {
    setDeleteConfirmModal({ isOpen: true, course })
  }

  // Export courses to Excel
  const handleExportCourses = async () => {
    if (courses.length === 0) {
      showToast('No courses to export', 'error')
      return
    }

    setIsExporting(true)

    try {
      // Prepare export data
      const exportData = courses.map(course => ({
        'Code': course.code,
        'Course Name': course.name,
        'Start Date': formatDate(course.startDate),
        'End Date': formatDate(course.endDate),
        'Trainer': course.trainer,
        'Sessions': course.section || '',
        'Region': course.region,
        'Channel': course.channel,
        'Venue': course.venue,
        'Status': course.status,
        'Created By': course.createdBy,
        'Created At': course.createdAt ? new Date(course.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '',
        'Updated By': course.createdBy // Using createdBy as placeholder for updatedBy
      }))

      // Create CSV content
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in values
            const stringValue = String(value || '')
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"` 
              : stringValue
          }).join(',')
        )
      ].join('\n')

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // Generate filename with timestamp
      const now = new Date()
      const timestamp = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '') + '_' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/:/g, '')
      
      const filename = `Courses_Export_${timestamp}.csv`

      // Create download link
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      showToast(`Successfully exported ${courses.length} courses`, 'success')
    } catch (error) {
      console.error('Export error:', error)
      showToast('Failed to export courses. Please try again.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteConfirmModal.course) return
    
    try {
      await courseAPI.delete(deleteConfirmModal.course.id)
      showToast(`Course "${deleteConfirmModal.course.code}" deleted successfully`, 'success')
      setDeleteConfirmModal({ isOpen: false, course: null })
      loadCourses()
    } catch (error) {
      console.error('Failed to delete course:', error)
      showToast('Failed to delete course. Please try again.', 'error')
    }
  }

  const columns: Column<Course>[] = [
    {
      key: 'code',
      label: 'COURSE CODE',
      sortable: true,
      render: (course) => <Link href={`/courses/${course.id}`}>{course.code}</Link>
    },
    {
      key: 'name',
      label: 'COURSE NAME',
      sortable: true
    },
    {
      key: 'dates',
      label: 'START-END DATE',
      wrap: true,
      render: (course) => (
        <>
          F: {formatDate(course.startDate)}<br />T: {formatDate(course.endDate)}
        </>
      )
    },
    {
      key: 'trainer',
      label: 'COURSE.TRAINER',
      sortable: true,
      render: (course) => <>• {course.trainer}</>
    },
    {
      key: 'section',
      label: 'SESSION',
      sortable: true
    },
    {
      key: 'region',
      label: 'REGION',
      sortable: true
    },
    {
      key: 'channel',
      label: 'CHANNEL',
      sortable: true
    },
    {
      key: 'venue',
      label: 'VENUE',
      sortable: true
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (course) => (
        <span className={`status-badge ${getStatusClass(course.status)}`}>{course.status}</span>
      )
    },
    {
      key: 'createdBy',
      label: 'CREATED BY',
      sortable: true
    },
    {
      key: 'createdAt',
      label: 'CREATED AT',
      sortable: true,
      render: (course) => {
        if (!course.createdAt) return '-'
        const date = new Date(course.createdAt)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      key: 'actions',
      label: 'ACTION',
      sortable: false,
      render: (course) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Register - Only for Trainers on NEW courses */}
          {canRegisterCourse(course) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRegisterCourse(course)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                color: '#0066cc'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Register Course"
            >
              📝
            </button>
          )}
          
          {/* Edit - Based on authorization */}
          {canEditCourse(course) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditCourse(course)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                color: '#666666'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Edit Course"
            >
              ✏️
            </button>
          )}
          
          {/* Cancel - Based on authorization */}
          {canCancelCourse(course) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCancelCourse(course)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                color: '#ff9800'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff3e0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Cancel Course"
            >
              ❌
            </button>
          )}
          
          {/* Delete - Based on authorization */}
          {canDeleteCourse(course) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteCourse(course)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                color: '#dc3545'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Delete Course"
            >
              🗑️
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout breadcrumbs={[{ label: 'Courses Management' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Program Curriculum</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            style={{ 
              width: 'auto', 
              padding: '10px 20px', 
              whiteSpace: 'nowrap', 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }} 
            onClick={handleExportCourses}
            disabled={isExporting || courses.length === 0}
          >
            {isExporting ? (
              <>
                <span style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #fff', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
                Exporting...
              </>
            ) : (
              <>
                📥 Export Courses
              </>
            )}
          </button>
          <button 
            className="btn-primary" 
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }} 
            onClick={() => setShowCreateModal(true)}
          >
            Create New Course +
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Type course code, course name,... to search."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select className="filter-select" value={filters.channel} onChange={(e) => handleFilterChange('channel', e.target.value)}>
          <option value="">All Channels</option>
          <option value="Agency">Agency</option>
          <option value="Banca FSC">Banca FSC</option>
          <option value="Banker">Banker</option>
          <option value="IFA">IFA</option>
        </select>
        <select className="filter-select" value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
          <option value="">All Regions</option>
          <option value="Central">Central</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="Nationwide">Nationwide</option>
        </select>
        <select className="filter-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="NEW">NEW</option>
          <option value="REGISTERED">REGISTERED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="WAITING_APPROVAL_EDIT">WAITING_APPROVAL_EDIT</option>
          <option value="WAITING_APPROVAL_CANCEL">WAITING_APPROVAL_CANCEL</option>
          <option value="CANCEL">CANCEL</option>
          <option value="FINISHED">FINISHED</option>
          <option value="DELETED">DELETED</option>
        </select>
      </div>

      <DataTable
        data={courses}
        columns={columns}
        emptyMessage="No courses found"
        onRowClick={(course) => window.location.href = `/courses/${course.id}`}
        defaultSortColumn="createdAt"
        defaultSortDirection="desc"
      />
      <div className="pagination">
        <span>Go 1 Page 1 of 1</span>
        <div className="pagination-controls">
          <button>&lt;</button>
          <span>1</span>
          <button>&gt;</button>
        </div>
      </div>

      {/* Course Creation Modal */}
      <CourseCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadCourses()
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.course && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmModal({ isOpen: false, course: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button 
                className="modal-close" 
                onClick={() => setDeleteConfirmModal({ isOpen: false, course: null })}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <p style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  color: '#333'
                }}>
                  Are you sure you want to delete this course?
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  <strong>Course Code:</strong> {deleteConfirmModal.course.code}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  <strong>Course Name:</strong> {deleteConfirmModal.course.name}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666'
                }}>
                  <strong>Status:</strong> {deleteConfirmModal.course.status}
                </p>
              </div>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#dc3545',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-footer">
              <div className="modal-footer-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteConfirmModal({ isOpen: false, course: null })}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={confirmDelete}
                  style={{ 
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333'
                    e.currentTarget.style.borderColor = '#bd2130'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545'
                    e.currentTarget.style.borderColor = '#dc3545'
                  }}
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

