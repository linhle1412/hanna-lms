'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Store user information in sessionStorage
      const user = data.user
      sessionStorage.setItem('userId', user.id.toString())
      sessionStorage.setItem('userName', user.username)
      sessionStorage.setItem('userEmail', user.email)
      sessionStorage.setItem('userRoles', JSON.stringify(user.roles))
      sessionStorage.setItem('userTeam', user.team)
      sessionStorage.setItem('userChannel', user.channel || '')
      sessionStorage.setItem('userRegion', user.region || '')
      
      // Set primary role for backward compatibility
      // Special handling for Test Role
      const primaryRole = user.roles[0] || ''
      if (primaryRole === 'TEST_ROLE') {
        sessionStorage.setItem('userRole', 'Test Role')
      } else {
        sessionStorage.setItem('userRole', primaryRole.toLowerCase() || '')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Quick login function for testing
  const quickLogin = async (username: string, password: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Store user information in sessionStorage
      const user = data.user
      sessionStorage.setItem('userId', user.id.toString())
      sessionStorage.setItem('userName', user.username)
      sessionStorage.setItem('userEmail', user.email)
      sessionStorage.setItem('userRoles', JSON.stringify(user.roles))
      sessionStorage.setItem('userTeam', user.team)
      sessionStorage.setItem('userChannel', user.channel || '')
      sessionStorage.setItem('userRegion', user.region || '')
      
      // Set primary role for backward compatibility
      // Special handling for Test Role
      const primaryRole = user.roles[0] || ''
      if (primaryRole === 'TEST_ROLE') {
        sessionStorage.setItem('userRole', 'Test Role')
      } else {
        sessionStorage.setItem('userRole', primaryRole.toLowerCase() || '')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1>LMS System</h1>
          <h2>Learning Management System</h2>
        </div>
        <div className="login-form">
          <h3>Sign In</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                color: '#c00',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div className="form-group button-group">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Login Buttons for Testing */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fff5f0',
            border: '1px solid var(--color-primary)',
            borderRadius: '6px'
          }}>
            <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>⚡ Quick Login (Testing)</strong>
            <div style={{
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => quickLogin('admin_user', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'var(--color-primary)',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = 'var(--color-primary)'
                }}
              >
                🔧 Admin
              </button>

              <button
                type="button"
                onClick={() => quickLogin('root_admin', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #cc0000',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#cc0000',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#cc0000'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#cc0000'
                }}
              >
                👑 Root Admin
              </button>

              <button
                type="button"
                onClick={() => quickLogin('master_user', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #9900cc',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#9900cc',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#9900cc'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#9900cc'
                }}
              >
                ⭐ Master
              </button>

              <button
                type="button"
                onClick={() => quickLogin('TrainerAgencyNorth', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #00aa00',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#00aa00',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#00aa00'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#00aa00'
                }}
              >
                📚 Trainer (North)
              </button>

              <button
                type="button"
                onClick={() => quickLogin('LeadAgencyNorth', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #ff6600',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#ff6600',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#ff6600'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#ff6600'
                }}
              >
                👥 Lead (North)
              </button>

              <button
                type="button"
                onClick={() => quickLogin('Head_agency', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #cc6600',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#cc6600',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#cc6600'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#cc6600'
                }}
              >
                🎯 Head (South)
              </button>

              <button
                type="button"
                onClick={() => quickLogin('trainer_user', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #0099cc',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#0099cc',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#0099cc'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#0099cc'
                }}
              >
                📖 Trainer (Middle)
              </button>

              <button
                type="button"
                onClick={() => quickLogin('test_user', 'password123')}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  border: '2px solid #ff00ff',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#ff00ff',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 8px rgba(255, 0, 255, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#ff00ff'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 0, 255, 0.5)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.color = '#ff00ff'
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 0, 255, 0.3)'
                }}
              >
                🧪 Test Role
              </button>
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              💡 Click any button to instantly login without entering credentials
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

