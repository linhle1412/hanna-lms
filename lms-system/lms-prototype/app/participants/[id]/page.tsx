'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { participantAPI } from '@/lib/api'
import type { Participant } from '@/lib/state'
import { useToast } from '@/contexts/ToastContext'

export default function ParticipantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [participant, setParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    if (params?.id) {
      loadParticipant()
    }
  }, [params?.id])

  const loadParticipant = async () => {
    try {
      const participantId = parseInt(params?.id as string)
      const foundParticipant = await participantAPI.getById(participantId)
      setParticipant(foundParticipant)
    } catch (error) {
      console.error('Failed to load participant:', error)
      showToast('Participant not found', 'error')
      router.push('/participants')
    }
  }

  if (!participant) {
    return (
      <div className="loading-container">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '70%' }} />
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading participant details...</div>
      </div>
    )
  }

  return (
    <Layout breadcrumbs={[
      { label: 'Participants', href: '/participants' },
      { label: 'Participant Details' }
    ]}>
      <h1 className="page-title">Participant: {participant.name}</h1>
      
      <div className="table-container" style={{ padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ width: '200px', fontWeight: 600, padding: '12px', color: '#555' }}>Name:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.name}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Agent Code:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.agentCode}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Email:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.email}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Phone:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.phone}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Region:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.region}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Channel:</td>
              <td style={{ padding: '12px', color: '#333' }}>{participant.channel}</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', fontWeight: 600, color: '#555' }}>Status:</td>
              <td style={{ padding: '12px' }}>
                <span className={`status-badge ${participant.status === 'Active' ? 'status-approved' : ''}`}>{participant.status}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

