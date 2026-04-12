'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface HeaderProps {
  breadcrumbs: Array<{ label: string; href?: string }>
}

export default function Header({ breadcrumbs }: HeaderProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('trainer')
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [userName, setUserName] = useState<string>('User')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole') || 'trainer'
      const rolesJson = sessionStorage.getItem('userRoles')
      const name = sessionStorage.getItem('userName') || 'User'
      
      setUserRole(role)
      setUserName(name)
      
      // Parse user's assigned roles
      if (rolesJson) {
        try {
          const roles = JSON.parse(rolesJson)
          // Convert to lowercase for consistency
          setUserRoles(roles.map((r: string) => r.toLowerCase()))
        } catch (e) {
          console.error('Error parsing user roles:', e)
          setUserRoles([role])
        }
      } else {
        setUserRoles([role])
      }
    }
  }, [])

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userRole', newRole)
      router.refresh()
      window.location.reload()
    }
  }

  const handleBack = () => {
    if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 2]?.href) {
      router.push(breadcrumbs[breadcrumbs.length - 2].href!)
    } else {
      router.push('/dashboard')
    }
  }

  // Role display names
  const roleNames: { [key: string]: string } = {
    'trainer': 'Trainer',
    'lead_region': 'Lead Region',
    'head_channel': 'Head Channel',
    'admin': 'Admin',
    'root_admin': 'Root Admin',
    'dms_admin': 'DMS Admin',
    'master_role': 'Master Role'
  }

  return (
    <header className="top-header">
      <div className="breadcrumb">
        <button className="btn-back-icon" onClick={handleBack} aria-label="Go back">
          <i className="fas fa-arrow-left"></i>
        </button>
        <Link href="/dashboard" className="breadcrumb-link">Home</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="breadcrumb-separator">
            <span className="breadcrumb-chevron"><i className="fas fa-chevron-right"></i></span>
            {crumb.href ? (
              <Link href={crumb.href} className="breadcrumb-link">{crumb.label}</Link>
            ) : (
              <span className="breadcrumb-active">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
      <div className="user-profile">
        {/* Only show dropdown if user has multiple roles */}
        {userRoles.length > 1 ? (
          <select id="roleSelector" value={userRole} onChange={handleRoleChange}>
            {userRoles.map(role => (
              <option key={role} value={role}>
                {roleNames[role] || role}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ 
            padding: '6px 12px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {roleNames[userRole] || userRole}
          </span>
        )}
        <img src="https://via.placeholder.com/32" alt="Profile" />
        <span>{userName}</span>
      </div>
    </header>
  )
}

