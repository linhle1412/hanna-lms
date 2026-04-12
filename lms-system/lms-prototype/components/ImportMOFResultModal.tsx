'use client'

import React, { useState, useEffect } from 'react'
import type { Course, Participant } from '@/lib/state'
import { participantAPI } from '@/lib/api'

interface ImportMOFResultModalProps {
  isOpen: boolean
  course: Course | null
  onImport: () => void
  onClose: () => void
}

interface MOFResultRow {
  participantId: number
  participantName: string
  agentCode: string
  mofExamId: string
  mofCourseCode: string
  province: string
  passed: boolean
  errors?: string[]
}

export default function ImportMOFResultModal({
  isOpen,
  course,
  onImport,
  onClose
}: ImportMOFResultModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<MOFResultRow[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && course) {
      loadParticipants()
    } else {
      // Reset state when modal closes
      setFile(null)
      setImportResults([])
      setValidationErrors([])
    }
  }, [isOpen, course])

  const loadParticipants = async () => {
    if (!course) return

    try {
      setLoading(true)
      const allParticipants = await participantAPI.getAll()
      const courseParticipants = allParticipants.filter(p =>
        course.participantIds?.includes(p.id)
      )
      setParticipants(courseParticipants)
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileName = file.name.toLowerCase()
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext))
      
      if (!isValidFile) {
        alert('Invalid file type. Please select a CSV or Excel file.')
        return
      }
      
      setFile(file)
      parseFile(file)
    }
  }

  const parseFile = async (file: File) => {
    try {
      setLoading(true)
      setValidationErrors([])
      
      // Read file content
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setValidationErrors(['File must contain at least a header row and one data row.'])
        return
      }

      // Parse CSV (simple parser - in production, use a proper CSV library)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Expected columns: Agent Code, MOF Exam ID, MOF Course Code, Province, Passed/Failed
      const agentCodeIndex = headers.findIndex(h => h.includes('agent') && h.includes('code'))
      const mofExamIdIndex = headers.findIndex(h => h.includes('mof') && h.includes('exam') && h.includes('id'))
      const mofCourseCodeIndex = headers.findIndex(h => h.includes('mof') && h.includes('course') && h.includes('code'))
      const provinceIndex = headers.findIndex(h => h.includes('province'))
      const resultIndex = headers.findIndex(h => h.includes('passed') || h.includes('failed') || h.includes('result'))

      if (agentCodeIndex === -1 || mofExamIdIndex === -1 || mofCourseCodeIndex === -1 || provinceIndex === -1) {
        setValidationErrors([
          'File must contain the following columns: Agent Code, MOF Exam ID, MOF Course Code, Province'
        ])
        return
      }

      const results: MOFResultRow[] = []
      const errors: string[] = []

      // Validate MOF Course Code matches course
      const courseCode = course?.code || ''
      const courseCodeMatch = courseCode.match(/-([A-Z]{2})$/)?.[1] // Extract course type code
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const agentCode = values[agentCodeIndex] || ''
        const mofExamId = values[mofExamIdIndex] || ''
        const mofCourseCode = values[mofCourseCodeIndex] || ''
        const province = values[provinceIndex] || ''
        const result = values[resultIndex]?.toLowerCase() || ''

        // Find participant by agent code
        const participant = participants.find(p => p.agentCode === agentCode)
        
        if (!participant) {
          errors.push(`Row ${i + 1}: Participant with agent code "${agentCode}" not found in course`)
          continue
        }

        // Validate MOF Course Code
        if (!mofCourseCode) {
          errors.push(`Row ${i + 1}: MOF Course Code is mandatory`)
          continue
        }

        // Validate Province
        if (!province) {
          errors.push(`Row ${i + 1}: Province is mandatory`)
          continue
        }

        // Validate MOF Course Code matches course (if course code pattern exists)
        if (courseCodeMatch && !mofCourseCode.includes(courseCodeMatch)) {
          errors.push(`Row ${i + 1}: MOF Course Code "${mofCourseCode}" does not match course type`)
        }

        results.push({
          participantId: participant.id,
          participantName: participant.name,
          agentCode,
          mofExamId,
          mofCourseCode,
          province,
          passed: result.includes('pass') || result === '1' || result === 'yes'
        })
      }

      setImportResults(results)
      setValidationErrors(errors)

      if (errors.length > 0) {
        showValidationSummary(errors)
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      setValidationErrors(['Failed to parse file. Please check the file format.'])
    } finally {
      setLoading(false)
    }
  }

  const showValidationSummary = (errors: string[]) => {
    const summary = `Found ${errors.length} validation error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
    alert(summary)
  }

  const handleImport = async () => {
    if (!course || importResults.length === 0) return

    if (validationErrors.length > 0) {
      if (!confirm('There are validation errors in the file. Do you want to proceed with importing valid rows only?')) {
        return
      }
    }

    if (!confirm(`Are you sure you want to import MOF results for ${importResults.length} participant(s)?`)) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // TODO: In production, this would:
      // 1. Update participant records with MOF exam ID, MOF course code, province
      // 2. Update participant exam results (passed/failed)
      // 3. Mark checklist step as done
      // 4. Send notification emails if needed
      
      // For now, just call onImport callback
      onImport()
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error importing MOF results:', error)
      alert('Failed to import MOF results. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Import MOF Exam Result
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            <strong>File Upload Template Requirements:</strong>
          </p>
          <ul style={{ fontSize: '14px', color: '#666', marginLeft: '20px', marginBottom: '12px' }}>
            <li>MOF Exam ID (stored for each participant)</li>
            <li>MOF Course Code <span style={{ color: '#f44336' }}>(Mandatory, validation check required)</span></li>
            <li>Province <span style={{ color: '#f44336' }}>(Mandatory, free text)</span></li>
            <li>Agent Code (to match participants)</li>
            <li>Passed/Failed status (optional)</li>
          </ul>
          <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
            Expected columns: Agent Code, MOF Exam ID, MOF Course Code, Province, Passed/Failed
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Upload Excel/CSV File
          </label>
          <input
            type="file"
            id="mof-import-file"
            onChange={handleFileChange}
            accept=".csv,.xls,.xlsx"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="mof-import-file"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          >
            <i className="fas fa-upload"></i>
            {file ? file.name : 'Choose File'}
          </label>
          {file && (
            <span style={{ marginLeft: '12px', fontSize: '14px', color: '#4caf50' }}>
              ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', color: '#0097A9' }}></i>
            <p style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>Parsing file...</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#c62828', marginBottom: '8px' }}>
              ⚠️ Validation Errors ({validationErrors.length})
            </p>
            <ul style={{ fontSize: '12px', color: '#c62828', marginLeft: '20px', margin: 0 }}>
              {validationErrors.slice(0, 5).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {validationErrors.length > 5 && (
                <li>... and {validationErrors.length - 5} more errors</li>
              )}
            </ul>
          </div>
        )}

        {importResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
              Preview ({importResults.length} participant(s) found):
            </p>
            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Agent Code</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>MOF Exam ID</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>MOF Course Code</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Province</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {importResults.map((result, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{result.agentCode}</td>
                      <td style={{ padding: '8px' }}>{result.participantName}</td>
                      <td style={{ padding: '8px' }}>{result.mofExamId || '-'}</td>
                      <td style={{ padding: '8px' }}>{result.mofCourseCode}</td>
                      <td style={{ padding: '8px' }}>{result.province}</td>
                      <td style={{ padding: '8px', color: result.passed ? '#4caf50' : '#f44336' }}>
                        {result.passed ? '✓ Passed' : '✗ Failed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#666',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isSubmitting || importResults.length === 0}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isSubmitting || importResults.length === 0
                ? '#ccc'
                : '#0097A9',
              cursor: isSubmitting || importResults.length === 0
                ? 'not-allowed'
                : 'pointer',
              color: 'white',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && importResults.length > 0) {
                e.currentTarget.style.backgroundColor = '#007a8a'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && importResults.length > 0) {
                e.currentTarget.style.backgroundColor = '#0097A9'
              }
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Importing...
              </>
            ) : (
              'Import MOF Results'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

