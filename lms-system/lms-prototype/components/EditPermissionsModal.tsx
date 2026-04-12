'use client'

import { useState, useEffect } from 'react'
import { Permission, RolePermissions } from '@/lib/permissions'

interface EditPermissionsModalProps {
  role: RolePermissions
  allPermissions: Permission[]
  onSave: (permissions: string[], roleName?: string, description?: string) => void
  onClose: () => void
}

export default function EditPermissionsModal({
  role,
  allPermissions,
  onSave,
  onClose,
}: EditPermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions)
  const [roleName, setRoleName] = useState(role.roleName)
  const [description, setDescription] = useState(role.description)
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

  const handleSave = () => {
    // For custom roles, pass name and description for update
    if (!role.isSystemRole) {
      onSave(selectedPermissions, roleName, description)
    } else {
      // For system roles, only permissions can be updated
      onSave(selectedPermissions)
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
          <h2>Edit Permissions: {role.isSystemRole ? role.roleName : roleName}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
          <div className="role-info-box">
            {role.isSystemRole ? (
              <>
                <p><strong>Role Name:</strong> {role.roleName}</p>
                <p><strong>Description:</strong> {role.description}</p>
                <p><strong>Type:</strong> 🔒 System Role (cannot be deleted or renamed)</p>
              </>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="editRoleName" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Role Name *
                  </label>
                  <input
                    id="editRoleName"
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    maxLength={50}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="editDescription" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    id="editDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={255}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <p><strong>Type:</strong> Custom Role (can be edited or deleted)</p>
              </>
            )}
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
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

