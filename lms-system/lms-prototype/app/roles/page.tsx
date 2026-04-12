'use client'

import { useState, useEffect } from 'react'
import { AVAILABLE_PERMISSIONS, RolePermissions } from '@/lib/permissions'
import { useToast } from '@/contexts/ToastContext'
import EditPermissionsModal from '@/components/EditPermissionsModal'
import CreateRoleModal from '@/components/CreateRoleModal'
import Layout from '@/components/Layout'

function RolePermissionManagement() {
  const [roles, setRoles] = useState<RolePermissions[]>([])
  const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadRoles()
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showEditModal || showCreateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showEditModal, showCreateModal])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        showToast('Failed to load roles', 'error')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      showToast('Failed to load roles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = (role: RolePermissions) => {
    setSelectedRole(role)
    setShowEditModal(true)
  }

  const handleSavePermissions = async (
    updatedPermissions: string[], 
    roleName?: string, 
    description?: string
  ) => {
    if (!selectedRole) return

    try {
      const updateData: any = { permissions: updatedPermissions }
      
      // For custom roles, include name and description if provided
      if (!selectedRole.isSystemRole) {
        if (roleName) updateData.roleName = roleName
        if (description) updateData.description = description
      }

      const response = await fetch(`/api/roles/${selectedRole.roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedRole = await response.json()
        setRoles(roles.map(r => r.roleId === selectedRole.roleId ? updatedRole : r))
        showToast('Role updated successfully', 'success')
        setShowEditModal(false)
        setSelectedRole(null)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to update role', 'error')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      showToast('Failed to update role', 'error')
    }
  }

  const handleCreateRole = async (roleData: {
    roleName: string
    description: string
    permissions: string[]
  }) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      })

      if (response.ok) {
        const newRole = await response.json()
        setRoles([...roles, newRole])
        showToast('Role created successfully', 'success')
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to create role', 'error')
        throw new Error(error.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRoles(roles.filter(r => r.roleId !== roleId))
        showToast('Role deleted successfully', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to delete role', 'error')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      showToast('Failed to delete role', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>🔐 Role & Permission Management</h1>
        <p>Loading roles...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1>🔐 Role & Permission Management</h1>

      <div className="info-banner">
        <p>ℹ️ Configure what each role can do in the system. System roles cannot be deleted. Custom roles can be created and deleted.</p>
      </div>

      <div className="roles-list">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <h2 style={{ margin: 0, flex: 1 }}>Role List</h2>
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateModal(true)}
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            ➕ Add New Role
          </button>
        </div>

        {roles.map(role => (
          <div key={role.roleId} className="role-card">
            <div className="role-header">
              <div>
                <h3>
                  {role.isSystemRole && '🔒 '}
                  {role.roleName}
                </h3>
                <p className="role-meta">
                  {role.isSystemRole ? 'System Role' : 'Custom Role'} • {role.permissions.length} permissions assigned
                </p>
                <p className="role-description">{role.description}</p>
              </div>
              <div className="role-actions">
                <button onClick={() => handleEditRole(role)} className="btn-secondary">
                  Edit Permissions
                </button>
                {!role.isSystemRole && (
                  <button 
                    onClick={() => handleDeleteRole(role.roleId, role.roleName)} 
                    className="btn-danger"
                    style={{ marginLeft: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <EditPermissionsModal
          role={selectedRole}
          allPermissions={AVAILABLE_PERMISSIONS}
          onSave={handleSavePermissions}
          onClose={() => {
            setShowEditModal(false)
            setSelectedRole(null)
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRoleModal
          allPermissions={AVAILABLE_PERMISSIONS}
          onSave={handleCreateRole}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

export default function RolePermissionPage() {
  return (
    <Layout breadcrumbs={[{ label: 'Role & Permission Management' }]}>
      <RolePermissionManagement />
    </Layout>
  )
}

