'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { courseAPI, programAPI } from '@/lib/api'
import type { Course, Program } from '@/lib/state'
import { getCurrentUserRole, canRegisterForCourse } from '@/lib/auth-utils'
import CourseRegistrationModal from '@/components/CourseRegistrationModal'
import CourseCreationModal from '@/components/CourseCreationModal'
import { useToast } from '@/contexts/ToastContext'

export default function MasterCalendarPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefilledData, setPrefilledData] = useState<{ startDate?: string; program?: string }>({})
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; course: Course } | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filters, setFilters] = useState({
    channel: 'all',
    region: 'all',
    courseType: 'all'
  })
  const [showPrograms, setShowPrograms] = useState(true)
  const [showProgramSelector, setShowProgramSelector] = useState(false)
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [allPrograms, setAllPrograms] = useState<string[]>([])
  const [systemPrograms, setSystemPrograms] = useState<Program[]>([])
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    loadCourses()
    loadSystemPrograms()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [courses, filters, currentMonth])

  useEffect(() => {
    // Initialize all programs from system programs (not just from courses)
    if (systemPrograms.length > 0) {
      const programNames = systemPrograms.map(p => p.name).sort()
      setAllPrograms(programNames)
      
      // Load saved selection from localStorage or default to all programs
      const savedSelection = localStorage.getItem('masterCalendar_selectedPrograms')
      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection)
          // Filter to only include programs that still exist in the system
          const validSelection = parsed.filter((p: string) => programNames.includes(p))
          setSelectedPrograms(validSelection.length > 0 ? validSelection : programNames)
        } catch {
          setSelectedPrograms(programNames)
        }
      } else {
        setSelectedPrograms(programNames)
      }
    }
  }, [systemPrograms])

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

  const loadSystemPrograms = async () => {
    try {
      const programs = await programAPI.getAll()
      setSystemPrograms(programs)
    } catch (error) {
      console.error('Failed to load programs:', error)
      showToast('Failed to load programs', 'error')
      // Fallback: extract programs from courses if API fails
      const allCourses = await courseAPI.getAll()
      const programNames = Array.from(new Set(allCourses.map(c => c.program).filter(Boolean)))
      const fallbackPrograms: Program[] = programNames.map((name, index) => ({
        id: index + 1,
        name,
        type: name.toLowerCase().includes('shine') ? 'SHINE' : name.toLowerCase().includes('product') ? 'Product' : 'Skill',
        licenseType: 'Unknown',
        duration: 5,
        status: 'ACTIVE'
      }))
      setSystemPrograms(fallbackPrograms)
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

  const getFirstDayOfMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month, 1).getDay()
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

  const getCoursesForDay = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return filteredCourses.filter(course => {
      if (!course.startDate) return false
      const courseDate = new Date(course.startDate)
      const courseDateStr = `${courseDate.getFullYear()}-${String(courseDate.getMonth() + 1).padStart(2, '0')}-${String(courseDate.getDate()).padStart(2, '0')}`
      return courseDateStr === dateStr
    })
  }

  const getDisplayedPrograms = () => {
    if (!showPrograms) return []
    // Return selected programs directly (they come from system programs, not just courses)
    return selectedPrograms.filter(p => allPrograms.includes(p))
  }

  const handleProgramSelectionChange = (program: string, checked: boolean) => {
    setSelectedPrograms(prev => {
      if (checked) {
        return [...prev, program]
      } else {
        return prev.filter(p => p !== program)
      }
    })
  }

  const handleSelectAllPrograms = (checked: boolean) => {
    if (checked) {
      setSelectedPrograms(allPrograms)
    } else {
      setSelectedPrograms([])
    }
  }

  const handleApplyProgramSelection = () => {
    if (selectedPrograms.length === 0) {
      showToast('Please select at least one program', 'warning')
      return
    }
    
    // Save to localStorage
    localStorage.setItem('masterCalendar_selectedPrograms', JSON.stringify(selectedPrograms))
    
    setShowProgramSelector(false)
    showToast(`Calendar updated to show ${selectedPrograms.length} program${selectedPrograms.length !== 1 ? 's' : ''}`, 'success')
  }

  const groupProgramsByType = () => {
    const grouped: { [key: string]: string[] } = {
      'SHINE': [],
      'Product': [],
      'Skill': []
    }
    
    allPrograms.forEach(program => {
      const programLower = program.toLowerCase()
      if (programLower.includes('shine')) {
        grouped['SHINE'].push(program)
      } else if (programLower.includes('product')) {
        grouped['Product'].push(program)
      } else if (programLower.includes('skill')) {
        grouped['Skill'].push(program)
      } else {
        // Default to Product if unclear
        grouped['Product'].push(program)
      }
    })
    
    return grouped
  }

  const getCourseCountForProgram = (program: string) => {
    return filteredCourses.filter(c => c.program === program).length
  }

  const getCoursesForProgramAndDay = (program: string, day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const targetDate = new Date(year, month, day)
    
    return filteredCourses.filter(course => {
      if (course.program !== program) return false
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
  const firstDayOfMonth = getFirstDayOfMonth()

  return (
    <Layout breadcrumbs={[{ label: 'Master Calendar' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Master Calendar</h1>
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
              // Simple month/year selector - can be enhanced
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
          <button 
            className="btn-primary" 
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap' }}
            onClick={() => router.push('/courses')}
          >
            Create Course
          </button>
        </div>
      </div>

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
            checked={showPrograms}
            onChange={(e) => setShowPrograms(e.target.checked)}
          /> 
          Show Programs
        </label>
      </div>

      <div className="calendar-matrix-view">
        <div className="matrix-container">
          <table className="calendar-matrix-table">
            <thead>
              <tr>
                <th className="program-header">
                  PROGRAM
                  {showPrograms && (
                    <button 
                      onClick={() => setShowProgramSelector(true)}
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
                      title="Customize Programs"
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
              {getDisplayedPrograms().map((program) => (
                <tr key={program} className="program-row">
                  <td className="program-name-cell">
                    <div className="program-name">{program}</div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNumber = i + 1
                    const courses = getCoursesForProgramAndDay(program, dayNumber)
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
                        onDoubleClick={() => {
                          if (!hasCourse) {
                            const year = currentMonth.getFullYear()
                            const month = currentMonth.getMonth()
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                            setPrefilledData({ startDate: dateStr, program: program })
                            setShowCreateModal(true)
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
                          `Code: ${course.code}\nName: ${course.name}\nTrainer: ${course.trainer || 'N/A'}\nStart: ${new Date(course.startDate).toLocaleDateString('en-GB')}\nEnd: ${new Date(course.endDate).toLocaleDateString('en-GB')}\nStatus: ${course.status}\n\nClick to view details | Right-click for options` 
                          : `Double-click to create ${program} course on ${dayNumber}/${currentMonth.getMonth() + 1}`
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
              
              {getDisplayedPrograms().length === 0 && allPrograms.length > 0 && (
                <tr>
                  <td colSpan={daysInMonth + 1} className="empty-state">
                    <p>⚙️</p>
                    <p>No programs selected</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowProgramSelector(true)}
                      style={{ marginTop: '10px' }}
                    >
                      Customize Programs
                    </button>
                  </td>
                </tr>
              )}
              
              {allPrograms.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 1} className="empty-state">
                    <p>📅</p>
                    <p>No programs available in the system</p>
                    <p className="empty-hint">Contact administrator to add programs</p>
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

      {/* Course Creation Modal */}
      <CourseCreationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setPrefilledData({})
        }}
        onSuccess={() => {
          setShowCreateModal(false)
          setPrefilledData({})
          loadCourses()
        }}
        prefilledData={prefilledData}
      />

      {/* Program Selector Modal */}
      {showProgramSelector && (
        <div className="modal-overlay" onClick={() => setShowProgramSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>Customize Programs</h2>
              <button className="modal-close" onClick={() => setShowProgramSelector(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Select programs to display in the calendar:
              </p>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 600 }}>
                <input 
                  type="checkbox"
                  checked={selectedPrograms.length === allPrograms.length && allPrograms.length > 0}
                  onChange={(e) => handleSelectAllPrograms(e.target.checked)}
                />
                Select All Programs
              </label>
              
              <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
                {Object.entries(groupProgramsByType()).map(([type, programs]) => (
                  programs.length > 0 && (
                    <div key={type} style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0097A9', marginBottom: '10px' }}>
                        {type} Programs:
                      </h3>
                      {programs.map(program => (
                        <label 
                          key={program} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            marginBottom: '8px',
                            padding: '8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={selectedPrograms.includes(program)}
                            onChange={(e) => handleProgramSelectionChange(program, e.target.checked)}
                          />
                          <span style={{ flex: 1 }}>{program}</span>
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>
                            ({getCourseCountForProgram(program)} {getCourseCountForProgram(program) === 1 ? 'course' : 'courses'})
                          </span>
                        </label>
                      ))}
                    </div>
                  )
                ))}
              </div>
              
            </div>
            
            <div className="modal-footer">
              <span style={{ fontSize: '14px', color: '#666' }}>
                {selectedPrograms.length} of {allPrograms.length} programs selected
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    // Reset to saved selection
                    const savedSelection = localStorage.getItem('masterCalendar_selectedPrograms')
                    if (savedSelection) {
                      try {
                        setSelectedPrograms(JSON.parse(savedSelection))
                      } catch {
                        setSelectedPrograms(allPrograms)
                      }
                    } else {
                      setSelectedPrograms(allPrograms)
                    }
                    setShowProgramSelector(false)
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleApplyProgramSelection}
                  disabled={selectedPrograms.length === 0}
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
