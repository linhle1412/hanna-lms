'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { courseChecklistAPI, courseAPI, participantAPI } from '@/lib/api'
import type { CourseChecklistInstance, CourseChecklistStepInstance, Course, Participant } from '@/lib/state'
import { getCurrentUserRole, getUserRoles } from '@/lib/auth-utils'
import EnterMOFExamCodeModal from './EnterMOFExamCodeModal'
import AddCustomActionModal from './AddCustomActionModal'
import MarkDoneModal from './MarkDoneModal'
import ConfirmPassedParticipantsModal from './ConfirmPassedParticipantsModal'
import ImportMOFResultModal from './ImportMOFResultModal'
import { exportParticipantsForMOF, isEligibleForMOF } from '@/lib/export-utils'
import { getStatusDefinitionLogic } from '@/lib/checklist-status-definitions'

interface CourseChecklistTableViewProps {
  courseId: number
  courseType?: string
}

// Helper function to check if step supports manual confirmation
// This includes steps like "Verify AOL information" and "Verify MOF information"
// which have actionType: 'confirm' or statusDefinitionLogic type: 'manual_confirm'
const supportsManualConfirm = (step: CourseChecklistStepInstance): boolean => {
  // Check if actionType is 'confirm' (e.g., "Verify AOL information", "Verify MOF information")
  if (step.actionType === 'confirm') return true
  
  // Check status definition logic for manual_confirm type
  const logic = getStatusDefinitionLogic(step.name, step.statusDefinitionLogic)
  if (logic?.type === 'manual_confirm') return true
  
  return false
}

// Helper function to check if step should hide action button (use checkbox only)
// For "Verify AOL information" and "Verify MOF information", we only show checkbox, not the Confirm button
const shouldHideActionButton = (step: CourseChecklistStepInstance): boolean => {
  const stepName = step.name.toLowerCase()
  return (
    stepName.includes('verify aol information') ||
    stepName.includes('verify mof information') ||
    stepName.includes('approve course')
  )
}

// Helper function to check if step should hide mark as completed checkbox
// Only show checkbox for "Verify AOL information" and "Verify MOF information"
const shouldHideMarkAsCompleted = (step: CourseChecklistStepInstance): boolean => {
  const stepName = step.name.toLowerCase()
  const isVerifyAOL = stepName.includes('verify aol information')
  const isVerifyMOF = stepName.includes('verify mof information')
  // Hide checkbox for all steps except Verify AOL and Verify MOF
  return !isVerifyAOL && !isVerifyMOF
}

// Helper function to check if step should have disabled (greyed out) mark as completed checkbox
const shouldDisableMarkAsCompleted = (step: CourseChecklistStepInstance): boolean => {
  const stepName = step.name.toLowerCase()
  return (
    stepName.includes('confirm passed participants') ||
    stepName.includes('finish course')
  )
}

// Helper function to check if step needs a progress bar
const needsProgressBar = (step: CourseChecklistStepInstance): boolean => {
  const logic = getStatusDefinitionLogic(step.name, step.statusDefinitionLogic)
  return logic?.type === 'percentage_calculation'
}

