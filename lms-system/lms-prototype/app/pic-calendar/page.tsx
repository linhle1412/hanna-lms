'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import PendingRegistrations from '@/components/PendingRegistrations'
import { getCurrentUserRole, hasAnyRole } from '@/lib/auth-utils'
import { courseAPI } from '@/lib/api'
import type { Course } from '@/lib/state'
import { useToast } from '@/contexts/ToastContext'
import CourseRegistrationModal from '@/components/CourseRegistrationModal'
import { canRegisterForCourse } from '@/lib/auth-utils'

type ApprovalTab = 'registered' | 'edit' | 'cancel'

function PICCalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'calendar' | 'approvals'>('calendar')
  const [approvalTab, setApprovalTab] = useState<ApprovalTab>('registered')
  const [canApprove, setCanApprove] = useState(false)
  const [approvalCounts, setApprovalCounts] = useState({
    registered: 0,
    edit: 0,
    cancel: 0
  })
  
  // Calendar state
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filters, setFilters] = useState({
    channel: 'all',
    region: 'all',
    courseType: 'all'
  })
  const [showTrainers, setShowTrainers] = useState(true)
  const [showTrainerSelector, setShowTrainerSelector] = useState(false)
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
  const [allTrainers, setAllTrainers] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; course: Course } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user can approve registrations
    const hasApprovalPermission = hasAnyRole(['lead_region', 'head_channel', 'master_role'])
    setCanApprove(hasApprovalPermission)
    
    // Check URL parameter to auto-open approvals tab
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'approvals' && hasApprovalPermission) {
      setActiveTab('approvals')
    }
    
    // Load courses and approval counts
    loadCourses()
    if (hasApprovalPermission) {
      loadApprovalCounts()
    }
  }, [searchParams])

  useEffect(() => {
    applyFilters()
  }, [courses, filters, currentMonth])

  useEffect(() => {
    // Initialize all trainers and selected trainers from filtered courses
    const trainers = getUniqueTrainersSorted()
    setAllTrainers(trainers)
    
    // Load saved selection from localStorage or default to all trainers
    const savedSelection = localStorage.getItem('picCalendar_selectedTrainers')
    if (savedSelection) {
      try {
        const parsed = JSON.parse(savedSelection)
        setSelectedTrainers(parsed)
      } catch {
        setSelectedTrainers(trainers)
      }
    } else {
      setSelectedTrainers(trainers)
    }
  }, [filteredCourses])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCourses = async () => {
    try {
      const allCourses = await courseAPI.getAll()
      setCourses(allCourses)
    } catch (error) {
      console.error('Failed to load courses:', error)
      showToast('Failed to load courses', 'error')
    }
  }

  const loadApprovalCounts = async () => {
    try {
      const courses = await courseAPI.getAll()
      
      setApprovalCounts({
        registered: courses.filter(c => c.status === 'REGISTERED').length,
        edit: courses.filter(c => c.status === 'WAITING_APPROVAL_EDIT').length,
        cancel: courses.filter(c => c.status === 'WAITING_APPROVAL_CANCEL').length
      })
    } catch (error) {
      console.error('Failed to load approval counts:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...courses]

    // Filter by channel
    if (filters.channel !== 'all') {
      filtered = filtered.filter(c => c.channel === filters.channel)
    }

    // Filter by region
    if (filters.region !== 'all') {
      filtered = filtered.filter(c => c.region === filters.region)
    }

    // Filter by course type
    if (filters.courseType !== 'all') {
      filtered = filtered.filter(c => {
        const courseType = c.courseType || c.program || ''
        return courseType.toLowerCase().includes(filters.courseType.toLowerCase())
      })
    }

    // Filter by current month
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    filtered = filtered.filter(c => {
      if (!c.startDate) return false
      const courseDate = new Date(c.startDate)
      return courseDate.getFullYear() === year && courseDate.getMonth() === month
    })

    setFilteredCourses(filtered)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase()
    switch (statusUpper) {
      case 'NEW': return '#FED141'
      case 'REGISTERED': return '#DBDFE1'
      case 'APPROVED': return '#0097A9'
      case 'IN_PROGRESS': return '#FF6347'
      case 'FINISHED': return '#FF6347'
      case 'CANCEL': return '#0A3B32'
      case 'WAITING_APPROVAL_EDIT': return '#6ECEB2'
      case 'WAITING_APPROVAL_CANCEL': return '#6ECEB2'
      default: return '#DBDFE1'
    }
  }

  const getUniqueTrainersSorted = (): string[] => {
    const trainers = Array.from(new Set(
      filteredCourses
        .map(c => c.trainer || c.primaryTrainer)
        .filter((t): t is string => Boolean(t))
    ))
    return trainers.sort()
  }

  const getDisplayedTrainers = () => {
    const allTrainers = getUniqueTrainersSorted()
    if (!showTrainers) return []
    return allTrainers.filter(t => selectedTrainers.includes(t))
  }

  const handleTrainerSelectionChange = (trainer: string, checked: boolean) => {
    setSelectedTrainers(prev => {
      if (checked) {
        return [...prev, trainer]
      } else {
        return prev.filter(t => t !== trainer)
      }
    })
  }

  const handleSelectAllTrainers = (checked: boolean) => {
    if (checked) {
      setSelectedTrainers(allTrainers)
    } else {
      setSelectedTrainers([])
    }
  }

  const handleApplyTrainerSelection = () => {
    if (selectedTrainers.length === 0) {
      showToast('Please select at least one trainer', 'warning')
      return
    }
    
    // Save to localStorage
    localStorage.setItem('picCalendar_selectedTrainers', JSON.stringify(selectedTrainers))
    
    setShowTrainerSelector(false)
    showToast(`Calendar updated to show ${selectedTrainers.length} trainer${selectedTrainers.length !== 1 ? 's' : ''}`, 'success')
  }

  const getCoursesForTrainerAndDay = (trainer: string, day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const targetDate = new Date(year, month, day)
    
    return filteredCourses.filter(course => {
      const courseTrainer = course.trainer || course.primaryTrainer
      if (courseTrainer !== trainer) return false
      if (!course.startDate || !course.endDate) return false
      const start = new Date(course.startDate)
      const end = new Date(course.endDate)
      // Reset time parts for accurate date comparison
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
      return targetDate >= start && targetDate <= end
    })
  }

  const getProvinceAbbreviation = (province: string | undefined) => {
    if (!province) return 'N/A'
    
    // Common province abbreviations
    const abbreviations: { [key: string]: string } = {
      'Ho Chi Minh': 'HCM',
      'Ho Chi Minh City': 'HCM',
      'Hanoi': 'HN',
      'Ha Noi': 'HN',
      'Da Nang': 'DN',
      'Hai Phong': 'HP',
      'Can Tho': 'CT',
      'Bien Hoa': 'BH',
      'Vung Tau': 'VT',
      'Nha Trang': 'NT',
      'Hue': 'HUE',
      'Buon Ma Thuot': 'BMT',
      'Quy Nhon': 'QN',
      'Viet Tri': 'VT',
      'Thai Nguyen': 'TN',
      'Bac Ninh': 'BN',
      'Long Xuyen': 'LX',
      'Rach Gia': 'RG',
      'Ca Mau': 'CM',
      'Vinh': 'VH',
      'My Tho': 'MT',
      'Phan Thiet': 'PT',
      'Dong Hoi': 'DH',
      'Tam Ky': 'TK',
      'Pleiku': 'PL',
      'Kon Tum': 'KT',
      'Dalat': 'DL',
      'Bac Lieu': 'BL',
      'Soc Trang': 'ST',
      'Tra Vinh': 'TV',
      'Ben Tre': 'BT',
      'Dong Thap': 'DT',
      'Tien Giang': 'TG',
      'Vinh Long': 'VL',
      'An Giang': 'AG',
      'Kien Giang': 'KG',
      'Bac Giang': 'BG',
      'Bac Kan': 'BK',
      'Cao Bang': 'CB',
      'Ha Giang': 'HG',
      'Ha Nam': 'HNM',
      'Ha Tinh': 'HT',
      'Hai Duong': 'HD',
      'Hoa Binh': 'HB',
      'Hung Yen': 'HY',
      'Khanh Hoa': 'KH',
      'Lai Chau': 'LC',
      'Lam Dong': 'LD',
      'Lang Son': 'LS',
      'Lao Cai': 'LCI',
      'Nam Dinh': 'ND',
      'Nghe An': 'NA',
      'Ninh Binh': 'NB',
      'Ninh Thuan': 'NTH',
      'Phu Tho': 'PTH',
      'Phu Yen': 'PY',
      'Quang Binh': 'QB',
      'Quang Nam': 'QNM',
      'Quang Ngai': 'QNG',
      'Quang Ninh': 'QNH',
      'Quang Tri': 'QT',
      'Son La': 'SL',
      'Tay Ninh': 'TN',
      'Thai Binh': 'TB',
      'Thanh Hoa': 'TH',
      'Thua Thien Hue': 'TTH',
      'Tuyen Quang': 'TQ',
      'Yen Bai': 'YB'
    }
    
    // Try exact match first
    if (abbreviations[province]) {
      return abbreviations[province]
    }
    
    // Try case-insensitive match
    const provinceLower = province.toLowerCase()
    for (const [fullName, abbr] of Object.entries(abbreviations)) {
      if (fullName.toLowerCase() === provinceLower) {
        return abbr
      }
    }
    
    // If no match, return first 2 uppercase letters (for 2-char province codes)
    return province.substring(0, 2).toUpperCase()
  }

  const canRegister = (course: Course) => {
    const { canRegister: allowed } = canRegisterForCourse(course)
    return allowed
  }

  const handleCourseRightClick = (e: React.MouseEvent, course: Course) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      course
    })
  }

  const handleRegisterClick = () => {
    if (!contextMenu?.course) return
    
    if (!canRegister(contextMenu.course)) {
      const { reason } = canRegisterForCourse(contextMenu.course)
      showToast(reason || 'You cannot register for this course.', 'warning')
      setContextMenu(null)
      return
    }

    setSelectedCourse(contextMenu.course)
    setShowRegisterModal(true)
    setContextMenu(null)
  }

  const handleViewDetails = () => {
    if (!contextMenu?.course) return
    router.push(`/courses/${contextMenu.course.id}`)
    setContextMenu(null)
  }

  const handleRegisterSuccess = () => {
    loadCourses()
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const daysInMonth = getDaysInMonth()

  return (
    <Layout breadcrumbs={[{ label: 'PIC Calendar' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>PIC Calendar</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button 
            className="btn-secondary" 
            onClick={() => handleMonthChange('prev')}
            style={{ padding: '8px 12px' }}
          >
            ‹ Prev
          </button>
          <select 
            className="filter-select"
            value={`${currentMonth.toLocaleString('default', { month: 'long' })} ${currentMonth.getFullYear()}`}
            onChange={(e) => {
              const [month, year] = e.target.value.split(' ')
              const newDate = new Date(`${month} 1, ${year}`)
              setCurrentMonth(newDate)
            }}
          >
            <option>{currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}</option>
          </select>
          <button 
            className="btn-secondary" 
            onClick={() => handleMonthChange('next')}
            style={{ padding: '8px 12px' }}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      {canApprove && (
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'calendar' ? '3px solid #0097A9' : '3px solid transparent',
              color: activeTab === 'calendar' ? '#0097A9' : '#666',
              fontWeight: activeTab === 'calendar' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            📅 My Calendar
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'approvals' ? '3px solid #0097A9' : '3px solid transparent',
              color: activeTab === 'approvals' ? '#0097A9' : '#666',
              fontWeight: activeTab === 'approvals' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            📋 Approvals
            {(approvalCounts.registered + approvalCounts.edit + approvalCounts.cancel) > 0 && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#f39c12',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {approvalCounts.registered + approvalCounts.edit + approvalCounts.cancel}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Approval Sub-Tabs */}
      {canApprove && activeTab === 'approvals' && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setApprovalTab('registered')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: approvalTab === 'registered' ? '2px solid #0097A9' : '2px solid transparent',
              color: approvalTab === 'registered' ? '#0097A9' : '#666',
              fontWeight: approvalTab === 'registered' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Approve Registered
            {approvalCounts.registered > 0 && (
              <span style={{
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: approvalTab === 'registered' ? '#0097A9' : '#e0e0e0',
                color: approvalTab === 'registered' ? 'white' : '#666',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {approvalCounts.registered}
              </span>
            )}
          </button>
          <button
            onClick={() => setApprovalTab('edit')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: approvalTab === 'edit' ? '2px solid #0097A9' : '2px solid transparent',
              color: approvalTab === 'edit' ? '#0097A9' : '#666',
              fontWeight: approvalTab === 'edit' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Approve Edit
            {approvalCounts.edit > 0 && (
              <span style={{
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: approvalTab === 'edit' ? '#0097A9' : '#e0e0e0',
                color: approvalTab === 'edit' ? 'white' : '#666',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {approvalCounts.edit}
              </span>
            )}
          </button>
          <button
            onClick={() => setApprovalTab('cancel')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: approvalTab === 'cancel' ? '2px solid #0097A9' : '2px solid transparent',
              color: approvalTab === 'cancel' ? '#0097A9' : '#666',
              fontWeight: approvalTab === 'cancel' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Approve Cancel
            {approvalCounts.cancel > 0 && (
              <span style={{
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: approvalTab === 'cancel' ? '#0097A9' : '#e0e0e0',
                color: approvalTab === 'cancel' ? 'white' : '#666',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {approvalCounts.cancel}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'calendar' ? (
        <>
          <div className="search-section">
            <select 
              className="filter-select"
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
            >
              <option value="all">All Channels</option>
              <option value="IFA">IFA</option>
              <option value="Banca">Banca</option>
              <option value="Agency">Agency</option>
              <option value="Banker">Banker</option>
            </select>
            <select 
              className="filter-select"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="all">All Regions</option>
              <option value="Central">Central</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="Nationwide">Nationwide</option>
            </select>
            <select 
              className="filter-select"
              value={filters.courseType}
              onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
            >
              <option value="all">All Course Types</option>
              <option value="SHINE">SHINE</option>
              <option value="Product">Product</option>
              <option value="Skill">Skill</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input 
                type="checkbox" 
                checked={showTrainers}
                onChange={(e) => setShowTrainers(e.target.checked)}
              /> 
              Show Trainers
            </label>
          </div>

          <div className="calendar-matrix-view">
            <div className="matrix-container">
              <table className="calendar-matrix-table">
                <thead>
                  <tr>
                    <th className="program-header">
                      PRIMARY TRAINER
                      {showTrainers && (
                        <button 
                          onClick={() => setShowTrainerSelector(true)}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                            padding: '0 0 0 8px',
                            color: '#666',
                            display: 'inline-flex',
                            alignItems: 'center',
                            verticalAlign: 'middle',
                            lineHeight: '1'
                          }}
                          title="Customize Trainers"
                        >
                          ⋮
                        </button>
                      )}
                    </th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i + 1} className="day-header">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getDisplayedTrainers().map((trainer) => (
                    <tr key={trainer} className="program-row">
                      <td className="program-name-cell">
                        <div 
                          className="program-name" 
                          style={{ cursor: 'pointer' }}
                          title={`Click to view ${trainer}'s profile`}
                        >
                          {trainer}
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNumber = i + 1
                        const courses = getCoursesForTrainerAndDay(trainer, dayNumber)
                        const hasCourse = courses.length > 0
                        const course = courses[0] // Take first course if multiple
                        
                        return (
                          <td 
                            key={dayNumber} 
                            className={`day-cell ${hasCourse ? 'has-course' : ''}`}
                            onClick={() => {
                              if (hasCourse && course) {
                                router.push(`/courses/${course.id}`)
                              }
                            }}
                            onContextMenu={(e) => {
                              if (hasCourse && course) {
                                handleCourseRightClick(e, course)
                              }
                            }}
                            style={{
                              backgroundColor: hasCourse ? getStatusColor(course?.status || '') : 'transparent',
                              cursor: hasCourse ? 'pointer' : 'default'
                            }}
                            title={hasCourse && course ? 
                              `Code: ${course.code}\nProgram: ${course.program}\nPrimary Trainer: ${trainer}\nCo-Trainer: ${course.coTrainer || 'N/A'}\nStart: ${new Date(course.startDate).toLocaleDateString('en-GB')}\nEnd: ${new Date(course.endDate).toLocaleDateString('en-GB')}\nProvince: ${course.province}\nStatus: ${course.status}\n\nClick to view details | Right-click for options` 
                              : ''
                            }
                          >
                            {hasCourse && course && (
                              <div className="course-indicator">
                                <span className="course-code-short">{getProvinceAbbreviation(course.province)}</span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  
                  {getDisplayedTrainers().length === 0 && getUniqueTrainersSorted().length > 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="empty-state">
                        <p>👤</p>
                        <p>No trainers selected</p>
                        <button 
                          className="btn-primary"
                          onClick={() => setShowTrainerSelector(true)}
                          style={{ marginTop: '10px' }}
                        >
                          Customize Trainers
                        </button>
                      </td>
                    </tr>
                  )}
                  
                  {getUniqueTrainersSorted().length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="empty-state">
                        <p>📅</p>
                        <p>No courses scheduled for this month</p>
                        <p className="empty-hint">Use filters above to view courses</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Status Legend */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              alignItems: 'center'
            }}>
              <strong style={{ marginRight: '10px' }}>Course Status:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#FED141', borderRadius: '3px' }}></div>
                <span>NEW</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#DBDFE1', borderRadius: '3px' }}></div>
                <span>REGISTERED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#0097A9', borderRadius: '3px' }}></div>
                <span>APPROVED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#FF6347', borderRadius: '3px' }}></div>
                <span>IN_PROGRESS / FINISHED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#0A3B32', borderRadius: '3px' }}></div>
                <span>CANCEL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#6ECEB2', borderRadius: '3px' }}></div>
                <span>WAITING APPROVAL</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {approvalTab === 'registered' && <PendingRegistrations onApprovalComplete={loadApprovalCounts} />}
          {approvalTab === 'edit' && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px dashed #ddd'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔧</div>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '5px' }}>
                Edit Approval Coming Soon
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                This feature will allow you to approve course edit requests
              </div>
            </div>
          )}
          {approvalTab === 'cancel' && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px dashed #ddd'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚫</div>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '5px' }}>
                Cancel Approval Coming Soon
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                This feature will allow you to approve course cancellation requests
              </div>
            </div>
          )}
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px',
            padding: '4px 0'
          }}
        >
          {canRegister(contextMenu.course) && (
            <button
              onClick={handleRegisterClick}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Register
            </button>
          )}
          <button
            onClick={() => router.push(`/courses/${contextMenu.course.id}?tab=general`)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Edit
          </button>
          <button
            onClick={handleViewDetails}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            View Details
          </button>
        </div>
      )}

      {/* Registration Modal */}
      <CourseRegistrationModal
        course={selectedCourse}
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false)
          setSelectedCourse(null)
        }}
        onSuccess={handleRegisterSuccess}
      />

      {/* Trainer Selector Modal */}
      {showTrainerSelector && (
        <div className="modal-overlay" onClick={() => setShowTrainerSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>👤 Select Trainers to Display</h2>
              <button className="modal-close" onClick={() => setShowTrainerSelector(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Select trainers to display in the calendar:
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAllTrainers(true)}
                >
                  ✓ Select All
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAllTrainers(false)}
                >
                  ✗ Deselect All
                </button>
              </div>
              
              <div className="program-list-container">
                {allTrainers.map(trainer => (
                  <label 
                    key={trainer} 
                    className={`program-list-item ${selectedTrainers.includes(trainer) ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox"
                      checked={selectedTrainers.includes(trainer)}
                      onChange={(e) => handleTrainerSelectionChange(trainer, e.target.checked)}
                    />
                    {trainer} ({filteredCourses.filter(c => (c.trainer || c.primaryTrainer) === trainer).length} courses)
                  </label>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <span style={{ fontSize: '14px', color: '#666' }}>
                {selectedTrainers.length} of {allTrainers.length} trainers selected
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    // Reset to saved selection
                    const savedSelection = localStorage.getItem('picCalendar_selectedTrainers')
                    if (savedSelection) {
                      try {
                        setSelectedTrainers(JSON.parse(savedSelection))
                      } catch {
                        setSelectedTrainers(allTrainers)
                      }
                    } else {
                      setSelectedTrainers(allTrainers)
                    }
                    setShowTrainerSelector(false)
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleApplyTrainerSelection}
                  disabled={selectedTrainers.length === 0}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default function PICCalendarPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PICCalendarContent />
    </Suspense>
  )
}
