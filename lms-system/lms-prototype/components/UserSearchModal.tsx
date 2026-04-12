'use client'

import React, { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api'
import type { User } from '@/lib/state'

interface UserSearchModalProps {
  onSelectUser: (user: User) => void
  onClose: () => void
}

export default function UserSearchModal({ onSelectUser, onClose }: UserSearchModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadUsers()
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

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userAPI.getAll()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = !teamFilter || user.team === teamFilter
    const hasTrainerRole = user.roles.some(role => 
      role.toUpperCase() === 'TRAINER' || role.toLowerCase() === 'trainer'
    )
    return matchesSearch && matchesTeam && hasTrainerRole
  })

  if (!mounted) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Search Existing Users</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
            <select
              className="form-select"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">All Teams</option>
              <option value="Admin">Admin</option>
              <option value="Trainer">Trainer</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="fas fa-user-slash" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
              <p style={{ fontStyle: 'italic' }}>No users found with TRAINER role</p>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                Try adjusting your search filters or create a new user first.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0066cc'
                    e.currentTarget.style.backgroundColor = '#e3f2fd'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '5px' }}>
                      <i className="fas fa-user" style={{ marginRight: '8px', color: '#0066cc' }}></i>
                      {user.username}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                      <i className="fas fa-envelope" style={{ marginRight: '8px', width: '14px' }}></i>
                      {user.email}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                      <i className="fas fa-users" style={{ marginRight: '8px', width: '14px' }}></i>
                      Team: {user.team}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <i className="fas fa-calendar" style={{ marginRight: '8px', width: '14px' }}></i>
                      Created: {user.createdDate}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {user.roles.map((role, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#0066cc',
                            fontWeight: '500'
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
                    onClick={() => onSelectUser(user)}
                  >
                    Select This User
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

