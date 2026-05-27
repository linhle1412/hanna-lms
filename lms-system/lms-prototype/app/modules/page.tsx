'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth-utils'
import Layout from '@/components/Layout'

interface Module {
  id: number
  name: string
  duration: number
  outcome: string
  tags?: string[]
  status: string
  createdBy: string
  updatedBy?: string
  createdDate: string
  updatedDate?: string
  files?: Array<{
    id: string
    fileName: string
    fileSize: number
    fileType: string
    uploadedBy: string
    uploadDate: string
  }>
  usageCount?: number
}

export default function ModulesPage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [filteredModules, setFilteredModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [durationFilter, setDurationFilter] = useState('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Module | null>(null)

  // Check authorization
  useEffect(() => {
    const authorized = hasAnyRole(['admin', 'master_role', 'root_admin', 'test_role'])
    if (!authorized) {
      router.push('/dashboard')
    }
  }, [router])

  // Load modules
  useEffect(() => {
    loadModules()
  }, [])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [modules, searchTerm, statusFilter, durationFilter])

  const loadModules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/modules')
      if (response.ok) {
        const data = await response.json()
        setModules(data)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...modules]

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(m => m.status === statusFilter)
    }

    // Duration filter
    if (durationFilter !== 'All') {
      if (durationFilter === '<2') {
        filtered = filtered.filter(m => m.duration < 2)
      } else if (durationFilter === '2-4') {
        filtered = filtered.filter(m => m.duration >= 2 && m.duration <= 4)
      } else if (durationFilter === '>4') {
        filtered = filtered.filter(m => m.duration > 4)
      }
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.outcome.toLowerCase().includes(search) ||
        (m.tags && m.tags.some(tag => tag.toLowerCase().includes(search)))
      )
    }

    setFilteredModules(filtered)
  }

  const handleDelete = async (module: Module) => {
    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Module deleted successfully')
        loadModules()
        setDeleteConfirm(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete module')
      }
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('Failed to delete module')
    }
  }

  const handleClone = (module: Module) => {
    setSelectedModule(module)
    setShowCloneModal(true)
  }

  const getStatusBadge = (status: string) => {
    const getStatusStyle = (status: string) => {
      const styles: { [key: string]: { backgroundColor: string; color: string } } = {
        ACTIVE: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
        INACTIVE: { backgroundColor: '#ffebee', color: '#c62828' },
        DRAFT: { backgroundColor: '#fff9c4', color: '#f57f17' }
      }
      return styles[status] || { backgroundColor: '#e0e0e0', color: '#666' }
    }

    const statusStyle = getStatusStyle(status)
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-block',
        ...statusStyle
      }}>
        {status}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return '🟢'
    if (status === 'INACTIVE') return '⚪'
    if (status === 'DRAFT') return '📝'
    return ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: 'Modules' }]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading modules...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[{ label: 'Modules' }]}>
      <div className="container" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📚 Module Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Add New Module
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, outcome, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          <option value="All">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
        </select>

        {/* Duration Filter */}
        <select
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          <option value="All">All Duration</option>
          <option value="<2">&lt; 2 hours</option>
          <option value="2-4">2-4 hours</option>
          <option value=">4">&gt; 4 hours</option>
        </select>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'All' || durationFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('All')
              setDurationFilter('All')
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '15px', color: '#666' }}>
        Showing {filteredModules.length} of {modules.length} modules
      </div>

      {/* Module List */}
      {filteredModules.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '2px dashed #ddd'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
          <h3 style={{ marginBottom: '10px', color: '#666' }}>No modules found</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            {searchTerm || statusFilter !== 'All' || durationFilter !== 'All'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first module'}
          </p>
          {!searchTerm && statusFilter === 'All' && durationFilter === 'All' && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Add New Module
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'auto', border: '1px solid #e0e0e0' }}>
          <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Outcome</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tags</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Usage</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created By</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module) => (
                <tr key={module.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px' }}>
                    <a
                      href={`/modules/${module.id}`}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
                      onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {module.name}
                    </a>
                  </td>
                  <td style={{ padding: '12px' }}>{module.duration} hours</td>
                  <td style={{ padding: '12px', maxWidth: '300px' }}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={module.outcome}>
                      {module.outcome}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {module.tags && module.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {module.tags && module.tags.length > 2 && (
                        <span style={{ fontSize: '12px', color: '#666' }}>+{module.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {getStatusBadge(module.status)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {module.usageCount || 0} product(s)
                  </td>
                  <td style={{ padding: '12px' }}>{module.createdBy}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div className="table-actions">
                      <button
                        onClick={() => handleClone(module)}
                        className="action-icon clone"
                        title="Clone Module"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(module)}
                        className="action-icon delete"
                        title="Delete Module"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Module Modal */}
      {showCreateModal && (
        <CreateModuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadModules()
          }}
        />
      )}

      {/* Clone Module Modal */}
      {showCloneModal && selectedModule && (
        <CloneModuleModal
          module={selectedModule}
          onClose={() => {
            setShowCloneModal(false)
            setSelectedModule(null)
          }}
          onSuccess={() => {
            setShowCloneModal(false)
            setSelectedModule(null)
            loadModules()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Delete Module?</h3>
            <p style={{ marginBottom: '8px' }}>⚠️ Are you sure you want to delete this module?</p>
            <p style={{ marginBottom: '16px', fontWeight: '500' }}>
              Module Name: {deleteConfirm.name}
            </p>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete Module
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}

// Create Module Modal Component
function CreateModuleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    duration: 0.5,
    outcome: '',
    tags: '',
    status: 'DRAFT'
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Module name is required'
    }
    if (formData.duration < 0.5 || formData.duration > 40) {
      newErrors.duration = 'Duration must be between 0.5 and 40 hours'
    }
    if (!formData.outcome.trim()) {
      newErrors.outcome = 'Learning outcome is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setSubmitting(true)
      const currentUser = sessionStorage.getItem('userName') || 'System'
      
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          createdBy: currentUser
        })
      })

      if (response.ok) {
        alert('Module created successfully!')
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create module')
      }
    } catch (error) {
      console.error('Error creating module:', error)
      alert('Failed to create module')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Module</h2>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Module Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${errors.name ? 'red' : '#ddd'}`,
                borderRadius: '4px'
              }}
              placeholder="Enter module name"
            />
            {errors.name && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Duration (hours) <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="40"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${errors.duration ? 'red' : '#ddd'}`,
                borderRadius: '4px'
              }}
            />
            {errors.duration && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.duration}</div>}
          </div>

          {/* Outcome */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Learning Outcome <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${errors.outcome ? 'red' : '#ddd'}`,
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Describe the expected learning outcomes"
            />
            {errors.outcome && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.outcome}</div>}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="e.g., Insurance, Sales, Basics"
            />
          </div>

          {/* Status */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Status <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Creating...' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Clone Module Modal Component
function CloneModuleModal({ module, onClose, onSuccess }: { module: Module; onClose: () => void; onSuccess: () => void }) {
  const [newName, setNewName] = useState(`${module.name} (Copy)`)
  const [copyFiles, setCopyFiles] = useState(true)
  const [copyTags, setCopyTags] = useState(true)
  const [setDraft, setSetDraft] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newName.trim()) {
      alert('Please enter a name for the cloned module')
      return
    }

    try {
      setSubmitting(true)
      const currentUser = sessionStorage.getItem('userName') || 'System'
      
      const response = await fetch(`/api/modules/${module.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName,
          copyFiles,
          copyTags,
          setDraft,
          clonedBy: currentUser
        })
      })

      if (response.ok) {
        alert('Module cloned successfully!')
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to clone module')
      }
    } catch (error) {
      console.error('Error cloning module:', error)
      alert('Failed to clone module')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Clone Module</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#666' }}>
              Source Module:
            </label>
            <div style={{ fontWeight: '500' }}>{module.name}</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              New Module Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={copyFiles}
                onChange={(e) => setCopyFiles(e.target.checked)}
              />
              <span>Copy attached files</span>
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={copyTags}
                onChange={(e) => setCopyTags(e.target.checked)}
              />
              <span>Copy tags</span>
            </label>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={setDraft}
                onChange={(e) => setSetDraft(e.target.checked)}
              />
              <span>Set as DRAFT status</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Cloning...' : 'Clone Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

