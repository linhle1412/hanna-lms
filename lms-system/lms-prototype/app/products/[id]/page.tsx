'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { Product } from '@/lib/state'
import { getUserRoles } from '@/lib/auth-utils'

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const productId = parseInt(params?.id as string)
  const editMode = searchParams?.get('edit') === 'true'

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(editMode)
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [lmsState, setLmsState] = useState<any>(null)

  // Authorization check
  const canEdit = () => {
    const roles = getUserRoles()
    return roles.some(role => ['admin', 'master_role', 'root_admin'].includes(role))
  }

  // Initialize LMS State and Load product
  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        const module = await import('@/lib/state')
        module.LMSState.init()
        setLmsState(module.LMSState)
        
        const foundProduct = module.LMSState.getProduct(productId)
        if (foundProduct) {
          setProduct(foundProduct)
          setFormData(foundProduct)
        } else {
          alert('Product not found')
          router.push('/products')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading product:', error)
        setLoading(false)
      }
    }
    
    initializeAndLoad()
  }, [productId, router])

  const handleSave = () => {
    if (!lmsState || !product) return

    const success = lmsState.updateProduct(product.id, formData)
    if (success) {
      setProduct(lmsState.getProduct(productId)!)
      setIsEditing(false)
      alert('Product updated successfully')
    } else {
      alert('Failed to update product')
    }
  }

  const getStatusBadge = (status: string) => {
    const style: React.CSSProperties = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block',
    }

    switch (status) {
      case 'ACTIVE':
        return <span style={{ ...style, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>{status}</span>
      case 'INACTIVE':
        return <span style={{ ...style, backgroundColor: '#ffebee', color: '#c62828' }}>{status}</span>
      case 'DRAFT':
        return <span style={{ ...style, backgroundColor: '#fff9c4', color: '#f57f17' }}>{status}</span>
      default:
        return <span style={{ ...style, backgroundColor: '#e0e0e0', color: '#555' }}>{status}</span>
    }
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Loading...' }
      ]}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading product...</p>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Not Found' }
      ]}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Product not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: product.name }
    ]}>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              📦 {product.name}
            </h1>
            {getStatusBadge(product.status)}
          </div>
          {canEdit() && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setFormData(product)
                      setIsEditing(false)
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
                    onClick={handleSave}
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
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
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
                  Edit
                </button>
              )}
            </div>
          )}
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Product Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.name}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Type
              </label>
              {isEditing ? (
                <select
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                >
                  <option value="Product">Product</option>
                  <option value="Skill">Skill</option>
                </select>
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.type}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Learner Type
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.learnerType || ''}
                  onChange={(e) => setFormData({ ...formData, learnerType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.learnerType || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                License
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.license || ''}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.license || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Duration
              </label>
              <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.duration} hours (auto-calculated)</div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Code
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.code || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Certificate
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.certificate || ''}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px' }}>{product.certificate || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Status
              </label>
              {isEditing ? (
                <select
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px'
                  }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              ) : (
                <div style={{ padding: '9px 0' }}>{getStatusBadge(product.status)}</div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#666' }}>
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '15px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ padding: '9px 0', fontSize: '15px', color: '#666' }}>
                  {product.description || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Sessions ({product.sessions.length})
          </h2>
          
          {product.sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No sessions added yet</p>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Sequence</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Session Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Module</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sessions.sort((a, b) => a.sequence - b.sequence).map(session => (
                    <tr key={session.sessionId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{session.sequence}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{session.sessionName}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{session.moduleName || '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {session.moduleDuration}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          fontSize: '13px',
          color: '#888'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <strong>Created By:</strong> {product.createdBy} on {product.createdDate}
            </div>
            {product.updatedBy && (
              <div>
                <strong>Updated By:</strong> {product.updatedBy} on {product.updatedDate}
              </div>
            )}
            {product.usageCount !== undefined && (
              <div>
                <strong>Usage:</strong> Used in {product.usageCount} program(s)
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

