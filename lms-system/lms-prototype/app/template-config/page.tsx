'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useToast } from '@/contexts/ToastContext'
import { templateAPI, userAPI } from '@/lib/api'
import { getUserRoles } from '@/lib/auth-utils'
import type { ChecklistTemplate, ChecklistStep, ReminderRecipient, User } from '@/lib/state'

export default function TemplateConfigPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Authorization check - Root Admin only
  useEffect(() => {
    const roles = getUserRoles()
    const isRootAdmin = roles.some(role => role === 'root_admin')
    
    if (!isRootAdmin) {
      router.push('/dashboard')
      showToast('Access denied. Root Admin only.', 'error')
    }
  }, [router, showToast])

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await templateAPI.getAll()
      // Only show default templates (system templates)
      const defaultTemplates = data.filter(t => t.isDefault)
      setTemplates(defaultTemplates)
      
      // Auto-select first template
      if (defaultTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(defaultTemplates[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showToast('Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
  }

  const handleStepUpdate = (stepId: number, updates: {
    pic?: string
    reminderTiming?: ChecklistStep['reminderTiming']
    reminderRecipients?: ReminderRecipient[]
  }) => {
    if (!selectedTemplate) return

    const updatedSteps = selectedTemplate.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          pic: updates.pic !== undefined ? updates.pic : step.pic,
          reminderTiming: updates.reminderTiming !== undefined ? updates.reminderTiming : step.reminderTiming,
          reminderRecipients: updates.reminderRecipients !== undefined ? updates.reminderRecipients : step.reminderRecipients
        }
      }
      return step
    })

    setSelectedTemplate({
      ...selectedTemplate,
      steps: updatedSteps
    })
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    try {
      setSaving(true)
      await templateAPI.update(selectedTemplate.id, {
        steps: selectedTemplate.steps
      })
      showToast('Template configuration saved successfully', 'success')
      await loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      showToast('Failed to save template configuration', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#666' }}></i>
          <p style={{ marginTop: '12px', color: '#666' }}>Loading templates...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>📋 Checklist Template Configuration</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Configure system templates. Only PIC, Reminder Timing, and Reminder Recipients can be edited.
          </p>
        </div>

        {/* Template Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Select Template:
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                style={{
                  padding: '12px 24px',
                  border: selectedTemplate?.id === template.id ? '2px solid #2196f3' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: selectedTemplate?.id === template.id ? '#e3f2fd' : '#fff',
                  cursor: 'pointer',
                  fontWeight: selectedTemplate?.id === template.id ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <>
            <div style={{
              padding: '16px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <strong>⚠️ Note:</strong> Only PIC, Reminder Timing, and Additional Recipients can be configured.
              All other fields are system-defined and read-only.
            </div>

            {/* Steps Configuration */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: '600'
              }}>
                Template: {selectedTemplate.name}
              </div>

              {selectedTemplate.steps.map((step, index) => (
                <StepConfigCard
                  key={step.id}
                  step={step}
                  index={index}
                  onUpdate={(updates) => handleStepUpdate(step.id, updates)}
                />
              ))}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => router.back()}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={saving}
                style={{
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  width: 'auto',
                  minWidth: '180px'
                }}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Saving...
                  </>
                ) : (
                  'Save Template Configuration'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

interface StepConfigCardProps {
  step: ChecklistStep
  index: number
  onUpdate: (updates: {
    pic?: string
    reminderTiming?: ChecklistStep['reminderTiming']
    reminderRecipients?: ReminderRecipient[]
  }) => void
}

function StepConfigCard({ step, index, onUpdate }: StepConfigCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [pic, setPic] = useState(step.pic)
  const [reminderType, setReminderType] = useState(step.reminderTiming?.type || 'none')
  const [reminderStart, setReminderStart] = useState(step.reminderTiming?.start || '')
  const [reminderEnd, setReminderEnd] = useState(step.reminderTiming?.end || '')
  const [reminderRecipients, setReminderRecipients] = useState<ReminderRecipient[]>(
    step.reminderRecipients || []
  )

  // Steps that support reminder configuration
  const STEPS_WITH_REMINDERS = [
    'Verify AOL information',
    'Verify MOF information',
    'Enter MOF exam code',
    'Export Participants for MOF exam'
  ]

  // Check if this step supports reminder configuration
  const supportsReminders = STEPS_WITH_REMINDERS.includes(step.name)

  const PIC_OPTIONS = [
    'Course Supporters',
    'Head Channel, Lead Region',
    'External API',
    'AA Admin',
    'System or Admin'
  ]

  const REMINDER_TYPES = [
    { value: 'none', label: 'No Reminder' },
    { value: 'daily', label: 'Daily' },
    { value: 'date_based', label: 'Date-based' },
    { value: 'course_date_relative', label: 'Course Date Relative' }
  ]

  const REMINDER_START_OPTIONS = [
    { value: 'course_creation', label: 'Course Creation' },
    { value: 'course_start', label: 'Course Start Date' },
    { value: 'course_end', label: 'Course End Date' },
    { value: 'custom', label: 'Custom Date' }
  ]

  const REMINDER_END_OPTIONS = [
    { value: 'when_done', label: 'When Action is Done' },
    { value: 'course_start', label: 'Course Start Date' },
    { value: 'course_end', label: 'Course End Date' },
    { value: 'never', label: 'Never' }
  ]

  const handleSave = () => {
    onUpdate({
      pic,
      reminderTiming: supportsReminders ? {
        type: reminderType as any,
        start: reminderStart,
        end: reminderEnd
      } : undefined,
      reminderRecipients: supportsReminders ? reminderRecipients : undefined
    })
  }

  return (
    <div style={{
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#fff'
    }}>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            Step #{step.order}: {step.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            PIC: {step.pic} | Action: {step.actionType}
          </div>
        </div>
        <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} style={{ color: '#666' }}></i>
      </div>

      {expanded && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #e0e0e0'
        }}>
          {/* Read-only fields */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              <strong>Read-only Fields:</strong>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <div><strong>Step Name:</strong> {step.name}</div>
              <div><strong>Action Type:</strong> {step.actionType}</div>
              <div><strong>Status Logic:</strong> {step.statusDefinitionLogic}</div>
            </div>
          </div>

          {/* Configurable: PIC */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Person In Charge (PIC) *:
            </label>
            <select
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {PIC_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Configurable: Reminder Timing - Only show for steps that support reminders */}
          {supportsReminders && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Reminder Timing:
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                    Frequency:
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as 'none' | 'daily' | 'date_based' | 'course_date_relative')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {REMINDER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                {reminderType !== 'none' && (
                  <>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                        Start:
                      </label>
                      <select
                        value={reminderStart}
                        onChange={(e) => setReminderStart(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        {REMINDER_START_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                        Stop:
                      </label>
                      <select
                        value={reminderEnd}
                        onChange={(e) => setReminderEnd(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        {REMINDER_END_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Configurable: Reminder Recipients - Only show for steps that support reminders */}
          {supportsReminders && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Also send reminder to:
              </label>
              <ReminderRecipientConfig
                recipients={reminderRecipients}
                onChange={setReminderRecipients}
              />
            </div>
          )}

          {/* Save button for this step */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0,
                width: 'auto',
                minWidth: '120px'
              }}
            >
              Save Step Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ReminderRecipientConfigProps {
  recipients: ReminderRecipient[]
  onChange: (recipients: ReminderRecipient[]) => void
}

function ReminderRecipientConfig({ recipients, onChange }: ReminderRecipientConfigProps) {
  const [newRecipientType, setNewRecipientType] = useState<'email' | 'user'>('email')
  const [newRecipientValue, setNewRecipientValue] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (newRecipientType === 'user') {
      loadUsers()
    } else {
      setUsers([])
      setUserSearchTerm('')
      setShowUserDropdown(false)
    }
  }, [newRecipientType])

  const loadUsers = async (search?: string) => {
    try {
      setLoadingUsers(true)
      const data = await userAPI.getAll({ search: search || userSearchTerm })
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (newRecipientType === 'user') {
      const debounceTimer = setTimeout(() => {
        loadUsers(userSearchTerm)
      }, 300)
      return () => clearTimeout(debounceTimer)
    }
  }, [userSearchTerm, newRecipientType])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true
    const searchLower = userSearchTerm.toLowerCase()
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const handleAdd = () => {
    if (!newRecipientValue.trim()) return

    let newRecipient: ReminderRecipient

    if (newRecipientType === 'user') {
      const selectedUser = users.find(u => u.id.toString() === newRecipientValue)
      if (!selectedUser) return

      newRecipient = {
        type: 'user',
        value: selectedUser.id.toString(),
        label: `${selectedUser.username} (${selectedUser.email})`,
        userId: selectedUser.id,
        userEmail: selectedUser.email
      }
    } else {
      // Email type
      newRecipient = {
        type: 'email',
        value: newRecipientValue.trim(),
        label: newRecipientValue.trim()
      }
    }

    onChange([...recipients, newRecipient])
    setNewRecipientValue('')
    setUserSearchTerm('')
    setShowUserDropdown(false)
  }

  const handleRemove = (index: number) => {
    onChange(recipients.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* Existing recipients */}
      {recipients.map((recipient, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        >
          <span style={{ flex: 1, fontSize: '14px' }}>
            {recipient.type === 'email' && '📧'}
            {recipient.type === 'user' && '👤'}
            {' '}
            {recipient.label || recipient.value}
          </span>
          <button
            onClick={() => handleRemove(index)}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: '#dc3545',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add new recipient */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            Type:
          </label>
          <select
            value={newRecipientType}
            onChange={(e) => setNewRecipientType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="email">Email</option>
            <option value="user">User</option>
          </select>
        </div>
        <div style={{ flex: 2, position: 'relative' }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            {newRecipientType === 'email' ? 'Email Address:' : 'Select User:'}
          </label>
          {newRecipientType === 'email' ? (
            <input
              type="email"
              value={newRecipientValue}
              onChange={(e) => setNewRecipientValue(e.target.value)}
              placeholder="email@example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          ) : (
            <div style={{ position: 'relative' }} data-user-dropdown>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value)
                  setShowUserDropdown(true)
                }}
                onFocus={() => setShowUserDropdown(true)}
                placeholder="Search by username or email..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              {showUserDropdown && (
                <div
                  data-user-dropdown
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {loadingUsers ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setNewRecipientValue(user.id.toString())
                          setUserSearchTerm(`${user.username} (${user.email})`)
                          setShowUserDropdown(false)
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff'
                        }}
                      >
                        <div style={{ fontWeight: '500' }}>{user.username}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newRecipientValue.trim()}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: !newRecipientValue.trim() ? '#ccc' : '#007bff',
            color: '#fff',
            borderRadius: '4px',
            cursor: !newRecipientValue.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            height: '38px',
            alignSelf: 'flex-end',
            flexShrink: 0,
            width: 'auto',
            minWidth: '80px'
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}

