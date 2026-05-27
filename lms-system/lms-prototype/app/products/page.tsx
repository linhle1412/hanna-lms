'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Product } from '@/lib/state'
import { getUserRoles } from '@/lib/auth-utils'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [productToClone, setProductToClone] = useState<Product | null>(null)
  const [lmsState, setLmsState] = useState<any>(null)
  const [cloneOptions, setCloneOptions] = useState({
    newName: '',
    copySessions: true,
    copyTags: true,
    copyFiles: false,
    setDraft: true
  })
  const [cloning, setCloning] = useState(false)

  // Authorization check
  useEffect(() => {
    const roles = getUserRoles()
    const hasAccess = roles.some(role => 
      ['admin', 'master_role', 'root_admin', 'lead_region', 'head_channel', 'trainer', 'test_role'].includes(role)
    )
    
    if (!hasAccess) {
      router.push('/dashboard')
    }
  }, [router])

  // Check if user can edit (Admin, Master Role, Root Admin, Test Role)
  const canEdit = () => {
    const roles = getUserRoles()
    return roles.some(role => ['admin', 'master_role', 'root_admin', 'test_role'].includes(role))
  }

  // Initialize LMS State and Load products
  useEffect(() => {
    const initializeState = async () => {
      try {
        const module = await import('@/lib/state')
        module.LMSState.init()
        setLmsState(module.LMSState)
        
        const allProducts = module.LMSState.getProducts()
        setProducts(allProducts)
        setFilteredProducts(allProducts)
        setLoading(false)
      } catch (error) {
        console.error('Error loading products:', error)
        setLoading(false)
      }
    }
    
    initializeState()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...products]

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(p => p.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(search)))
      )
    }

    setFilteredProducts(filtered)
  }, [products, typeFilter, statusFilter, searchTerm])

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!productToDelete || !lmsState) return

    if (productToDelete.usageCount && productToDelete.usageCount > 0) {
      alert(`Cannot delete product. It is currently used in ${productToDelete.usageCount} program(s).`)
      setShowDeleteModal(false)
      return
    }

    const success = lmsState.deleteProduct(productToDelete.id)
    if (success) {
      setProducts(lmsState.getProducts())
      alert('Product deleted successfully')
    } else {
      alert('Failed to delete product')
    }
    setShowDeleteModal(false)
    setProductToDelete(null)
  }

  const handleClone = (product: Product) => {
    setProductToClone(product)
    setCloneOptions({
      newName: `${product.name} (Copy)`,
      copySessions: true,
      copyTags: true,
      copyFiles: false,
      setDraft: true
    })
    setShowCloneModal(true)
  }

  const confirmClone = () => {
    if (!productToClone || !lmsState) return

    if (!cloneOptions.newName.trim()) {
      alert('Please enter a name for the cloned product')
      return
    }

    setCloning(true)
    try {
      const clonedProduct = lmsState.cloneProduct(
        productToClone.id,
        cloneOptions.newName,
        {
          copySessions: cloneOptions.copySessions,
          copyTags: cloneOptions.copyTags,
          copyFiles: cloneOptions.copyFiles,
          setDraft: cloneOptions.setDraft
        }
      )

      if (clonedProduct) {
        setProducts(lmsState.getProducts())
        alert('Product cloned successfully!')
        setShowCloneModal(false)
        setProductToClone(null)
        router.push(`/products/${clonedProduct.id}?edit=true`)
      } else {
        alert('Failed to clone product')
      }
    } catch (error) {
      console.error('Error cloning product:', error)
      alert('Failed to clone product')
    } finally {
      setCloning(false)
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
      <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading products...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]}>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📦 Product Management</h1>
          {canEdit() && (
            <button
              onClick={() => router.push('/products/new')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Add New Product
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="All">All Types</option>
                <option value="Product">Product</option>
                <option value="Skill">Skill</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Sessions</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Certificate</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created By</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
                    <p style={{ color: '#666', margin: '5px 0' }}>No products found</p>
                    {canEdit() && (
                      <button
                        onClick={() => router.push('/products/new')}
                        style={{
                          marginTop: '15px',
                          padding: '8px 16px',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        + Add New Product
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <a
                        href={`/products/${product.id}`}
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/products/${product.id}`)
                        }}
                      >
                        {product.name}
                      </a>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {product.description || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: product.type === 'Product' ? '#e3f2fd' : '#f3e5f5',
                        color: product.type === 'Product' ? '#1976d2' : '#7b1fa2',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {product.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {product.sessions.length}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      {product.certificate || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {product.duration}h
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {getStatusBadge(product.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      {product.createdBy}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="table-actions">
                        {canEdit() && (
                          <>
                            <button
                              className="action-icon edit"
                              title="Edit Product"
                              onClick={() => router.push(`/products/${product.id}?edit=true`)}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              className="action-icon clone"
                              title="Clone Product"
                              onClick={() => handleClone(product)}
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                            <button
                              className="action-icon delete"
                              title="Delete Product"
                              onClick={() => handleDelete(product)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Delete Product?</h3>
            <p style={{ marginBottom: '10px' }}>
              ⚠️ Are you sure you want to delete this product?
            </p>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0' }}><strong>Product Name:</strong> {productToDelete.name}</p>
              <p style={{ margin: '5px 0' }}><strong>Sessions:</strong> {productToDelete.sessions.length}</p>
              <p style={{ margin: '5px 0' }}><strong>Duration:</strong> {productToDelete.duration} hours</p>
              {productToDelete.usageCount && productToDelete.usageCount > 0 && (
                <p style={{ margin: '5px 0', color: '#d32f2f' }}>
                  <strong>Warning:</strong> Used in {productToDelete.usageCount} program(s)
                </p>
              )}
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setProductToDelete(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Product Modal */}
      {showCloneModal && productToClone && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Clone Product</h3>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Source Product:</strong> {productToClone.name}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Sessions:</strong> {productToClone.sessions.length}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Duration:</strong> {productToClone.duration} hours
              </p>
              {productToClone.tags && productToClone.tags.length > 0 && (
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Tags:</strong> {productToClone.tags.join(', ')}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                New Product Name <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={cloneOptions.newName}
                onChange={(e) => setCloneOptions({ ...cloneOptions, newName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '15px'
                }}
                placeholder="Enter name for cloned product"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>
                Clone Options
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '5px'
                }}>
                  <input
                    type="checkbox"
                    checked={cloneOptions.copySessions}
                    onChange={(e) => setCloneOptions({ ...cloneOptions, copySessions: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Copy Sessions</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Clone all {productToClone.sessions.length} session(s) with their module references
                    </div>
                  </div>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '5px'
                }}>
                  <input
                    type="checkbox"
                    checked={cloneOptions.copyTags}
                    onChange={(e) => setCloneOptions({ ...cloneOptions, copyTags: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Copy Tags</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {productToClone.tags && productToClone.tags.length > 0
                        ? `Clone ${productToClone.tags.length} tag(s)`
                        : 'No tags to copy'}
                    </div>
                  </div>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '5px'
                }}>
                  <input
                    type="checkbox"
                    checked={cloneOptions.copyFiles}
                    onChange={(e) => setCloneOptions({ ...cloneOptions, copyFiles: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Copy File References</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {productToClone.files && productToClone.files.length > 0
                        ? `Clone ${productToClone.files.length} file reference(s)`
                        : 'No files to copy'}
                    </div>
                  </div>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '5px'
                }}>
                  <input
                    type="checkbox"
                    checked={cloneOptions.setDraft}
                    onChange={(e) => setCloneOptions({ ...cloneOptions, setDraft: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Set as Draft</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {cloneOptions.setDraft 
                        ? 'Cloned product will be in DRAFT status'
                        : `Cloned product will inherit status: ${productToClone.status}`}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1976d2'
            }}>
              <strong>Note:</strong> The product code will not be copied (must be unique). You can edit the cloned product after creation.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCloneModal(false)
                  setProductToClone(null)
                }}
                disabled={cloning}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: cloning ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClone}
                disabled={cloning}
                style={{
                  padding: '10px 20px',
                  backgroundColor: cloning ? '#ccc' : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: cloning ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {cloning ? 'Cloning...' : 'Clone Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

