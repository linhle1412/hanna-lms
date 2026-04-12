'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { programAPI, productAPI } from '@/lib/api'
import type { Program, Product } from '@/lib/state'
import { useToast } from '@/contexts/ToastContext'
import { hasAnyRole } from '@/lib/auth-utils'

interface Stage {
  id: number
  name: string
  order: number
  productIds: number[]
}

export default function ProgramDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'stages' | 'files' | 'history'>('general')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Program>>({})
  const [stages, setStages] = useState<Stage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [expandedStage, setExpandedStage] = useState<number | null>(null)

  const canManage = hasAnyRole(['admin', 'master_role', 'root_admin'])

  useEffect(() => {
    if (params?.id) {
      loadProgram()
      loadProducts()
    }
  }, [params?.id])

  const loadProgram = async () => {
    try {
      setLoading(true)
      const data = await programAPI.getById(parseInt(params?.id as string))
      if (!data) {
        showToast('Program not found', 'error')
        router.push('/programs')
        return
      }
      setProgram(data)
      setEditData(data)
      
      // Load stages (mock data for now)
      const mockStages: Stage[] = [
        { id: 1, name: 'Foundation Stage', order: 1, productIds: [1, 2] },
        { id: 2, name: 'Advanced Stage', order: 2, productIds: [3] }
      ]
      setStages(mockStages)
    } catch (error) {
      console.error('Failed to load program:', error)
      showToast('Failed to load program details', 'error')
      router.push('/programs')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productAPI.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData(program || {})
  }

  const handleSaveEdit = async () => {
    if (!program) return

    try {
      await programAPI.update(program.id, editData)
      showToast('Program updated successfully', 'success')
      setIsEditing(false)
      loadProgram()
    } catch (error) {
      console.error('Failed to update program:', error)
      showToast('Failed to update program', 'error')
    }
  }

  const handleStatusToggle = async () => {
    if (!program) return

    const newStatus = program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate'
    
    if (confirm(`Are you sure you want to ${action} "${program.name}"?`)) {
      try {
        await programAPI.update(program.id, { status: newStatus })
        showToast(`Program ${action}d successfully`, 'success')
        loadProgram()
      } catch (error) {
        console.error(`Failed to ${action} program:`, error)
        showToast(`Failed to ${action} program`, 'error')
      }
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

  const getProductsByIds = (productIds: number[]) => {
    return products.filter(p => productIds.includes(p.id))
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[
        { label: 'Program Management', href: '/programs' },
        { label: 'Loading...' }
      ]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading program details...</div>
      </Layout>
    )
  }

  if (!program) {
    return (
      <Layout breadcrumbs={[
        { label: 'Program Management', href: '/programs' },
        { label: 'Not Found' }
      ]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Program not found</h2>
          <button className="btn-primary" onClick={() => router.push('/programs')}>
            Back to Program List
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Program Management', href: '/programs' },
      { label: program.name }
    ]}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px', marginTop: 0 }}>{program.name}</h1>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <span style={{ color: '#666', fontSize: '14px' }}>
                <i className="fas fa-clock"></i> {program.duration} days
              </span>
              <span style={{ color: '#666', fontSize: '14px' }}>
                <i className="fas fa-users"></i> Max {program.maxParticipant} participants
              </span>
            </div>
          </div>
          {canManage && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => router.push('/programs')}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleStatusToggle}
                style={{ 
                  backgroundColor: program.status === 'ACTIVE' ? '#ffc107' : '#28a745',
                  color: 'white'
                }}
              >
                <i className={`fas fa-${program.status === 'ACTIVE' ? 'pause' : 'check'}`}></i> 
                {program.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn-secondary" onClick={() => router.push(`/programs/${program.id}/edit`)}>
                <i className="fas fa-edit"></i> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Tab Headers */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #f0f0f0',
          padding: '0 20px'
        }}>
          {[
            { key: 'general', label: 'General', icon: 'info-circle' },
            { key: 'stages', label: 'Stages', icon: 'layer-group' },
            { key: 'files', label: 'Files', icon: 'file' },
            { key: 'history', label: 'History', icon: 'history' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '15px 20px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? '#0097A9' : '#666',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? '600' : '400',
                borderBottom: activeTab === tab.key ? '2px solid #0097A9' : 'none',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              <i className={`fas fa-${tab.icon}`} style={{ marginRight: '8px' }}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '25px' }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Program Information</h2>
                {canManage && !isEditing && (
                  <button className="btn-secondary" onClick={handleEdit}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                )}
                {isEditing && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                    <button className="btn-primary" onClick={handleSaveEdit}>
                      <i className="fas fa-save"></i> Save
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px' }}>{program.name}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                    Type
                  </label>
                  {isEditing ? (
                    <select
                      className="form-control"
                      value={editData.type || ''}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    >
                      <option value="SHINE">SHINE</option>
                      <option value="Product">Product</option>
                      <option value="Skill">Skill</option>
                    </select>
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px' }}>{program.type}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                    License Type
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editData.licenseType || ''}
                      onChange={(e) => setEditData({ ...editData, licenseType: e.target.value })}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px' }}>{program.licenseType}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                    Duration
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="form-control"
                      value={editData.duration || ''}
                      onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) })}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px' }}>{program.duration} days</p>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
                      {program.description || 'No description'}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div style={{ 
                marginTop: '30px', 
                paddingTop: '20px', 
                borderTop: '1px solid #e0e0e0',
                fontSize: '13px',
                color: '#666'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Created:</strong> System on {new Date().toLocaleDateString()}</div>
                  <div><strong>Updated:</strong> System on {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stages Tab */}
          {activeTab === 'stages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Program Stages</h2>
                {canManage && (
                  <button className="btn-primary">
                    <i className="fas fa-plus"></i> Add Stage
                  </button>
                )}
              </div>

              {stages.map((stage) => (
                <div key={stage.id} style={{ 
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                        ↕ Stage {stage.order}:
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {stage.name}
                      </span>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        ({stage.productIds.length} products)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {canManage && (
                        <>
                          <button className="action-icon edit" title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="action-icon delete" title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </>
                      )}
                      <i className={`fas fa-chevron-${expandedStage === stage.id ? 'up' : 'down'}`}></i>
                    </div>
                  </div>

                  {expandedStage === stage.id && (
                    <div style={{ padding: '20px', backgroundColor: 'white' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '15px', fontSize: '14px', color: '#666', fontWeight: '600' }}>
                        Products in this stage:
                      </h4>
                      {getProductsByIds(stage.productIds).map((product) => (
                        <div key={product.id} style={{ 
                          padding: '12px',
                          marginBottom: '10px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', marginBottom: '5px' }}>{product.name}</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              {product.sessions.length} sessions • {product.duration} hours
                            </div>
                          </div>
                          <button 
                            className="btn-secondary" 
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => router.push(`/products/${product.id}`)}
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                      {getProductsByIds(stage.productIds).length === 0 && (
                        <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>
                          No products assigned to this stage
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {stages.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#999',
                  border: '1px dashed #ddd',
                  borderRadius: '8px'
                }}>
                  <i className="fas fa-layer-group" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ margin: 0 }}>No stages defined yet</p>
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Attached Files</h2>
                {canManage && (
                  <button className="btn-primary">
                    <i className="fas fa-upload"></i> Upload File
                  </button>
                )}
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#999',
                border: '1px dashed #ddd',
                borderRadius: '8px'
              }}>
                <i className="fas fa-file" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                <p style={{ margin: 0 }}>No files attached</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#333' }}>Change History</h2>
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#999',
                border: '1px dashed #ddd',
                borderRadius: '8px'
              }}>
                <i className="fas fa-history" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                <p style={{ margin: 0 }}>No history available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}









