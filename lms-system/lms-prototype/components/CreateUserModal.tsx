'use client'

import React, { useState, useEffect } from 'react'
import { UserRole } from '@/lib/auth-utils'
import { RolePermissions } from '@/lib/permissions'

interface CreateUserModalProps {
  onSave: (userData: UserFormData) => void
  onClose: () => void
}

export interface UserFormData {
  username: string
  email: string
  team: string
  roles: UserRole[]
  channel?: string
  region?: string
}

const TEAM_OPTIONS = ['Admin', 'Trainer', 'None']

const CHANNEL_OPTIONS = ['Agency', 'Banca', 'IFA', 'Banker']

const REGION_OPTIONS = ['South', 'Middle', 'North', 'Central']

export default function CreateUserModal({ onSave, onClose }: CreateUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    team: '',
    roles: [],
    channel: '',
    region: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const [roles, setRoles] = useState<RolePermissions[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    setMounted(true)
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        console.error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.team) {
      errors.team = 'Team is required'
    }

    if (formData.roles.length === 0) {
      errors.roles = 'At least one role must be selected'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Convert roleIds to roleNames in uppercase format for storage
      // Users.json stores role names (e.g., 'TRAINER', 'LEAD_REGION', 'SENIOR_TRAINER')
      const dataToSave = {
        ...formData,
        roles: formData.roles.map(roleId => {
          const role = roles.find(r => r.roleId === roleId)
          return role ? role.roleName : roleId.toUpperCase()
        }) as any
      }
      onSave(dataToSave)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
    // Clear role error when user selects a role
    if (fieldErrors.roles) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.roles
        return newErrors
      })
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Create New User</h2>
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
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ 
            padding: '24px',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 140px)'
          }}>
            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                User Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${fieldErrors.username ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              {fieldErrors.username && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.username}
                </div>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Email <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${fieldErrors.email ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              {fieldErrors.email && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Team */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Team <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${fieldErrors.team ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select team</option>
                {TEAM_OPTIONS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {fieldErrors.team && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.team}
                </div>
              )}
            </div>

            {/* Channel */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Channel <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional - Required for auto-determining trainer title)</span>
              </label>
              <select
                value={formData.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select channel (optional)</option>
                {CHANNEL_OPTIONS.map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Region <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional - Required for LEAD/TRAINER roles)</span>
              </label>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select region (optional)</option>
                {REGION_OPTIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Roles Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                Roles <span style={{ color: 'red' }}>*</span>
              </label>
              {loadingRoles ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Loading roles...
                </div>
              ) : (
                <div style={{
                  border: `1px solid ${fieldErrors.roles ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  padding: '12px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    Select one or more roles for this user:
                  </div>
                  
                  {/* System Roles */}
                  {roles.filter(r => r.isSystemRole).length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                        🔒 System Roles
                      </div>
                      {roles.filter(r => r.isSystemRole).map(role => (
                        <div
                          key={role.roleId}
                          style={{
                            marginBottom: '8px',
                            padding: '10px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            gap: '10px'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.roles.includes(role.roleId)}
                              onChange={() => handleRoleToggle(role.roleId)}
                              style={{
                                marginTop: '2px',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                {role.roleName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {role.description}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom Roles */}
                  {roles.filter(r => !r.isSystemRole).length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                        Custom Roles
                      </div>
                      {roles.filter(r => !r.isSystemRole).map(role => (
                        <div
                          key={role.roleId}
                          style={{
                            marginBottom: '8px',
                            padding: '10px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            gap: '10px'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.roles.includes(role.roleId)}
                              onChange={() => handleRoleToggle(role.roleId)}
                              style={{
                                marginTop: '2px',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                {role.roleName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {role.description}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {roles.length === 0 && !loadingRoles && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No roles available
                    </div>
                  )}
                </div>
              )}
              {fieldErrors.roles && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.roles}
                </div>
              )}
              {formData.roles.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#0066cc' }}>
                  Selected: {formData.roles.map(roleId => {
                    const role = roles.find(r => r.roleId === roleId)
                    return role ? role.roleName : roleId
                  }).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="modal-footer-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create User
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

