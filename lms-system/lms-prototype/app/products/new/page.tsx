'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Product, Module } from '@/lib/state'
import { getUserRoles } from '@/lib/auth-utils'

export default function NewProductPage() {
  const router = useRouter()
  const [lmsState, setLmsState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    license: '',
    duration: 2,
    code: '',
    type: 'Product' as string,
    learnerType: '',
    certificate: false,
    status: 'DRAFT' as string,
    tags: [] as string[],
    sessions: [] as Array<{
      sessionId: number;
      sessionName: string;
      description?: string;
      fileName?: string;
      moduleId: number;
      moduleName?: string;
      moduleDuration?: number;
      sequence: number;
    }>
  })

  const [newTag, setNewTag] = useState('')
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [editingSessionIndex, setEditingSessionIndex] = useState<number | null>(null)
  const [moduleSearchTerm, setModuleSearchTerm] = useState('')
  const [sessionForm, setSessionForm] = useState({
    sessionName: '',
    description: '',
    fileName: '',
    moduleId: 0,
    moduleName: '',
    moduleDuration: 0
  })

  // Authorization check
  useEffect(() => {
    const roles = getUserRoles()
    const hasAccess = roles.some(role => ['admin', 'master_role', 'root_admin'].includes(role))
    if (!hasAccess) {
      router.push('/products')
    }
  }, [router])

  // Initialize LMS State and load modules
  useEffect(() => {
    const initializeState = async () => {
      try {
        const module = await import('@/lib/state')
        module.LMSState.init()
        setLmsState(module.LMSState)
        
        // Load modules from API (server-side data source)
        const response = await fetch('/api/modules?status=ACTIVE')
        if (response.ok) {
          const activeModules = await response.json()
          console.log('Loaded active modules from API:', activeModules) // Debug log
          setModules(activeModules)
        } else {
          console.error('Failed to load modules from API')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error initializing:', error)
        setLoading(false)
      }
    }
    initializeState()
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.type) {
      newErrors.type = 'Product type is required'
    }
    if (formData.sessions.length === 0) {
      newErrors.sessions = 'At least one session is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !lmsState) return

    setSaving(true)
    try {
      const newProduct = lmsState.createProduct(formData)
      alert('Product created successfully!')
      router.push(`/products/${newProduct.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product')
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleAddSession = () => {
    if (!sessionForm.sessionName.trim()) {
      alert('Session name is required')
      return
    }
    if (!sessionForm.moduleId) {
      alert('Please select a module')
      return
    }

    const newSession = {
      sessionId: Date.now() + Math.random(),
      sessionName: sessionForm.sessionName,
      description: sessionForm.description,
      fileName: sessionForm.fileName,
      moduleId: sessionForm.moduleId,
      moduleName: sessionForm.moduleName,
      moduleDuration: sessionForm.moduleDuration,
      sequence: formData.sessions.length + 1
    }

    setFormData({
      ...formData,
      sessions: [...formData.sessions, newSession]
    })

    // Reset form
    setSessionForm({
      sessionName: '',
      description: '',
      fileName: '',
      moduleId: 0,
      moduleName: '',
      moduleDuration: 0
    })
    setShowModuleSelector(false)
  }

  const handleEditSession = (index: number) => {
    const session = formData.sessions[index]
    setSessionForm({
      sessionName: session.sessionName,
      description: session.description || '',
      fileName: session.fileName || '',
      moduleId: session.moduleId,
      moduleName: session.moduleName || '',
      moduleDuration: session.moduleDuration || 0
    })
    setEditingSessionIndex(index)
    setShowModuleSelector(true)
  }

  const handleUpdateSession = () => {
    if (editingSessionIndex === null) return

    const updatedSessions = [...formData.sessions]
    updatedSessions[editingSessionIndex] = {
      ...updatedSessions[editingSessionIndex],
      sessionName: sessionForm.sessionName,
      description: sessionForm.description,
      fileName: sessionForm.fileName,
      moduleId: sessionForm.moduleId,
      moduleName: sessionForm.moduleName,
      moduleDuration: sessionForm.moduleDuration
    }

    setFormData({
      ...formData,
      sessions: updatedSessions
    })

    setSessionForm({
      sessionName: '',
      description: '',
      fileName: '',
      moduleId: 0,
      moduleName: '',
      moduleDuration: 0
    })
    setEditingSessionIndex(null)
    setShowModuleSelector(false)
  }

  const handleDeleteSession = (index: number) => {
    const updatedSessions = formData.sessions
      .filter((_, i) => i !== index)
      .map((session, i) => ({ ...session, sequence: i + 1 }))
    
    setFormData({
      ...formData,
      sessions: updatedSessions
    })
  }

  const handleMoveSession = (index: number, direction: 'up' | 'down') => {
    const newSessions = [...formData.sessions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSessions.length) return

    // Swap
    [newSessions[index], newSessions[targetIndex]] = [newSessions[targetIndex], newSessions[index]]
    
    // Update sequences
    newSessions.forEach((session, i) => {
      session.sequence = i + 1
    })

    setFormData({
      ...formData,
      sessions: newSessions
    })
  }

  const handleSelectModule = (module: Module) => {
    setSessionForm({
      ...sessionForm,
      moduleId: module.id,
      moduleName: module.name,
      moduleDuration: module.duration
    })
  }

  const calculateTotalDuration = () => {
    return formData.sessions.reduce((total, session) => total + (session.moduleDuration || 0), 0)
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'New Product' }
      ]}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'New Product' }
    ]}>
      <div style={{ padding: '20px' }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📦 Create New Product</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => router.push('/products')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saving ? '#ccc' : '#0097A9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {saving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>

          {/* General Information */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              General Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  Name <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: `1px solid ${errors.name ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                  placeholder="Enter product name"
                />
                {errors.name && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  Type <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: `1px solid ${errors.type ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                >
                  <option value="Product">Product</option>
                  <option value="Skill">Skill</option>
                </select>
                {errors.type && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px' }}>{errors.type}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  Learner Type
                </label>
                <select
                  value={formData.learnerType}
                  onChange={(e) => setFormData({ ...formData, learnerType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                >
                  <option value="">Select learner type</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  License
                </label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                  placeholder="e.g., Life Insurance License"
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  Duration
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                  placeholder="Duration in hours"
                  step="0.5"
                  min="0"
                />
              </div>

              {/* Code */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                  placeholder="e.g., D0TD"
                />
              </div>

              {/* Certificate */}
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                <input
                  type="checkbox"
                  id="certificate"
                  checked={formData.certificate}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '8px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="certificate" style={{ fontSize: '14px', color: '#666', cursor: 'pointer' }}>
                  Certificate
                </label>
              </div>
            </div>

            {/* Tags - Full width row */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '16px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index)
                        setFormData({ ...formData, tags: newTags })
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                        setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
                        setNewTag('')
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
                      setNewTag('')
                    }
                  }}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>


          {/* Old tags section removed - now in General Information */}
          <div style={{ display: 'none' }}>
            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        padding: '0 5px',
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Sessions <span style={{ color: '#d32f2f' }}>*</span> ({formData.sessions.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowModuleSelector(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0097A9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + Add Session
              </button>
            </div>

            {errors.sessions && <div style={{ color: '#d32f2f', fontSize: '14px', marginBottom: '15px' }}>{errors.sessions}</div>}

            {formData.sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                <p>No sessions added yet. Click "Add Session" to get started.</p>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px', width: '60px' }}>#</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Session Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Module</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Duration</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px', width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.sessions.map((session, index) => (
                      <tr key={session.sessionId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{session.sequence}</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{session.sessionName}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{session.moduleName || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{session.moduleDuration}h</td>
                        <td style={{ padding: '12px' }}>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="action-icon edit"
                              title="Edit Session"
                              onClick={() => handleEditSession(index)}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              className="action-icon"
                              title="Move Up"
                              onClick={() => handleMoveSession(index, 'up')}
                              disabled={index === 0}
                              style={{ color: index === 0 ? '#ccc' : '#666' }}
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              className="action-icon"
                              title="Move Down"
                              onClick={() => handleMoveSession(index, 'down')}
                              disabled={index === formData.sessions.length - 1}
                              style={{ color: index === formData.sessions.length - 1 ? '#ccc' : '#666' }}
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                            <button
                              type="button"
                              className="action-icon delete"
                              title="Delete Session"
                              onClick={() => handleDeleteSession(index)}
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
          </div>
        </form>
      </div>

      {/* Module Selector Modal */}
      {showModuleSelector && (
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
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              {editingSessionIndex !== null ? 'Edit Session' : 'Add Session'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Session Name <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={sessionForm.sessionName}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
                placeholder="e.g., Session 1: Introduction"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Description
              </label>
              <textarea
                value={sessionForm.description}
                onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '15px',
                  resize: 'vertical'
                }}
                placeholder="Session description"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                File Name
              </label>
              <input
                type="text"
                value={sessionForm.fileName}
                onChange={(e) => setSessionForm({ ...sessionForm, fileName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
                placeholder="e.g., session1-slides.pdf"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>
                Select Module <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              
              {/* Module Search Input */}
              {modules.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search modules by name, outcome, or tags..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
              
              <div style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                {modules.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No Active Modules Available</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
                      You need to create modules before adding sessions to products.
                    </p>
                    <a 
                      href="/modules" 
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#0097A9',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Go to Module Management
                    </a>
                  </div>
                ) : (
                  (() => {
                    const filteredModules = modules.filter(module => {
                      if (!moduleSearchTerm) return true
                      const searchLower = moduleSearchTerm.toLowerCase()
                      return (
                        module.name.toLowerCase().includes(searchLower) ||
                        module.outcome.toLowerCase().includes(searchLower) ||
                        (module.tags && module.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                      )
                    })
                    
                    if (filteredModules.length === 0) {
                      return (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                          <p style={{ margin: '0', fontSize: '14px' }}>
                            No modules found matching &quot;{moduleSearchTerm}&quot;
                          </p>
                        </div>
                      )
                    }
                    
                    return filteredModules.map(module => (
                    <div
                      key={module.id}
                      onClick={() => handleSelectModule(module)}
                      style={{
                        padding: '12px 15px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        backgroundColor: sessionForm.moduleId === module.id ? '#e3f2fd' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (sessionForm.moduleId !== module.id) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (sessionForm.moduleId !== module.id) {
                          e.currentTarget.style.backgroundColor = 'white'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '15px', marginBottom: '4px' }}>
                            {module.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            {module.outcome}
                          </div>
                        </div>
                        <div style={{ 
                          padding: '4px 10px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {module.duration}h
                        </div>
                      </div>
                    </div>
                  ))
                })()
                )}
              </div>
              {sessionForm.moduleId > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '5px',
                  fontSize: '14px'
                }}>
                  ✓ Selected: <strong>{sessionForm.moduleName}</strong> ({sessionForm.moduleDuration}h)
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowModuleSelector(false)
                  setEditingSessionIndex(null)
                  setSessionForm({
                    sessionName: '',
                    description: '',
                    fileName: '',
                    moduleId: 0,
                    moduleName: '',
                    moduleDuration: 0
                  })
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingSessionIndex !== null ? handleUpdateSession : handleAddSession}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0097A9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingSessionIndex !== null ? 'Update Session' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
