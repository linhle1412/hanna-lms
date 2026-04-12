'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { Trainer, User } from '@/lib/state'
import { userAPI } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import UserSearchModal from './UserSearchModal'
import { 
  autoDetermineTrainerTitle, 
  getTrainerTitleValidationMessage, 
  isTrainerTitleReadOnly,
  DEFAULT_TRAINER_TITLE_OPTIONS 
} from '@/lib/trainer-title-utils'

interface CreateTrainerModalProps {
  onSave: (trainerData: Partial<Trainer>) => void
  onClose: () => void
}

type UserLookupStatus = 'idle' | 'searching' | 'found' | 'not-found' | 'error'

export default function CreateTrainerModal({ onSave, onClose }: CreateTrainerModalProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<Partial<Trainer>>({
    fullName: '',
    trainerTitle: '',
    gender: '',
    idNumber: '',
    issueDate: '',
    issuePlace: '',
    email: '',
    phone: '',
    trainerRate: 0,
    highestDegree: '',
    degree: '',
    trainerType: '',
    location: '',
    region: '',
    status: 'Active'
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Trainer, string>>>({})
  const [mounted, setMounted] = useState(false)
  
  // User linking states
  const [userLookupStatus, setUserLookupStatus] = useState<UserLookupStatus>('idle')
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [autoCreateUser, setAutoCreateUser] = useState(false)
  const [newUserTeam, setNewUserTeam] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [lookupError, setLookupError] = useState('')
  
  // Autocomplete search states
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Auto-determine trainer title when trainer type or selected user changes
  useEffect(() => {
    if (formData.trainerType === 'Internal Trainer' && selectedUser) {
      const autoTitle = autoDetermineTrainerTitle(selectedUser)
      if (autoTitle) {
        setFormData(prev => ({ ...prev, trainerTitle: autoTitle }))
      }
    } else if (formData.trainerType === 'External Contractor') {
      // Clear auto-determined title for External Contractors
      if (formData.trainerTitle && !DEFAULT_TRAINER_TITLE_OPTIONS.includes(formData.trainerTitle)) {
        setFormData(prev => ({ ...prev, trainerTitle: '' }))
      }
    }
  }, [formData.trainerType, selectedUser])

  // Debounced autocomplete search - only for Internal trainers
  useEffect(() => {
    // Skip search for External trainers or if user already selected
    if (formData.trainerType === 'External Contractor' || selectedUser) {
      setShowDropdown(false)
      setSearchResults([])
      return
    }

    const term = searchTerm.trim()
    if (!term || term.length < 2) {
      setShowDropdown(false)
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      searchUsers(term)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, formData.trainerType, selectedUser])

  const searchUsers = async (term: string) => {
    try {
      setIsSearching(true)
      
      const users = await userAPI.getAll()
      
      // Filter users with Team "Trainer" and matching search term
      const filtered = users.filter(user => {
        const isTrainerTeam = user.team.toLowerCase() === 'trainer'
        
        const matchesSearch = 
          user.username.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase())
        
        return isTrainerTeam && matchesSearch
      })
      
      setSearchResults(filtered.slice(0, 5)) // Limit to 5 results
      setShowDropdown(true)
    } catch (error) {
      console.error('User search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, email: user.email }))
    setSearchTerm('')
    setShowDropdown(false)
    setSearchResults([])
    setAutoCreateUser(false)
    
    // Auto-determine trainer title if Internal Trainer
    if (formData.trainerType === 'Internal Trainer') {
      const autoTitle = autoDetermineTrainerTitle(user)
      if (autoTitle) {
        setFormData(prev => ({ ...prev, trainerTitle: autoTitle }))
      }
    }
  }

  const handleClearSelection = () => {
    setSelectedUser(null)
    setFormData(prev => ({ ...prev, email: '', trainerTitle: '' }))
    setSearchTerm('')
  }

  const handleSelectUserFromSearch = (user: User) => {
    setFormData(prev => ({ ...prev, email: user.email }))
    setFoundUser(user)
    setUserLookupStatus('found')
    setShowUserSearch(false)
    showToast('User selected successfully', 'success')
  }

  const validateForm = () => {
    const errors: Partial<Record<keyof Trainer, string>> = {}
    
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required.'
    }
    if (!formData.trainerTitle) {
      errors.trainerTitle = 'Trainer title is required.'
    }
    if (!formData.gender) {
      errors.gender = 'Gender is required.'
    }
    if (!formData.idNumber?.trim()) {
      errors.idNumber = 'ID number is required.'
    }
    if (!formData.issueDate) {
      errors.issueDate = 'Issue date is required.'
    }
    if (!formData.issuePlace?.trim()) {
      errors.issuePlace = 'Issue place is required.'
    }
    
    // User linking validation - only required for Internal trainers
    if (formData.trainerType === 'Internal Trainer') {
      if (!selectedUser && !autoCreateUser) {
        errors.email = 'Please select a user account or create a new one.'
      }
      
      if (autoCreateUser) {
        if (!formData.email?.trim()) {
          errors.email = 'Email is required to create new user.'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Email is invalid.'
        }
        
        if (!newUserTeam) {
          errors.email = 'Please select a team for the new user.'
        }
      }
    }
    
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone is required.'
    }
    if (!formData.trainerRate || formData.trainerRate <= 0) {
      errors.trainerRate = 'Trainer rate must be greater than 0.'
    }
    if (!formData.degree) {
      errors.degree = 'Degree is required.'
    }
    if (!formData.trainerType) {
      errors.trainerType = 'Trainer type is required.'
    }
    if (!formData.location?.trim()) {
      errors.location = 'Location is required.'
    }
    if (!formData.region) {
      errors.region = 'Region is required.'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // If auto-create user is enabled, create the user first
    if (autoCreateUser && formData.trainerType === 'Internal Trainer' && !selectedUser) {
      try {
        const newUser = await userAPI.create({
          username: formData.email!.split('@')[0],
          email: formData.email!,
          roles: ['TRAINER'],
          team: newUserTeam,
          createdDate: new Date().toISOString().split('T')[0]
        })
        showToast('User account created successfully', 'success')
        setSelectedUser(newUser)
      } catch (error) {
        console.error('Failed to create user:', error)
        showToast('Failed to create user account', 'error')
        return
      }
    }

    onSave(formData)
  }

  const handleInputChange = (field: keyof Trainer, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!mounted) {
    return null
  }

  const isInternalTrainer = formData.trainerType === 'Internal Trainer'
  const isExternalTrainer = formData.trainerType === 'External Contractor'

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Create New Trainer</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px', flexGrow: 1 }}>
              
              {/* General Information */}
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', borderBottom: '2px solid #0066cc', paddingBottom: '8px' }}>
                Trainer Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    style={{ borderColor: fieldErrors.fullName ? '#dc3545' : '' }}
                  />
                  {fieldErrors.fullName && <p className="error-message">{fieldErrors.fullName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="trainerTitle">
                    Trainer Title *
                    {isTrainerTitleReadOnly(formData.trainerType || '', selectedUser) && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        color: '#28a745', 
                        fontWeight: 'normal' 
                      }}>
                        ✓ Auto-determined from user account
                      </span>
                    )}
                  </label>
                  {isTrainerTitleReadOnly(formData.trainerType || '', selectedUser) ? (
                    <input
                      type="text"
                      id="trainerTitle"
                      className="form-input"
                      value={formData.trainerTitle}
                      readOnly
                      disabled
                      style={{ 
                        borderColor: fieldErrors.trainerTitle ? '#dc3545' : '',
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed',
                        color: '#666'
                      }}
                    />
                  ) : (
                    <select
                      id="trainerTitle"
                      className="form-select"
                      value={formData.trainerTitle}
                      onChange={(e) => handleInputChange('trainerTitle', e.target.value)}
                      style={{ borderColor: fieldErrors.trainerTitle ? '#dc3545' : '' }}
                    >
                      <option value="">Select trainer title</option>
                      {DEFAULT_TRAINER_TITLE_OPTIONS.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.trainerTitle && <p className="error-message">{fieldErrors.trainerTitle}</p>}
                  {selectedUser && getTrainerTitleValidationMessage(selectedUser) && (
                    <p className="error-message">{getTrainerTitleValidationMessage(selectedUser)}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    style={{ borderColor: fieldErrors.gender ? '#dc3545' : '' }}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {fieldErrors.gender && <p className="error-message">{fieldErrors.gender}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="idNumber">ID Number *</label>
                  <input
                    type="text"
                    id="idNumber"
                    className="form-input"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    style={{ borderColor: fieldErrors.idNumber ? '#dc3545' : '' }}
                  />
                  {fieldErrors.idNumber && <p className="error-message">{fieldErrors.idNumber}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="issueDate">Issue Date *</label>
                  <input
                    type="date"
                    id="issueDate"
                    className="form-input"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    style={{ borderColor: fieldErrors.issueDate ? '#dc3545' : '' }}
                  />
                  {fieldErrors.issueDate && <p className="error-message">{fieldErrors.issueDate}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="issuePlace">Issue Place *</label>
                  <input
                    type="text"
                    id="issuePlace"
                    className="form-input"
                    value={formData.issuePlace}
                    onChange={(e) => handleInputChange('issuePlace', e.target.value)}
                    style={{ borderColor: fieldErrors.issuePlace ? '#dc3545' : '' }}
                  />
                  {fieldErrors.issuePlace && <p className="error-message">{fieldErrors.issuePlace}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{ borderColor: fieldErrors.phone ? '#dc3545' : '' }}
                  />
                  {fieldErrors.phone && <p className="error-message">{fieldErrors.phone}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="trainerRate">Trainer Rate ($/hr) *</label>
                  <input
                    type="number"
                    id="trainerRate"
                    className="form-input"
                    min="0"
                    step="0.01"
                    value={formData.trainerRate}
                    onChange={(e) => handleInputChange('trainerRate', parseFloat(e.target.value) || 0)}
                    style={{ borderColor: fieldErrors.trainerRate ? '#dc3545' : '' }}
                  />
                  {fieldErrors.trainerRate && <p className="error-message">{fieldErrors.trainerRate}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="highestDegree">Highest Degree</label>
                  <input
                    type="text"
                    id="highestDegree"
                    className="form-input"
                    placeholder="e.g., Master of Business Administration"
                    value={formData.highestDegree}
                    onChange={(e) => handleInputChange('highestDegree', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="degree">Degree *</label>
                  <select
                    id="degree"
                    className="form-select"
                    value={formData.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
                    style={{ borderColor: fieldErrors.degree ? '#dc3545' : '' }}
                  >
                    <option value="">Select degree</option>
                    <option value="Associate">Associate</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="Doctoral">Doctoral</option>
                  </select>
                  {fieldErrors.degree && <p className="error-message">{fieldErrors.degree}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="trainerType">Trainer Type *</label>
                  <select
                    id="trainerType"
                    className="form-select"
                    value={formData.trainerType}
                    onChange={(e) => handleInputChange('trainerType', e.target.value)}
                    style={{ borderColor: fieldErrors.trainerType ? '#dc3545' : '' }}
                  >
                    <option value="">Select trainer type</option>
                    <option value="Internal Trainer">Internal Trainer</option>
                    <option value="External Contractor">External Contractor</option>
                  </select>
                  {fieldErrors.trainerType && <p className="error-message">{fieldErrors.trainerType}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    className="form-input"
                    placeholder="e.g., Ho Chi Minh City"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    style={{ borderColor: fieldErrors.location ? '#dc3545' : '' }}
                  />
                  {fieldErrors.location && <p className="error-message">{fieldErrors.location}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="region">Region *</label>
                  <select
                    id="region"
                    className="form-select"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    style={{ borderColor: fieldErrors.region ? '#dc3545' : '' }}
                  >
                    <option value="">Select region</option>
                    <option value="South">South</option>
                    <option value="Middle">Middle</option>
                    <option value="North">North</option>
                  </select>
                  {fieldErrors.region && <p className="error-message">{fieldErrors.region}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* External Contractor Info Message */}
              {isExternalTrainer && (
                <div style={{
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-info-circle" style={{ color: '#1976d2', fontSize: '20px' }}></i>
                    <div>
                      <strong style={{ color: '#1565c0', display: 'block', marginBottom: '5px' }}>
                        External Contractor
                      </strong>
                      <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                        External contractors do not require LMS system access. 
                        User account linking is not needed for this trainer type.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Account Linking Section - Only for Internal trainers */}
              {isInternalTrainer && (
                <div style={{
                  backgroundColor: '#f0f7ff',
                  border: '2px solid #0066cc',
                  borderRadius: '8px',
                  padding: '20px',
                  marginTop: '25px'
                }}>
                  <h3 style={{ 
                    marginTop: 0, 
                    marginBottom: '15px', 
                    color: '#0066cc',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-link"></i>
                    User Account Linking
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                    Internal trainers require LMS system access. Search and link to an existing user account with Team "Trainer".
                  </p>
                  
                  {/* Selected User Display */}
                  {selectedUser ? (
                    <div style={{
                      backgroundColor: '#e8f5e9',
                      border: '1px solid #4caf50',
                      borderRadius: '6px',
                      padding: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="fas fa-check-circle" style={{ color: '#4caf50', fontSize: '20px' }}></i>
                          <strong style={{ color: '#2e7d32' }}>User Account Linked</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={handleClearSelection}
                        >
                          <i className="fas fa-times"></i> Change
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', marginLeft: '30px' }}>
                        <div><strong>Username:</strong> {selectedUser.username}</div>
                        <div><strong>Email:</strong> {selectedUser.email}</div>
                        <div><strong>Team:</strong> {selectedUser.team}</div>
                        <div>
                          <strong>Roles:</strong>{' '}
                          {selectedUser.roles.map((role, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '3px',
                                fontSize: '11px',
                                marginLeft: '4px'
                              }}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search Input with Autocomplete */}
                      <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }}>
                        <label htmlFor="userSearch" style={{ fontWeight: '600' }}>
                          Search User by Username or Email *
                          {isSearching && (
                            <span style={{ marginLeft: '10px', color: '#999', fontSize: '13px' }}>
                              <i className="fas fa-spinner fa-spin"></i> Searching...
                            </span>
                          )}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            id="userSearch"
                            className="form-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Type username or email to search..."
                            autoComplete="off"
                            style={{ 
                              paddingRight: '40px',
                              borderColor: fieldErrors.email ? '#dc3545' : '#ddd'
                            }}
                          />
                          <i className="fas fa-search" style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#999',
                            fontSize: '16px'
                          }}></i>
                        </div>
                        
                        {/* Dropdown Results */}
                        {showDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            marginTop: '5px'
                          }}>
                            {searchResults.length > 0 ? (
                              searchResults.map(user => (
                                <div
                                  key={user.id}
                                  style={{
                                    padding: '12px 15px',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onClick={() => handleSelectUser(user)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                                    e.currentTarget.style.borderLeft = '3px solid #0066cc'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white'
                                    e.currentTarget.style.borderLeft = '3px solid transparent'
                                  }}
                                >
                                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#333' }}>
                                    <i className="fas fa-user" style={{ marginRight: '8px', color: '#0066cc' }}></i>
                                    {user.username}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                    <i className="fas fa-envelope" style={{ marginRight: '8px', width: '14px' }}></i>
                                    {user.email}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    <i className="fas fa-users" style={{ marginRight: '8px', width: '14px' }}></i>
                                    Team: {user.team} | Roles: {user.roles.join(', ')}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                <i className="fas fa-user-slash" style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}></i>
                                <p style={{ fontSize: '13px', margin: 0 }}>No users found with Team "Trainer"</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {fieldErrors.email && <p className="error-message">{fieldErrors.email}</p>}
                      </div>

                      {/* Divider */}
                      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                        <span style={{ padding: '0 15px', fontSize: '13px', color: '#999', fontWeight: '500' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                      </div>

                      {/* Create New User Option */}
                      <div>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '15px'
                        }}>
                          <input
                            type="checkbox"
                            checked={autoCreateUser}
                            onChange={(e) => setAutoCreateUser(e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          Create new user account
                        </label>

                        {autoCreateUser && (
                          <div style={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            padding: '15px'
                          }}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                              <label htmlFor="newUserEmail" style={{ fontSize: '13px', fontWeight: '600' }}>
                                Email *
                              </label>
                              <input
                                type="email"
                                id="newUserEmail"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter email for new user"
                                style={{ fontSize: '13px' }}
                              />
                            </div>
                            
                            <div style={{ fontSize: '13px', marginBottom: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                              <div style={{ marginBottom: '6px' }}>
                                <strong>Username:</strong> {formData.email?.split('@')[0] || 'N/A'}
                              </div>
                              <div>
                                <strong>Role:</strong> <span style={{ 
                                  padding: '2px 6px', 
                                  backgroundColor: '#e3f2fd', 
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                  marginLeft: '4px'
                                }}>TRAINER</span>
                              </div>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label htmlFor="newUserTeam" style={{ fontSize: '13px', fontWeight: '600' }}>
                                Select Team *
                              </label>
                              <select
                                id="newUserTeam"
                                className="form-select"
                                value={newUserTeam}
                                onChange={(e) => setNewUserTeam(e.target.value)}
                                style={{ fontSize: '13px' }}
                              >
                                <option value="">Select team</option>
                                <option value="Admin">Admin</option>
                                <option value="Trainer">Trainer</option>
                                <option value="None">None</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {autoCreateUser && isInternalTrainer ? 'Create User & Trainer' : 'Create Trainer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearchModal
          onSelectUser={handleSelectUserFromSearch}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </>
  )
}
