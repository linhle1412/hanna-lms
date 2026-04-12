'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { getCurrentUserRole } from '@/lib/auth-utils'
import { courseAPI, userAPI } from '@/lib/api'
import MultiSelect from '@/components/MultiSelect'
import { MOF_ADDRESS_CONFIGS } from '@/lib/mof-address-config'
import { generateUniqueCourseCode } from '@/lib/course-code-generator'
import type { User } from '@/lib/state'

interface CourseCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  prefilledData?: {
    startDate?: string
    program?: string
  }
}

export default function CourseCreationModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledData
}: CourseCreationModalProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trainers, setTrainers] = useState<User[]>([])

  // Form state
  const [courseType, setCourseType] = useState<'Shine' | 'Product' | 'Skill'>('Shine')
  const [licenseType, setLicenseType] = useState<string>('') // Auto-populated from program
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Mock programs data - will be replaced with API call later
  const mockPrograms = useMemo(() => [
    { id: 1, name: 'SHINE Basic', type: 'Shine', status: 'Active' },
    { id: 2, name: 'SHINE Advanced', type: 'Shine', status: 'Active' },
    { id: 3, name: 'Product Training A', type: 'Product', status: 'Active' },
    { id: 4, name: 'Product Training B', type: 'Product', status: 'Active' },
    { id: 5, name: 'Skill Development', type: 'Skill', status: 'Active' },
    { id: 6, name: 'Skill Enhancement', type: 'Skill', status: 'Active' }
  ], [])

  // Filter programs by course type
  const filteredPrograms = useMemo(() => {
    return mockPrograms.filter(p => p.type === courseType && p.status === 'Active')
  }, [courseType, mockPrograms])
  const [formData, setFormData] = useState({
    // Base fields (1-17, 21)
    program: prefilledData?.program || '',
    courseName: '',
    partner: [] as string[],
    branch: '',
    primaryTrainer: '',
    coTrainer: '',
    channel: '',
    region: '',
    venueAddress: '',
    startDate: prefilledData?.startDate || '',
    startTimePeriod: 'AM',
    endDate: '',
    endTimePeriod: 'AM',
    area: '',
    province: '',
    description: '',
    
    // AOL fields (18-20) - for SHINE and Product
    aolStartTime: '',
    aolEndTime: '',
    aolExamId: [] as string[],
    
    // MOF fields (22-33) - for SHINE only
    // Note: District removed due to Vietnam admin reform July 2025
    mofCourseName: '',
    examType: '',
    mofExamTime: '',
    isProctorTrainer: false,
    proctorTrainer: '',
    proctorName: '',
    proctorPhone: '',
    mofAddress: '',
    mofProvince: '',
    ward: '',
    examCategory: '',
    supporter: [] as string[]
  })

  // Fetch trainers on mount
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const allUsers = await userAPI.getAll()
        // Filter users with team "Trainer"
        const trainerUsers = allUsers.filter(user => user.team.toLowerCase() === 'trainer')
        setTrainers(trainerUsers)
      } catch (error) {
        console.error('Failed to fetch trainers:', error)
        showToast('Failed to load trainers', 'error')
      }
    }
    
    if (isOpen) {
      fetchTrainers()
    }
  }, [isOpen, showToast])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFieldErrors({}) // Clear errors
      setFormData({
        program: prefilledData?.program || '',
        courseName: '',
        partner: [],
        branch: '',
        primaryTrainer: (() => {
          if (typeof window === 'undefined') return '';
          const userRole = sessionStorage.getItem('userRole')?.toLowerCase();
          const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('currentUserName') || '';
          // Only auto-set for Trainer role
          return userRole === 'trainer' ? userName : '';
        })(),
        coTrainer: '',
        channel: '',
        region: '',
        venueAddress: '',
        startDate: prefilledData?.startDate || '',
        startTimePeriod: 'AM',
        endDate: '',
        endTimePeriod: 'AM',
        area: '',
        province: '',
        description: '',
        aolStartTime: '',
        aolEndTime: '',
        aolExamId: [],
        mofCourseName: '',
        examType: '',
        mofExamTime: '',
        isProctorTrainer: false,
        proctorTrainer: '',
        proctorName: '',
        proctorPhone: '',
        mofAddress: '',
        mofProvince: '',
        ward: '',
        examCategory: '',
        supporter: []
      })
      setCourseType('Shine')
      setLicenseType('')
    }
  }, [isOpen, prefilledData])

  // Auto-populate license type when program changes
  useEffect(() => {
    if (formData.program) {
      // TODO: Fetch license type from program API
      // For MVP: Auto-detect based on program name
      if (formData.program.toLowerCase().includes('shine')) {
        setLicenseType('Insurance Agent License')
      } else if (formData.program.toLowerCase().includes('product')) {
        setLicenseType('Product Training Certificate')
      } else if (formData.program.toLowerCase().includes('skill')) {
        setLicenseType('Skill Development Certificate')
      } else {
        setLicenseType('General Training Certificate')
      }
    } else {
      setLicenseType('')
    }
  }, [formData.program])

  // Auto-fill course name with program name (editable)
  useEffect(() => {
    if (formData.program && !formData.courseName) {
      handleInputChange('courseName', formData.program)
    }
  }, [formData.program])

  // Auto-populate MOF Province and Ward when MOF Address is selected
  // Updated for Vietnam's 2-tier admin structure (no district level)
  useEffect(() => {
    if (formData.mofAddress) {
      const selectedConfig = MOF_ADDRESS_CONFIGS.find(config => config.address === formData.mofAddress)
      if (selectedConfig) {
        setFormData(prev => ({
          ...prev,
          mofProvince: selectedConfig.city,
          ward: selectedConfig.ward
        }))
      }
    }
  }, [formData.mofAddress])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Start date validation: must be >= today + 2 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const minDate = new Date(today)
    minDate.setDate(minDate.getDate() + 2)
    const startDate = new Date(formData.startDate)
    startDate.setHours(0, 0, 0, 0)

    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    } else if (startDate < minDate) {
      errors.startDate = 'Must be at least 2 days from today'
    }

    // End date validation
    if (!formData.endDate) {
      errors.endDate = 'End date is required'
    } else {
      const endDate = new Date(formData.endDate)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < startDate) {
        errors.endDate = 'Cannot be before start date'
      }
    }

    // Required base fields
    if (!formData.program) errors.program = 'Program is required'
    if (!formData.courseName) errors.courseName = 'Course name is required'
    if (!formData.primaryTrainer) errors.primaryTrainer = 'Primary trainer is required'
    if (!formData.channel) errors.channel = 'Channel is required'
    if (!formData.region) errors.region = 'Region is required'
    if (!formData.venueAddress) errors.venueAddress = 'Venue address is required'
    if (!formData.area) errors.area = 'Area is required'
    if (!formData.province) errors.province = 'Province is required'

    // SHINE-specific validations
    if (courseType === 'Shine') {
      if (!formData.mofCourseName) errors.mofCourseName = 'MOF course name is required'
      if (!formData.examType) errors.examType = 'Exam type is required'
      if (!formData.mofExamTime) {
        errors.mofExamTime = 'MOF exam time is required'
      } else {
        // MOF exam time validation
        const mofExamDate = new Date(formData.mofExamTime)
        const maxMofDate = new Date(startDate)
        maxMofDate.setDate(maxMofDate.getDate() + 30)
        
        if (mofExamDate < startDate || mofExamDate > maxMofDate) {
          errors.mofExamTime = 'Must be within 30 days of course start'
        }
      }
      if (!formData.mofAddress) errors.mofAddress = 'MOF address is required'
      if (!formData.examCategory) errors.examCategory = 'Exam category is required'

      // Proctor validation
      if (formData.isProctorTrainer && !formData.proctorTrainer) {
        errors.proctorTrainer = 'Proctor trainer is required'
      }
      if (!formData.isProctorTrainer) {
        if (!formData.proctorName) errors.proctorName = 'Proctor name is required'
        if (!formData.proctorPhone) errors.proctorPhone = 'Proctor phone is required'
      }
    }

    // AOL validation for SHINE and Product
    if (courseType === 'Shine' || courseType === 'Product') {
      if (formData.aolStartTime && formData.aolEndTime) {
        const aolStart = new Date(formData.aolStartTime)
        const aolEnd = new Date(formData.aolEndTime)
        const endDate = new Date(formData.endDate)
        const maxAolDate = new Date(endDate)
        maxAolDate.setDate(maxAolDate.getDate() + 3)

        if (aolStart < startDate) {
          errors.aolStartTime = 'Must be after course start date'
        }
        if (aolEnd > maxAolDate) {
          errors.aolEndTime = 'Must be within course end date + 3 days'
        }
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    const isValid = validateForm()
    if (!isValid) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const userName = typeof window !== 'undefined' 
        ? sessionStorage.getItem('currentUserName') || 'System'
        : 'System'
      const userRole = getCurrentUserRole()

      // Fetch all courses to generate unique course code
      const allCourses = await courseAPI.getAll()
      
      // Generate unique course code
      const courseCode = generateUniqueCourseCode({
        province: formData.province,
        channel: formData.channel,
        courseType: courseType,
        program: formData.program
      }, allCourses)

      // Prepare course data
      const courseData = {
        code: courseCode,
        status: 'NEW',
        courseType,
        name: formData.courseName,
        program: formData.program,
        channel: formData.channel,
        region: formData.region,
        venueAddress: formData.venueAddress,
        startDate: formData.startDate,
        startTimePeriod: formData.startTimePeriod,
        endDate: formData.endDate,
        endTimePeriod: formData.endTimePeriod,
        area: formData.area,
        province: formData.province,
        primaryTrainer: formData.primaryTrainer,
        trainer: formData.primaryTrainer,
        coTrainer: formData.coTrainer || undefined,
        partner: formData.partner.length > 0 ? formData.partner : undefined,
        branch: formData.branch || undefined,
        description: formData.description || undefined,
        
        // AOL fields for SHINE and Product
        ...(courseType === 'Shine' || courseType === 'Product' ? {
          aolStartTime: formData.aolStartTime || undefined,
          aolEndTime: formData.aolEndTime || undefined,
          aolExamId: formData.aolExamId.length > 0 ? formData.aolExamId : undefined,
        } : {}),
        
        // MOF fields for SHINE only
        ...(courseType === 'Shine' ? {
          mofCourseName: formData.mofCourseName,
          examType: formData.examType,
          mofExamTime: formData.mofExamTime,
          isProctorTrainer: formData.isProctorTrainer,
          proctorTrainer: formData.isProctorTrainer ? formData.proctorTrainer : undefined,
          proctorName: !formData.isProctorTrainer ? formData.proctorName : undefined,
          proctorPhone: !formData.isProctorTrainer ? formData.proctorPhone : undefined,
          mofAddress: formData.mofAddress,
          mofProvince: formData.mofProvince,
          ward: formData.ward,
          examCategory: formData.examCategory,
          supporter: formData.supporter.length > 0 ? formData.supporter : undefined,
        } : {}),
        
        // User info for backend
        userName,
        userRole,
        createdBy: userName
      }

      await courseAPI.create(courseData)
      showToast(`Course created successfully! Course Code: ${courseCode}`, 'success')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course'
      showToast(errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const showMOFFields = courseType === 'Shine'
  const showAOLFields = courseType === 'Shine' || courseType === 'Product'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h3>Create New Course</h3>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {/* Row 1: Course Type | Program */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Course Type <span style={{ color: 'red' }}>*</span></label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value as 'Shine' | 'Product' | 'Skill')}
                disabled={isSubmitting}
              >
                <option value="Shine">SHINE</option>
                <option value="Product">Product</option>
                <option value="Skill">Skill</option>
              </select>
            </div>

            <div className="form-group">
              <label>Program <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.program}
                onChange={(e) => handleInputChange('program', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.program ? '#dc3545' : undefined }}
              >
                <option value="">Select program</option>
                {filteredPrograms.map(program => (
                  <option key={program.id} value={program.name}>
                    {program.name}
                  </option>
                ))}
              </select>
              {fieldErrors.program && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.program}
                </small>
              )}
            </div>
          </div>

          {/* Row 1.5: License Type (Display only, auto-populated) */}
          {licenseType && (
            <div className="form-group">
              <label>License Type</label>
              <input
                type="text"
                value={licenseType}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          )}

          {/* Row 2: Course Name (full width) */}
          <div className="form-group">
            <label>Course Name <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) => handleInputChange('courseName', e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter course name"
              style={{ borderColor: fieldErrors.courseName ? '#dc3545' : undefined }}
            />
            {fieldErrors.courseName && (
              <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {fieldErrors.courseName}
              </small>
            )}
          </div>

          {/* Row 2.5: Partner | Branch (Optional) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <MultiSelect
              label="Partner"
              options={['Partner A', 'Partner B', 'Partner C', 'Partner D', 'Partner E']}
              selectedValues={formData.partner}
              onChange={(selected) => handleInputChange('partner', selected)}
              placeholder="Select partners..."
              disabled={isSubmitting}
              size={5}
              style={{ margin: 0 }}
            />

            <div className="form-group">
              <label>Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select branch (optional)</option>
                <option value="Branch 1">Branch 1</option>
                <option value="Branch 2">Branch 2</option>
                <option value="Branch 3">Branch 3</option>
              </select>
            </div>
          </div>

          {/* Row 3: Primary Trainer | Co-Trainer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Primary Trainer <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.primaryTrainer}
                onChange={(e) => handleInputChange('primaryTrainer', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.primaryTrainer ? '#dc3545' : undefined }}
              >
                <option value="">Select primary trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.username}>
                    {trainer.username}
                  </option>
                ))}
              </select>
              {fieldErrors.primaryTrainer && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.primaryTrainer}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Co-Trainer</label>
              <select
                value={formData.coTrainer}
                onChange={(e) => handleInputChange('coTrainer', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select co-trainer (optional)</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.username}>
                    {trainer.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Channel | Region */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Channel <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.channel ? '#dc3545' : undefined }}
              >
                <option value="">Select channel</option>
                <option value="Agency">Agency</option>
                <option value="Banca FSC">Banca FSC</option>
                <option value="Banker">Banker</option>
                <option value="IFA">IFA</option>
              </select>
              {fieldErrors.channel && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.channel}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Region <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.region ? '#dc3545' : undefined }}
              >
                <option value="">Select region</option>
                <option value="Central">Central</option>
                <option value="Middle">Middle</option>
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
              {fieldErrors.region && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.region}
                </small>
              )}
            </div>
          </div>

          {/* Row 5: Venue Address (full width) */}
          <div className="form-group">
            <label>Venue Address <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              value={formData.venueAddress}
              onChange={(e) => handleInputChange('venueAddress', e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter venue address"
              style={{ borderColor: fieldErrors.venueAddress ? '#dc3545' : undefined }}
            />
            {fieldErrors.venueAddress && (
              <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {fieldErrors.venueAddress}
              </small>
            )}
          </div>

          {/* Row 6: Start Date | End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Start Date <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.startDate ? '#dc3545' : undefined }}
              />
              {fieldErrors.startDate && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.startDate}
                </small>
              )}
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="startTimePeriod"
                    value="AM"
                    checked={formData.startTimePeriod === 'AM'}
                    onChange={(e) => handleInputChange('startTimePeriod', e.target.value)}
                    disabled={isSubmitting}
                    style={{ marginRight: '5px' }}
                  />
                  AM
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="startTimePeriod"
                    value="PM"
                    checked={formData.startTimePeriod === 'PM'}
                    onChange={(e) => handleInputChange('startTimePeriod', e.target.value)}
                    disabled={isSubmitting}
                    style={{ marginRight: '5px' }}
                  />
                  PM
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>End Date <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.endDate ? '#dc3545' : undefined }}
              />
              {fieldErrors.endDate && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.endDate}
                </small>
              )}
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="endTimePeriod"
                    value="AM"
                    checked={formData.endTimePeriod === 'AM'}
                    onChange={(e) => handleInputChange('endTimePeriod', e.target.value)}
                    disabled={isSubmitting}
                    style={{ marginRight: '5px' }}
                  />
                  AM
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="endTimePeriod"
                    value="PM"
                    checked={formData.endTimePeriod === 'PM'}
                    onChange={(e) => handleInputChange('endTimePeriod', e.target.value)}
                    disabled={isSubmitting}
                    style={{ marginRight: '5px' }}
                  />
                  PM
                </label>
              </div>
            </div>
          </div>

          {/* Row 7: Area | Province */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Area <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.area ? '#dc3545' : undefined }}
              >
                <option value="">Select area</option>
                <option value="Area 1">Area 1</option>
                <option value="Area 2">Area 2</option>
                <option value="Area 3">Area 3</option>
                <option value="Area 4">Area 4</option>
              </select>
              {fieldErrors.area && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.area}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Province <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                disabled={isSubmitting}
                style={{ borderColor: fieldErrors.province ? '#dc3545' : undefined }}
              >
                <option value="">Select province</option>
                <option value="Ho Chi Minh">Ho Chi Minh</option>
                <option value="Hanoi">Hanoi</option>
                <option value="Da Nang">Da Nang</option>
                <option value="Can Tho">Can Tho</option>
                <option value="Hai Phong">Hai Phong</option>
              </select>
              {fieldErrors.province && (
                <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.province}
                </small>
              )}
            </div>
          </div>

          {/* Row 8: Description (full width) */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter course description (optional)"
              rows={3}
            />
          </div>

          {/* AOL Fields - Show for SHINE and Product */}
          {showAOLFields && (
            <>
              <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '15px', marginTop: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>AOL Exam Information (Optional)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>AOL Start Time</label>
                  <input
                    type="date"
                    value={formData.aolStartTime}
                    onChange={(e) => handleInputChange('aolStartTime', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.aolStartTime ? '#dc3545' : undefined }}
                  />
                  {fieldErrors.aolStartTime && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.aolStartTime}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>AOL End Time</label>
                  <input
                    type="date"
                    value={formData.aolEndTime}
                    onChange={(e) => handleInputChange('aolEndTime', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.aolEndTime ? '#dc3545' : undefined }}
                  />
                  {fieldErrors.aolEndTime && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.aolEndTime}
                    </small>
                  )}
                </div>
              </div>

              <MultiSelect
                label="AOL Exam ID"
                options={['AOL001', 'AOL002', 'AOL003', 'AOL004', 'AOL005']}
                selectedValues={formData.aolExamId}
                onChange={(selected) => handleInputChange('aolExamId', selected)}
                placeholder="Select AOL exam codes..."
                disabled={isSubmitting}
                size={5}
              />
            </>
          )}

          {/* MOF Fields - Show for SHINE only */}
          {showMOFFields && (
            <>
              <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '15px', marginTop: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>MOF Exam Information</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>MOF Course Name <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.mofCourseName}
                    onChange={(e) => handleInputChange('mofCourseName', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter MOF course name"
                    style={{ borderColor: fieldErrors.mofCourseName ? '#dc3545' : undefined }}
                  />
                  {fieldErrors.mofCourseName && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.mofCourseName}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Exam Type <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={formData.examType}
                    onChange={(e) => handleInputChange('examType', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.examType ? '#dc3545' : undefined }}
                  >
                    <option value="">Select exam type</option>
                    <option value="Trực tuyến tại doanh nghiệp">Trực tuyến tại doanh nghiệp</option>
                    <option value="Trực tuyến tại VIDI">Trực tuyến tại VIDI</option>
                  </select>
                  {fieldErrors.examType && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.examType}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>MOF Exam Time <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="datetime-local"
                    value={formData.mofExamTime}
                    onChange={(e) => handleInputChange('mofExamTime', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.mofExamTime ? '#dc3545' : undefined }}
                  />
                  {fieldErrors.mofExamTime && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.mofExamTime}
                    </small>
                  )}
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontWeight: 'normal',
                    marginBottom: 0
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.isProctorTrainer}
                      onChange={(e) => handleInputChange('isProctorTrainer', e.target.checked)}
                      disabled={isSubmitting}
                      style={{ 
                        marginRight: '8px', 
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ lineHeight: '1.5' }}>Proctor is a trainer</span>
                  </label>
                </div>

                {formData.isProctorTrainer ? (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Proctor Trainer <span style={{ color: 'red' }}>*</span></label>
                    <select
                      value={formData.proctorTrainer}
                      onChange={(e) => handleInputChange('proctorTrainer', e.target.value)}
                      disabled={isSubmitting}
                      style={{ borderColor: fieldErrors.proctorTrainer ? '#dc3545' : undefined }}
                    >
                      <option value="">Select proctor trainer</option>
                      {trainers.map(trainer => (
                        <option key={trainer.id} value={trainer.username}>
                          {trainer.username}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.proctorTrainer && (
                      <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.proctorTrainer}
                      </small>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Proctor Name <span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="text"
                        value={formData.proctorName}
                        onChange={(e) => handleInputChange('proctorName', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Enter proctor name"
                        style={{ borderColor: fieldErrors.proctorName ? '#dc3545' : undefined }}
                      />
                      {fieldErrors.proctorName && (
                        <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.proctorName}
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Proctor Phone <span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="text"
                        value={formData.proctorPhone}
                        onChange={(e) => handleInputChange('proctorPhone', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Enter proctor phone"
                        style={{ borderColor: fieldErrors.proctorPhone ? '#dc3545' : undefined }}
                      />
                      {fieldErrors.proctorPhone && (
                        <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.proctorPhone}
                        </small>
                      )}
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>MOF Address <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={formData.mofAddress}
                    onChange={(e) => handleInputChange('mofAddress', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.mofAddress ? '#dc3545' : undefined }}
                  >
                    <option value="">Select MOF exam address</option>
                    {MOF_ADDRESS_CONFIGS.map((config) => (
                      <option key={config.address} value={config.address}>
                        {config.address}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.mofAddress && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.mofAddress}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>MOF Province <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.mofProvince}
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    placeholder="Auto-populated from MOF Address"
                  />
                </div>

                <div className="form-group">
                  <label>Ward <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.ward}
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    placeholder="Auto-populated from MOF Address"
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Note: District level abolished in Vietnam admin reform (July 2025)
                  </small>
                </div>

                <div className="form-group">
                  <label>Exam Category <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={formData.examCategory}
                    onChange={(e) => handleInputChange('examCategory', e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderColor: fieldErrors.examCategory ? '#dc3545' : undefined }}
                  >
                    <option value="">Select exam category</option>
                    <option value="Nhân viên tư vấn bảo hiểm">Nhân viên tư vấn bảo hiểm</option>
                    <option value="Nhân viên NH">Nhân viên NH</option>
                  </select>
                  {fieldErrors.examCategory && (
                    <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.examCategory}
                    </small>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <MultiSelect
                    label="Supporter"
                    options={['Admin User 1', 'Admin User 2', 'Admin User 3', 'Admin User 4', 'Admin User 5']}
                    selectedValues={formData.supporter}
                    onChange={(selected) => handleInputChange('supporter', selected)}
                    placeholder="Select supporters (optional)..."
                    disabled={isSubmitting}
                    size={5}
                  />
                </div>
              </div>
            </>
          )}
          </div>
    
        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
