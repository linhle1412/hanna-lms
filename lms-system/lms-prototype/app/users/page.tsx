'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { userAPI } from '@/lib/api'
import type { User } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import CreateUserModal, { type UserFormData } from '@/components/CreateUserModal'

export default function UserManagementPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({ search: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll(filters)
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
    }
  }

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      await userAPI.create(userData)
      showToast('User created successfully', 'success')
      setShowCreateModal(false)
      loadUsers() // Reload the user list
    } catch (error) {
      console.error('Failed to create user:', error)
      showToast('Failed to create user. Please try again.', 'error')
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'username',
      label: 'Username',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (user) => user.roles.join(', ')
    },
    {
      key: 'team',
      label: 'Team',
      sortable: true
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => <a href="#">View</a>
    }
  ]

  return (
    <Layout breadcrumbs={[{ label: 'User Management' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>User Management</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => setShowCreateModal(true)}>+ Add New User</button>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search by username, email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <DataTable
        data={users}
        columns={columns}
        emptyMessage="No users found"
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onSave={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </Layout>
  )
}

