'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { courseAPI, participantAPI, trainerAPI } from '@/lib/api'
import type { Course, Participant, Trainer } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import ConfirmationModal from '@/components/ConfirmationModal'
import StatusTimeline from '@/components/StatusTimeline'
import MultiSelect from '@/components/MultiSelect'
import { checkEditPermission, getCurrentUserRole, canRegisterForCourse, type EditPermission } from '@/lib/auth-utils'
import CourseRegistrationModal from '@/components/CourseRegistrationModal'
import CourseChecklist from '@/components/CourseChecklist'
import { exportParticipantsForMOF, isEligibleForMOF } from '@/lib/export-utils'

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalActiveTab, setAddModalActiveTab] = useState<'normal' | 'reexam'>('normal')
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [participantToRemove, setParticipantToRemove] = useState<number | null>(null)
  const [participantSearchQuery, setParticipantSearchQuery] = useState('')
  const [selectedReExamParticipants, setSelectedReExamParticipants] = useState<number[]>([])
  const [reExamSearchQuery, setReExamSearchQuery] = useState('')
  const [participantExamTypes, setParticipantExamTypes] = useState<Record<number, string>>({})
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{
    success: Array<{ participant: Partial<Participant>, action: string }>
    failed: Array<{ participant: Partial<Participant>, reason: string }>
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPermission, setEditPermission] = useState<EditPermission | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Course>>({})
  const [editReason, setEditReason] = useState('')
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showApproveRegistrationModal, setShowApproveRegistrationModal] = useState(false)
  const [showRejectRegistrationModal, setShowRejectRegistrationModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showApproveEditModal, setShowApproveEditModal] = useState(false)
  const [showRejectEditModal, setShowRejectEditModal] = useState(false)
  const [showApproveCancelModal, setShowApproveCancelModal] = useState(false)
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false)
  
  // Mock data for dropdowns
  const partners = ['Partner A', 'Partner B', 'Partner C']
  const branches = ['Branch 1', 'Branch 2', 'Branch 3']
  const areas = ['Area 1', 'Area 2', 'Area 3']
  const provinces = ['Ho Chi Minh', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong']
  const aolExamCodes = ['AOL001', 'AOL002', 'AOL003']

  const loadCourseDetails = useCallback(async () => {
    if (!params?.id) {
      showToast('Invalid course ID', 'error')
      router.push('/courses')
      return
    }

    try {
      const courseId = parseInt(params.id as string)
      if (isNaN(courseId)) {
        showToast('Invalid course ID', 'error')
        router.push('/courses')
        return
      }
      
      const foundCourse = await courseAPI.getById(courseId)
      
      if (!foundCourse) {
        showToast('Course not found', 'error')
        router.push('/courses')
        return
      }
      
      setCourse(foundCourse)
      
      // Load participants for this course
      setIsLoadingParticipants(true)
      try {
        if (foundCourse.participantIds && foundCourse.participantIds.length > 0) {
          try {
            const participantPromises = foundCourse.participantIds.map(id => 
              participantAPI.getById(id).catch(err => {
                console.warn(`Failed to load participant ${id}:`, err)
                return null
              })
            )
            const participantsData = await Promise.all(participantPromises)
            setParticipants(participantsData.filter(p => p !== null) as Participant[])
          } catch (error) {
            console.error('Failed to load participants:', error)
            setParticipants([])
          }
        } else {
          setParticipants([])
        }
      } finally {
        setIsLoadingParticipants(false)
      }
    } catch (error) {
      console.error('Failed to load course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showToast(`Failed to load course details: ${errorMessage}`, 'error')
      router.push('/courses')
    }
  }, [params?.id, router, showToast])

  useEffect(() => {
    if (params?.id) {
      loadCourseDetails()
    }
  }, [params?.id, loadCourseDetails])

  useEffect(() => {
    const loadAllParticipants = async () => {
      try {
        const data = await participantAPI.getAll({})
        setAllParticipants(data)
      } catch (error) {
        console.error('Failed to load participants:', error)
      }
    }
    loadAllParticipants()
  }, [])

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const data = await trainerAPI.getAll({})
        setTrainers(data)
      } catch (error) {
        console.error('Failed to load trainers:', error)
      }
    }
    loadTrainers()
  }, [])

  // Check edit permission when course loads
  useEffect(() => {
    if (course) {
      const permission = checkEditPermission(course)
      setEditPermission(permission)
    }
  }, [course])

  // Close actions menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showActionsMenu) {
        setShowActionsMenu(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showActionsMenu])

  // Clear selected participants when participants list changes
  useEffect(() => {
    // Remove any selected IDs that no longer exist in the participants list
    setSelectedParticipantIds(prev => 
      prev.filter(id => participants.some(p => p.id === id))
    )
  }, [participants])

  const handleEditClick = () => {
    if (!course || !editPermission) return

    if (!editPermission.canEdit) {
      showToast(editPermission.reason || 'You do not have permission to edit this course', 'warning')
      return
    }

    // Initialize form data with current course data
    setEditFormData({
      name: course.name,
      program: course.program,
      trainer: course.trainer,
      primaryTrainer: course.primaryTrainer,
      coTrainer: course.coTrainer,
      channel: course.channel,
      region: course.region,
      venueAddress: course.venueAddress,
      venue: course.venue,
      area: course.area,
      province: course.province,
      startDate: course.startDate,
      endDate: course.endDate,
      startTimePeriod: course.startTimePeriod,
      endTimePeriod: course.endTimePeriod,
      description: course.description,
      aolStartTime: course.aolStartTime,
      aolEndTime: course.aolEndTime,
      aolExamId: course.aolExamId,
      mofCourseName: course.mofCourseName,
      examType: course.examType,
      mofExamTime: course.mofExamTime,
      isProctorTrainer: course.isProctorTrainer,
      proctorTrainer: course.proctorTrainer,
      proctorName: course.proctorName,
      proctorPhone: course.proctorPhone,
      mofAddress: course.mofAddress,
      mofProvince: course.mofProvince,
      ward: course.ward,
      examCategory: course.examCategory,
      supporter: course.supporter,
      partner: course.partner,
      branch: course.branch,
    })
    setEditReason('')
    setEditFieldErrors({})
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!course || !editPermission) return

    // Validate edit reason
    if (!editReason.trim()) {
      showToast('Please provide a reason for editing the course', 'warning')
      return
    }

    // Check if user has field-level restrictions (e.g., Admin can only edit MOF class code)
    const allowedFields = editPermission.editableFields
    let updatesToApply = editFormData
    
    if (allowedFields && allowedFields.length > 0) {
      // Only allow editing specified fields
      const restrictedUpdates: Partial<Course> = {}
      allowedFields.forEach(field => {
        if (editFormData[field as keyof Course] !== undefined) {
          (restrictedUpdates as any)[field] = editFormData[field as keyof Course]
        }
      })
      
      if (Object.keys(restrictedUpdates).length === 0) {
        showToast(`You can only edit the following fields: ${allowedFields.join(', ')}`, 'warning')
        return
      }
      
      updatesToApply = restrictedUpdates
    }

    setIsSaving(true)
    try {
      const userRole = getCurrentUserRole()
      const userName = typeof window !== 'undefined' ? sessionStorage.getItem('currentUserName') || 'System' : 'System'

      await courseAPI.update(course.id, updatesToApply, {
        editReason: editReason.trim(),
        userRole,
        userName,
        requiresApproval: editPermission.requiresApproval || false,
      })

      await loadCourseDetails()
      setShowEditModal(false)
      setEditReason('')
      
      if (editPermission.requiresApproval) {
        showToast('Edit request submitted. Waiting for approval.', 'success')
      } else {
        showToast('Course updated successfully!', 'success')
      }
    } catch (error) {
      console.error('Failed to update course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course'
      showToast(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditFormData({})
    setEditReason('')
    setEditFieldErrors({})
  }

  // Check if user can register for this course
  const canRegister = () => {
    if (!course) return false
    const { canRegister: allowed } = canRegisterForCourse(course)
    return allowed
  }

  const handleRegisterClick = () => {
    if (!canRegister()) {
      const { reason } = canRegisterForCourse(course!)
      showToast(reason || 'You cannot register for this course', 'warning')
      return
    }
    setShowRegisterModal(true)
  }

  const handleExportParticipantsForMOF = async () => {
    if (!course) return

    try {
      // Check if course is SHINE type
      if (course.courseType?.toLowerCase() !== 'shine') {
        showToast('MOF export is only available for SHINE courses', 'warning')
        return
      }

      // Check if course has participants
      if (!participants || participants.length === 0) {
        showToast('No participants found in this course', 'warning')
        return
      }

      // Filter eligible participants (passed AOL, full attendance)
      const eligibleParticipants = participants.filter(p => 
        isEligibleForMOF(p, course)
      )

      if (eligibleParticipants.length === 0) {
        showToast('No eligible participants found. Participants must pass AOL exams and have full attendance.', 'warning')
        return
      }

      // Export to CSV
      exportParticipantsForMOF(eligibleParticipants, course, eligibleParticipants.map(p => p.id))
      
      showToast(`Exported ${eligibleParticipants.length} participant(s) for MOF exam`, 'success')
    } catch (error) {
      console.error('Error exporting participants for MOF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to export participants for MOF exam'
      showToast(errorMessage, 'error')
    }
  }

  // Handler for approving registration
  const handleApproveRegistration = async () => {
    if (!course) return
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Registration approved successfully', 'success')
        await loadCourseDetails()
        setShowApproveRegistrationModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to approve registration', 'error')
      }
    } catch (error) {
      showToast('Error approving registration', 'error')
    }
  }

  // Handler for rejecting registration
  const handleRejectRegistration = async () => {
    if (!course) return
    if (!actionReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning')
      return
    }
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Registration rejected', 'success')
        await loadCourseDetails()
        setShowRejectRegistrationModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to reject registration', 'error')
      }
    } catch (error) {
      showToast('Error rejecting registration', 'error')
    }
  }

  // Handler for approving edit
  const handleApproveEdit = async () => {
    if (!course) return
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Edit approved successfully', 'success')
        await loadCourseDetails()
        setShowApproveEditModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to approve edit', 'error')
      }
    } catch (error) {
      showToast('Error approving edit', 'error')
    }
  }

  // Handler for rejecting edit
  const handleRejectEdit = async () => {
    if (!course) return
    if (!actionReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning')
      return
    }
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Edit rejected', 'success')
        await loadCourseDetails()
        setShowRejectEditModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to reject edit', 'error')
      }
    } catch (error) {
      showToast('Error rejecting edit', 'error')
    }
  }

  // Handler for cancel request
  const handleCancelRequest = async () => {
    if (!course) return
    if (!actionReason.trim()) {
      showToast('Please provide a reason for cancellation', 'warning')
      return
    }
    try {
      const response = await fetch(`/api/courses/${course.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Cancellation request submitted', 'success')
        await loadCourseDetails()
        setShowCancelModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to submit cancellation request', 'error')
      }
    } catch (error) {
      showToast('Error submitting cancellation request', 'error')
    }
  }

  // Handler for approving cancel
  const handleApproveCancel = async () => {
    if (!course) return
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Cancellation approved', 'success')
        await loadCourseDetails()
        setShowApproveCancelModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to approve cancellation', 'error')
      }
    } catch (error) {
      showToast('Error approving cancellation', 'error')
    }
  }

  // Handler for rejecting cancel
  const handleRejectCancel = async () => {
    if (!course) return
    if (!actionReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning')
      return
    }
    try {
      const response = await fetch(`/api/courses/${course.id}/approve-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', approverNote: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Cancellation rejected', 'success')
        await loadCourseDetails()
        setShowRejectCancelModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to reject cancellation', 'error')
      }
    } catch (error) {
      showToast('Error rejecting cancellation', 'error')
    }
  }

  // Handler for finishing course
  const handleFinishCourse = async () => {
    if (!course) return
    try {
      const response = await fetch(`/api/courses/${course.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: actionReason })
      })
      const data = await response.json()
      if (data.success) {
        showToast('Course finished successfully', 'success')
        await loadCourseDetails()
        setShowFinishModal(false)
        setActionReason('')
      } else {
        showToast(data.error || 'Failed to finish course', 'error')
      }
    } catch (error) {
      showToast('Error finishing course', 'error')
    }
  }

  // Handler for deleting course
  const handleDeleteCourse = async () => {
    if (!course) return
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        showToast('Course deleted successfully', 'success')
        router.push('/courses')
      } else {
        showToast(data.error || 'Failed to delete course', 'error')
      }
    } catch (error) {
      showToast('Error deleting course', 'error')
    }
  }

  if (!course) {
    return (
      <div className="loading-container">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '70%' }} />
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading course details...</div>
      </div>
    )
  }

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase().replace(' ', '-')
    return `status-${statusLower}`
  }

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) {
      showToast('Please select at least one participant', 'warning')
      return
    }

    try {
      await Promise.all(selectedParticipants.map(pid => courseAPI.addParticipant(course!.id, pid)))
      
      // Set exam type to "Normal" for participants added via normal flow
      const newExamTypes: Record<number, string> = {}
      selectedParticipants.forEach(pid => {
        newExamTypes[pid] = 'Normal'
      })
      setParticipantExamTypes(prev => ({ ...prev, ...newExamTypes }))
      
      setShowAddModal(false)
      setSelectedParticipants([])
      setParticipantSearchQuery('')
      setAddModalActiveTab('normal')
      await loadCourseDetails()
      showToast(`${selectedParticipants.length} participant(s) added successfully!`, 'success')
    } catch (error) {
      console.error('Failed to add participants:', error)
      showToast('Failed to add participants. Please try again.', 'error')
    }
  }

  // Check if participant is eligible for re-exam (mock function - actual implementation would check against course/exam data)
  const isEligibleForReExam = (participant: Participant): boolean => {
    // Mock eligibility check - In real implementation, this would check:
    // 1. Participant exists ✓ (already in allParticipants list)
    // 2. AOL exams passed ✓ (check participant's previous course records)
    // 3. Attendance completed ✓ (check attendance records)
    // 4. Course completed within past 45 days ✓ (check previous course end date)
    // 5. MOF exam not passed ✓ (check MOF exam results)
    
    // For demo purposes, we'll use a simple check based on participant ID
    // In production, this would query actual exam and attendance records
    // This is a placeholder - actual implementation needs backend support
    return participant.status === 'Active'
  }

  const handleAddReExamParticipants = async () => {
    if (selectedReExamParticipants.length === 0) {
      showToast('Please select at least one participant', 'warning')
      return
    }

    try {
      // Note: The actual API would need to support exam type parameter
      // For now, we'll add participants and note that exam type should be "Re MOF Examination"
      // In production, the API should be: courseAPI.addParticipant(courseId, participantId, { examType: 'Re MOF Examination' })
      await Promise.all(selectedReExamParticipants.map(pid => courseAPI.addParticipant(course!.id, pid)))
      
      // Set exam type to "Re MOF Examination" for participants added via re-exam flow
      const newExamTypes: Record<number, string> = {}
      selectedReExamParticipants.forEach(pid => {
        newExamTypes[pid] = 'Re MOF Examination'
      })
      setParticipantExamTypes(prev => ({ ...prev, ...newExamTypes }))
      
      setShowAddModal(false)
      setSelectedReExamParticipants([])
      setReExamSearchQuery('')
      setAddModalActiveTab('normal')
      await loadCourseDetails()
      showToast(`${selectedReExamParticipants.length} re-exam participant(s) added successfully with exam type "Re MOF Examination"!`, 'success')
    } catch (error) {
      console.error('Failed to add re-exam participants:', error)
      showToast('Failed to add re-exam participants. Please try again.', 'error')
    }
  }

  const handleRemoveParticipant = (participantId: number) => {
    setParticipantToRemove(participantId)
    setShowConfirmModal(true)
  }

  const confirmRemoveParticipant = async () => {
    if (participantToRemove === null || !course) return

    try {
      await courseAPI.removeParticipant(course.id, participantToRemove)
      // Remove exam type when participant is removed
      setParticipantExamTypes(prev => {
        const updated = { ...prev }
        delete updated[participantToRemove]
        return updated
      })
      await loadCourseDetails()
      showToast('Participant removed successfully', 'success')
      setShowConfirmModal(false)
      setParticipantToRemove(null)
    } catch (error) {
      console.error('Failed to remove participant:', error)
      showToast('Failed to remove participant. Please try again.', 'error')
      setShowConfirmModal(false)
      setParticipantToRemove(null)
    }
  }

  const cancelRemoveParticipant = () => {
    setShowConfirmModal(false)
    setParticipantToRemove(null)
  }

  // Bulk selection handlers
  const handleSelectParticipant = (participantId: number) => {
    setSelectedParticipantIds(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const handleSelectAllParticipants = () => {
    if (selectedParticipantIds.length === participants.length) {
      setSelectedParticipantIds([])
    } else {
      setSelectedParticipantIds(participants.map(p => p.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedParticipantIds.length === 0) return
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    if (!course || selectedParticipantIds.length === 0) return

    try {
      // Remove all selected participants
      for (const participantId of selectedParticipantIds) {
        await courseAPI.removeParticipant(course.id, participantId)
        // Remove exam type when participant is removed
        setParticipantExamTypes(prev => {
          const updated = { ...prev }
          delete updated[participantId]
          return updated
        })
      }
      await loadCourseDetails()
      showToast(`${selectedParticipantIds.length} participant(s) removed successfully`, 'success')
      setShowBulkDeleteModal(false)
      setSelectedParticipantIds([])
    } catch (error) {
      console.error('Failed to remove participants:', error)
      showToast('Failed to remove participants. Please try again.', 'error')
      setShowBulkDeleteModal(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileName = file.name.toLowerCase()
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext))
      
      if (!isValidFile) {
        showToast('Invalid file type. Please select a CSV or Excel file.', 'error')
        return
      }
      
      setImportFile(file)
      setImportResults(null) // Clear previous results
    }
  }

  const handleImportParticipants = async () => {
    if (!importFile || !course) return

    setIsImporting(true)
    setImportResults({ success: [], failed: [] })

    try {
      // Parse CSV file
      const text = await importFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        showToast('File is empty', 'error')
        setIsImporting(false)
        return
      }

      // Parse CSV headers (assuming first line is header)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const nameIndex = headers.findIndex(h => h.includes('name'))
      const agentCodeIndex = headers.findIndex(h => h.includes('agent') || h.includes('code'))
      const emailIndex = headers.findIndex(h => h.includes('email'))
      const phoneIndex = headers.findIndex(h => h.includes('phone'))
      const regionIndex = headers.findIndex(h => h.includes('region'))
      const channelIndex = headers.findIndex(h => h.includes('channel'))

      if (nameIndex === -1 || agentCodeIndex === -1) {
        showToast('CSV file must contain "Name" and "Agent Code" columns', 'error')
        setIsImporting(false)
        return
      }

      const success: Array<{ participant: Partial<Participant>, action: string }> = []
      const failed: Array<{ participant: Partial<Participant>, reason: string }> = []

      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const name = values[nameIndex] || ''
        const agentCode = values[agentCodeIndex] || ''
        const email = values[emailIndex] || ''
        const phone = values[phoneIndex] || ''
        const region = values[regionIndex] || ''
        const channel = values[channelIndex] || ''

        if (!name || !agentCode) {
          failed.push({
            participant: { name, agentCode, email, phone },
            reason: 'Missing required fields (Name or Agent Code)'
          })
          continue
        }

        // Find existing participant by agent code or email
        const existingParticipant = allParticipants.find(
          p => p.agentCode?.toLowerCase() === agentCode.toLowerCase() ||
               p.email?.toLowerCase() === email.toLowerCase()
        )

        if (!existingParticipant) {
          failed.push({
            participant: { name, agentCode, email, phone },
            reason: 'Participant not found in system'
          })
          continue
        }

        // Check if participant is already in the course
        if (course.participantIds.includes(existingParticipant.id)) {
          failed.push({
            participant: { name, agentCode, email, phone },
            reason: 'Participant already in course'
          })
          continue
        }

        try {
          // Add participant to course
          await courseAPI.addParticipant(course.id, existingParticipant.id)
          
          // Set exam type to "Normal" for imported participants
          setParticipantExamTypes(prev => ({
            ...prev,
            [existingParticipant.id]: 'Normal'
          }))

          success.push({
            participant: existingParticipant,
            action: 'Added to course'
          })
        } catch (error) {
          failed.push({
            participant: { name, agentCode, email, phone },
            reason: 'Failed to add participant to course'
          })
        }
      }

      setImportResults({ success, failed })
      
      // Reload course details to refresh participants list
      await loadCourseDetails()

      if (success.length > 0) {
        showToast(`Successfully imported ${success.length} participant(s)`, 'success')
      }
      if (failed.length > 0) {
        showToast(`${failed.length} participant(s) failed to import`, 'warning')
      }
    } catch (error) {
      console.error('Failed to import participants:', error)
      showToast('Failed to import participants. Please check the file format.', 'error')
      setImportResults(null)
    } finally {
      setIsImporting(false)
    }
  }

  // Filter participants based on search query
  const filteredParticipants = allParticipants.filter(participant => {
    // Only show participants who exist in system and are not already in the course
    if (course && course.participantIds.includes(participant.id)) {
      return false
    }

    // If no search query, show all eligible participants
    if (!participantSearchQuery.trim()) {
      return true
    }

    // Search across: Name, AD name (if exists), Email, Phone, Agent code
    const searchLower = participantSearchQuery.toLowerCase().trim()
    const nameMatch = participant.name?.toLowerCase().includes(searchLower) || false
    const emailMatch = participant.email?.toLowerCase().includes(searchLower) || false
    const phoneMatch = participant.phone?.toLowerCase().includes(searchLower) || false
    const agentCodeMatch = participant.agentCode?.toLowerCase().includes(searchLower) || false
    // AD name is not currently in the data structure, but we'll check if it exists
    const adNameMatch = (participant as any).adName?.toLowerCase().includes(searchLower) || false

    return nameMatch || emailMatch || phoneMatch || agentCodeMatch || adNameMatch
  })

  // Filter participants eligible for re-exam
  const filteredReExamParticipants = allParticipants.filter(participant => {
    // Only show participants who exist in system and are not already in the course
    if (course && course.participantIds.includes(participant.id)) {
      return false
    }

    // Check re-exam eligibility: All conditions must be met
    // 1. Participant exists ✓ (already in allParticipants)
    // 2. AOL exams passed ✓
    // 3. Attendance completed ✓
    // 4. Course completed within past 45 days ✓
    // 5. MOF exam not passed ✓
    if (!isEligibleForReExam(participant)) {
      return false
    }

    // If no search query, show all eligible re-exam participants
    if (!reExamSearchQuery.trim()) {
      return true
    }

    // Search across: Name, AD name (if exists), Email, Phone, Agent code
    const searchLower = reExamSearchQuery.toLowerCase().trim()
    const nameMatch = participant.name?.toLowerCase().includes(searchLower) || false
    const emailMatch = participant.email?.toLowerCase().includes(searchLower) || false
    const phoneMatch = participant.phone?.toLowerCase().includes(searchLower) || false
    const agentCodeMatch = participant.agentCode?.toLowerCase().includes(searchLower) || false
    const adNameMatch = (participant as any).adName?.toLowerCase().includes(searchLower) || false

    return nameMatch || emailMatch || phoneMatch || agentCodeMatch || adNameMatch
  })

  // Check if course is SHINE type
  const isSHINECourse = course?.courseType?.toLowerCase() === 'shine'

  if (!course) {
    return <div>Loading...</div>
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Courses', href: '/courses' },
      { label: 'Course Details' }
    ]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1, minWidth: 0 }}>Course: {course.code}</h1>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Register Button - for NEW status */}
          {canRegister() && course.status === 'NEW' && (
            <button 
              className="btn-primary"
              style={{ 
                whiteSpace: 'nowrap', 
                width: 'auto', 
                padding: '10px 20px'
              }}
              onClick={handleRegisterClick}
            >
              <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
              Register
            </button>
          )}
          
          {/* Approve Registration - for REGISTERED status */}
          {course.status === 'REGISTERED' && (
            <>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#4caf50'
                }}
                onClick={() => setShowApproveRegistrationModal(true)}
              >
                <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                Approve Registration
              </button>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#f44336'
                }}
                onClick={() => setShowRejectRegistrationModal(true)}
              >
                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                Reject Registration
              </button>
            </>
          )}
          
          {/* Approve/Reject Edit - for WAITING_APPROVAL_EDIT status */}
          {course.status === 'WAITING_APPROVAL_EDIT' && (
            <>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#4caf50'
                }}
                onClick={() => setShowApproveEditModal(true)}
              >
                <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                Approve Edit
              </button>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#f44336'
                }}
                onClick={() => setShowRejectEditModal(true)}
              >
                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                Reject Edit
              </button>
            </>
          )}
          
          {/* Approve/Reject Cancel - for WAITING_APPROVAL_CANCEL status */}
          {course.status === 'WAITING_APPROVAL_CANCEL' && (
            <>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#4caf50'
                }}
                onClick={() => setShowApproveCancelModal(true)}
              >
                <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                Approve Cancel
              </button>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 20px',
                  backgroundColor: '#f44336'
                }}
                onClick={() => setShowRejectCancelModal(true)}
              >
                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                Reject Cancel
              </button>
            </>
          )}
          
          {/* Edit Button - for most statuses */}
          {!['CANCEL', 'FINISHED', 'WAITING_APPROVAL_EDIT', 'WAITING_APPROVAL_CANCEL'].includes(course.status) && (
            <button 
              className={`btn-primary ${!editPermission?.canEdit ? 'disabled' : ''}`}
              style={{ 
                whiteSpace: 'nowrap', 
                width: 'auto', 
                padding: '10px 20px',
                opacity: editPermission?.canEdit ? 1 : 0.5,
                cursor: editPermission?.canEdit ? 'pointer' : 'not-allowed',
                backgroundColor: '#2196f3'
              }}
              onClick={handleEditClick}
              disabled={!editPermission?.canEdit}
              title={editPermission?.reason || 'Edit Course'}
            >
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
              Edit
            </button>
          )}
          
          {/* Finish Button - for IN_PROGRESS status */}
          {course.status === 'IN_PROGRESS' && (
            <button 
              className="btn-primary"
              style={{ 
                whiteSpace: 'nowrap', 
                width: 'auto', 
                padding: '10px 20px',
                backgroundColor: '#9c27b0'
              }}
              onClick={() => setShowFinishModal(true)}
            >
              <i className="fas fa-flag-checkered" style={{ marginRight: '8px' }}></i>
              Finish Course
            </button>
          )}
          
          {/* More Actions Dropdown (Cancel & Delete) */}
          {(['NEW', 'REGISTERED', 'APPROVED', 'IN_PROGRESS'].includes(course.status)) && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-primary"
                style={{ 
                  whiteSpace: 'nowrap', 
                  width: 'auto', 
                  padding: '10px 15px',
                  backgroundColor: '#666'
                }}
                onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              
              {showMoreActionsMenu && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                    onClick={() => setShowMoreActionsMenu(false)}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '5px',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Cancel Button - for REGISTERED, APPROVED, IN_PROGRESS statuses */}
                    {['REGISTERED', 'APPROVED', 'IN_PROGRESS'].includes(course.status) && (
                      <button
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          color: '#ff9800',
                          fontWeight: 500
                        }}
                        onClick={() => {
                          setShowCancelModal(true)
                          setShowMoreActionsMenu(false)
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <i className="fas fa-ban" style={{ width: '16px' }}></i>
                        Request Cancel
                      </button>
                    )}
                    
                    {/* Delete Button - for NEW, REGISTERED statuses */}
                    {['NEW', 'REGISTERED'].includes(course.status) && (
                      <button
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          color: '#f44336',
                          fontWeight: 500,
                          borderTop: ['REGISTERED', 'APPROVED', 'IN_PROGRESS'].includes(course.status) ? '1px solid #eee' : 'none'
                        }}
                        onClick={() => {
                          setShowDeleteModal(true)
                          setShowMoreActionsMenu(false)
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <i className="fas fa-trash" style={{ width: '16px' }}></i>
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline - Always Visible */}
      <div style={{ marginBottom: '24px' }}>
        <StatusTimeline course={course} statusHistory={course.statusHistory} />
      </div>

      {/* Tabs Navigation */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
        <button className={`tab ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>Planning</button>
        <button className={`tab ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>Participants</button>
        <button className={`tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>Checklist</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
      </div>

      {/* GENERAL TAB - Course Information Cards */}
      {activeTab === 'general' && (
        <div className="tab-content-wrapper active">
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1 - Course Overview */}
            <div className="course-details-card">
                <div className="course-details-card-header">Course Overview</div>
                <div className="course-details-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Course Code:</div>
                        <div style={{ color: '#333' }}>{course.code}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Status:</div>
                        <div style={{ color: '#333' }}>
                          <span className={getStatusClass(course.status)} style={{ 
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Course Type:</div>
                        <div style={{ color: '#333' }}>{course.courseType || '-'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>License Type:</div>
                        <div style={{ color: '#333' }}>{course.licenseType || '-'}</div>
                        </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Course Name:</div>
                        <div style={{ color: '#333' }}>{course.name}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Program:</div>
                        <div style={{ color: '#333' }}>{course.program}</div>
                      </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Partner:</div>
                          <div style={{ color: '#333' }}>
                          {course.partner && course.partner.length > 0 ? (
                            course.partner.map((p, idx) => (
                              <span key={idx} style={{ 
                                display: 'inline-block', 
                                backgroundColor: 'var(--color-primary)', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px', 
                                marginRight: '5px', 
                                marginBottom: '5px' 
                              }}>
                                {p}
                              </span>
                            ))
                          ) : '-'}
                          </div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Branch:</div>
                          <div style={{ color: '#333' }}>
                          {course.branch ? (
                            Array.isArray(course.branch) ? (
                              course.branch.map((b, idx) => (
                                <span key={idx} style={{ 
                                  display: 'inline-block', 
                                  backgroundColor: 'var(--color-primary)', 
                                  color: 'white', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '12px', 
                                  marginRight: '5px', 
                                  marginBottom: '5px' 
                                }}>
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span style={{ 
                                display: 'inline-block', 
                                backgroundColor: 'var(--color-primary)', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px' 
                              }}>
                                {course.branch}
                              </span>
                            )
                          ) : '-'}
                          </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Primary Trainer:</div>
                        <div style={{ color: '#333' }}>{course.primaryTrainer || course.trainer || '-'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Co-Trainer:</div>
                        <div style={{ color: '#333' }}>{course.coTrainer || '-'}</div>
                        </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Channel:</div>
                        <div style={{ color: '#333' }}>{course.channel}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Region:</div>
                        <div style={{ color: '#333' }}>{course.region}</div>
                      </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Venue Address:</div>
                        <div style={{ color: '#333' }}>{course.venueAddress || course.venue || '-'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Area:</div>
                        <div style={{ color: '#333' }}>{course.area || '-'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Province:</div>
                        <div style={{ color: '#333' }}>{course.province || '-'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Start Date:</div>
                          <div style={{ color: '#333' }}>
                          {course.startDate ? (
                            <>
                            {new Date(course.startDate).toLocaleDateString('en-GB')}
                            {course.startTimePeriod && ` (${course.startTimePeriod})`}
                            </>
                          ) : '-'}
                          </div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>End Date:</div>
                          <div style={{ color: '#333' }}>
                          {course.endDate ? (
                            <>
                            {new Date(course.endDate).toLocaleDateString('en-GB')}
                            {course.endTimePeriod && ` (${course.endTimePeriod})`}
                            </>
                          ) : '-'}
                          </div>
                        </div>
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Description:</div>
                        <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{course.description || '-'}</div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 - AOL Information */}
              {(course.courseType?.toLowerCase() === 'shine' || course.courseType?.toLowerCase() === 'product') && (
                <div className="course-details-card">
                  <div className="course-details-card-header">AOL Information</div>
                  <div className="course-details-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>AOL Start Time:</div>
                        <div style={{ color: '#333' }}>
                          {course.aolStartTime ? new Date(course.aolStartTime).toLocaleString('en-GB') : '-'}
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>AOL End Time:</div>
                        <div style={{ color: '#333' }}>
                          {course.aolEndTime ? new Date(course.aolEndTime).toLocaleString('en-GB') : '-'}
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', gridColumn: '1 / -1' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>AOL Exam ID:</div>
                        <div style={{ color: '#333' }}>
                          {course.aolExamId && course.aolExamId.length > 0 ? (
                            course.aolExamId.map((id, idx) => (
                            <span key={idx} style={{ 
                              display: 'inline-block', 
                              backgroundColor: 'var(--color-primary)', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px', 
                              marginRight: '5px', 
                              marginBottom: '5px' 
                            }}>
                              {id}
                            </span>
                            ))
                          ) : '-'}
                  </div>
                </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3 - MOF Information */}
              {isSHINECourse && (
                <div className="course-details-card">
                  <div className="course-details-card-header">MOF Information</div>
                  <div className="course-details-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>MOF Course Name:</div>
                        <div style={{ color: '#333' }}>{course.mofCourseName || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Exam Type:</div>
                        <div style={{ color: '#333' }}>{course.examType || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>MOF Exam Time:</div>
                        <div style={{ color: '#333' }}>
                          {course.mofExamTime ? new Date(course.mofExamTime).toLocaleString('en-GB') : '-'}
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Is Proctor Trainer:</div>
                        <div style={{ color: '#333' }}>
                          {course.isProctorTrainer !== undefined ? (course.isProctorTrainer ? 'Yes' : 'No') : '-'}
                        </div>
                      </div>
                      {course.isProctorTrainer ? (
                        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', gridColumn: '1 / -1' }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Proctor Trainer:</div>
                          <div style={{ color: '#333' }}>{course.proctorTrainer || '-'}</div>
                        </div>
                      ) : (
                        <>
                          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Proctor Name:</div>
                            <div style={{ color: '#333' }}>{course.proctorName || '-'}</div>
                          </div>
                          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Proctor Phone:</div>
                            <div style={{ color: '#333' }}>{course.proctorPhone || '-'}</div>
                          </div>
                        </>
                    )}
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>MOF Address:</div>
                        <div style={{ color: '#333' }}>{course.mofAddress || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>MOF Province:</div>
                        <div style={{ color: '#333' }}>{course.mofProvince || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Ward:</div>
                        <div style={{ color: '#333' }}>{course.ward || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Exam Categories:</div>
                        <div style={{ color: '#333' }}>{course.examCategory || '-'}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', gridColumn: '1 / -1' }}>
                        <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>Supporter:</div>
                        <div style={{ color: '#333' }}>
                          {course.supporter && course.supporter.length > 0 ? (
                            course.supporter.map((s, idx) => (
                            <span key={idx} style={{ 
                              display: 'inline-block', 
                              backgroundColor: 'var(--color-primary)', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px', 
                              marginRight: '5px', 
                              marginBottom: '5px' 
                            }}>
                              {s}
                            </span>
                            ))
                          ) : '-'}
                        </div>
                      </div>
                      {course.mofExamCode && (
                        <div style={{ 
                          borderBottom: '1px solid #e0e0e0', 
                          paddingBottom: '12px', 
                          gridColumn: '1 / -1',
                          backgroundColor: '#f0f7ff',
                          padding: '12px',
                          borderRadius: '4px',
                          marginTop: '8px',
                          border: '1px solid #2196f3'
                        }}>
                          <div style={{ fontWeight: 600, color: '#555', marginBottom: '6px' }}>
                            MOF Exam Code:
                          </div>
                          <div style={{ 
                            color: '#2196f3', 
                            fontSize: '16px', 
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px'
                          }}>
                            {course.mofExamCode}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            Entered via checklist
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
      )}

      {/* PARTICIPANTS TAB */}
          {activeTab === 'participants' && (
            <div className="tab-content-wrapper active">
              <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
                <h2 style={{ margin: 0, flex: 1 }}>Participants</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                  {/* Quick Action: Add Participants */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                      title="Add Participants"
                      onClick={() => {
                        setAddModalActiveTab('normal');
                        setShowAddModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#0097A9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                      }}
                    >
                      <i className="fas fa-user-plus" style={{ fontSize: '16px', color: '#666' }}></i>
                      {isSHINECourse && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          backgroundColor: '#ff6b6b',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          border: '2px solid white',
                          lineHeight: 1.2
                        }}>
                          SHINE
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Quick Action: Import Participants */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Import Participants"
                      onClick={() => setShowImportModal(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#0097A9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                      }}
                    >
                      <i className="fas fa-upload" style={{ fontSize: '16px', color: '#666' }}></i>
                    </button>
                  </div>

                  {/* Quick Action: Export for MOF Exam (SHINE only) */}
                  {isSHINECourse && (
                    <div style={{ position: 'relative' }}>
                      <button 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          backgroundColor: 'white',
                          cursor: participants && participants.length > 0 ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          opacity: participants && participants.length > 0 ? 1 : 0.6
                        }}
                        title={participants && participants.length > 0 ? 'Export for MOF Exam' : 'No participants to export'}
                        onClick={() => {
                          if (participants && participants.length > 0) {
                            handleExportParticipantsForMOF();
                          }
                        }}
                        disabled={!participants || participants.length === 0}
                        onMouseEnter={(e) => {
                          if (participants && participants.length > 0) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                            e.currentTarget.style.borderColor = '#0097A9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#ddd';
                        }}
                      >
                        <i className="fas fa-download" style={{ fontSize: '16px', color: participants && participants.length > 0 ? '#666' : '#999' }}></i>
                      </button>
                    </div>
                  )}

                  {/* 3-dots Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                      title="More Actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(!showActionsMenu);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#0097A9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                      }}
                    >
                      <i className="fas fa-ellipsis-v" style={{ fontSize: '16px', color: '#666' }}></i>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showActionsMenu && (
                      <>
                        {/* Overlay to close menu when clicking outside */}
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                            background: 'transparent'
                          }}
                          onClick={() => setShowActionsMenu(false)}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          minWidth: '200px',
                          zIndex: 1000,
                          overflow: 'hidden'
                        }}>
                          <button
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#333',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              setShowImportModal(true);
                              setShowActionsMenu(false);
                            }}
                          >
                            <i className="fas fa-upload" style={{ width: '16px', color: '#666' }}></i>
                            Import Participants
                          </button>
                          
                          <button
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#333',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              position: 'relative',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              setAddModalActiveTab('normal');
                              setShowAddModal(true);
                              setShowActionsMenu(false);
                            }}
                          >
                            <i className="fas fa-user-plus" style={{ width: '16px', color: '#666' }}></i>
                            Add Participants
                            {isSHINECourse && (
                              <span style={{
                                marginLeft: 'auto',
                                backgroundColor: '#ff6b6b',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '10px',
                                lineHeight: 1.2
                              }}>
                                SHINE
                              </span>
                            )}
                          </button>
                          
                          {isSHINECourse && (
                            <button
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                textAlign: 'left',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: participants && participants.length > 0 ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                color: participants && participants.length > 0 ? '#333' : '#999',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'background-color 0.2s',
                                opacity: participants && participants.length > 0 ? 1 : 0.6
                              }}
                              onMouseEnter={(e) => {
                                if (participants && participants.length > 0) {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }
                              }}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => {
                                if (participants && participants.length > 0) {
                                  handleExportParticipantsForMOF();
                                  setShowActionsMenu(false);
                                }
                              }}
                              disabled={!participants || participants.length === 0}
                              title={participants && participants.length > 0 ? 'Export eligible participants for MOF exam' : 'No participants to export'}
                            >
                              <i className="fas fa-download" style={{ width: '16px', color: '#666' }}></i>
                              Export for MOF Exam
                            </button>
                          )}
                          
                          <div style={{
                            width: '100%',
                            height: '1px',
                            backgroundColor: '#e0e0e0',
                            margin: '4px 0'
                          }} />
                          
                          <button
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: selectedParticipantIds.length > 0 ? 'pointer' : 'not-allowed',
                              fontSize: '14px',
                              color: selectedParticipantIds.length > 0 ? '#e74c3c' : '#999',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background-color 0.2s',
                              opacity: selectedParticipantIds.length > 0 ? 1 : 0.6
                            }}
                            onMouseEnter={(e) => {
                              if (selectedParticipantIds.length > 0) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              if (selectedParticipantIds.length > 0) {
                                handleBulkDelete();
                                setShowActionsMenu(false);
                              }
                            }}
                            disabled={selectedParticipantIds.length === 0}
                            title={selectedParticipantIds.length > 0 ? `Delete ${selectedParticipantIds.length} selected participant(s)` : 'Select participants to delete'}
                          >
                            <i className="fas fa-trash-alt" style={{ width: '16px', color: selectedParticipantIds.length > 0 ? '#e74c3c' : '#999' }}></i>
                            Delete Selected ({selectedParticipantIds.length})
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DataTable
            data={participants}
            isLoading={isLoadingParticipants}
            columns={[
              {
                key: 'select',
                label: (
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && selectedParticipantIds.length === participants.length}
                    onChange={handleSelectAllParticipants}
                    style={{
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px'
                    }}
                  />
                ),
                width: '50px',
                align: 'center',
                freeze: true,
                render: (participant) => (
                  <input
                    type="checkbox"
                    checked={selectedParticipantIds.includes(participant.id)}
                    onChange={() => handleSelectParticipant(participant.id)}
                    style={{
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px'
                    }}
                  />
                )
              },
              {
                key: 'name',
                label: 'Name',
                sortable: true,
                render: (participant) => (
                  <Link 
                    href={`/participants/${participant.id}`}
                    style={{
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      transition: 'text-decoration 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {participant.name}
                  </Link>
                )
              },
              { key: 'id', label: 'Participant ID', sortable: true },
              { key: 'agentCode', label: 'Agent Code', sortable: true },
              { key: 'email', label: 'Email', sortable: true },
              { key: 'phone', label: 'Phone', sortable: true },
              {
                key: 'examType',
                label: 'Exam Type',
                sortable: true,
                render: (participant) => (
                  <span style={{ fontWeight: 500, color: participantExamTypes[participant.id] === 'Re MOF Examination' ? '#f39c12' : '#333' }}>
                    {participantExamTypes[participant.id] || 'Normal'}
                  </span>
                )
              },
              {
                key: 'aolResult',
                label: 'AOL Result',
                render: () => <span className="status-badge status-approved">Passed</span>
              },
              {
                key: 'mofResult',
                label: 'MOF Result',
                render: () => <span className="status-badge status-pending">Pending</span>
              },
              {
                key: 'attendance',
                label: 'Attendance',
                render: () => '85%'
              },
              {
                key: 'finalResult',
                label: 'Final Result',
                render: () => <span className="status-badge status-pending">In Progress</span>
              },
              {
                key: 'actions',
                label: 'Actions',
                width: '60px',
                align: 'center',
                freeze: true,
                render: (participant) => (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemoveParticipant(participant.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      color: '#e74c3c'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Remove Participant"
                  >
                    <i className="fas fa-trash-alt" style={{ fontSize: '16px' }}></i>
                  </button>
                )
              }
            ]}
              emptyMessage="No participants added yet"
            />
            </div>
          )}

      {/* PLANNING TAB */}
          {activeTab === 'planning' && (
            <div className="tab-content-wrapper active">
              <div className="table-container" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Course Planning</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Trainer</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Stage 1</td>
                      <td>01/10/2025</td>
                      <td>09:00 AM - 12:00 PM</td>
                      <td>{course.trainer}</td>
                      <td><a href="#">Edit</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* CHECKLIST TAB */}
          {activeTab === 'checklist' && (
            <div className="tab-content-wrapper active">
              {/* View Toggle */}
              <CourseChecklist courseId={course.id} courseType={course.courseType} />
            </div>
          )}

      {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="tab-content-wrapper active">
              <div className="table-container" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Course History</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Field</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Modified By</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{new Date().toLocaleString()}</td>
                      <td>Created</td>
                      <td>Course</td>
                      <td>-</td>
                      <td>{course.code}</td>
                      <td>{course.createdBy}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* Unified Add Participants Modal with Tabs */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false)
          setParticipantSearchQuery('')
          setReExamSearchQuery('')
          setSelectedParticipants([])
          setSelectedReExamParticipants([])
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
            <div className="modal-header">
              <h3>Add Participants to Course</h3>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false)
                setParticipantSearchQuery('')
                setReExamSearchQuery('')
                setSelectedParticipants([])
                setSelectedReExamParticipants([])
              }}><i className="fas fa-times"></i></button>
            </div>
            
            {/* Tabs Navigation */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '2px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              padding: '0 20px'
            }}>
              <button
                onClick={() => setAddModalActiveTab('normal')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: addModalActiveTab === 'normal' ? 600 : 400,
                  color: addModalActiveTab === 'normal' ? '#2196f3' : '#666',
                  borderBottom: addModalActiveTab === 'normal' ? '3px solid #2196f3' : '3px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fas fa-user-plus" style={{ marginRight: '6px' }}></i>
                Normal Participants
              </button>
              {isSHINECourse && (
                <button
                  onClick={() => setAddModalActiveTab('reexam')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: addModalActiveTab === 'reexam' ? 600 : 400,
                    color: addModalActiveTab === 'reexam' ? '#2196f3' : '#666',
                    borderBottom: addModalActiveTab === 'reexam' ? '3px solid #2196f3' : '3px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <i className="fas fa-redo" style={{ marginRight: '6px' }}></i>
                  Re-Exam Participants
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '10px',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}>
                    SHINE
                  </span>
                </button>
              )}
            </div>

            <div className="modal-body">
              {/* Normal Participants Tab */}
              {addModalActiveTab === 'normal' && (
                <>
                  <div className="search-section" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by Name, AD name, Email, Phone, or Agent code..."
                      value={participantSearchQuery}
                      onChange={(e) => setParticipantSearchQuery(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th><input type="checkbox" onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants(filteredParticipants.map(p => p.id))
                            } else {
                              setSelectedParticipants([])
                            }
                          }} /> Select All</th>
                          <th>Name</th>
                          <th>Agent Code</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                              {participantSearchQuery.trim() 
                                ? 'No participants found matching your search criteria.' 
                                : 'No existing participants available. Use Import feature to create new participants.'}
                            </td>
                          </tr>
                        ) : (
                          filteredParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedParticipants.includes(participant.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedParticipants([...selectedParticipants, participant.id])
                                    } else {
                                      setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id))
                                    }
                                  }}
                                />
                              </td>
                              <td>{participant.name}</td>
                              <td>{participant.agentCode}</td>
                              <td>{participant.email}</td>
                              <td>{participant.phone}</td>
                              <td>{participant.status === 'Active' ? <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i> : ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Re-Exam Participants Tab */}
              {addModalActiveTab === 'reexam' && isSHINECourse && (
                <>
                  <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(0, 175, 245, 0.1)', borderRadius: '4px', fontSize: '13px', color: '#555' }}>
                    <strong>Re-exam Eligibility Requirements:</strong> Participants must meet ALL conditions:
                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                      <li>AOL exams passed <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i></li>
                      <li>Attendance completed <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i></li>
                      <li>Course completed within past 45 days <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i></li>
                      <li>MOF exam not passed <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i></li>
                    </ul>
                  </div>
                  <div className="search-section" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by Name, AD name, Email, Phone, or Agent code..."
                      value={reExamSearchQuery}
                      onChange={(e) => setReExamSearchQuery(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  {filteredReExamParticipants.length > 0 && (
                    <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                      Showing {filteredReExamParticipants.length} eligible re-exam participant{filteredReExamParticipants.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th><input type="checkbox" onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReExamParticipants(filteredReExamParticipants.map(p => p.id))
                            } else {
                              setSelectedReExamParticipants([])
                            }
                          }} /> Select All</th>
                          <th>Name</th>
                          <th>Agent Code</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Eligibility</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReExamParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                              {reExamSearchQuery.trim() 
                                ? 'No eligible re-exam participants found matching your search criteria.' 
                                : 'No eligible re-exam participants found. Participants must meet all re-exam conditions: AOL passed, Attendance completed, Course within 45 days, MOF not passed.'}
                            </td>
                          </tr>
                        ) : (
                          filteredReExamParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedReExamParticipants.includes(participant.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedReExamParticipants([...selectedReExamParticipants, participant.id])
                                    } else {
                                      setSelectedReExamParticipants(selectedReExamParticipants.filter(id => id !== participant.id))
                                    }
                                  }}
                                />
                              </td>
                              <td>{participant.name}</td>
                              <td>{participant.agentCode}</td>
                              <td>{participant.email}</td>
                              <td>{participant.phone}</td>
                              <td>
                                <span style={{ color: '#2ecc71', fontWeight: 500 }}>
                                  <i className="fas fa-check" style={{ marginRight: '4px' }}></i>Eligible
                                </span>
                              </td>
                              <td>{participant.status === 'Active' ? <i className="fas fa-check" style={{ color: 'var(--color-success)' }}></i> : ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <div className="modal-footer-actions">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowAddModal(false)
                    setParticipantSearchQuery('')
                    setReExamSearchQuery('')
                    setSelectedParticipants([])
                    setSelectedReExamParticipants([])
                  }}
                >
                  Cancel
                </button>
                {addModalActiveTab === 'normal' ? (
                  <button 
                    className="btn-primary" 
                    onClick={handleAddParticipants}
                    disabled={selectedParticipants.length === 0}
                  >
                    Add Selected to Course
                  </button>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={handleAddReExamParticipants}
                    disabled={selectedReExamParticipants.length === 0}
                  >
                    Add Selected to Course (Re MOF Examination)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Remove Participant"
        message="Are you sure you want to remove this participant from the course?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmRemoveParticipant}
        onCancel={cancelRemoveParticipant}
        type="danger"
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        title="Delete Selected Participants"
        message={`Are you sure you want to delete ${selectedParticipantIds.length} selected participant(s) from the course? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={cancelBulkDelete}
        type="danger"
      />

      {/* Import Participants Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => {
          if (!isImporting) {
            setShowImportModal(false)
            setImportFile(null)
            setImportResults(null)
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Import Participants to Course</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!isImporting) {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResults(null)
                  }
                }}
                disabled={isImporting}
                style={{ opacity: isImporting ? 0.5 : 1, cursor: isImporting ? 'not-allowed' : 'pointer' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0 }}>
              {isImporting && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  borderRadius: '8px'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '16px' }}></i>
                  <p style={{ fontSize: '16px', color: '#666', fontWeight: 500, margin: 0 }}>
                    Importing participants...
                  </p>
                  <p style={{ fontSize: '14px', color: '#999', marginTop: '8px', margin: 0 }}>
                    Please wait while we process your file
                  </p>
                </div>
              )}
              {!importResults ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 500 }}>
                      Import Rules:
                    </p>
                    {course?.program === 'SHINE Program' && course?.channel === 'Banca' ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <li>Import will <strong>create new participants</strong> if they don't exist</li>
                        <li>Participants that already exist will be rejected</li>
                        <li>Use "Add Participants" function for existing participants</li>
                      </ul>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <li>Only <strong>existing participants</strong> will be added to the course</li>
                        <li>Participants that don't exist will be rejected</li>
                      </ul>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="importFile">Select File (CSV or Excel)</label>
                    <input
                      type="file"
                      id="importFile"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileUpload}
                      disabled={isImporting}
                      style={{ 
                        width: '100%', 
                        maxWidth: '100%',
                        padding: '8px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        cursor: isImporting ? 'not-allowed' : 'pointer',
                        opacity: isImporting ? 0.6 : 1,
                        boxSizing: 'border-box'
                      }}
                    />
                    {importFile && (
                      <p style={{ marginTop: '10px', color: '#666', fontSize: '14px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        Selected: {importFile.name}
                      </p>
                    )}
                  </div>
                  <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px', fontSize: '14px', color: '#856404', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <strong>File Format:</strong> CSV file with columns: Name, Agent Code, Email, Phone, Region, Channel
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '8px 16px', 
                      borderRadius: '4px', 
                      background: importResults.success.length > 0 ? '#d4edda' : '#f8f9fa',
                      color: importResults.success.length > 0 ? '#155724' : '#666',
                      fontWeight: 500
                    }}>
                      Success: {importResults.success.length}
                    </span>
                    <span style={{ 
                      padding: '8px 16px', 
                      borderRadius: '4px', 
                      background: importResults.failed.length > 0 ? '#f8d7da' : '#f8f9fa',
                      color: importResults.failed.length > 0 ? '#721c24' : '#666',
                      fontWeight: 500
                    }}>
                      Failed: {importResults.failed.length}
                    </span>
                  </div>

                  {importResults.success.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '10px', color: '#155724' }}>Successfully Imported ({importResults.success.length})</h4>
                      <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Agent Code</th>
                              <th>Email</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResults.success.map((item, index) => (
                              <tr key={index}>
                                <td>{item.participant.name}</td>
                                <td>{item.participant.agentCode}</td>
                                <td>{item.participant.email || '-'}</td>
                                <td style={{ fontSize: '12px', color: '#155724' }}>{item.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {importResults.failed.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '10px', color: '#721c24' }}>Failed to Import ({importResults.failed.length})</h4>
                      <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Agent Code</th>
                              <th>Email</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResults.failed.map((item, index) => (
                              <tr key={index}>
                                <td>{item.participant.name}</td>
                                <td>{item.participant.agentCode}</td>
                                <td>{item.participant.email || '-'}</td>
                                <td style={{ fontSize: '12px', color: '#721c24' }}>{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!importResults ? (
                <div className="modal-footer-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResults(null)
                    }}
                    disabled={isImporting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleImportParticipants}
                    disabled={!importFile || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Importing...</span>
                      </>
                    ) : (
                      'Import Participants'
                    )}
                  </button>
                </div>
              ) : (
                <div className="modal-footer-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResults(null)
                    }}
                  >
                    Close
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setImportResults(null)
                      setImportFile(null)
                    }}
                  >
                    Import Another File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && course && editPermission && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Edit Course: {course.code}</h3>
              <button className="modal-close" onClick={handleCancelEdit} disabled={isSaving}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0 }}>
              {isSaving && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  borderRadius: '8px'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '16px' }}></i>
                  <p style={{ fontSize: '16px', color: '#666', fontWeight: 500, margin: 0 }}>
                    {editPermission.requiresApproval ? 'Submitting edit request...' : 'Saving changes...'}
                  </p>
                </div>
              )}

              {editPermission.requiresApproval && (
                <div style={{ marginBottom: '20px', padding: '12px', background: '#fff3cd', borderRadius: '4px', fontSize: '14px', color: '#856404' }}>
                  <strong>⚠️ Approval Required:</strong> Your edits will require approval from Head Channel before being applied.
                </div>
              )}

              {editPermission.editableFields && editPermission.editableFields.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '12px', background: '#e7f3ff', borderRadius: '4px', fontSize: '14px', color: '#004085' }}>
                  <strong>ℹ️ Field Restriction:</strong> You can only edit the following field(s): <strong>{editPermission.editableFields.join(', ')}</strong>
                </div>
              )}

              <form className="modal-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Edit Reason - Required */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="editReason">Edit Reason <span className="required-field">*</span></label>
                  <textarea
                    id="editReason"
                    required
                    rows={3}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Please provide a reason for editing this course..."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                {/* Basic Course Fields */}
                <div className="form-group">
                  <label htmlFor="editCourseName">Course Name <span className="required-field">*</span></label>
                  <input
                    type="text"
                    id="editCourseName"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('name'))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editProgram">Program</label>
                  <select
                    id="editProgram"
                    value={editFormData.program || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('program'))}
                  >
                    <option value="">Select Program</option>
                    <option value="SHINE Program">SHINE Program</option>
                    <option value="Product Program">Product Program</option>
                    <option value="Skill Program">Skill Program</option>
                  </select>
                </div>

                {/* Partner and Branch */}
                {(!editPermission.editableFields || editPermission.editableFields.includes('partner')) && (
                  <MultiSelect
                    id="editPartner"
                    label="Partner"
                    options={partners}
                    selectedValues={editFormData.partner || []}
                    onChange={(selected) => setEditFormData({ ...editFormData, partner: selected })}
                    placeholder="Select Partner"
                    size={3}
                    disabled={isSaving}
                  />
                )}
                {(!editPermission.editableFields || editPermission.editableFields.includes('branch')) && (
                  <MultiSelect
                    id="editBranch"
                    label="Branch"
                    options={branches}
                    selectedValues={Array.isArray(editFormData.branch) ? editFormData.branch : editFormData.branch ? [editFormData.branch] : []}
                    onChange={(selected) => setEditFormData({ ...editFormData, branch: selected })}
                    placeholder="Select Branch"
                    size={3}
                    disabled={isSaving}
                  />
                )}

                <div className="form-group">
                  <label htmlFor="editPrimaryTrainer">Primary Trainer</label>
                  <select
                    id="editPrimaryTrainer"
                    value={editFormData.primaryTrainer || editFormData.trainer || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, primaryTrainer: e.target.value, trainer: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('primaryTrainer'))}
                  >
                    <option value="">Select Primary Trainer</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.fullName}>{t.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editCoTrainer">Co-Trainer</label>
                  <select
                    id="editCoTrainer"
                    value={editFormData.coTrainer || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, coTrainer: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('coTrainer'))}
                  >
                    <option value="">Select Co-Trainer</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.fullName}>{t.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editChannel">Channel <span className="required-field">*</span></label>
                  <select
                    id="editChannel"
                    required
                    value={editFormData.channel || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, channel: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('channel'))}
                  >
                    <option value="">Select Channel</option>
                    <option value="Agent">Agent</option>
                    <option value="Banca FSC">Banca FSC</option>
                    <option value="Banker">Banker</option>
                    <option value="IFA">IFA</option>
                    <option value="Banca">Banca</option>
                    <option value="Agency">Agency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editRegion">Region <span className="required-field">*</span></label>
                  <select
                    id="editRegion"
                    required
                    value={editFormData.region || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('region'))}
                  >
                    <option value="">Select Region</option>
                    <option value="Central">Central</option>
                    <option value="Middle">Middle</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="Nationwide">Nationwide</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editVenueAddress">Venue Address <span className="required-field">*</span></label>
                  <input
                    type="text"
                    id="editVenueAddress"
                    required
                    value={editFormData.venueAddress || editFormData.venue || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, venueAddress: e.target.value, venue: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('venueAddress'))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editArea">Area <span className="required-field">*</span></label>
                  <select
                    id="editArea"
                    required
                    value={editFormData.area || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('area'))}
                  >
                    <option value="">Select Area</option>
                    {areas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editProvince">Province <span className="required-field">*</span></label>
                  <select
                    id="editProvince"
                    required
                    value={editFormData.province || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('province'))}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editStartDate">Start Date <span className="required-field">*</span></label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="date"
                      id="editStartDate"
                      required
                      value={editFormData.startDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('startDate'))}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', margin: 0 }}>
                      <input
                        type="radio"
                        name="editStartTimePeriod"
                        checked={(editFormData.startTimePeriod || 'AM') === 'AM'}
                        onChange={() => setEditFormData({ ...editFormData, startTimePeriod: 'AM' })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('startTimePeriod'))}
                      />
                      <span>AM</span>
                    </label>
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', margin: 0 }}>
                      <input
                        type="radio"
                        name="editStartTimePeriod"
                        checked={(editFormData.startTimePeriod || 'AM') === 'PM'}
                        onChange={() => setEditFormData({ ...editFormData, startTimePeriod: 'PM' })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('startTimePeriod'))}
                      />
                      <span>PM</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editEndDate">End Date <span className="required-field">*</span></label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="date"
                      id="editEndDate"
                      required
                      value={editFormData.endDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('endDate'))}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', margin: 0 }}>
                      <input
                        type="radio"
                        name="editEndTimePeriod"
                        checked={(editFormData.endTimePeriod || 'AM') === 'AM'}
                        onChange={() => setEditFormData({ ...editFormData, endTimePeriod: 'AM' })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('endTimePeriod'))}
                      />
                      <span>AM</span>
                    </label>
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', margin: 0 }}>
                      <input
                        type="radio"
                        name="editEndTimePeriod"
                        checked={(editFormData.endTimePeriod || 'AM') === 'PM'}
                        onChange={() => setEditFormData({ ...editFormData, endTimePeriod: 'PM' })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('endTimePeriod'))}
                      />
                      <span>PM</span>
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="editDescription">Description</label>
                  <textarea
                    id="editDescription"
                    rows={4}
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('description'))}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                {/* AOL Information Section - Only show if not restricted or AOL fields are allowed */}
                {(!editPermission.editableFields || 
                  editPermission.editableFields.some(f => f.includes('aol') || f.includes('AOL'))) && (
                  <>
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
                      <label style={{ fontWeight: 600 }}>AOL Information</label>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editAolStartTime">AOL Start Time</label>
                      <input
                        type="datetime-local"
                        id="editAolStartTime"
                        value={editFormData.aolStartTime ? new Date(editFormData.aolStartTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, aolStartTime: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('aolStartTime'))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editAolEndTime">AOL End Time</label>
                      <input
                        type="datetime-local"
                        id="editAolEndTime"
                        value={editFormData.aolEndTime ? new Date(editFormData.aolEndTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, aolEndTime: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('aolEndTime'))}
                      />
                    </div>
                    {(!editPermission.editableFields || editPermission.editableFields.includes('aolExamId')) && (
                      <MultiSelect
                        id="editAolExamId"
                        label="AOL Exam ID"
                        options={aolExamCodes}
                        selectedValues={editFormData.aolExamId || []}
                        onChange={(selected) => setEditFormData({ ...editFormData, aolExamId: selected })}
                        placeholder="Select AOL Exam ID"
                        size={3}
                        disabled={isSaving}
                      />
                    )}
                  </>
                )}

                {/* MOF Fields - Only for SHINE courses and if not restricted */}
                {course.program === 'SHINE Program' && (!editPermission.editableFields || editPermission.editableFields.includes('mofCourseName')) && (
                  <>
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
                      <label style={{ fontWeight: 600 }}>MOF Information</label>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMofCourseName">MOF Course Name <span className="required-field">*</span></label>
                      <input
                        type="text"
                        id="editMofCourseName"
                        required
                        value={editFormData.mofCourseName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mofCourseName: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('mofCourseName'))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="editExamType">Exam Type <span className="required-field">*</span></label>
                      <select
                        id="editExamType"
                        required
                        value={editFormData.examType || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, examType: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('examType'))}
                      >
                        <option value="">Select Exam Type</option>
                        <option value="Trực tuyến tại doanh nghiệp">Trực tuyến tại doanh nghiệp</option>
                        <option value="Trực tuyến tại VIDI">Trực tuyến tại VIDI</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="editMofExamTime">MOF Exam Time <span className="required-field">*</span></label>
                      <input
                        type="datetime-local"
                        id="editMofExamTime"
                        required
                        value={editFormData.mofExamTime ? new Date(editFormData.mofExamTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mofExamTime: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('mofExamTime'))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="editMofAddress">MOF Address <span className="required-field">*</span></label>
                      <input
                        type="text"
                        id="editMofAddress"
                        required
                        value={editFormData.mofAddress || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mofAddress: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('mofAddress'))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="editMofProvince">MOF Province <span className="required-field">*</span></label>
                      <select
                        id="editMofProvince"
                        required
                        value={editFormData.mofProvince || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mofProvince: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('mofProvince'))}
                      >
                        <option value="">Select MOF Province</option>
                        {provinces.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="editWard">Ward <span className="required-field">*</span></label>
                      <input
                        type="text"
                        id="editWard"
                        required
                        value={editFormData.ward || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, ward: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('ward'))}
                      />
                      <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Note: District level abolished in Vietnam admin reform (July 2025)
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="editExamCategory">Exam Categories <span className="required-field">*</span></label>
                      <select
                        id="editExamCategory"
                        required
                        value={editFormData.examCategory || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, examCategory: e.target.value })}
                        disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('examCategory'))}
                      >
                        <option value="">Select Exam Category</option>
                        <option value="Nhân viên tư vấn bảo hiểm">Nhân viên tư vấn bảo hiểm</option>
                        <option value="Nhân viên NH">Nhân viên NH</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Is Proctor Trainer</label>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                        <label style={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="editIsProctorTrainer"
                            checked={editFormData.isProctorTrainer === true}
                            onChange={() => setEditFormData({ ...editFormData, isProctorTrainer: true, proctorName: undefined, proctorPhone: undefined })}
                            disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('isProctorTrainer'))}
                          />
                          <span>Yes</span>
                        </label>
                        <label style={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="editIsProctorTrainer"
                            checked={editFormData.isProctorTrainer === false}
                            onChange={() => setEditFormData({ ...editFormData, isProctorTrainer: false, proctorTrainer: undefined })}
                            disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('isProctorTrainer'))}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {editFormData.isProctorTrainer && (
                      <div className="form-group">
                        <label htmlFor="editProctorTrainer">Proctor Trainer</label>
                        <select
                          id="editProctorTrainer"
                          value={editFormData.proctorTrainer || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, proctorTrainer: e.target.value })}
                          disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('proctorTrainer'))}
                        >
                          <option value="">Select Proctor Trainer</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.fullName}>{t.fullName}</option>
                    ))}
                        </select>
                      </div>
                    )}

                    {!editFormData.isProctorTrainer && (
                      <>
                        <div className="form-group">
                          <label htmlFor="editProctorName">Proctor Name</label>
                          <input
                            type="text"
                            id="editProctorName"
                            value={editFormData.proctorName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, proctorName: e.target.value })}
                            disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('proctorName'))}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="editProctorPhone">Proctor Phone</label>
                          <input
                            type="text"
                            id="editProctorPhone"
                            value={editFormData.proctorPhone || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, proctorPhone: e.target.value })}
                            disabled={isSaving || (editPermission.editableFields && !editPermission.editableFields.includes('proctorPhone'))}
                          />
                        </div>
                      </>
                    )}

                    {(!editPermission.editableFields || editPermission.editableFields.includes('supporter')) && (
                      <MultiSelect
                        id="editSupporter"
                        label="Supporter"
                        options={[]}
                        selectedValues={editFormData.supporter || []}
                        onChange={(selected) => setEditFormData({ ...editFormData, supporter: selected })}
                        placeholder="Select Supporter"
                        size={3}
                        disabled={isSaving}
                      />
                    )}
                  </>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-actions">
                <button 
                  className="btn-secondary" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editReason.trim()}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      {editPermission.requiresApproval ? 'Submitting...' : 'Saving...'}
                    </>
                  ) : (
                    editPermission.requiresApproval ? 'Submit for Approval' : 'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Course Modal */}
      <CourseRegistrationModal
        course={course}
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          setShowRegisterModal(false)
          loadCourseDetails()
        }}
      />

      {/* Approve Registration Modal */}
      {showApproveRegistrationModal && (
        <div className="modal-overlay" onClick={() => setShowApproveRegistrationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Registration</h3>
              <button className="modal-close" onClick={() => setShowApproveRegistrationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve the registration for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Note (Optional):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Add approval note..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApproveRegistrationModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApproveRegistration} style={{ backgroundColor: '#4caf50' }}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Registration Modal */}
      {showRejectRegistrationModal && (
        <div className="modal-overlay" onClick={() => setShowRejectRegistrationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Registration</h3>
              <button className="modal-close" onClick={() => setShowRejectRegistrationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject the registration for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Reason (Required):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectRegistrationModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRejectRegistration} style={{ backgroundColor: '#f44336' }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Edit Modal */}
      {showApproveEditModal && (
        <div className="modal-overlay" onClick={() => setShowApproveEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Edit Request</h3>
              <button className="modal-close" onClick={() => setShowApproveEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve the edit request for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Note (Optional):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Add approval note..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApproveEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApproveEdit} style={{ backgroundColor: '#4caf50' }}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Edit Modal */}
      {showRejectEditModal && (
        <div className="modal-overlay" onClick={() => setShowRejectEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Edit Request</h3>
              <button className="modal-close" onClick={() => setShowRejectEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject the edit request for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Reason (Required):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRejectEdit} style={{ backgroundColor: '#f44336' }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Course Cancellation</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Submit a request to cancel course <strong>{course.code}</strong>.</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Reason (Required):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCancelRequest} style={{ backgroundColor: '#ff9800' }}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Cancel Modal */}
      {showApproveCancelModal && (
        <div className="modal-overlay" onClick={() => setShowApproveCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Cancellation</h3>
              <button className="modal-close" onClick={() => setShowApproveCancelModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve the cancellation for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Note (Optional):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Add approval note..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApproveCancelModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApproveCancel} style={{ backgroundColor: '#4caf50' }}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Cancel Modal */}
      {showRejectCancelModal && (
        <div className="modal-overlay" onClick={() => setShowRejectCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Cancellation</h3>
              <button className="modal-close" onClick={() => setShowRejectCancelModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject the cancellation for course <strong>{course.code}</strong>?</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Reason (Required):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectCancelModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRejectCancel} style={{ backgroundColor: '#f44336' }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Course Modal */}
      {showFinishModal && (
        <div className="modal-overlay" onClick={() => setShowFinishModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Finish Course</h3>
              <button className="modal-close" onClick={() => setShowFinishModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Mark course <strong>{course.code}</strong> as finished.</p>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Note (Optional):
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Add completion note..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFinishModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleFinishCourse} style={{ backgroundColor: '#9c27b0' }}>
                Finish Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Course</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#f44336', fontWeight: 600 }}>
                Warning: This action cannot be undone!
              </p>
              <p>Are you sure you want to delete course <strong>{course.code}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleDeleteCourse} style={{ backgroundColor: '#f44336' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

