'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [sessionData, setSessionData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data: Record<string, string> = {}
      data['userId'] = sessionStorage.getItem('userId') || 'NOT SET'
      data['userName'] = sessionStorage.getItem('userName') || 'NOT SET'
      data['userEmail'] = sessionStorage.getItem('userEmail') || 'NOT SET'
      data['userRole'] = sessionStorage.getItem('userRole') || 'NOT SET'
      data['userRoles'] = sessionStorage.getItem('userRoles') || 'NOT SET'
      data['userTeam'] = sessionStorage.getItem('userTeam') || 'NOT SET'
      data['userChannel'] = sessionStorage.getItem('userChannel') || 'NOT SET'
      data['userRegion'] = sessionStorage.getItem('userRegion') || 'NOT SET'
      setSessionData(data)
    }
  }, [])

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#0097A9' }}>Debug: Session Storage</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Current Session Data:</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Key</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sessionData).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#495057' }}>{key}</td>
                <td style={{ 
                  padding: '12px', 
                  fontFamily: 'monospace',
                  color: value === 'NOT SET' ? '#dc3545' : '#28a745'
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '6px'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '16px' }}>Role Check Results:</h3>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>
              <strong>isAdmin:</strong> {
                ['admin', 'root_admin', 'lead_region', 'head_channel', 'master_role']
                  .includes(sessionData.userRole) ? '✅ TRUE' : '❌ FALSE'
              }
            </li>
            <li>
              <strong>canViewPrograms:</strong> {
                ['admin', 'root_admin', 'lead_region', 'head_channel', 'master_role', 'trainer']
                  .includes(sessionData.userRole) ? '✅ TRUE' : '❌ FALSE'
              }
            </li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <a 
            href="/dashboard" 
            style={{ 
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#0097A9',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}




