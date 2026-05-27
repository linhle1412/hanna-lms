'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { hasAnyRole } from '@/lib/auth-utils'
import { useToast } from '@/contexts/ToastContext'

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
  files?: FileAttachment[]
  usageCount?: number
}

interface FileAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadDate: string
}

export default function ModuleDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authorization
  useEffect(() => {
    const authorized = hasAnyRole(['admin', 'master_role', 'root_admin', 'test_role'])
    if (!authorized) {
      router.push('/dashboard')
    }
  }, [router])

  // Load module data
  useEffect(() => {
    if (params?.id) {
      loadModule()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  const loadModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules/${params?.id}`)
      if (response.ok) {
        const data = await response.json()
        setModule(data)
      } else {
        showToast('Module not found', 'error')
        router.push('/modules')
      }
    } catch (error) {
      console.error('Error loading module:', error)
      showToast('Failed to load module', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[
        { label: 'Modules', href: '/modules' },
        { label: 'Loading...' }
      ]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading module...</p>
        </div>
      </Layout>
    )
  }

  if (!module) {
    return null
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Modules', href: '/modules' },
      { label: module.name }
    ]}>
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => router.push('/modules')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Modules
          </button>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
          📚 {module.name}
        </h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            Module Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
            <div style={{ fontWeight: '600' }}>Duration:</div>
            <div>{module.duration} hours</div>

            <div style={{ fontWeight: '600' }}>Status:</div>
            <div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: module.status === 'ACTIVE' ? '#e8f5e9' : module.status === 'DRAFT' ? '#fff9c4' : '#ffebee',
                color: module.status === 'ACTIVE' ? '#2e7d32' : module.status === 'DRAFT' ? '#f57f17' : '#c62828'
              }}>
                {module.status}
              </span>
            </div>

            <div style={{ fontWeight: '600' }}>Learning Outcome:</div>
            <div>{module.outcome}</div>

            {module.tags && module.tags.length > 0 && (
              <>
                <div style={{ fontWeight: '600' }}>Tags:</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {module.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '12px',
                        fontSize: '13px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontWeight: '600' }}>Created By:</div>
            <div>{module.createdBy} on {new Date(module.createdDate).toLocaleDateString()}</div>

            {module.updatedBy && (
              <>
                <div style={{ fontWeight: '600' }}>Updated By:</div>
                <div>{module.updatedBy} on {module.updatedDate && new Date(module.updatedDate).toLocaleDateString()}</div>
              </>
            )}

            <div style={{ fontWeight: '600' }}>Usage:</div>
            <div>{module.usageCount || 0} product(s)</div>
          </div>
        </div>

        {module.files && module.files.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Attached Files
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {module.files.map((file) => (
                <li key={file.id} style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{file.fileName}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded by {file.uploadedBy}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  )
}
