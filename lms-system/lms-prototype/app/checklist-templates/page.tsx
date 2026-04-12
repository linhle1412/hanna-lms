'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import ChecklistTemplateModal from '@/components/ChecklistTemplateModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import type { ChecklistTemplate } from '@/lib/state'
import { getUserRoles, getCurrentUserRole } from '@/lib/auth-utils'
import { templateAPI } from '@/lib/api'

export default function ChecklistTemplatesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseTypeFilter, setCourseTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [cloningTemplate, setCloningTemplate] = useState<ChecklistTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; template: ChecklistTemplate | null }>({
    isOpen: false,
    template: null
  })

  // Authorization check - Only Root Admin can access
  useEffect(() => {
    const roles = getUserRoles()
    const userRole = getCurrentUserRole()
    const hasAccess = roles.some(role => 
      ['root_admin'].includes(role)
    ) || userRole === 'Root Admin'
    
    if (!hasAccess) {
      router.push('/dashboard')
    }
  }, [router])

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [templates, searchTerm, courseTypeFilter, statusFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await templateAPI.getAll()
      // Only show the 3 system templates (SHINE, Product, Skill defaults)
      const systemTemplates = data.filter(t => t.isDefault)
      setTemplates(systemTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
      showToast('Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...templates]

    // Course Type filter
    if (courseTypeFilter !== 'All') {
      filtered = filtered.filter(t => t.courseType === courseTypeFilter)
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        filtered = filtered.filter(t => t.isActive)
      } else if (statusFilter === 'Inactive') {
        filtered = filtered.filter(t => !t.isActive)
      }
    }

    // Type filter is not needed - only system templates are shown

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search))
      )
    }

    setFilteredTemplates(filtered)
  }

  const handleCreateNew = () => {
    // Create new template is not allowed - only 3 system templates
    showToast('Creating new templates is not available. Only 3 system templates are allowed.', 'warning')
  }

  const handleEdit = (template: ChecklistTemplate) => {
    setEditingTemplate(template)
    setCloningTemplate(null)
    setShowTemplateModal(true)
  }

  const handleClone = (template: ChecklistTemplate) => {
    // Clone functionality is not allowed - only 3 system templates
    showToast('Clone functionality is not available. Only 3 system templates are allowed.', 'warning')
  }

  const handleDelete = (template: ChecklistTemplate) => {
    if (template.isDefault) {
      showToast('Cannot delete default template', 'error')
      return
    }
    setDeleteConfirm({ isOpen: true, template })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.template) return

    try {
      await templateAPI.delete(deleteConfirm.template.id)
      showToast('Template deleted successfully', 'success')
      loadTemplates()
      setDeleteConfirm({ isOpen: false, template: null })
    } catch (error) {
      console.error('Error deleting template:', error)
      showToast('Failed to delete template', 'error')
    }
  }

  const handleToggleActive = async (template: ChecklistTemplate) => {
    try {
      await templateAPI.update(template.id, { isActive: !template.isActive })
      showToast(`Template ${template.isActive ? 'deactivated' : 'activated'} successfully`, 'success')
      loadTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      showToast('Failed to update template', 'error')
    }
  }

  const handleSaveTemplate = async (templateData: Partial<ChecklistTemplate>) => {
    try {
      if (editingTemplate) {
        await templateAPI.update(editingTemplate.id, templateData)
        showToast('Template updated successfully', 'success')
      } else if (cloningTemplate) {
        // Create new template from clone
        const newTemplate = {
          ...templateData,
          name: templateData.name || `${cloningTemplate.name} (Copy)`,
          isDefault: false
        }
        await templateAPI.create(newTemplate)
        showToast('Template cloned successfully', 'success')
      } else {
        await templateAPI.create(templateData)
        showToast('Template created successfully', 'success')
      }
      setShowTemplateModal(false)
      setEditingTemplate(null)
      setCloningTemplate(null)
      loadTemplates()
    } catch (error: any) {
      console.error('Error saving template:', error)
      showToast(error.message || 'Failed to save template', 'error')
    }
  }

  const canEdit = () => {
    const roles = getUserRoles()
    const userRole = getCurrentUserRole()
    // Only Root Admin can edit system templates
    return roles.some(role => ['root_admin'].includes(role)) || userRole === 'Root Admin'
  }

  const columns: Column<ChecklistTemplate>[] = [
    {
      key: 'name',
      label: 'Template Name',
      render: (template) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {template.isDefault ? '🔒' : '📄'} {template.name}
          </div>
          {template.description && (
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              {template.description}
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'courseType',
      label: 'Course Type',
      render: (template) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: template.courseType === 'SHINE' ? '#fff3e0' : template.courseType === 'Product' ? '#e3f2fd' : '#e8f5e9',
          color: template.courseType === 'SHINE' ? '#e65100' : template.courseType === 'Product' ? '#1565c0' : '#2e7d32',
          fontWeight: '500',
          fontSize: '12px'
        }}>
          {template.courseType}
        </span>
      ),
      sortable: true
    },
    {
      key: 'steps',
      label: 'Steps',
      render: (template) => (
        <span style={{ fontWeight: '500' }}>{template.steps.length}</span>
      ),
      align: 'center'
    },
    {
      key: 'isDefault',
      label: 'Default',
      render: (template) => (
        <span style={{ color: template.isDefault ? '#28a745' : '#6c757d' }}>
          {template.isDefault ? 'Yes' : 'No'}
        </span>
      ),
      align: 'center'
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (template) => (
        <span style={{ color: template.isActive ? '#28a745' : '#dc3545' }}>
          {template.isActive ? '✓' : '✗'}
        </span>
      ),
      align: 'center'
    },
    {
      key: 'updatedDate',
      label: 'Modified',
      render: (template) => {
        const date = template.updatedDate || template.createdDate
        if (!date) return '-'
        const d = new Date(date)
        return (
          <div>
            <div>{d.toLocaleDateString('en-GB')}</div>
            {template.updatedBy && (
              <div style={{ fontSize: '11px', color: '#666' }}>by {template.updatedBy}</div>
            )}
          </div>
        )
      },
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (template) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canEdit() && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(template)
                }}
                className="btn btn-sm btn-primary"
                title="Edit template"
              >
                Edit
              </button>
              {!template.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(template)
                  }}
                  className="btn btn-sm btn-danger"
                  title="Delete template"
                >
                  Delete
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleActive(template)
                }}
                className="btn btn-sm"
                title={template.isActive ? 'Deactivate' : 'Activate'}
                style={{
                  backgroundColor: template.isActive ? '#ffc107' : '#28a745',
                  color: '#000'
                }}
              >
                {template.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </>
          )}
        </div>
      ),
      freeze: true,
      align: 'right'
    }
  ]

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '8px' }}>📋 Checklist Templates</h1>
            <p style={{ margin: 0, color: '#666' }}>Manage checklist templates for course types</p>
          </div>
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>⚠️ System Templates:</strong> Only 3 system templates are available (SHINE, Product, Skill). 
            Only Root Admin can configure PIC, Reminder Timing, and Reminder Recipients.
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Course Type:
            </label>
            <select
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value)}
              className="form-control"
            >
              <option value="All">All</option>
              <option value="SHINE">SHINE</option>
              <option value="Product">Product</option>
              <option value="Skill">Skill</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>


          <div style={{ flex: '2', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              🔍 Search:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by template name or description..."
              className="form-control"
            />
          </div>
        </div>

        {/* Templates Table */}
        <DataTable
          data={filteredTemplates}
          columns={columns}
          isLoading={loading}
          emptyMessage="No templates found. Create your first template to get started."
          defaultSortColumn="updatedDate"
          defaultSortDirection="desc"
        />

        {/* Template Modal */}
        {showTemplateModal && (
          <ChecklistTemplateModal
            template={editingTemplate || cloningTemplate}
            isClone={!!cloningTemplate}
            onSave={handleSaveTemplate}
            onClose={() => {
              setShowTemplateModal(false)
              setEditingTemplate(null)
              setCloningTemplate(null)
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && deleteConfirm.template && (
          <ConfirmationModal
            isOpen={deleteConfirm.isOpen}
            title="Delete Template"
            message={`Are you sure you want to delete "${deleteConfirm.template.name}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm({ isOpen: false, template: null })}
            type="danger"
          />
        )}
      </div>
    </Layout>
  )
}

