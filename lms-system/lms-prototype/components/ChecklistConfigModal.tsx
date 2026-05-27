'use client'

import React, { useState, useEffect } from 'react'
import type { ChecklistTemplate, ChecklistStep, ReminderRecipient } from '@/lib/state'

interface ChecklistConfigModalProps {
  template: ChecklistTemplate
  onSave: (updatedSteps: ChecklistStep[]) => void
  onClose: () => void
}

const PIC_OPTIONS = [
  'Course Supporters',
  'Head Channel',
  'Lead Region',
  'AA Admin',
  'External API',
  'System or Admin'
]

const REMINDER_TYPES = [
  { value: 'none', label: 'No reminder' },
  { value: 'daily', label: 'Daily' },
  { value: 'date_based', label: 'Date-based' },
  { value: 'course_date_relative', label: 'Course date relative' }
]

const CHANNEL_OPTIONS = ['Agency', 'Banca', 'IFA', 'Banker']
const REGION_OPTIONS = ['North', 'South', 'Central', 'Nationwide']

export default function ChecklistConfigModal({
  template,
  onSave,
  onClose
}: ChecklistConfigModalProps) {
  const [steps, setSteps] = useState<ChecklistStep[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Deep clone steps to avoid mutating original
    setSteps(JSON.parse(JSON.stringify(template.steps)))
  }, [template])

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

  const handleUpdateStep = (stepId: number, updates: Partial<ChecklistStep>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }

  const handleAddRecipient = (stepId: number, type: 'email' | 'channel' | 'region') => {
    const step = steps.find(s => s.id === stepId)
    if (!step) return

    const newRecipient: ReminderRecipient = {
      type,
      value: type === 'email' ? '' : (type === 'channel' ? CHANNEL_OPTIONS[0] : REGION_OPTIONS[0])
    }

    const currentRecipients = step.reminderRecipients || []
    handleUpdateStep(stepId, {
      reminderRecipients: [...currentRecipients, newRecipient]
    })
  }

  const handleRemoveRecipient = (stepId: number, recipientIndex: number) => {
    const step = steps.find(s => s.id === stepId)
    if (!step || !step.reminderRecipients) return

    const updatedRecipients = step.reminderRecipients.filter((_, idx) => idx !== recipientIndex)
    handleUpdateStep(stepId, {
      reminderRecipients: updatedRecipients
    })
  }

  const handleUpdateRecipient = (stepId: number, recipientIndex: number, updates: Partial<ReminderRecipient>) => {
    const step = steps.find(s => s.id === stepId)
    if (!step || !step.reminderRecipients) return

    const updatedRecipients = step.reminderRecipients.map((r, idx) =>
      idx === recipientIndex ? { ...r, ...updates } : r
    )
    handleUpdateStep(stepId, {
      reminderRecipients: updatedRecipients
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    steps.forEach((step, idx) => {
      if (!step.pic) {
        newErrors[`step_${step.id}_pic`] = `Step ${idx + 1} PIC is required`
      }

      // Validate email recipients
      if (step.reminderRecipients) {
        step.reminderRecipients.forEach((recipient, rIdx) => {
          if (recipient.type === 'email' && !recipient.value.trim()) {
            newErrors[`step_${step.id}_recipient_${rIdx}`] = 'Email address is required'
          } else if (recipient.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.value)) {
            newErrors[`step_${step.id}_recipient_${rIdx}`] = 'Invalid email address'
          }
        })
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      return
    }

    onSave(steps)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '90vw', width: '1400px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Configure Template: {template.name}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <strong>⚠️ Note:</strong> Only PIC, Reminder Timing, and Additional Recipients can be configured.
            All other fields are system-defined and read-only.
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Template Steps Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step, index) => (
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
                      <div>
                        <strong style={{ fontSize: '16px' }}>{step.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          <span style={{ padding: '2px 8px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginRight: '8px' }}>
                            {step.actionType}
                          </span>
                          <span style={{ color: '#666' }}>
                            {step.statusDefinitionLogic}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStepExpand(step.id)}
                      className="btn btn-sm"
                    >
                      {expandedSteps.has(step.id) ? '▲ Collapse' : '▼ Expand'}
                    </button>
                  </div>

                  {expandedSteps.has(step.id) && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {/* PIC Configuration */}
                      <div style={{ marginBottom: '16px' }}>
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

                      {/* Reminder Timing Configuration */}
                      <div style={{ marginBottom: '16px' }}>
                        <label className="form-label">Time to Send Reminder:</label>
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
                          {step.reminderTiming?.type === 'daily' && (
                            <div>
                              <label className="form-label">Start From:</label>
                              <select
                                value={step.reminderTiming?.start || 'course_creation'}
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

                          {step.reminderTiming?.type === 'date_based' && (
                            <>
                              <div>
                                <label className="form-label">Start From:</label>
                                <select
                                  value={step.reminderTiming?.start || 'course_end'}
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
                                  value={step.reminderTiming?.daysAfter || 0}
                                  onChange={(e) => handleUpdateStep(step.id, {
                                    reminderTiming: { ...step.reminderTiming!, daysAfter: parseInt(e.target.value) || 0 }
                                  })}
                                  className="form-control"
                                  min="0"
                                />
                              </div>
                            </>
                          )}

                          {step.reminderTiming?.type === 'course_date_relative' && (
                            <div>
                              <label className="form-label">Days Before Course Start:</label>
                              <input
                                type="number"
                                value={step.reminderTiming?.daysBefore || 7}
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

                      {/* Additional Recipients Configuration */}
                      <div style={{ marginBottom: '16px' }}>
                        <label className="form-label">Also Send Reminder To:</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {step.reminderRecipients && step.reminderRecipients.length > 0 ? (
                            step.reminderRecipients.map((recipient, rIdx) => (
                              <div key={rIdx} style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '8px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                              }}>
                                <select
                                  value={recipient.type}
                                  onChange={(e) => handleUpdateRecipient(step.id, rIdx, {
                                    type: e.target.value as 'email' | 'channel' | 'region',
                                    value: e.target.value === 'email' ? '' : (e.target.value === 'channel' ? CHANNEL_OPTIONS[0] : REGION_OPTIONS[0])
                                  })}
                                  className="form-control"
                                  style={{ width: '150px' }}
                                >
                                  <option value="email">Email</option>
                                  <option value="channel">Users by Channel</option>
                                  <option value="region">Users by Region</option>
                                </select>
                                {recipient.type === 'email' ? (
                                  <input
                                    type="email"
                                    value={recipient.value}
                                    onChange={(e) => handleUpdateRecipient(step.id, rIdx, { value: e.target.value })}
                                    className={`form-control ${errors[`step_${step.id}_recipient_${rIdx}`] ? 'error' : ''}`}
                                    placeholder="email@company.com"
                                    style={{ flex: 1 }}
                                  />
                                ) : recipient.type === 'channel' ? (
                                  <select
                                    value={recipient.value}
                                    onChange={(e) => handleUpdateRecipient(step.id, rIdx, { value: e.target.value })}
                                    className="form-control"
                                    style={{ flex: 1 }}
                                  >
                                    {CHANNEL_OPTIONS.map(ch => (
                                      <option key={ch} value={ch}>{ch}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <select
                                    value={recipient.value}
                                    onChange={(e) => handleUpdateRecipient(step.id, rIdx, { value: e.target.value })}
                                    className="form-control"
                                    style={{ flex: 1 }}
                                  >
                                    {REGION_OPTIONS.map(reg => (
                                      <option key={reg} value={reg}>{reg}</option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  onClick={() => handleRemoveRecipient(step.id, rIdx)}
                                  className="btn btn-sm btn-danger"
                                >
                                  Remove
                                </button>
                                {errors[`step_${step.id}_recipient_${rIdx}`] && (
                                  <div className="error-message" style={{ fontSize: '12px' }}>
                                    {errors[`step_${step.id}_recipient_${rIdx}`]}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                              No additional recipients configured
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const hasEmail = step.reminderRecipients?.some(r => r.type === 'email')
                              handleAddRecipient(step.id, hasEmail ? 'channel' : 'email')
                            }}
                            className="btn btn-sm btn-secondary"
                            style={{ alignSelf: 'flex-start' }}
                          >
                            + Add Recipient
                          </button>
                        </div>
                      </div>

                      {/* Read-only fields display */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        <div><strong>Action Type:</strong> {step.actionType} (Read-only)</div>
                        <div style={{ marginTop: '4px' }}>
                          <strong>Status Definition Logic:</strong> {step.statusDefinitionLogic} (Read-only)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            style={{
              whiteSpace: 'nowrap',
              flexShrink: 0,
              width: 'auto',
              minWidth: '180px'
            }}
          >
            Save Template Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

