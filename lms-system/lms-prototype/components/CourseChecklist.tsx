'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { courseChecklistAPI, courseAPI, participantAPI } from '@/lib/api'
import type { CourseChecklistInstance, CourseChecklistStepInstance, Course, Participant } from '@/lib/state'
import { getCurrentUserRole } from '@/lib/auth-utils'
import EnterMOFExamCodeModal from './EnterMOFExamCodeModal'
import ConfirmPassedParticipantsModal from './ConfirmPassedParticipantsModal'
import ImportMOFResultModal from './ImportMOFResultModal'
import { exportParticipantsForMOF, isEligibleForMOF } from '@/lib/export-utils'
import { getStatusDefinitionLogic } from '@/lib/checklist-status-definitions'

interface CourseChecklistProps {
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

const ACTION_BUTTONS = {
  confirm: { label: 'Confirm', icon: '✓', className: 'btn-primary' },
  approve: { label: 'Approve', icon: '✓', className: 'btn-primary' },
  export: { label: 'Export', icon: 'fas fa-download', className: 'btn-secondary' },
  import: { label: 'Import', icon: 'fas fa-upload', className: 'btn-secondary' },
  enter_data: { label: 'Enter Data', icon: '', className: 'btn-primary' },
  finish: { label: 'Finish', icon: '', className: 'btn-primary' },
  none: null
}

export default function CourseChecklist({ courseId, courseType }: CourseChecklistProps) {
  const { showToast } = useToast()
  const [checklist, setChecklist] = useState<CourseChecklistInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStep, setUpdatingStep] = useState<number | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [showMOFModal, setShowMOFModal] = useState(false)
  const [showConfirmPassedModal, setShowConfirmPassedModal] = useState(false)
  const [showImportMOFModal, setShowImportMOFModal] = useState(false)
  const [selectedStepForAction, setSelectedStepForAction] = useState<CourseChecklistStepInstance | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])

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
    // Handle specific action types
    switch (step.actionType) {
      case 'confirm':
        // Check if this is the "Confirm passed participants" step
        if (step.name.toLowerCase().includes('confirm passed participants')) {
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
        if (step.name.toLowerCase().includes('import mof result')) {
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
          showToast('Enter data functionality will be implemented', 'info')
        }
        break
      case 'finish':
        showToast('Finish course functionality will be implemented', 'info')
        // TODO: Implement finish course
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
    // Authorization logic based on PIC and user role
    const userRole = getCurrentUserRole()
    if (!userRole) return false

    // TEST ROLE: Bypass all permission checks for testing purposes
    if (userRole === 'Test Role') return true

    // Admin and Master Role can perform any action
    if (userRole === 'Admin' || userRole === 'Master Role') return true

    // Check if user role matches PIC
    const picRoleMap: Record<string, string[]> = {
      'Course Supporters': ['Trainer', 'Lead Region', 'Head Channel'],
      'Head Channel': ['Head Channel', 'Admin'],
      'Lead Region': ['Lead Region', 'Admin'],
      'AA Admin': ['Admin'],
      'System or Admin': ['Admin', 'Master Role']
    }

    const allowedRoles = picRoleMap[step.pic] || []
    return allowedRoles.includes(userRole)
  }

  const getProgress = () => {
    if (!checklist) return { completed: 0, total: 0, percentage: 0 }
    const total = checklist.steps.filter(s => s.status !== 'not_applicable').length
    const completed = checklist.steps.filter(s => s.status === 'done').length
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#666' }}></i>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading checklist...</p>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>No checklist template found for this course type.</p>
      </div>
    )
  }

  const progress = getProgress()
  const actionButtonConfig = ACTION_BUTTONS[checklist.steps[0]?.actionType || 'none']

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Course Checklist</h3>
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

        {/* Progress Bar */}
        <div style={{ marginBottom: '8px' }}>
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
            position: 'relative'
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
        </div>
      </div>

      {/* Timeline View */}
      <div style={{ position: 'relative', paddingLeft: '40px' }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: '#e0e0e0',
          zIndex: 0
        }}>
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: `${(progress.completed / progress.total) * 100}%`,
            backgroundColor: '#4caf50',
            transition: 'height 0.3s ease',
            zIndex: 1
          }} />
        </div>

        {/* Timeline Steps */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {checklist.steps.map((step, index) => {
            const canAction = canPerformAction(step)
            const actionBtn = ACTION_BUTTONS[step.actionType]
            const isUpdating = updatingStep === step.stepId
            const isExpanded = expandedStep === step.stepId
            const isLast = index === checklist.steps.length - 1
            const isDone = step.status === 'done'
            const isPending = step.status === 'pending'
            const isOverdue = step.status === 'overdue'
            
            // Check if step has percentage > 0 to show "inprogress" status, or 100% to show "done"
            const stepProgress = needsProgressBar(step) ? calculateStepProgress(step, course, participants) : null
            const isInProgress = stepProgress !== null && stepProgress > 0 && stepProgress < 100 && !isDone
            const isDoneByPercentage = stepProgress !== null && stepProgress >= 100 && !isDone

            // Status colors - use done colors if percentage is 100% even if status is not done yet
            const effectiveIsDone = isDone || isDoneByPercentage
            const statusColor = effectiveIsDone ? '#4caf50' : isOverdue ? '#f44336' : isInProgress ? '#2196f3' : isPending ? '#ff9800' : '#9e9e9e'
            const statusBg = effectiveIsDone ? '#e8f5e9' : isOverdue ? '#ffebee' : isInProgress ? '#e3f2fd' : isPending ? '#fff3e0' : '#f5f5f5'

            return (
              <div key={step.stepId} style={{ position: 'relative', marginBottom: isLast ? '0' : '24px' }}>
                {/* Timeline Node */}
                <div style={{
                  position: 'absolute',
                  left: '-32px',
                  top: '0',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  border: '4px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                  transition: 'all 0.3s ease'
                }}>
                  {isDone ? (
                    <i className="fas fa-check" style={{ color: 'white', fontSize: '16px' }}></i>
                  ) : (
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>{step.order}</span>
                  )}
                </div>

                {/* Step Content Card */}
                <div style={{
                  marginLeft: '20px',
                  backgroundColor: isDone ? '#e8f5e9' : '#ffffff',  // Green background for done
                  border: `2px solid ${effectiveIsDone ? '#4caf50' : statusColor}`,  // Green border for done
                  borderRadius: '8px',
                  boxShadow: isDone 
                    ? '0 2px 8px rgba(76, 175, 80, 0.2)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}>
                  {/* Step Header */}
                  <div style={{
                    padding: '16px 20px',
                    backgroundColor: statusBg,
                    borderBottom: isExpanded ? `1px solid ${statusColor}` : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                  >
                    {!isExpanded ? (
                      /* Collapsed: Only show step name */
                      <h4 style={{ 
                        margin: 0,
                        fontWeight: 600, 
                        color: '#2c3e50',
                        fontSize: '16px'
                      }}>
                        {step.name}
                      </h4>
                    ) : (
                      /* Expanded: Show all details */
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        {/* Step Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <h4 style={{ 
                              margin: 0,
                              fontWeight: 600, 
                              color: '#2c3e50',
                              fontSize: '16px'
                            }}>
                              {step.name}
                            </h4>
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              backgroundColor: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 500,
                              border: `1px solid ${statusColor}`
                            }}>
                              {STATUS_LABELS[isDoneByPercentage ? 'done' : isInProgress ? 'inprogress' : step.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </div>
                          {/* Progress Bar for steps that need it */}
                          {needsProgressBar(step) && step.status !== 'done' && (() => {
                            const stepProgress = calculateStepProgress(step, course, participants)
                            return stepProgress !== null ? (
                              <div style={{ marginTop: '12px', width: '100%' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  marginBottom: '6px',
                                  fontSize: '13px',
                                  color: '#666'
                                }}>
                                  <span>Progress</span>
                                  <span style={{ fontWeight: 600 }}>{stepProgress}%</span>
                                </div>
                                <div style={{
                                  width: '100%',
                                  height: '10px',
                                  backgroundColor: '#e0e0e0',
                                  borderRadius: '5px',
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
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#666',
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap'
                          }}>
                            <span>
                              <i className="fas fa-user" style={{ marginRight: '6px', color: statusColor }}></i>
                              <strong>PIC:</strong> {step.pic}
                            </span>
                            {step.completedAt && (
                              <span>
                                <i className="fas fa-calendar-check" style={{ marginRight: '6px', color: statusColor }}></i>
                                <strong>Completed:</strong> {new Date(step.completedAt).toLocaleDateString()}
                              </span>
                            )}
                            {step.completedBy && (
                              <span>
                                <i className="fas fa-user-check" style={{ marginRight: '6px', color: statusColor }}></i>
                                <strong>By:</strong> {step.completedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          alignItems: 'center',
                          flexShrink: 0,
                          flexWrap: 'wrap'
                        }}>
                          {/* Action button based on actionType (Confirm, Approve, Export, etc.) */}
                          {/* Hide action button for "Verify AOL information" and "Verify MOF information" - they use checkbox only */}
                          {step.status !== 'done' && step.status !== 'not_applicable' && actionBtn && canAction && !shouldHideActionButton(step) && (
                            <button
                              className={actionBtn.className}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleActionButton(step)
                              }}
                              disabled={isUpdating}
                              style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <>
                                  {actionBtn.icon && (
                                    actionBtn.icon.startsWith('fa') ? (
                                      <i className={actionBtn.icon} style={{ marginRight: '6px' }}></i>
                                    ) : (
                                      <span style={{ marginRight: '6px' }}>{actionBtn.icon}</span>
                                    )
                                  )}
                                  {actionBtn.label}
                                </>
                              )}
                            </button>
                          )}
                          {/* "Mark as Completed" button - only show if no actionType button is shown and step should not hide it */}
                          {step.status !== 'done' && 
                           step.status !== 'not_applicable' && 
                           canAction && 
                           (!actionBtn || step.actionType === 'none') &&
                           !shouldHideMarkAsCompleted(step) && (
                            <button
                              className="btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStepAction(step, 'mark_done')
                              }}
                              disabled={isUpdating}
                              style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                whiteSpace: 'nowrap'
                              }}
                              title="Mark as Completed"
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <>
                                  <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                                  Mark as Completed
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mark as Completed Checkbox - Show for all steps except those that should be hidden - Only when expanded */}
                  {isExpanded && step.status !== 'done' && step.status !== 'not_applicable' && !shouldHideMarkAsCompleted(step) && (
                    <div style={{ 
                      padding: '12px 20px',
                      backgroundColor: '#f5f5f5',
                      borderTop: `1px solid ${statusColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <input
                        type="checkbox"
                        id={`checkbox-${step.stepId}`}
                        checked={false}
                        onChange={async (e) => {
                          e.stopPropagation()
                          if (supportsManualConfirm(step) && canAction && !shouldDisableMarkAsCompleted(step)) {
                            await handleStepAction(step, 'mark_done')
                          }
                        }}
                        disabled={isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: (isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)) ? 'not-allowed' : 'pointer',
                          accentColor: '#4caf50',
                          opacity: (isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)) ? 0.5 : 1
                        }}
                      />
                      <label 
                        htmlFor={`checkbox-${step.stepId}`}
                        style={{
                          cursor: (isUpdating || !supportsManualConfirm(step) || !canAction || shouldDisableMarkAsCompleted(step)) ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          color: (supportsManualConfirm(step) && canAction && !shouldDisableMarkAsCompleted(step)) ? '#666' : '#999',
                          userSelect: 'none',
                          flex: 1
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title={
                          shouldDisableMarkAsCompleted(step)
                            ? `Complete the action (${actionBtn?.label || 'action'}) to complete this task`
                            : !canAction
                            ? `Permission required: ${step.pic}`
                            : step.actionType === 'approve'
                            ? 'Approve the course on the dedicated approval screen to complete this task'
                            : !supportsManualConfirm(step)
                            ? `Complete the action (${actionBtn?.label || 'action'}) to complete this task`
                            : 'Check to mark this step as completed'
                        }
                      >
                        Mark as completed
                        {shouldDisableMarkAsCompleted(step) && actionBtn && (
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                            (Complete the {actionBtn.label} action to complete this task)
                          </span>
                        )}
                        {!supportsManualConfirm(step) && actionBtn && !shouldDisableMarkAsCompleted(step) && (
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                            (Complete the {actionBtn.label} action to complete this task)
                          </span>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fafafa',
                      borderTop: `1px solid ${statusColor}`
                    }}>
                      {step.description && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '6px', color: statusColor }}></i>
                            Description:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                            {step.description}
                          </p>
                        </div>
                      )}
                      {step.notes && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-sticky-note" style={{ marginRight: '6px', color: statusColor }}></i>
                            Notes:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                            {step.notes}
                          </p>
                        </div>
                      )}
                      {step.reminderTiming && step.reminderTiming.type !== 'none' && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-bell" style={{ marginRight: '6px', color: statusColor }}></i>
                            Reminder:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                            {step.reminderTiming.type === 'daily' && 'Daily reminders'}
                            {step.reminderTiming.type === 'date_based' && 'Date-based reminders'}
                            {step.reminderTiming.type === 'course_date_relative' && 'Course date relative reminders'}
                          </p>
                        </div>
                      )}
                      {step.actionType && step.actionType !== 'none' && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-bolt" style={{ marginRight: '6px', color: statusColor }}></i>
                            Action Type:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                            {actionBtn?.label || step.actionType}
                          </p>
                        </div>
                      )}
                      {step.isCustom && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-star" style={{ marginRight: '6px', color: statusColor }}></i>
                            Custom Step:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                            This is a custom step added to this course
                          </p>
                        </div>
                      )}
                      {step.manualMarkDoneBy && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-user-shield" style={{ marginRight: '6px', color: statusColor }}></i>
                            Manually Completed:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                            By {step.manualMarkDoneBy}
                            {step.manualMarkDoneReason && ` - ${step.manualMarkDoneReason}`}
                          </p>
                        </div>
                      )}
                      {step.autoDetectedAt && (
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            <i className="fas fa-magic" style={{ marginRight: '6px', color: statusColor }}></i>
                            Auto-detected:
                          </strong>
                          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                            {new Date(step.autoDetectedAt).toLocaleString()}
                            {step.autoDetectionReason && ` - ${step.autoDetectionReason}`}
                          </p>
                        </div>
                      )}
                      {!step.description && !step.notes && !step.actionType && !step.isCustom && !step.manualMarkDoneBy && !step.autoDetectedAt && (
                        <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                          No additional details available for this step
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {checklist.steps.length === 0 && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#666'
        }}>
          <p>No checklist steps configured for this course.</p>
        </div>
      )}

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
    </div>
  )
}

