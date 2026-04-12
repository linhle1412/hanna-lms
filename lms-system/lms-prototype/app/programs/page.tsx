'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { programAPI } from '@/lib/api'
import type { Program } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import { hasAnyRole } from '@/lib/auth-utils'

export default function ProgramsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All'
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const canManage = hasAnyRole(['admin', 'master_role', 'root_admin'])

  useEffect(() => {
    const authorized = hasAnyRole(['admin', 'master_role', 'root_admin', 'trainer', 'lead_region', 'head_channel'])
    if (!authorized) {
      router.push('/dashboard')
    }
  }, [router])

  useEffect(() => {
    loadPrograms()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [programs, filters])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const data = await programAPI.getAll()
      setPrograms(data)
    } catch (error) {
      console.error('Failed to load programs:', error)
      showToast('Failed to load programs', 'error')
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...programs]

    // Type filter
    if (filters.type !== 'All') {
      filtered = filtered.filter(p => p.type === filters.type)
    }

    // Status filter
    if (filters.status !== 'All') {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.licenseType && p.licenseType.toLowerCase().includes(search))
      )
    }

    setFilteredPrograms(filtered)
  }

  const handleCreateProgram = () => {
    router.push('/programs/create')
  }

  const handleEditProgram = (programId: number) => {
    router.push(`/programs/${programId}/edit`)
  }

  const handleViewProgram = (programId: number) => {
    router.push(`/programs/${programId}`)
  }

  const handleCloneProgram = (program: Program) => {
    setSelectedProgram(program)
    setShowCloneModal(true)
  }

  const handleDeleteProgram = (program: Program) => {
    setSelectedProgram(program)
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const confirmClone = async () => {
    if (!selectedProgram) return

    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: `${selectedProgram.name} - Copy`,
          copyStages: true,
          copyFiles: false,
          copyTags: true,
          setInactive: false
        })
      })

      if (!response.ok) throw new Error('Clone failed')

      const clonedProgram = await response.json()
      showToast(`Program cloned successfully: ${clonedProgram.name}`, 'success')
      setShowCloneModal(false)
      loadPrograms()
      router.push(`/programs/${clonedProgram.id}`)
    } catch (error) {
      console.error('Failed to clone program:', error)
      showToast('Failed to clone program', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!selectedProgram || deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    try {
      await programAPI.delete(selectedProgram.id)
      showToast(`Program "${selectedProgram.name}" deleted successfully`, 'success')
      setShowDeleteModal(false)
      loadPrograms()
    } catch (error) {
      console.error('Failed to delete program:', error)
      showToast('Failed to delete program', 'error')
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SHINE': return '#0097A9'
      case 'Product': return '#28a745'
      case 'Skill': return '#ffc107'
      default: return '#6c757d'
    }
  }

  const columns: Column<Program>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (program) => (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault()
            handleViewProgram(program.id)
          }}
          style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', fontWeight: '500' }}
        >
          {program.name}
        </a>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (program) => {
        const desc = program.description || 'No description'
        return (
          <span title={desc}>
            {desc.length > 100 ? `${desc.substring(0, 100)}...` : desc}
          </span>
        )
      }
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (program) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getTypeBadgeColor(program.type) + '20',
          color: getTypeBadgeColor(program.type),
          border: `1px solid ${getTypeBadgeColor(program.type)}`
        }}>
          {program.type}
        </span>
      )
    },
    {
      key: 'licenseType',
      label: 'License',
      sortable: true
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (program) => `${program.duration} days`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (program) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: program.status === 'ACTIVE' ? '#e8f5e9' : '#ffebee',
          color: program.status === 'ACTIVE' ? '#2e7d32' : '#c62828'
        }}>
          {program.status}
        </span>
      )
    }
  ]

  if (canManage) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      render: (program) => (
        <div className="table-actions">
          <button 
            className="action-icon view" 
            title="View Details"
            onClick={() => handleViewProgram(program.id)}
          >
            <i className="fas fa-eye"></i>
          </button>
          <button 
            className="action-icon edit" 
            title="Edit Program"
            onClick={() => handleEditProgram(program.id)}
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            className="action-icon clone" 
            title="Clone Program"
            onClick={() => handleCloneProgram(program)}
          >
            <i className="fas fa-copy"></i>
          </button>
          <button 
            className="action-icon delete" 
            title="Delete Program"
            onClick={() => handleDeleteProgram(program)}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      )
    })
  }

  return (
    <Layout breadcrumbs={[{ label: 'Program Management' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Program Management</h1>
        {canManage && (
          <button className="btn-primary" onClick={handleCreateProgram}>
            <i className="fas fa-plus"></i> Add New Program
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="search-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, description, license..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="All">All Types</option>
          <option value="SHINE">SHINE</option>
          <option value="Product">Product</option>
          <option value="Skill">Skill</option>
        </select>
        <select 
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="All">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading programs...</div>
      ) : filteredPrograms.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>📋</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>No programs found</h3>
          <p style={{ margin: '0 0 20px 0', color: '#999' }}>
            {filters.search || filters.type !== 'All' || filters.status !== 'All' 
              ? 'Try adjusting your filters'
              : 'Get started by creating your first program'
            }
          </p>
          {canManage && !filters.search && filters.type === 'All' && filters.status === 'All' && (
            <button className="btn-primary" onClick={handleCreateProgram}>
              <i className="fas fa-plus"></i> Add New Program
            </button>
          )}
        </div>
      ) : (
        <DataTable
          data={filteredPrograms}
          columns={columns}
          emptyMessage="No programs found"
        />
      )}

      {/* Clone Modal */}
      {showCloneModal && selectedProgram && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Clone Program</h3>
              <button className="close-btn" onClick={() => setShowCloneModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Create a copy of "{selectedProgram.name}" with all configurations and stages.
              </p>
              <div className="form-group">
                <label>New Program Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${selectedProgram.name} - Copy`}
                  readOnly
                />
              </div>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" defaultChecked disabled />
                  Copy all stages and products
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" />
                  Copy attached files
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" defaultChecked disabled />
                  Copy tags
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" />
                  Set cloned program as INACTIVE
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCloneModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmClone}>
                <i className="fas fa-copy"></i> Clone Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProgram && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>⚠️ Delete Program</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px' }}>
                Are you sure you want to delete this program?
              </p>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '6px',
                marginBottom: '15px',
                border: '1px solid #dee2e6'
              }}>
                <div><strong>Program:</strong> {selectedProgram.name}</div>
                <div><strong>Type:</strong> {selectedProgram.type}</div>
                <div><strong>Status:</strong> {selectedProgram.status}</div>
              </div>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Warning:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>This action cannot be undone</li>
                  <li>Courses associated with this program will remain but lose program link</li>
                </ul>
              </div>
              <div className="form-group">
                <label>To confirm, type <strong>DELETE</strong> in the box below:</label>
                <input
                  type="text"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{ 
                  backgroundColor: '#dc3545',
                  opacity: deleteConfirmText !== 'DELETE' ? 0.5 : 1
                }}
              >
                <i className="fas fa-trash"></i> Delete Program
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}









