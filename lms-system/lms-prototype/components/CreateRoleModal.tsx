'use client'

import { useState, useEffect } from 'react'
import { Permission } from '@/lib/permissions'

interface CreateRoleModalProps {
  allPermissions: Permission[]
  onSave: (role: {
    roleName: string
    description: string
    permissions: string[]
  }) => Promise<void>
  onClose: () => void
}

export default function CreateRoleModal({
  allPermissions,
  onSave,
  onClose,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const categoryLabels: Record<string, string> = {
    calendar: '📅 CALENDAR PERMISSIONS',
    course: '📚 COURSE MANAGEMENT PERMISSIONS',
    participant: '👥 PARTICIPANT MANAGEMENT PERMISSIONS',
    content: '📖 CONTENT MANAGEMENT PERMISSIONS',
    report: '📊 REPORT PERMISSIONS',
    admin: '⚙️ ADMIN PERMISSIONS',
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    )
  }

  const handleSave = async () => {
    if (!roleName.trim()) {
      alert('Role name is required')
      return
    }

    if (!description.trim()) {
      alert('Description is required')
      return
    }

    setSaving(true)
    try {
      await onSave({
        roleName: roleName.trim(),
        description: description.trim(),
        permissions: selectedPermissions,
      })
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Don't render until mounted (client-side only)
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
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Create New Role</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="roleName" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Role Name *
            </label>
            <input
              id="roleName"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., SENIOR_TRAINER"
              maxLength={50}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this role"
              rows={3}
              maxLength={255}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <h3>Permissions (Select all that apply)</h3>

          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <div key={category} className="permission-category">
              <h4>{categoryLabels[category] || category.toUpperCase()}</h4>
              {permissions.map(perm => (
                <label key={perm.id} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <span className="permission-label">
                    {perm.feature}
                    {perm.description && <span className="permission-desc"> - {perm.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          ))}

          <div className="permission-summary">
            <strong>Summary:</strong> {selectedPermissions.length} of {allPermissions.length} permissions selected
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