// Helper function to calculate step progress percentage
const calculateStepProgress = (step: CourseChecklistStepInstance, course: Course | null, participants: Participant[]): number | null => {
  if (!course || step.status === 'done') return null
  
  const logic = getStatusDefinitionLogic(step.name, step.statusDefinitionLogic)
  if (logic?.type !== 'percentage_calculation' || !logic.percentageCalculation) {
    return null
  }

  try {
    // Evaluate numerator
    let numerator = 0
    const numExpr = logic.percentageCalculation.numerator
    if (numExpr === 'participantIds.length' || numExpr === 'participantIds?.length') {
      numerator = course.participantIds?.length || 0
    } else if (numExpr === 'participantsWithAttendance.length' || numExpr === 'participantsWithAttendance?.length') {
      // Count participants with attendance data (placeholder - would need actual attendance data)
      // For now, assume all participants have attendance if they exist
      numerator = participants.length > 0 ? participants.length : 0
    } else if (numExpr === 'participantsWithAOLResults.length' || numExpr === 'participantsWithAOLResults?.length') {
      // Count participants with AOL exam results
      // For now, check if participant has any AOL-related data or assume all have results if participants exist
      // In production, this would check actual AOL result data
      numerator = participants.length > 0 ? participants.length : 0
    } else {
      const numMatch = numExpr.match(/^(\d+)$/)
      if (numMatch) {
        numerator = parseInt(numMatch[1], 10)
      }
    }

    // Evaluate denominator
    let denominator = 0
    const denomExpr = logic.percentageCalculation.denominator
    if (denomExpr === 'participantIds.length' || denomExpr === 'participantIds?.length') {
      denominator = course.participantIds?.length || 1
    } else if (denomExpr === 'participantsWithAttendance.length' || denomExpr === 'participantsWithAttendance?.length') {
      denominator = participants.length || 1
    } else {
      const denomMatch = denomExpr.match(/^(\d+)$/)
      if (denomMatch) {
        denominator = parseInt(denomMatch[1], 10)
      } else {
        // Default to 50 for "Add participants" step
        denominator = 50
      }
    }

    if (denominator === 0) return null
    
    const percentage = Math.min(100, Math.max(0, Math.round((numerator / denominator) * 100)))
    return percentage
  } catch (error) {
    console.error('Error calculating step progress:', error)
    return null
  }
}

const STATUS_ICONS = {
  done: '✅',
  pending: '⏳',
  overdue: '🔴',
  not_started: '⚪',
  not_applicable: '⚫'
}

const STATUS_LABELS = {
  done: 'Done',
  pending: 'Pending',
  inprogress: 'In Progress',
  overdue: 'Overdue',
  not_started: 'Not Started',
  not_applicable: 'Not Applicable'
}

