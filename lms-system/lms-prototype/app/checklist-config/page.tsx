'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useToast } from '@/contexts/ToastContext'
import { templateAPI } from '@/lib/api'
import { getUserRoles } from '@/lib/auth-utils'
import type { ChecklistTemplate, ChecklistStep, ReminderRecipient } from '@/lib/state'
import ChecklistConfigModal from '@/components/ChecklistConfigModal'

export default function ChecklistConfigPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Authorization check - Only Root Admin
  useEffect(() => {
    const roles = getUserRoles()
    const hasAccess = roles.includes('root_admin')
    
    if (!hasAccess) {
      showToast('Access denied. Only Root Admin can configure checklist templates.', 'error')
      router.push('/dashboard')
    }
  }, [router, showToast])

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await templateAPI.getAll()
      // Only show the 3 system templates
      const systemTemplates = data.filter(t => t.isDefault)
      setTemplates(systemTemplates)
      
      // Auto-select first template
      if (systemTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(systemTemplates[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showToast('Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: ChecklistTemplate) => {
    setSelectedTemplate(template)
  }

  const handleSaveConfig = async (templateId: string, updatedSteps: ChecklistStep[]) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      await templateAPI.update(templateId, {
        steps: updatedSteps
      })
      
      showToast('Template configuration saved successfully', 'success')
      await loadTemplates()
      setShowConfigModal(false)
    } catch (error: any) {
      console.error('Error saving template config:', error)
      showToast(error.message || 'Failed to save template configuration', 'error')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>📋 Course Type Checklist Configuration</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Configure PIC, Reminder Timing, and Additional Recipients for system templates
          </p>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <strong>⚠️ Note:</strong> Only PIC, Reminder Timing, and Additional Recipients can be configured.
          All other fields (step name, order, action type, status definition logic) are system-defined and read-only.
        </div>

        {/* Template Selection */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              style={{
                padding: '16px 24px',
                border: '2px solid',
                borderColor: selectedTemplate?.id === template.id ? '#007bff' : '#e0e0e0',
                borderRadius: '8px',
                backgroundColor: selectedTemplate?.id === template.id ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                fontWeight: selectedTemplate?.id === template.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                {template.courseType === 'SHINE' ? '✨' : template.courseType === 'Product' ? '📦' : '🎯'} {template.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {template.steps.length} steps
              </div>
            </button>
          ))}
        </div>

        {/* Template Details */}
        {selectedTemplate && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '8px' }}>{selectedTemplate.name}</h2>
                <p style={{ margin: 0, color: '#666' }}>{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="btn btn-primary"
              >
                ⚙️ Configure Template
              </button>
            </div>

            {/* Steps Preview */}
            <div>
              <h3 style={{ marginBottom: '16px' }}>Template Steps ({selectedTemplate.steps.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedTemplate.steps.map((step, index) => (
                  <div
                    key={step.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}>
                            {step.order}
                          </span>
                          <strong>{step.name}</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginLeft: '40px' }}>
                          <div><strong>PIC:</strong> {step.pic}</div>
                          <div><strong>Reminder:</strong> {
                            step.reminderTiming?.type === 'none' ? 'No reminder' :
                            step.reminderTiming?.type === 'daily' ? 'Daily' :
                            step.reminderTiming?.type === 'date_based' ? 'Date-based' :
                            'Course date relative'
                          }</div>
                          {step.reminderRecipients && step.reminderRecipients.length > 0 && (
                            <div><strong>Additional Recipients:</strong> {
                              step.reminderRecipients.map(r => {
                                if (r.type === 'email') return r.value
                                if (r.type === 'channel') return `Users by Channel: ${r.value}`
                                if (r.type === 'region') return `Users by Region: ${r.value}`
                                return ''
                              }).filter(Boolean).join(', ') || 'None'
                            }</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && selectedTemplate && (
          <ChecklistConfigModal
            template={selectedTemplate}
            onSave={(updatedSteps) => handleSaveConfig(selectedTemplate.id, updatedSteps)}
            onClose={() => setShowConfigModal(false)}
          />
        )}
      </div>
    </Layout>
  )
}

