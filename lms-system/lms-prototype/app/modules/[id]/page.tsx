'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function ModuleDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = params?.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<Module>>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [deleteFileConfirm, setDeleteFileConfirm] = useState<string | null>(null)

  // Check authorization
  useEffect(() => {
    const authorized = hasAnyRole(['admin', 'master_role', 'root_admin'])
    if (!authorized) {
      router.push('/dashboard')
    }
  }, [router])

  // Load module
  useEffect(() => {
    if (moduleId) {
      loadModule()
    }
  }, [moduleId])

  const loadModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules/${moduleId}`)
      if (response.ok) {
        const data = await response.json()
        setModule(data)
        setFormData(data)
      } else {
        alert('Module not found')
        router.push('/modules')
      }
    } catch (error) {
      console.error('Error loading module:', error)
      alert('Failed to load module')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Module name is required'
    }
    if (!formData.duration || formData.duration < 0.5 || formData.duration > 40) {
      newErrors.duration = 'Duration must be between 0.5 and 40 hours'
    }
    if (!formData.outcome?.trim()) {
      newErrors.outcome = 'Learning outcome is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      const currentUser = sessionStorage.getItem('userName') || 'System'
      
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updatedBy: currentUser
        })
      })

      if (response.ok) {
        alert('Module updated successfully!')
        setEditMode(false)
        loadModule()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update module')
      }
    } catch (error) {
      console.error('Error updating module:', error)
      alert('Failed to update module')
    }
  }

  const handleCancel = () => {
    setFormData(module || {})
    setErrors({})
    setEditMode(false)
  }

  const handleDeleteFile = (fileId: string) => {
    // In a real system, this would call an API to delete the file
    // For now, we'll just remove it from the local state
    const updatedFiles = (module?.files || []).filter(f => f.id !== fileId)
    setModule({ ...module!, files: updatedFiles })
    setDeleteFileConfirm(null)
    alert('File deleted successfully')
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📈'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('zip') || fileType.includes('compressed')) return '📦'
    return '📎'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: 'Modules', href: '/modules' }, { label: 'Loading...' }]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading module...</p>
        </div>
      </Layout>
    )
  }

  if (!module) {
    return (
      <Layout breadcrumbs={[{ label: 'Modules', href: '/modules' }, { label: 'Not Found' }]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Module not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[{ label: 'Modules', href: '/modules' }, { label: module.name }]}>
      <div className="container" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            📚 {module.name}
          </h1>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0097A9',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Edit Module
            </button>
          )}
        </div>
      </div>

      {/* General Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          General Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Module Name {editMode && <span style={{ color: 'red' }}>*</span>}
            </label>
            {editMode ? (
              <>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${errors.name ? 'red' : '#ddd'}`,
                    borderRadius: '4px'
                  }}
                />
                {errors.name && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
              </>
            ) : (
              <div style={{ padding: '8px 0' }}>{module.name}</div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Duration (hours) {editMode && <span style={{ color: 'red' }}>*</span>}
            </label>
            {editMode ? (
              <>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="40"
                  value={formData.duration || 0}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${errors.duration ? 'red' : '#ddd'}`,
                    borderRadius: '4px'
                  }}
                />
                {errors.duration && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.duration}</div>}
              </>
            ) : (
              <div style={{ padding: '8px 0' }}>{module.duration} hours</div>
            )}
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Status {editMode && <span style={{ color: 'red' }}>*</span>}
            </label>
            {editMode ? (
              <select
                value={formData.status || 'DRAFT'}
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
            ) : (
              <div style={{ padding: '8px 0' }}>{getStatusBadge(module.status)}</div>
            )}
          </div>

          {/* Usage Count */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Usage
            </label>
            <div style={{ padding: '8px 0' }}>{module.usageCount || 0} product(s)</div>
          </div>
        </div>

        {/* Outcome */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
            Learning Outcome {editMode && <span style={{ color: 'red' }}>*</span>}
          </label>
          {editMode ? (
            <>
              <textarea
                value={formData.outcome || ''}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${errors.outcome ? 'red' : '#ddd'}`,
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
              {errors.outcome && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.outcome}</div>}
            </>
          ) : (
            <div style={{ padding: '8px 0', lineHeight: '1.6' }}>{module.outcome}</div>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
            Tags
          </label>
          {editMode ? (
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Enter tags separated by commas"
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px 0' }}>
              {module.tags && module.tags.length > 0 ? (
                module.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '16px',
                      fontSize: '14px'
                    }}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span style={{ color: '#999' }}>No tags</span>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '20px', 
          borderTop: '1px solid #e0e0e0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            <strong>Created By:</strong> {module.createdBy} on {module.createdDate}
          </div>
          {module.updatedBy && (
            <div>
              <strong>Updated By:</strong> {module.updatedBy} on {module.updatedDate}
            </div>
          )}
        </div>

        {/* Edit Mode Buttons */}
        {editMode && (
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
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
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0097A9',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Attached Files Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Attached Files
          </h2>
          <button
            onClick={() => alert('File upload functionality would be implemented here')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0097A9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add File
          </button>
        </div>

        {module.files && module.files.length > 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>File Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Uploaded By</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Upload Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {module.files.map((file) => (
                  <tr key={file.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getFileIcon(file.fileType)}</span>
                        <span title={file.fileName}>{file.fileName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{formatFileSize(file.fileSize)}</td>
                    <td style={{ padding: '12px' }}>{file.uploadedBy}</td>
                    <td style={{ padding: '12px' }}>{formatDate(file.uploadDate)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => alert('Download functionality would be implemented here')}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#0097A9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => setDeleteFileConfirm(file.id)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            border: '2px dashed #ddd'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📎</div>
            <p style={{ color: '#666', marginBottom: '16px' }}>No files attached</p>
            <button
              onClick={() => alert('File upload functionality would be implemented here')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0097A9',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Add First File
            </button>
          </div>
        )}
      </div>

      {/* Module Usage Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          Module Usage
        </h2>
        <div style={{ color: '#666' }}>
          <p>This module is currently used in <strong>{module.usageCount || 0}</strong> product(s).</p>
          {module.usageCount && module.usageCount > 0 ? (
            <p style={{ marginTop: '12px', fontSize: '14px' }}>
              ℹ️ This module cannot be deleted while it is in use. Please remove it from all products first.
            </p>
          ) : (
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#4caf50' }}>
              ✓ This module is not currently in use and can be deleted if needed.
            </p>
          )}
        </div>
      </div>

      {/* Delete File Confirmation Modal */}
      {deleteFileConfirm && (
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
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Delete File?</h3>
            <p style={{ marginBottom: '24px' }}>
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteFileConfirm(null)}
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
                onClick={() => handleDeleteFile(deleteFileConfirm)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}

