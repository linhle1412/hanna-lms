'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { courseAPI, participantAPI, trainerAPI, userAPI } from '@/lib/api'
import type { Course } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    courses: 0,
    participants: 0,
    trainers: 0,
    users: 0,
    pendingApprovals: 0
  })
  const [recentCourses, setRecentCourses] = useState<Course[]>([])
  const [showPendingApprovals, setShowPendingApprovals] = useState(false)

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
      const canApprove = roles.some((r: string) => ['lead_region', 'head_channel', 'master_role'].includes(r))
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
      const pendingApprovals = courses.filter(c => 
        c.status === 'REGISTERED' || 
        c.status === 'WAITING_APPROVAL_EDIT' || 
        c.status === 'WAITING_APPROVAL_CANCEL'
      ).length
      
      setStats({
        courses: courses.length,
        participants: participants.length,
        trainers: trainers.length,
        users: users.length,
        pendingApprovals
      })
      setRecentCourses(courses.slice(0, 3))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
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
            <Link href="/pic-calendar?tab=approvals" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <h3>Pending Approvals</h3>
                <p style={{ color: '#f39c12' }}>{stats.pendingApprovals}</p>
              </div>
            </Link>
          )}
          <div className="stat-card">
            <h3>Trainers</h3>
            <p style={{ color: '#2ecc71' }}>{stats.trainers}</p>
          </div>
        </div>
      </div>

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
