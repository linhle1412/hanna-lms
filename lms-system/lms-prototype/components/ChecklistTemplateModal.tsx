'use client'

import React, { useState, useEffect } from 'react'
import type { ChecklistTemplate, ChecklistStep } from '@/lib/state'

interface ChecklistTemplateModalProps {
  template: ChecklistTemplate | null
  isClone?: boolean
  onSave: (templateData: Partial<ChecklistTemplate>) => void
  onClose: () => void
}

const COURSE_TYPES = ['SHINE', 'Product', 'Skill'] as const
const PIC_OPTIONS = [
  'Course Supporters',
  'Head Channel',
  'Lead Region',
  'AA Admin',
  'External API',
  'System or Admin'
]

const ACTION_TYPES = [
  { value: 'confirm', label: 'Confirm/Update' },
  { value: 'approve', label: 'Approve/Reject' },
  { value: 'export', label: 'Export' },
  { value: 'import', label: 'Import' },
  { value: 'enter_data', label: 'Enter Data' },
  { value: 'finish', label: 'Finish' },
  { value: 'none', label: 'No Action' }
]

const REMINDER_TYPES = [
  { value: 'none', label: 'No reminder' },
  { value: 'daily', label: 'Daily' },
  { value: 'date_based', label: 'Date-based' },
  { value: 'course_date_relative', label: 'Course date relative' }
]

const STANDARD_STEPS: Record<string, Omit<ChecklistStep, 'id' | 'order'>> = {
  'Verify AOL information': {
    name: 'Verify AOL information',
    pic: 'Course Supporters',
    reminderTiming: { type: 'daily', start: 'course_creation' },
    actionType: 'confirm',
    statusDefinitionLogic: 'Step is marked done when PIC confirms the step is completed',
    isActive: true
  },
  'Verify MOF information': {
    name: 'Verify MOF information',
    pic: 'Course Supporters',
    reminderTiming: { type: 'daily', start: 'course_creation' },
    actionType: 'confirm',
    statusDefinitionLogic: 'Step is marked done when PIC confirms the step is completed',
    isActive: true
  },
  'Enter MOF exam code': {
    name: 'Enter MOF exam code',
    pic: 'Course Supporters',
    reminderTiming: { type: 'daily', start: 'course_creation' },
    actionType: 'enter_data',
    statusDefinitionLogic: 'Step is marked done when MOF exam code field is entered with information',
    isActive: true
  },
  'Approve course': {
    name: 'Approve course',
    pic: 'Head Channel, Lead Region',
    reminderTiming: { type: 'daily', daysBefore: 7 },
    actionType: 'approve',
    statusDefinitionLogic: 'Step is marked done when course status changes to "Approved"',
    isActive: true
  },
  'Add participants': {
    name: 'Add participants',
    pic: 'External API',
    reminderTiming: { type: 'none' },
    actionType: 'none',
    statusDefinitionLogic: 'Calculate percentage: (Number of added participants / Max participants allowed in program) × 100%',
    isActive: true
  },
  'Export Participants for MOF exam': {
    name: 'Export Participants for MOF exam',
    pic: 'Course Supporters',
    reminderTiming: { type: 'date_based', daysAfter: 3, start: 'course_end' },
    actionType: 'export',
    statusDefinitionLogic: 'Step is marked done when user clicks "Export participant for MOF exam" button',
    isActive: true
  },
  'Update AOL exam result': {
    name: 'Update AOL exam result',
    pic: 'Course Supporters',
    reminderTiming: { type: 'none' },
    actionType: 'none',
    statusDefinitionLogic: 'Step is marked done when AOL exam results are received and updated for all participants in the course',
    isActive: true
  },
  'Update attendance result': {
    name: 'Update attendance result',
    pic: 'External API',
    reminderTiming: { type: 'none' },
    actionType: 'none',
    statusDefinitionLogic: 'Count and calculate percentage of participants who have attendance data recorded',
    isActive: true
  },
  'Import MOF result': {
    name: 'Import MOF result',
    pic: 'Course Supporters',
    reminderTiming: { type: 'none' },
    actionType: 'import',
    statusDefinitionLogic: 'Step is marked done when user successfully imports MOF exam results',
    isActive: true
  },
  'Confirm passed participants': {
    name: 'Confirm passed participants',
    pic: 'AA Admin',
    reminderTiming: { type: 'date_based', daysAfter: 1, start: 'course_end' },
    additionalEmails: [],
    actionType: 'confirm',
    statusDefinitionLogic: 'Step is marked done when user successfully confirms passed participants',
    isActive: true
  },
  'Export participant for granting agent/license code': {
    name: 'Export participant for granting agent/license code',
    pic: 'AA Admin',
    reminderTiming: { type: 'none' },
    actionType: 'export',
    statusDefinitionLogic: 'Step is marked done when user exports passed participants for code assignment',
    isActive: true
  },
  'Grant agent code': {
    name: 'Grant agent code',
    pic: 'External API',
    reminderTiming: { type: 'none' },
    actionType: 'none',
    statusDefinitionLogic: 'Step is marked done when agent codes are received and assigned to all passed participants',
    isActive: true
  },
  'Grant license code': {
    name: 'Grant license code',
    pic: 'External API',
    reminderTiming: { type: 'none' },
    actionType: 'none',
    statusDefinitionLogic: 'Step is marked done when API receives and updates license codes for participants',
    isActive: true
  },
  'Finish course': {
    name: 'Finish course',
    pic: 'System or Admin',
    reminderTiming: { type: 'none' },
    actionType: 'finish',
    statusDefinitionLogic: 'Step is marked done when course status is set to "Finished"',
    isActive: true
  }
}

