'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { courseAPI, participantAPI, trainerAPI, userAPI } from '@/lib/api'
import type { Course } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import PendingRegistrations from '@/components/PendingRegistrations'
import PendingEditApprovals from '@/components/PendingEditApprovals'
import PendingCancelApprovals from '@/components/PendingCancelApprovals'

type ApprovalTab = 'registered' | 'edit' | 'cancel'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    courses: 0,
    participants: 0,
    trainers: 0,
    users: 0,
    pendingApprovals: 0
  })
  const [approvalCounts, setApprovalCounts] = useState({
    registered: 0,
    edit: 0,
    cancel: 0
  })
  const [recentCourses, setRecentCourses] = useState<Course[]>([])
  const [showPendingApprovals, setShowPendingApprovals] = useState(false)
  const [showApprovalsSection, setShowApprovalsSection] = useState(false)
  const [activeApprovalTab, setActiveApprovalTab] = useState<ApprovalTab>('registered')

  useEffect(() => {
    loadDashboardData()
    checkApprovalPermission()
  }, [])

  const checkApprovalPermission = () => {
    if (typeof window === 'undefined') return
    const rolesJson = sessionStorage.getItem('userRoles')
    if (!rolesJson) return
    
    try {
      const roles = JSON.parse(rolesJson).map((r: string) => r.toLowerCase())
      const canApprove = roles.some((r: string) => ['lead_region', 'head_channel', 'master_role', 'test_role'].includes(r))
      setShowPendingApprovals(canApprove)
    } catch (e) {
      console.error('Error checking approval permission:', e)
    }
  }

  const loadDashboardData = async () => {
    try {
      const [courses, participants, trainers, users] = await Promise.all([
        courseAPI.getAll(),
        participantAPI.getAll(),
        trainerAPI.getAll(),
        userAPI.getAll()
      ])
      
      // Calculate pending approvals count (3 types)
      const registeredCount = courses.filter(c => c.status === 'REGISTERED').length
      const editCount = courses.filter(c => c.status === 'WAITING_APPROVAL_EDIT').length
      const cancelCount = courses.filter(c => c.status === 'WAITING_APPROVAL_CANCEL').length
      const totalPendingApprovals = registeredCount + editCount + cancelCount
      
      setStats({
        courses: courses.length,
        participants: participants.length,
        trainers: trainers.length,
        users: users.length,
        pendingApprovals: totalPendingApprovals
      })

      setApprovalCounts({
        registered: registeredCount,
        edit: editCount,
        cancel: cancelCount
      })
      
      setRecentCourses(courses.slice(0, 3))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const handleApprovalComplete = () => {
    loadDashboardData()
  }

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase().replace(' ', '-')
    return `status-${statusLower}`
  }

  const courseColumns: Column<Course>[] = [
    {
      key: 'code',
      label: 'Course Code',
      sortable: true,
      render: (course) => <Link href={`/courses/${course.id}`}>{course.code}</Link>
    },
    {
      key: 'name',
      label: 'Course Name',
      sortable: true
    },
    {
      key: 'trainer',
      label: 'Trainer',
      sortable: true,
      render: (course) => <>• {course.trainer}</>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (course) => (
        <span className={`status-badge ${getStatusClass(course.status)}`}>{course.status}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (course) => <Link href={`/courses/${course.id}`}>View</Link>
    }
  ]

  return (
    <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="dashboard-stats">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-card">
            <h3>Active Courses</h3>
            <p style={{ color: 'var(--color-primary)' }}>{stats.courses}</p>
          </div>
          <div className="stat-card">
            <h3>Total Participants</h3>
            <p style={{ color: '#3498db' }}>{stats.participants}</p>
          </div>
          {showPendingApprovals && (
            <div 
              className="stat-card" 
              style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
              onClick={() => setShowApprovalsSection(!showApprovalsSection)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <h3>
                Pending Approvals
                <i 
                  className={`fas fa-chevron-${showApprovalsSection ? 'up' : 'down'}`} 
                  style={{ marginLeft: '8px', fontSize: '14px', color: '#999' }}
                ></i>
              </h3>
              <p style={{ color: '#f39c12' }}>{stats.pendingApprovals}</p>
              {stats.pendingApprovals > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginTop: '8px',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  {approvalCounts.registered > 0 && <span>Register: {approvalCounts.registered}</span>}
                  {approvalCounts.edit > 0 && <span>Edit: {approvalCounts.edit}</span>}
                  {approvalCounts.cancel > 0 && <span>Cancel: {approvalCounts.cancel}</span>}
                </div>
              )}
            </div>
          )}
          <div className="stat-card">
            <h3>Trainers</h3>
            <p style={{ color: '#2ecc71' }}>{stats.trainers}</p>
          </div>
        </div>
      </div>

      {/* Approval Requests Section */}
      {showPendingApprovals && showApprovalsSection && stats.pendingApprovals > 0 && (
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
              <i className="fas fa-clipboard-check" style={{ marginRight: '10px', color: 'var(--color-primary)' }}></i>
              Approval Requests
            </h2>
            <button
              onClick={() => setShowApprovalsSection(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#999',
                cursor: 'pointer',
                padding: '5px 10px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Approval Tabs */}
          <div className="tabs" style={{ borderBottom: '1px solid #e0e0e0' }}>
            <button 
              className={`tab ${activeApprovalTab === 'registered' ? 'active' : ''}`}
              onClick={() => setActiveApprovalTab('registered')}
              style={{ position: 'relative' }}
            >
              Registration Requests
              {approvalCounts.registered > 0 && (
                <span style={{
                  marginLeft: '8px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {approvalCounts.registered}
                </span>
              )}
            </button>
            <button 
              className={`tab ${activeApprovalTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveApprovalTab('edit')}
              style={{ position: 'relative' }}
            >
              Edit Requests
              {approvalCounts.edit > 0 && (
                <span style={{
                  marginLeft: '8px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {approvalCounts.edit}
                </span>
              )}
            </button>
            <button 
              className={`tab ${activeApprovalTab === 'cancel' ? 'active' : ''}`}
              onClick={() => setActiveApprovalTab('cancel')}
              style={{ position: 'relative' }}
            >
              Cancellation Requests
              {approvalCounts.cancel > 0 && (
                <span style={{
                  marginLeft: '8px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {approvalCounts.cancel}
                </span>
              )}
            </button>
          </div>

          {/* Approval Tab Content */}
          <div style={{ padding: '20px' }}>
            {activeApprovalTab === 'registered' && (
              <PendingRegistrations onApprovalComplete={handleApprovalComplete} />
            )}
            {activeApprovalTab === 'edit' && (
              <PendingEditApprovals onApprovalComplete={handleApprovalComplete} />
            )}
            {activeApprovalTab === 'cancel' && (
              <PendingCancelApprovals onApprovalComplete={handleApprovalComplete} />
            )}
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <h2 style={{ margin: 0, flex: 1 }}>Recent Courses</h2>
          <Link href="/courses" className="btn-primary" style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }}>View All Courses</Link>
        </div>
        <DataTable
          data={recentCourses}
          columns={courseColumns}
          emptyMessage="No courses found"
        />
      </div>
    </Layout>
  )
}
