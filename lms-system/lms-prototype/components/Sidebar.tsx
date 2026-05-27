'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps {
  userRole: string | null
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ userRole, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [contentExpanded, setContentExpanded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole')
      setCurrentRole(role || userRole)
      
      // Auto-expand Content menu if on modules, products, or programs page
      const contentPages = ['/modules', '/products', '/programs', '/content']
      if (contentPages.some(page => pathname?.startsWith(page))) {
        setContentExpanded(true)
      }
    }
  }, [userRole, pathname])

  // Role checks (roles stored as lowercase in sessionStorage)
  const isAdmin = currentRole === 'admin' || 
                  currentRole === 'root_admin' || 
                  currentRole === 'lead_region' || 
                  currentRole === 'head_channel' || 
                  currentRole === 'master_role' ||
                  currentRole === 'test_role' ||
                  currentRole === 'Test Role'
  const isRootAdmin = currentRole === 'root_admin' || 
                      currentRole === 'test_role' ||
                      currentRole === 'Test Role'
  const canViewPrograms = isAdmin || currentRole === 'trainer'

  const isActive = (path: string) => pathname === path

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div>
          <h2>LMS System</h2>
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none',
              border: 'none',
              color: '#2c3e50',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '5px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              marginLeft: 'auto',
              minWidth: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
          </button>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} title={isCollapsed ? 'Dashboard' : ''}>
          <span className="nav-icon"><i className="fas fa-home"></i></span>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
        <Link href="/master-calendar" className={`nav-item ${isActive('/master-calendar') ? 'active' : ''}`} title={isCollapsed ? 'Master Calendar' : ''}>
          <span className="nav-icon"><i className="fas fa-calendar-alt"></i></span>
          {!isCollapsed && <span>Master Calendar</span>}
        </Link>
        <Link href="/pic-calendar" className={`nav-item ${isActive('/pic-calendar') ? 'active' : ''}`} title={isCollapsed ? 'PIC Calendar' : ''}>
          <span className="nav-icon"><i className="fas fa-user"></i></span>
          {!isCollapsed && <span>PIC Calendar</span>}
        </Link>
        <Link href="/courses" className={`nav-item ${isActive('/courses') ? 'active' : ''}`} title={isCollapsed ? 'Courses' : ''}>
          <span className="nav-icon"><i className="fas fa-book"></i></span>
          {!isCollapsed && <span>Courses</span>}
        </Link>
        {isAdmin && (
          <Link href="/participants" className={`nav-item ${isActive('/participants') ? 'active' : ''}`} title={isCollapsed ? 'Participants' : ''}>
            <span className="nav-icon"><i className="fas fa-users"></i></span>
            {!isCollapsed && <span>Participants</span>}
          </Link>
        )}
        {isAdmin && (
          <Link href="/trainers" className={`nav-item ${isActive('/trainers') ? 'active' : ''}`} title={isCollapsed ? 'Trainers' : ''}>
            <span className="nav-icon"><i className="fas fa-chalkboard-teacher"></i></span>
            {!isCollapsed && <span>Trainers</span>}
          </Link>
        )}
        
        {/* Content Management - Collapsible Menu */}
        {isAdmin && (
          <>
            <div 
              className={`nav-item nav-item-expandable ${contentExpanded ? 'expanded' : ''}`}
              onClick={() => !isCollapsed && setContentExpanded(!contentExpanded)}
              style={{ cursor: isCollapsed ? 'default' : 'pointer' }}
              title={isCollapsed ? 'Content Management' : ''}
            >
              <span className="nav-icon"><i className="fas fa-book-open"></i></span>
              {!isCollapsed && (
                <>
                  <span>Content Management</span>
                  <i className={`fas fa-chevron-${contentExpanded ? 'down' : 'right'}`} style={{ marginLeft: 'auto', fontSize: '12px' }}></i>
                </>
              )}
            </div>
            
            {/* Submenu Items */}
            {!isCollapsed && contentExpanded && (
              <div className="nav-submenu">
                <Link href="/modules" className={`nav-item nav-subitem ${isActive('/modules') ? 'active' : ''}`}>
                  <span className="nav-icon"><i className="fas fa-puzzle-piece"></i></span>
                  <span>Modules</span>
                </Link>
                <Link href="/products" className={`nav-item nav-subitem ${isActive('/products') ? 'active' : ''}`}>
                  <span className="nav-icon"><i className="fas fa-box"></i></span>
                  <span>Products</span>
                </Link>
                {canViewPrograms && (
                  <Link href="/programs" className={`nav-item nav-subitem ${isActive('/programs') ? 'active' : ''}`}>
                    <span className="nav-icon"><i className="fas fa-sitemap"></i></span>
                    <span>Programs</span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
        
        {isRootAdmin && (
          <Link href="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`} title={isCollapsed ? 'Users' : ''}>
            <span className="nav-icon"><i className="fas fa-user-cog"></i></span>
            {!isCollapsed && <span>Users</span>}
          </Link>
        )}
        {isRootAdmin && (
          <Link href="/roles" className={`nav-item ${isActive('/roles') ? 'active' : ''}`} title={isCollapsed ? 'Role & Permissions' : ''}>
            <span className="nav-icon"><i className="fas fa-shield-alt"></i></span>
            {!isCollapsed && <span>Role & Permissions</span>}
          </Link>
        )}
        {isAdmin && (
          <Link href="/checklist-templates" className={`nav-item ${isActive('/checklist-templates') ? 'active' : ''}`} title={isCollapsed ? 'Checklist Templates' : ''}>
            <span className="nav-icon"><i className="fas fa-tasks"></i></span>
            {!isCollapsed && <span>Checklist Templates</span>}
          </Link>
        )}
        {isRootAdmin && (
          <Link href="/template-config" className={`nav-item ${isActive('/template-config') ? 'active' : ''}`} title={isCollapsed ? 'Template Configuration' : ''}>
            <span className="nav-icon"><i className="fas fa-cog"></i></span>
            {!isCollapsed && <span>Template Configuration</span>}
          </Link>
        )}
        {isAdmin && (
          <Link href="/reports" className={`nav-item ${isActive('/reports') ? 'active' : ''}`} title={isCollapsed ? 'Reports' : ''}>
            <span className="nav-icon"><i className="fas fa-chart-bar"></i></span>
            {!isCollapsed && <span>Reports</span>}
          </Link>
        )}
      </nav>
    </aside>
  )
}