export default function ChecklistTemplateModal({
  template,
  isClone = false,
  onSave,
  onClose
}: ChecklistTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'steps'>('general')
  const [formData, setFormData] = useState<Partial<ChecklistTemplate>>({
    name: '',
    description: '',
    courseType: 'SHINE',
    steps: [],
    isActive: true,
    isDefault: false
  })
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Check if this is a system template (only configurable fields can be edited)
  const isSystemTemplate = template?.isDefault && !isClone

  useEffect(() => {
    if (template) {
      if (isClone) {
        setFormData({
          ...template,
          name: `${template.name} (Copy)`,
          isDefault: false,
          id: undefined
        })
      } else {
        setFormData(template)
      }
    }
  }, [template, isClone])

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
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const toggleStepExpand = (stepId: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleAddStep = () => {
    const newStep: ChecklistStep = {
      id: Date.now(),
      name: '',
      order: (formData.steps?.length || 0) + 1,
      pic: 'Course Supporters',
      reminderTiming: { type: 'none' },
      actionType: 'none',
      statusDefinitionLogic: '',
      isActive: true
    }
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), newStep]
    })
    setExpandedSteps(new Set([...expandedSteps, newStep.id]))
  }

  const handleRemoveStep = (stepId: number) => {
    setFormData({
      ...formData,
      steps: formData.steps?.filter(s => s.id !== stepId).map((s, idx) => ({ ...s, order: idx + 1 })) || []
    })
    const newExpanded = new Set(expandedSteps)
    newExpanded.delete(stepId)
    setExpandedSteps(newExpanded)
  }

  const handleUpdateStep = (stepId: number, updates: Partial<ChecklistStep>) => {
    setFormData({
      ...formData,
      steps: formData.steps?.map(s => s.id === stepId ? { ...s, ...updates } : s) || []
    })
  }

  const handleAddStandardStep = (stepName: string) => {
    const standardStep = STANDARD_STEPS[stepName]
    if (!standardStep) return

    const newStep: ChecklistStep = {
      ...standardStep,
      id: Date.now(),
      order: (formData.steps?.length || 0) + 1
    }
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), newStep]
    })
  }

  const handleMoveStep = (stepId: number, direction: 'up' | 'down') => {
    const steps = [...(formData.steps || [])]
    const index = steps.findIndex(s => s.id === stepId)
    if (index === -1) return

    if (direction === 'up' && index > 0) {
      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]]
      steps[index - 1].order = index
      steps[index].order = index + 1
    } else if (direction === 'down' && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]]
      steps[index].order = index + 1
      steps[index + 1].order = index + 2
    }

    setFormData({ ...formData, steps })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Template name is required'
    }

    if (!formData.courseType) {
      newErrors.courseType = 'Course type is required'
    }

    if (!formData.steps || formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required'
    } else {
      formData.steps.forEach((step, idx) => {
        if (!step.name?.trim()) {
          newErrors[`step_${step.id}_name`] = `Step ${idx + 1} name is required`
        }
        if (!step.pic) {
          newErrors[`step_${step.id}_pic`] = `Step ${idx + 1} PIC is required`
        }
        if (!step.statusDefinitionLogic?.trim()) {
          newErrors[`step_${step.id}_logic`] = `Step ${idx + 1} status definition logic is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      return
    }

    const templateData: Partial<ChecklistTemplate> = {
      ...formData,
      steps: formData.steps?.map((s, idx) => ({ ...s, order: idx + 1 }))
    }

    onSave(templateData)
  }

  const availableStandardSteps = Object.keys(STANDARD_STEPS).filter(
    stepName => !formData.steps?.some(s => s.name === stepName)
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '90vw', width: '1200px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isClone ? 'Clone Template' : template ? (isSystemTemplate ? 'Configure System Template' : 'Edit Template') : 'Create New Template'}
            {template && !isClone && <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
              ({template.name})
            </span>}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '24px' }}>
            <button
              onClick={() => setActiveTab('general')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'general' ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === 'general' ? '#007bff' : '#666',
                fontWeight: activeTab === 'general' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              📝 General Information
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'steps' ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === 'steps' ? '#007bff' : '#666',
                fontWeight: activeTab === 'steps' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              ✅ Checklist Steps Configuration
            </button>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  Template Name: <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  placeholder="Enter template name"
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Description:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  Course Type: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.courseType || 'SHINE'}
                  onChange={(e) => setFormData({ ...formData, courseType: e.target.value as 'SHINE' | 'Product' | 'Skill' })}
                  className={`form-control ${errors.courseType ? 'error' : ''}`}
                  disabled={!!template && !isClone}
                >
                  {COURSE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.courseType && <div className="error-message">{errors.courseType}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Active Template
                </label>
              </div>

              {isSystemTemplate && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  marginBottom: '24px'
                }}>
                  <strong>⚠️ System Template Configuration:</strong> Only PIC, Reminder Timing, and Reminder Recipients can be configured. 
                  All other fields (step name, action type, status definition logic, step order) are system-defined and read-only.
                </div>
              )}
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Checklist Steps</h3>
                {!isSystemTemplate && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {availableStandardSteps.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddStandardStep(e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="form-control"
                        style={{ marginRight: '8px' }}
                      >
                        <option value="">Add Standard Step...</option>
                        {availableStandardSteps.map(stepName => (
                          <option key={stepName} value={stepName}>{stepName}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={handleAddStep}
                      className="btn btn-secondary"
                    >
                      + Add New Step
                    </button>
                  </div>
                )}
              </div>

              {errors.steps && <div className="error-message" style={{ marginBottom: '16px' }}>{errors.steps}</div>}

              {formData.steps && formData.steps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formData.steps.map((step, index) => (
                    <div
                      key={step.id}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {step.order}
                          </span>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                            className={`form-control ${errors[`step_${step.id}_name`] ? 'error' : ''}`}
                            placeholder="Step name"
                            style={{ flex: 1, maxWidth: '400px' }}
                            disabled={isSystemTemplate}
                            readOnly={isSystemTemplate}
                          />
                          {errors[`step_${step.id}_name`] && (
                            <div className="error-message">{errors[`step_${step.id}_name`]}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!isSystemTemplate && (
                            <>
                              <button
                                onClick={() => handleMoveStep(step.id, 'up')}
                                disabled={index === 0}
                                className="btn btn-sm"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => handleMoveStep(step.id, 'down')}
                                disabled={index === formData.steps!.length - 1}
                                className="btn btn-sm"
                                title="Move down"
                              >
                                ↓
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleStepExpand(step.id)}
                            className="btn btn-sm"
                          >
                            {expandedSteps.has(step.id) ? '▲' : '▼'}
                          </button>
                          {!isSystemTemplate && (
                            <button
                              onClick={() => handleRemoveStep(step.id)}
                              className="btn btn-sm btn-danger"
                              title="Remove step"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedSteps.has(step.id) && (
                        <div style={{
                          marginTop: '16px',
                          padding: '16px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                              <label className="form-label">
                                PIC (Person in Charge): <span style={{ color: 'red' }}>*</span>
                              </label>
                              <select
                                value={step.pic}
                                onChange={(e) => handleUpdateStep(step.id, { pic: e.target.value })}
                                className={`form-control ${errors[`step_${step.id}_pic`] ? 'error' : ''}`}
                              >
                                {PIC_OPTIONS.map(pic => (
                                  <option key={pic} value={pic}>{pic}</option>
                                ))}
                              </select>
                              {errors[`step_${step.id}_pic`] && (
                                <div className="error-message">{errors[`step_${step.id}_pic`]}</div>
                              )}
                            </div>

                            <div>
                              <label className="form-label">
                                Action Type:
                                {isSystemTemplate && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Read-only)</span>}
                              </label>
                              <select
                                value={step.actionType}
                                onChange={(e) => handleUpdateStep(step.id, { actionType: e.target.value as any })}
                                className="form-control"
                                disabled={isSystemTemplate}
                              >
                                {ACTION_TYPES.map(action => (
                                  <option key={action.value} value={action.value}>{action.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Reminder Timing:</label>
                            <select
                              value={step.reminderTiming?.type || 'none'}
                              onChange={(e) => {
                                const reminderType = e.target.value as any
                                handleUpdateStep(step.id, {
                                  reminderTiming: {
                                    type: reminderType,
                                    ...(reminderType === 'daily' ? { start: 'course_creation' } : {}),
                                    ...(reminderType === 'date_based' ? { daysAfter: 0, start: 'course_end' } : {}),
                                    ...(reminderType === 'course_date_relative' ? { daysBefore: 7 } : {})
                                  }
                                })
                              }}
                              className="form-control"
                            >
                              {REMINDER_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          {step.reminderTiming?.type !== 'none' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                              {step.reminderTiming.type === 'daily' && (
                                <div>
                                  <label className="form-label">Start From:</label>
                                  <select
                                    value={step.reminderTiming.start || 'course_creation'}
                                    onChange={(e) => handleUpdateStep(step.id, {
                                      reminderTiming: { ...step.reminderTiming!, start: e.target.value }
                                    })}
                                    className="form-control"
                                  >
                                    <option value="course_creation">Course Creation</option>
                                    <option value="course_start">Course Start Date</option>
                                    <option value="course_end">Course End Date</option>
                                  </select>
                                </div>
                              )}

                              {step.reminderTiming.type === 'date_based' && (
                                <>
                                  <div>
                                    <label className="form-label">Start From:</label>
                                    <select
                                      value={step.reminderTiming.start || 'course_end'}
                                      onChange={(e) => handleUpdateStep(step.id, {
                                        reminderTiming: { ...step.reminderTiming!, start: e.target.value }
                                      })}
                                      className="form-control"
                                    >
                                      <option value="course_end">Course End Date</option>
                                      <option value="course_start">Course Start Date</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="form-label">Days After:</label>
                                    <input
                                      type="number"
                                      value={step.reminderTiming.daysAfter || 0}
                                      onChange={(e) => handleUpdateStep(step.id, {
                                        reminderTiming: { ...step.reminderTiming!, daysAfter: parseInt(e.target.value) || 0 }
                                      })}
                                      className="form-control"
                                      min="0"
                                    />
                                  </div>
                                </>
                              )}

                              {step.reminderTiming.type === 'course_date_relative' && (
                                <div>
                                  <label className="form-label">Days Before Course Start:</label>
                                  <input
                                    type="number"
                                    value={step.reminderTiming.daysBefore || 7}
                                    onChange={(e) => handleUpdateStep(step.id, {
                                      reminderTiming: { ...step.reminderTiming!, daysBefore: parseInt(e.target.value) || 7 }
                                    })}
                                    className="form-control"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">
                              Also send reminder to: <span style={{ fontSize: '12px', color: '#666' }}>(Configurable)</span>
                            </label>
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                Reminder Recipients (Email / Users by Channel / Users by Region)
                              </div>
                              {step.reminderRecipients && step.reminderRecipients.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {step.reminderRecipients.map((recipient, idx) => (
                                    <div key={idx} style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '8px',
                                      backgroundColor: '#fff',
                                      borderRadius: '4px'
                                    }}>
                                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                                        {recipient.type === 'email' ? '📧' : recipient.type === 'channel' ? '🏢' : '🌍'} 
                                        {recipient.type.toUpperCase()}: {recipient.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                  No additional recipients configured
                                </div>
                              )}
                              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '8px' }}>
                                Note: Reminder recipient configuration will be implemented in a future update.
                                Currently using Additional Email Addresses field below.
                              </small>
                            </div>
                            <input
                              type="text"
                              value={step.additionalEmails?.join('; ') || ''}
                              onChange={(e) => handleUpdateStep(step.id, {
                                additionalEmails: e.target.value.split(';').map(email => email.trim()).filter(Boolean)
                              })}
                              className="form-control"
                              placeholder="email1@company.com; email2@company.com"
                            />
                            <small style={{ color: '#666', fontSize: '12px' }}>Separate multiple emails with semicolons</small>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">
                              Status Definition Logic: <span style={{ color: 'red' }}>*</span>
                              {isSystemTemplate && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Read-only)</span>}
                            </label>
                            <textarea
                              value={step.statusDefinitionLogic}
                              onChange={(e) => handleUpdateStep(step.id, { statusDefinitionLogic: e.target.value })}
                              className={`form-control ${errors[`step_${step.id}_logic`] ? 'error' : ''}`}
                              placeholder="Describe when this step is marked as done..."
                              rows={3}
                              disabled={isSystemTemplate}
                              readOnly={isSystemTemplate}
                            />
                            {errors[`step_${step.id}_logic`] && (
                              <div className="error-message">{errors[`step_${step.id}_logic`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="form-label">
                              <input
                                type="checkbox"
                                checked={step.isActive}
                                onChange={(e) => handleUpdateStep(step.id, { isActive: e.target.checked })}
                                style={{ marginRight: '8px' }}
                              />
                              Step is Active
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: '#666',
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px'
                }}>
                  <p>No steps configured. Add your first step to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isClone ? 'Clone & Edit Template' : template ? (isSystemTemplate ? 'Save Configuration' : 'Save Template') : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