const STATUS_COLORS = {
  done: { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
  pending: { bg: '#fff3e0', text: '#e65100', border: '#ff9800' },
  inprogress: { bg: '#e3f2fd', text: '#1976d2', border: '#2196f3' },
  overdue: { bg: '#ffebee', text: '#c62828', border: '#f44336' },
  not_started: { bg: '#f5f5f5', text: '#616161', border: '#9e9e9e' },
  not_applicable: { bg: '#eceff1', text: '#455a64', border: '#78909c' }
}

const ACTION_BUTTONS = {
  confirm: { label: 'Confirm', icon: '✓', className: 'btn-primary' },
  approve: { label: 'Approve', icon: '✓', className: 'btn-primary' },
  export: { label: 'Export', icon: 'fas fa-download', className: 'btn-secondary' },
  import: { label: 'Import', icon: 'fas fa-upload', className: 'btn-secondary' },
  enter_data: { label: 'Enter Data', icon: '', className: 'btn-primary' },
  finish: { label: 'Finish', icon: '', className: 'btn-primary' },
  none: null
}

export default function CourseChecklistTableView({ courseId, courseType }: CourseChecklistTableViewProps) {
  const { showToast } = useToast()
  const [checklist, setChecklist] = useState<CourseChecklistInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStep, setUpdatingStep] = useState<number | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [showMOFModal, setShowMOFModal] = useState(false)
  const [showCustomActionModal, setShowCustomActionModal] = useState(false)
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false)
  const [showConfirmPassedModal, setShowConfirmPassedModal] = useState(false)
  const [showImportMOFModal, setShowImportMOFModal] = useState(false)
  const [selectedStepForMarkDone, setSelectedStepForMarkDone] = useState<CourseChecklistStepInstance | null>(null)
  const [selectedStepForAction, setSelectedStepForAction] = useState<CourseChecklistStepInstance | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [picFilter, setPicFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'order' | 'status' | 'pic' | 'completedAt'>('order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadChecklist()
    loadCourseData()
  }, [courseId])

  // Auto-mark steps as done when percentage reaches 100%
  useEffect(() => {
    if (!checklist || !course || participants.length === 0) return

    const autoMarkDone = async () => {
      for (const step of checklist.steps) {
        // Skip if already done or not applicable
        if (step.status === 'done' || step.status === 'not_applicable') continue
        
        // Check if step needs progress bar and calculate percentage
        if (needsProgressBar(step)) {
          const stepProgress = calculateStepProgress(step, course, participants)
          if (stepProgress !== null && stepProgress >= 100) {
            try {
              await courseChecklistAPI.updateStep(courseId, step.stepId, {
                status: 'done',
                completedBy: 'System',
                notes: `Automatically marked as done when percentage reached 100% (${stepProgress}%)`
              })
              // Reload checklist to reflect the change
              await loadChecklist()
            } catch (error) {
              console.error(`Error auto-marking step ${step.stepId} as done:`, error)
            }
          }
        }
      }
    }

    autoMarkDone()
  }, [checklist, course, participants, courseId])

  const loadChecklist = async () => {
    try {
      setLoading(true)
      const data = await courseChecklistAPI.getByCourseId(courseId)
      setChecklist(data)
    } catch (error) {
      console.error('Error loading checklist:', error)
      showToast('Failed to load checklist', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseData = async () => {
    try {
      const courseData = await courseAPI.getById(courseId)
      setCourse(courseData)
      
      // Load participants if course has participantIds
      if (courseData.participantIds && courseData.participantIds.length > 0) {
        const allParticipants = await participantAPI.getAll()
        const courseParticipants = allParticipants.filter(p => 
          courseData.participantIds.includes(p.id)
        )
        setParticipants(courseParticipants)
      } else {
        setParticipants([])
      }
    } catch (error) {
      console.error('Error loading course data:', error)
    }
  }

  const handleStepAction = async (step: CourseChecklistStepInstance, action: 'mark_done' | 'mark_pending') => {
    if (updatingStep === step.stepId) return

    try {
      setUpdatingStep(step.stepId)
      const userRole = getCurrentUserRole()
      const newStatus = action === 'mark_done' ? 'done' : 'pending'

      await courseChecklistAPI.updateStep(courseId, step.stepId, {
        status: newStatus,
        completedBy: userRole || 'System'
      })

      showToast(`Step "${step.name}" marked as ${STATUS_LABELS[newStatus]}`, 'success')
      await loadChecklist()
    } catch (error) {
      console.error('Error updating step:', error)
      showToast('Failed to update step', 'error')
    } finally {
      setUpdatingStep(null)
    }
  }

  const handleActionButton = async (step: CourseChecklistStepInstance) => {
    console.log('handleActionButton called:', { stepName: step.name, actionType: step.actionType })
    switch (step.actionType) {
      case 'confirm':
        // Check if this is the "Confirm passed participants" step
        const isConfirmPassed = step.name.toLowerCase().includes('confirm passed participants') || 
                                step.name.toLowerCase().includes('confirm passed')
        console.log('Confirm step check:', { stepName: step.name, isConfirmPassed })
        if (isConfirmPassed) {
          try {
            const courseData = await courseAPI.getById(courseId)
            setCourse(courseData)
            setSelectedStepForAction(step)
            setShowConfirmPassedModal(true)
          } catch (error) {
            console.error('Error loading course:', error)
            showToast('Failed to load course information', 'error')
          }
        } else {
          // For other confirm actions, just mark as done
          await handleStepAction(step, 'mark_done')
        }
        break
      case 'approve':
        await handleStepAction(step, 'mark_done')
        break
      case 'export':
        // Check if this is the "Export Participants for MOF exam" step
        if (step.name.toLowerCase().includes('export participants for mof')) {
          await handleExportParticipantsForMOF(step)
        } else {
          showToast('Export functionality will be implemented', 'info')
        }
        break
      case 'import':
        // Check if this is the "Import MOF result" step
        const isImportMOF = step.name.toLowerCase().includes('import mof result') ||
                           step.name.toLowerCase().includes('import mof')
        console.log('Import step check:', { stepName: step.name, isImportMOF })
        if (isImportMOF) {
          try {
            const courseData = await courseAPI.getById(courseId)
            setCourse(courseData)
            setSelectedStepForAction(step)
            setShowImportMOFModal(true)
          } catch (error) {
            console.error('Error loading course:', error)
            showToast('Failed to load course information', 'error')
          }
        } else {
          showToast('Import functionality will be implemented', 'info')
        }
        break
      case 'enter_data':
        // Check if this is the "Enter MOF exam code" step
        if (step.name.toLowerCase().includes('mof exam code')) {
          // Load course data and show MOF exam code modal
          try {
            const courseData = await courseAPI.getById(courseId)
            setCourse(courseData)
            setShowMOFModal(true)
          } catch (error) {
            console.error('Error loading course:', error)
            showToast('Failed to load course information', 'error')
          }
        } else {
          showToast('Enter Data functionality will be implemented', 'info')
        }
        break
      case 'finish':
        await handleStepAction(step, 'mark_done')
        break
      default:
        break
    }
  }

  const handleExportParticipantsForMOF = async (step: CourseChecklistStepInstance) => {
    try {
      // Load course data
      const courseData = await courseAPI.getById(courseId)
      
      // Check if course is SHINE type
      if (courseData.courseType?.toLowerCase() !== 'shine') {
        showToast('MOF export is only available for SHINE courses', 'warning')
        return
      }

      // Check if course has participants
      if (!courseData.participantIds || courseData.participantIds.length === 0) {
        showToast('No participants found in this course', 'warning')
        return
      }

      // Load all participants
      const allParticipants = await participantAPI.getAll()
      
      // Get course participants
      const courseParticipants = allParticipants.filter(p => 
        courseData.participantIds.includes(p.id)
      )

      if (courseParticipants.length === 0) {
        showToast('No participants found in this course', 'warning')
        return
      }

      // Filter eligible participants (passed AOL, full attendance)
      // For now, we'll export all participants. In production, filter by eligibility
      const eligibleParticipants = courseParticipants.filter(p => 
        isEligibleForMOF(p, courseData)
      )

      if (eligibleParticipants.length === 0) {
        showToast('No eligible participants found. Participants must pass AOL exams and have full attendance.', 'warning')
        return
      }

      // Export to CSV
      exportParticipantsForMOF(eligibleParticipants, courseData, eligibleParticipants.map(p => p.id))
      
      showToast(`Exported ${eligibleParticipants.length} participant(s) for MOF exam`, 'success')
      
      // Mark step as done
      await handleStepAction(step, 'mark_done')
    } catch (error) {
      console.error('Error exporting participants for MOF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to export participants for MOF exam'
      showToast(errorMessage, 'error')
    }
  }

  const handleMOFCodeSuccess = async () => {
    // Reload course data to get updated mofExamCode
    try {
      const updatedCourse = await courseAPI.getById(courseId)
      setCourse(updatedCourse)
      
      // Reload checklist
      await loadChecklist()
      
      // Find the "Enter MOF exam code" step and mark it as done if course has mofExamCode
      if (updatedCourse.mofExamCode) {
        // Small delay to ensure checklist is loaded
        setTimeout(async () => {
          const currentChecklist = await courseChecklistAPI.getByCourseId(courseId)
          const mofStep = currentChecklist.steps.find(s => s.name.toLowerCase().includes('mof exam code'))
          if (mofStep && mofStep.status !== 'done') {
            await handleStepAction(mofStep, 'mark_done')
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error reloading course:', error)
    }
  }

  const canPerformAction = (step: CourseChecklistStepInstance): boolean => {
    const userRole = getCurrentUserRole()
    if (!userRole) {
      console.log('canPerformAction: No user role found')
      return false
    }
    
    // TEST ROLE: Bypass all permission checks for testing purposes
    if (userRole === 'Test Role') {
      console.log('canPerformAction: Test Role - allowing action')
      return true
    }
    
    // Check if user role matches PIC or is admin
    const isPIC = step.pic.toUpperCase() === userRole.toUpperCase()
    const isAdmin = ['Admin', 'Master Role', 'Root Admin'].includes(userRole)
    
    console.log('canPerformAction:', { 
      userRole, 
      stepPIC: step.pic, 
      isPIC, 
      isAdmin, 
      result: isPIC || isAdmin 
    })
    
    return isPIC || isAdmin
  }

  const isAdmin = (): boolean => {
    const roles = getUserRoles()
    const userRole = getCurrentUserRole()
    return roles.some(r => ['admin', 'master_role', 'root_admin'].includes(r.toLowerCase())) ||
           ['Admin', 'Master Role', 'Root Admin', 'Test Role'].includes(userRole)
  }

  const handleAddCustomAction = async (action: {
    name: string
    description?: string
    pic: string
    reminderTiming?: any
    reminderRecipients?: any[]
  }) => {
    try {
      await courseChecklistAPI.addCustomAction(courseId, action)
      showToast('Custom action added successfully', 'success')
      await loadChecklist()
    } catch (error) {
      console.error('Error adding custom action:', error)
      showToast('Failed to add custom action', 'error')
      throw error
    }
  }

  const handleDeleteCustomAction = async (stepId: number) => {
    if (!confirm('Are you sure you want to delete this custom action?')) return

    try {
      await courseChecklistAPI.deleteCustomAction(courseId, stepId)
      showToast('Custom action deleted successfully', 'success')
      await loadChecklist()
    } catch (error) {
      console.error('Error deleting custom action:', error)
      showToast('Failed to delete custom action', 'error')
    }
  }

  const handleMarkDoneClick = (step: CourseChecklistStepInstance) => {
    setSelectedStepForMarkDone(step)
    setShowMarkDoneModal(true)
  }

  const handleConfirmMarkDone = async (reason: string, notes?: string) => {
    if (!selectedStepForMarkDone) return

    try {
      setUpdatingStep(selectedStepForMarkDone.stepId)
      const userRole = getCurrentUserRole()

      await courseChecklistAPI.updateStep(courseId, selectedStepForMarkDone.stepId, {
        status: 'done',
        completedBy: userRole || 'Admin',
        manualMarkDoneReason: reason,
        notes
      })

      showToast(`Step "${selectedStepForMarkDone.name}" marked as done`, 'success')
      await loadChecklist()
      setShowMarkDoneModal(false)
      setSelectedStepForMarkDone(null)
    } catch (error) {
      console.error('Error marking step as done:', error)
      showToast('Failed to mark step as done', 'error')
    } finally {
      setUpdatingStep(null)
    }
  }

  // Calculate progress
  const progress = useMemo(() => {
    if (!checklist) return { completed: 0, total: 0, percentage: 0 }
    
    const total = checklist.steps.length
    const completed = checklist.steps.filter(s => s.status === 'done').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { completed, total, percentage }
  }, [checklist])

  // Get unique PICs for filter
  const uniquePICs = useMemo(() => {
    if (!checklist) return []
    return Array.from(new Set(checklist.steps.map(s => s.pic))).sort()
  }, [checklist])

  // Filter and sort steps
  const filteredAndSortedSteps = useMemo(() => {
    if (!checklist) return []

    let filtered = [...checklist.steps]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // Apply PIC filter
    if (picFilter !== 'all') {
      filtered = filtered.filter(s => s.pic === picFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.pic.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'order':
          aVal = a.order
          bVal = b.order
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'pic':
          aVal = a.pic
          bVal = b.pic
          break
        case 'completedAt':
          aVal = a.completedAt ? new Date(a.completedAt).getTime() : 0
          bVal = b.completedAt ? new Date(b.completedAt).getTime() : 0
          break
        default:
          aVal = a.order
          bVal = b.order
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [checklist, statusFilter, picFilter, searchQuery, sortBy, sortOrder])

  // Status statistics
  const statusStats = useMemo(() => {
    if (!checklist) return {}
    const stats: Record<string, number> = {}
    checklist.steps.forEach(step => {
      stats[step.status] = (stats[step.status] || 0) + 1
    })
    return stats
  }, [checklist])

  const handleSort = (column: 'order' | 'status' | 'pic' | 'completedAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#666' }}></i>
        <p style={{ marginTop: '12px', color: '#666' }}>Loading checklist...</p>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <p>No checklist found for this course.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Course Checklist</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdmin() && (
              <button
                onClick={() => {
                  // Load course data for modal
                  courseAPI.getById(courseId).then(setCourse).catch(console.error)
                  setShowCustomActionModal(true)
                }}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-plus"></i>
                Add Custom Action
              </button>
            )}
            <span style={{ 
              fontSize: '14px', 
              color: '#666',
              backgroundColor: '#f5f5f5',
              padding: '6px 12px',
              borderRadius: '4px'
            }}>
              Template: {checklist.templateName}
            </span>
          </div>
        </div>

        {/* Progress Bar and Stats */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
              Progress: {progress.completed} of {progress.total} steps completed
            </span>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>
              {progress.percentage}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              backgroundColor: progress.percentage === 100 ? '#4caf50' : '#2196f3',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {progress.percentage > 0 && `${progress.percentage}%`}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap',
            fontSize: '13px'
          }}>
            {Object.entries(statusStats).map(([status, count]) => (
              <span 
                key={status}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.bg || '#f5f5f5',
                  color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.text || '#666',
                  border: `1px solid ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.border || '#ddd'}`,
                  fontWeight: 500
                }}
              >
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}></i>
              <input
                type="text"
                placeholder="Search steps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* PIC Filter */}
          <select
            value={picFilter}
            onChange={(e) => setPicFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All PICs</option>
            {uniquePICs.map(pic => (
              <option key={pic} value={pic}>{pic}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || picFilter !== 'all' || searchQuery) && (
            <button
              className="btn-secondary"
              onClick={() => {
                setStatusFilter('all')
                setPicFilter('all')
                setSearchQuery('')
              }}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleSort('order')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Step #
                  {sortBy === 'order' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666'
              }}>
                Step Name
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleSort('status')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Status
                  {sortBy === 'status' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleSort('pic')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  PIC
                  {sortBy === 'pic' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleSort('completedAt')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Completed Date
                  {sortBy === 'completedAt' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </div>
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666'
              }}>
                Completed By
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'center', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                width: '100px'
              }}>
                Mark as Completed
              </th>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'center', 
                fontWeight: 600,
                fontSize: '13px',
                color: '#666',
                width: '200px'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedSteps.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No steps found matching your filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedSteps.map((step, index) => {
                const canAction = canPerformAction(step)
                const actionBtn = ACTION_BUTTONS[step.actionType]
                const isUpdating = updatingStep === step.stepId
                const isExpanded = expandedRow === step.stepId
                
                // Check if step has percentage > 0 to show "inprogress" status, or 100% to show "done"
                const stepProgress = needsProgressBar(step) ? calculateStepProgress(step, course, participants) : null
                let displayStatus = step.status
                if (stepProgress !== null) {
                  if (stepProgress >= 100) {
                    displayStatus = 'done'
                  } else if (stepProgress > 0 && step.status !== 'done') {
                    displayStatus = 'inprogress'
                  }
                }
                const statusColor = STATUS_COLORS[displayStatus as keyof typeof STATUS_COLORS]

                return (
                  <React.Fragment key={step.stepId}>
                    <tr style={{
                      backgroundColor: step.status === 'done' 
                        ? '#e8f5e9'  // Green background for completed steps
                        : index % 2 === 0 ? '#ffffff' : '#fafafa',
                      borderBottom: '1px solid #e0e0e0',
                      borderLeft: step.status === 'done' ? '4px solid #4caf50' : 'none',  // Green left border
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (step.status !== 'done') {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (step.status !== 'done') {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa'
                      }
                    }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#2c3e50', fontWeight: 600 }}>
                        {step.order}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#2c3e50' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {step.isCustom && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              backgroundColor: '#e3f2fd', 
                              color: '#1565c0',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              CUSTOM
                            </span>
                          )}
                          <span style={{ fontWeight: 500 }}>{step.name}</span>
                          {step.description && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : step.stepId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2196f3',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '12px'
                              }}
                              title="View details"
                            >
                              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                            </button>
                          )}
                        </div>
                        {/* Progress Bar for steps that need it */}
                        {needsProgressBar(step) && step.status !== 'done' && (() => {
                          const stepProgress = calculateStepProgress(step, course, participants)
                          return stepProgress !== null ? (
                            <div style={{ marginTop: '8px', width: '100%' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: '#666'
                              }}>
                                <span>Progress</span>
                                <span style={{ fontWeight: 600 }}>{stepProgress}%</span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${stepProgress}%`,
                                  height: '100%',
                                  backgroundColor: stepProgress === 100 ? '#4caf50' : '#fbc02d',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          ) : null
                        })()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: statusColor?.bg || '#f5f5f5',
                          color: statusColor?.text || '#666',
                          border: `1px solid ${statusColor?.border || '#ddd'}`
                        }}>
                          {STATUS_LABELS[displayStatus as keyof typeof STATUS_LABELS]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                        {step.pic}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                        {step.completedAt ? new Date(step.completedAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                        {step.completedBy || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {step.status === 'done' ? (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#4caf50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}>
                            <i className="fas fa-check" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                        ) : step.status === 'not_applicable' ? (
                          <span style={{ color: '#ccc' }}>-</span>
                        ) : shouldHideMarkAsCompleted(step) ? (
                          <span style={{ color: '#ccc' }}>-</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={async () => {
                              if (supportsManualConfirm(step) && canAction && !shouldDisableMarkAsCompleted(step)) {
                                await handleStepAction(step, 'mark_done')
                              }
                            }}
                            disabled={isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: (isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)) ? 'not-allowed' : 'pointer',
                              accentColor: '#4caf50',
                              opacity: (isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)) ? 0.5 : 1
                            }}
                            title={
                              step.status === 'not_applicable' 
                                ? 'Step is not applicable'
                                : shouldDisableMarkAsCompleted(step)
                                ? `Complete the action (${actionBtn?.label || 'action'}) to complete this task`
                                : !canAction
                                ? `Permission required: ${step.pic}`
                                : step.actionType === 'approve'
                                ? 'Approve the course on the dedicated approval screen to complete this task'
                                : !supportsManualConfirm(step)
                                ? `Complete the action (${actionBtn?.label || 'action'}) to complete this task`
                                : 'Check to mark this step as completed'
                            }
                          />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* Action button based on actionType (Confirm, Approve, Export, etc.) */}
                          {/* Hide action button for "Verify AOL information" and "Verify MOF information" - they use checkbox only */}
                          {step.status !== 'done' && step.status !== 'not_applicable' && actionBtn && !shouldHideActionButton(step) && (
                            <button
                              className={actionBtn.className}
                              onClick={() => handleActionButton(step)}
                              disabled={isUpdating || !canAction}
                              style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                opacity: canAction ? 1 : 0.6,
                                cursor: canAction ? 'pointer' : 'not-allowed'
                              }}
                              title={canAction ? actionBtn.label : `Permission required: ${step.pic}`}
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <>
                                  {actionBtn.icon && (
                                    actionBtn.icon.startsWith('fa') ? (
                                      <i className={actionBtn.icon} style={{ marginRight: '4px' }}></i>
                                    ) : (
                                      <span style={{ marginRight: '4px' }}>{actionBtn.icon}</span>
                                    )
                                  )}
                                  {actionBtn.label}
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Regular "Done" button - only show if:
                              1. No actionType button is shown (actionType is 'none' or no actionBtn)
                              2. User can perform action
                              3. Not a custom step
                              4. User is NOT admin (admins use "Mark as Completed" instead)
                              5. Step should not hide mark as completed button */}
                          {step.status !== 'done' && 
                           step.status !== 'not_applicable' && 
                           canAction && 
                           !step.isCustom && 
                           (!actionBtn || step.actionType === 'none') &&
                           !isAdmin() &&
                           !shouldHideMarkAsCompleted(step) && (
                            <button
                              className="btn-secondary"
                              onClick={() => handleStepAction(step, 'mark_done')}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}
                              title="Mark as Completed"
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                '✓ Done'
                              )}
                            </button>
                          )}
                          
                          {/* Admin "Mark as Completed" button - only show for admins, replaces regular "Done" button */}
                          {isAdmin() && 
                           step.status !== 'done' && 
                           step.status !== 'not_applicable' && 
                           (!actionBtn || step.actionType === 'none' || step.isCustom) &&
                           !shouldHideMarkAsCompleted(step) && (
                            <button
                              className="btn-primary"
                              onClick={() => handleMarkDoneClick(step)}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                backgroundColor: '#ff9800',
                                borderColor: '#ff9800'
                              }}
                              title="Admin: Mark as Completed (with reason)"
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                '🔧 Mark as Completed'
                              )}
                            </button>
                          )}
                          
                          {/* Delete button for custom actions */}
                          {isAdmin() && step.isCustom && step.status !== 'done' && step.status !== 'not_applicable' && (
                            <button
                              className="btn-secondary"
                              onClick={() => handleDeleteCustomAction(step.stepId)}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                backgroundColor: '#dc3545',
                                borderColor: '#dc3545',
                                color: '#fff'
                              }}
                              title="Delete Custom Action"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Row for Details */}
                    {isExpanded && step.description && (
                      <tr>
                        <td colSpan={8} style={{
                          padding: '20px',
                          backgroundColor: '#fafafa',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <div style={{ maxWidth: '800px' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '6px', color: '#2196f3' }}></i>
                                Description:
                              </strong>
                              <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                                {step.description}
                              </p>
                            </div>
                            {step.notes && (
                              <div style={{ marginBottom: '12px' }}>
                                <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                  <i className="fas fa-sticky-note" style={{ marginRight: '6px', color: '#2196f3' }}></i>
                                  Notes:
                                </strong>
                                <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                                  {step.notes}
                                </p>
                              </div>
                            )}
                            {step.reminderTiming && step.reminderTiming.type !== 'none' && (
                              <div>
                                <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                  <i className="fas fa-bell" style={{ marginRight: '6px', color: '#2196f3' }}></i>
                                  Reminder:
                                </strong>
                                <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                                  {step.reminderTiming.type === 'daily' && 'Daily reminders'}
                                  {step.reminderTiming.type === 'date_based' && 'Date-based reminders'}
                                  {step.reminderTiming.type === 'course_date_relative' && 'Course date relative reminders'}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div style={{ 
        marginTop: '12px', 
        fontSize: '13px', 
        color: '#666',
        textAlign: 'right'
      }}>
        Showing {filteredAndSortedSteps.length} of {checklist.steps.length} steps
      </div>

      {/* MOF Exam Code Modal */}
      <EnterMOFExamCodeModal
        isOpen={showMOFModal}
        onClose={() => {
          setShowMOFModal(false)
          setCourse(null)
        }}
        course={course}
        onSuccess={handleMOFCodeSuccess}
      />

      {/* Confirm Passed Participants Modal */}
      <ConfirmPassedParticipantsModal
        isOpen={showConfirmPassedModal}
        course={course}
        onClose={() => {
          setShowConfirmPassedModal(false)
          setCourse(null)
          setSelectedStepForAction(null)
        }}
        onConfirm={async () => {
          if (selectedStepForAction) {
            await handleStepAction(selectedStepForAction, 'mark_done')
            showToast('Passed participants confirmed successfully', 'success')
          }
          setShowConfirmPassedModal(false)
          setCourse(null)
          setSelectedStepForAction(null)
        }}
      />

      {/* Import MOF Result Modal */}
      <ImportMOFResultModal
        isOpen={showImportMOFModal}
        course={course}
        onClose={() => {
          setShowImportMOFModal(false)
          setCourse(null)
          setSelectedStepForAction(null)
        }}
        onImport={async () => {
          if (selectedStepForAction) {
            await handleStepAction(selectedStepForAction, 'mark_done')
            showToast('MOF results imported successfully', 'success')
          }
          setShowImportMOFModal(false)
          setCourse(null)
          setSelectedStepForAction(null)
        }}
      />

      {/* Add Custom Action Modal */}
      {course && (
        <AddCustomActionModal
          isOpen={showCustomActionModal}
          courseId={courseId}
          courseName={course.name || course.code}
          onClose={() => {
            setShowCustomActionModal(false)
            setCourse(null)
          }}
          onSave={handleAddCustomAction}
        />
      )}

      {/* Mark Done Modal */}
      {selectedStepForMarkDone && course && (
        <MarkDoneModal
          isOpen={showMarkDoneModal}
          stepName={selectedStepForMarkDone.name}
          courseName={course.name || course.code}
          onClose={() => {
            setShowMarkDoneModal(false)
            setSelectedStepForMarkDone(null)
          }}
          onConfirm={handleConfirmMarkDone}
        />
      )}
    </div>
  )
}

