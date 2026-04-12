'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { trainerAPI } from '@/lib/api'
import type { Trainer } from '@/lib/state'
import { useToast } from '@/contexts/ToastContext'

export default function TrainerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('general')

  useEffect(() => {
    loadTrainer()
  }, [params?.id])

  const loadTrainer = async () => {
    try {
      setLoading(true)
      const data = await trainerAPI.getById(parseInt(params?.id as string))
      setTrainer(data)
    } catch (error) {
      console.error('Failed to load trainer:', error)
      showToast('Failed to load trainer details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    showToast('Edit functionality coming soon', 'info')
  }

  const handleDelete = async () => {
    if (!trainer) return
    
    if (confirm(`Are you sure you want to delete trainer "${trainer.fullName}"?`)) {
      try {
        await trainerAPI.delete(trainer.id)
        showToast('Trainer deleted successfully', 'success')
        router.push('/trainers')
      } catch (error) {
        console.error('Failed to delete trainer:', error)
        showToast('Failed to delete trainer', 'error')
      }
    }
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[
        { label: 'Trainer Management', href: '/trainers' },
        { label: 'Loading...' }
      ]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading trainer details...</div>
      </Layout>
    )
  }

  if (!trainer) {
    return (
      <Layout breadcrumbs={[
        { label: 'Trainer Management', href: '/trainers' },
        { label: 'Not Found' }
      ]}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Trainer not found</h2>
          <button className="btn-primary" onClick={() => router.push('/trainers')}>
            Back to Trainer List
          </button>
        </div>
      </Layout>
    )
  }

  const sections = [
    { key: 'general', label: 'General Information', icon: 'fa-info-circle' },
    { key: 'address', label: 'Address', icon: 'fa-map-marker-alt' },
    { key: 'experience', label: 'Experience', icon: 'fa-briefcase' },
    { key: 'education', label: 'Education', icon: 'fa-graduation-cap' },
    { key: 'rewards', label: 'Rewards', icon: 'fa-trophy' },
    { key: 'certifications', label: 'Certifications', icon: 'fa-certificate' },
    { key: 'performance', label: 'Performance', icon: 'fa-chart-line' }
  ]

  return (
    <Layout breadcrumbs={[
      { label: 'Trainer Management', href: '/trainers' },
      { label: trainer.fullName }
    ]}>
      {/* Header - Full Width */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px', marginTop: 0 }}>{trainer.fullName}</h1>
            <div style={{ display: 'flex', gap: '15px', color: '#666', fontSize: '14px', flexWrap: 'wrap' }}>
              <span><i className="fas fa-briefcase"></i> {trainer.trainerTitle}</span>
              <span><i className="fas fa-envelope"></i> {trainer.email}</span>
              <span><i className="fas fa-phone"></i> {trainer.phone}</span>
              <span><i className="fas fa-map-marker-alt"></i> {trainer.location}</span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: trainer.status === 'Active' ? '#e8f5e9' : '#ffebee',
                color: trainer.status === 'Active' ? '#2e7d32' : '#c62828'
              }}>
                {trainer.status}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleEdit}>
              <i className="fas fa-edit"></i> Edit
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleDelete}
              style={{ backgroundColor: '#dc3545', color: 'white' }}
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '20px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Stats Card */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>
              <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#0066cc' }}></i>
              Quick Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Courses Taught</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066cc' }}>
                  {trainer.activeRatio?.totalCourses || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Completed</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                  {trainer.activeRatio?.completedCourses || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Average Rating</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9800' }}>
                  {trainer.activeRatio?.averageRating.toFixed(1) || 'N/A'}/5.0
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Active Since</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  {trainer.createdDate || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>
              <i className="fas fa-list" style={{ marginRight: '8px', color: '#0066cc' }}></i>
              Sections
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {sections.map(section => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  style={{
                    padding: '10px 12px',
                    border: 'none',
                    background: activeSection === section.key ? '#e3f2fd' : 'transparent',
                    color: activeSection === section.key ? '#0066cc' : '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeSection === section.key ? '600' : '400',
                    borderRadius: '6px',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    borderLeft: activeSection === section.key ? '3px solid #0066cc' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.key) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.key) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <i className={`fas ${section.icon}`} style={{ marginRight: '10px', width: '16px' }}></i>
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Account Card */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>
              <i className="fas fa-user-circle" style={{ marginRight: '8px', color: '#0066cc' }}></i>
              Linked Account
            </h3>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Username:</strong> {trainer.email.split('@')[0]}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Role:</strong> <span style={{ 
                  padding: '2px 8px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#0066cc'
                }}>TRAINER</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Status:</strong> <span style={{ color: '#4caf50' }}>●</span> Active
              </div>
            </div>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '15px', fontSize: '13px' }}
              onClick={() => showToast('View user details coming soon', 'info')}
            >
              <i className="fas fa-external-link-alt"></i> View User Details
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>
              <i className="fas fa-bolt" style={{ marginRight: '8px', color: '#0066cc' }}></i>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', fontSize: '13px', justifyContent: 'flex-start' }}
                onClick={() => showToast('Assign to course coming soon', 'info')}
              >
                <i className="fas fa-plus-circle"></i> Assign to Course
              </button>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', fontSize: '13px', justifyContent: 'flex-start' }}
                onClick={() => router.push('/pic-calendar')}
              >
                <i className="fas fa-calendar"></i> View Calendar
              </button>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', fontSize: '13px', justifyContent: 'flex-start' }}
                onClick={() => showToast('Generate report coming soon', 'info')}
              >
                <i className="fas fa-file-pdf"></i> Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Content Area */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}>
          
          {/* General Information Section */}
          {activeSection === 'general' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333', fontSize: '20px' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                General Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Full Name</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.fullName}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Trainer Title</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.trainerTitle}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Gender</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.gender}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>ID Number</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.idNumber}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Issue Date</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.issueDate}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Issue Place</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.issuePlace}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Email</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.email}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Phone</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.phone}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Trainer Rate</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>${trainer.trainerRate}/hr</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Highest Degree</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.highestDegree || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Degree</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.degree}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Trainer Type</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.trainerType}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Location</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.location}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Region</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.region}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Status</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.status}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Created By</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.createdBy || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Created Date</label>
                  <p style={{ margin: 0, fontSize: '15px' }}>{trainer.createdDate || 'N/A'}</p>
                </div>
                {trainer.updatedBy && (
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Updated By</label>
                    <p style={{ margin: 0, fontSize: '15px' }}>{trainer.updatedBy}</p>
                  </div>
                )}
                {trainer.updatedDate && (
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '13px' }}>Updated Date</label>
                    <p style={{ margin: 0, fontSize: '15px' }}>{trainer.updatedDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Section */}
          {activeSection === 'address' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                  Address Information
                </h2>
                <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => showToast('Add address coming soon', 'info')}>
                  <i className="fas fa-plus"></i> Add New
                </button>
              </div>
              {trainer.address && trainer.address.length > 0 ? (
                trainer.address.map((addr, index) => (
                  <div key={index} style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, color: '#0066cc', fontSize: '16px' }}>
                        <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
                        {addr.type} Address
                      </h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => showToast('Edit address coming soon', 'info')}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white' }} onClick={() => showToast('Delete address coming soon', 'info')}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                      <div>
                        <strong style={{ color: '#666' }}>Street:</strong> {addr.street}
                      </div>
                      <div>
                        <strong style={{ color: '#666' }}>City:</strong> {addr.city}
                      </div>
                      <div>
                        <strong style={{ color: '#666' }}>Ward:</strong> {addr.ward}
                      </div>
                      <div>
                        <strong style={{ color: '#666' }}>Country:</strong> {addr.country}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-map-marker-alt" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No address information available</p>
                  <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => showToast('Add address coming soon', 'info')}>
                    Add First Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                  <i className="fas fa-briefcase" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                  Work Experience
                </h2>
                <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => showToast('Add experience coming soon', 'info')}>
                  <i className="fas fa-plus"></i> Add New
                </button>
              </div>
              {trainer.experiences && trainer.experiences.length > 0 ? (
                trainer.experiences.map((exp, index) => (
                  <div key={index} style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '5px', color: '#0066cc', fontSize: '16px' }}>{exp.position}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{exp.company}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> {exp.startDate} - {exp.endDate}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => showToast('Edit experience coming soon', 'info')}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white' }} onClick={() => showToast('Delete experience coming soon', 'info')}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: '15px 0 0 0', fontSize: '14px', lineHeight: '1.6' }}>{exp.description}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-briefcase" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No work experience recorded</p>
                  <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => showToast('Add experience coming soon', 'info')}>
                    Add First Experience
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Education Section */}
          {activeSection === 'education' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                  <i className="fas fa-graduation-cap" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                  Education History
                </h2>
                <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => showToast('Add education coming soon', 'info')}>
                  <i className="fas fa-plus"></i> Add New
                </button>
              </div>
              {trainer.education && trainer.education.length > 0 ? (
                trainer.education.map((edu, index) => (
                  <div key={index} style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '5px', color: '#0066cc', fontSize: '16px' }}>
                          {edu.degree} in {edu.fieldOfStudy}
                        </h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{edu.institution}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> {edu.startDate} - {edu.endDate}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => showToast('Edit education coming soon', 'info')}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white' }} onClick={() => showToast('Delete education coming soon', 'info')}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-graduation-cap" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No education history recorded</p>
                  <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => showToast('Add education coming soon', 'info')}>
                    Add First Education
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rewards Section */}
          {activeSection === 'rewards' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                  <i className="fas fa-trophy" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                  Rewards & Achievements
                </h2>
                <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => showToast('Add reward coming soon', 'info')}>
                  <i className="fas fa-plus"></i> Add New
                </button>
              </div>
              {trainer.rewards && trainer.rewards.length > 0 ? (
                trainer.rewards.map((reward, index) => (
                  <div key={index} style={{ 
                    padding: '20px', 
                    backgroundColor: '#fff9e6', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #ffd700'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '5px', color: '#d97706', fontSize: '16px' }}>
                          <i className="fas fa-trophy" style={{ color: '#ffd700', marginRight: '8px' }}></i>
                          {reward.title}
                        </h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Issued by: {reward.issuer}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> {reward.date}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => showToast('Edit reward coming soon', 'info')}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white' }} onClick={() => showToast('Delete reward coming soon', 'info')}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: '15px 0 0 0', fontSize: '14px', lineHeight: '1.6' }}>{reward.description}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-trophy" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No rewards or achievements recorded</p>
                  <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => showToast('Add reward coming soon', 'info')}>
                    Add First Reward
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Certifications Section */}
          {activeSection === 'certifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                  <i className="fas fa-certificate" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                  Certifications
                </h2>
                <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => showToast('Add certification coming soon', 'info')}>
                  <i className="fas fa-plus"></i> Add New
                </button>
              </div>
              {trainer.certifications && trainer.certifications.length > 0 ? (
                trainer.certifications.map((cert, index) => (
                  <div key={index} style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '5px', color: '#0066cc', fontSize: '16px' }}>{cert.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Issued by: {cert.issuer}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px' }}>
                          <i className="fas fa-calendar"></i> Issue Date: {cert.issueDate}
                          {cert.expiryDate && ` | Expiry Date: ${cert.expiryDate}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => showToast('Edit certification coming soon', 'info')}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white' }} onClick={() => showToast('Delete certification coming soon', 'info')}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-certificate" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No certifications recorded</p>
                  <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => showToast('Add certification coming soon', 'info')}>
                    Add First Certification
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Performance Section */}
          {activeSection === 'performance' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333', fontSize: '20px' }}>
                <i className="fas fa-chart-line" style={{ marginRight: '10px', color: '#0066cc' }}></i>
                Performance Metrics
              </h2>
              {trainer.activeRatio ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #2196f3'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
                        {trainer.activeRatio.totalCourses}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Total Courses</div>
                    </div>
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#e8f5e9', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #4caf50'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#388e3c', marginBottom: '5px' }}>
                        {trainer.activeRatio.completedCourses}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Completed Courses</div>
                    </div>
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#fff3e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #ff9800'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f57c00', marginBottom: '5px' }}>
                        {trainer.activeRatio.averageRating.toFixed(1)}
                        <span style={{ fontSize: '18px' }}>/5.0</span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Average Rating</div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#333', fontSize: '18px' }}>Training History</h3>
                  {trainer.trainingHistory && trainer.trainingHistory.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Course Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Participants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trainer.trainingHistory.map((history, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{history.courseName}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{history.courseDate}</td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{history.participants}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No training history available</p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="fas fa-chart-line" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                  <p style={{ fontStyle: 'italic' }}>No performance metrics available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
