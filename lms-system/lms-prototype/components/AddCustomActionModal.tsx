'use client'

import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api'
import type { ReminderRecipient, User } from '@/lib/state'

interface AddCustomActionModalProps {
  isOpen: boolean
  courseId: number
  courseName: string
  onClose: () => void
  onSave: (action: {
    name: string
    description?: string
    pic: string
    reminderTiming?: {
      type: 'none' | 'daily' | 'date_based' | 'course_date_relative'
      start?: string
      end?: string
    }
    reminderRecipients?: ReminderRecipient[]
  }) => Promise<void>
}

const PIC_OPTIONS = [
  'Course Supporters',
  'Head Channel, Lead Region',
  'External API',
  'AA Admin',
  'System or Admin',
  'VIP Coordinator'
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
  { value: 'course_end', label: 'Course End Date' }
]

const REMINDER_END_OPTIONS = [
  { value: 'when_done', label: 'When Action is Done' },
  { value: 'course_start', label: 'Course Start Date' },
  { value: 'course_end', label: 'Course End Date' },
  { value: 'never', label: 'Never' }
]

export default function AddCustomActionModal({
  isOpen,
  courseId,
  courseName,
  onClose,
  onSave
}: AddCustomActionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pic, setPic] = useState('Course Supporters')
  const [reminderType, setReminderType] = useState<'none' | 'daily' | 'date_based' | 'course_date_relative'>('none')
  const [reminderStart, setReminderStart] = useState('course_creation')
  const [reminderEnd, setReminderEnd] = useState('when_done')
  const [reminderRecipients, setReminderRecipients] = useState<ReminderRecipient[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('')
      setDescription('')
      setPic('Course Supporters')
      setReminderType('none')
      setReminderStart('course_creation')
      setReminderEnd('when_done')
      setReminderRecipients([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        pic,
        reminderTiming: reminderType !== 'none' ? {
          type: reminderType,
          start: reminderStart,
          end: reminderEnd
        } : undefined,
        reminderRecipients: reminderRecipients.length > 0 ? reminderRecipients : undefined
      })
      onClose()
    } catch (error) {
      console.error('Error saving custom action:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Add Custom Action to Course Checklist</h2>
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

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Course:</strong> {courseName}
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '13px' }}>
              <strong>⚠️ Note:</strong> Custom actions are specific to this course only and do not affect the template.
            </div>

            {/* Action Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Action Name: *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="e.g., VIP Coordinator Notification"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Description: (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Describe the custom action..."
              />
            </div>

            {/* PIC */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Person In Charge (PIC): *
              </label>
              <select
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                required
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

            {/* Reminder Timing */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Time to Send Reminder:
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                    Frequency:
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as any)}
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

            {/* Reminder Recipients */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Also send reminder to:
              </label>
              <ReminderRecipientConfig
                recipients={reminderRecipients}
                onChange={setReminderRecipients}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Saving...
                </>
              ) : (
                'Add Custom Action'
              )}
            </button>
          </div>
        </form>
      </div>
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
            type="button"
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
            flexShrink: 0,
            width: 'auto',
            minWidth: '80px',
            height: '38px',
            alignSelf: 'flex-end'
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
