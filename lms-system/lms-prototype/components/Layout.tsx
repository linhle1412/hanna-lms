'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import ProgressBar from './ProgressBar'
import ToastContainer from './Toast'

interface LayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export default function Layout({ children, breadcrumbs = [] }: LayoutProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole')
      if (!role) {
        router.push('/')
        return
      }
      setUserRole(role)
      
      // Load collapsed state from localStorage
      const savedCollapsed = localStorage.getItem('sidebarCollapsed')
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true')
      }
      
      setIsLoading(false)
    }
  }, [router])

  const handleToggleSidebar = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '30%' }} />
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ProgressBar />
      <ToastContainer />
      <Sidebar userRole={userRole} isCollapsed={isCollapsed} onToggle={handleToggleSidebar} />
      <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header breadcrumbs={breadcrumbs} />
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

