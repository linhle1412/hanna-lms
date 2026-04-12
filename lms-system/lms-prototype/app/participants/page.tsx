'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { participantAPI } from '@/lib/api'
import type { Participant } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'

export default function ParticipantListPage() {
  const { showToast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    channel: ''
  })

  useEffect(() => {
    loadParticipants()
  }, [filters])

  const loadParticipants = async () => {
    try {
      const data = await participantAPI.getAll(filters)
      setParticipants(data)
    } catch (error) {
      console.error('Failed to load participants:', error)
      setParticipants([])
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const columns: Column<Participant>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (participant) => <Link href={`/participants/${participant.id}`}>{participant.name}</Link>
    },
    {
      key: 'agentCode',
      label: 'Agent Code',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true
    },
    {
      key: 'channel',
      label: 'Channel',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (participant) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: participant.status === 'Active' ? '#e8f5e9' : '#ffebee',
          color: participant.status === 'Active' ? '#2e7d32' : '#c62828'
        }}>
          {participant.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (participant) => (
        <div className="table-actions">
          <Link href={`/participants/${participant.id}`}>
            <button className="action-icon view" title="View Details">
              <i className="fas fa-eye"></i>
            </button>
          </Link>
        </div>
      )
    }
  ]

  return (
    <Layout breadcrumbs={[{ label: 'Participants' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Participants</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => showToast('Import feature coming soon', 'info')}>Import Participants</button>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, agent code, email, phone, ID..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select className="filter-select" onChange={(e) => handleFilterChange('region', e.target.value)}>
          <option value="">All Regions</option>
          <option value="IFA Central">IFA Central</option>
          <option value="Banca South">Banca South</option>
          <option value="Agency South">Agency South</option>
        </select>
        <select className="filter-select" onChange={(e) => handleFilterChange('channel', e.target.value)}>
          <option value="">All Channels</option>
          <option value="IFA">IFA</option>
          <option value="Banca">Banca</option>
          <option value="Agency">Agency</option>
        </select>
      </div>

      <DataTable
        data={participants}
        columns={columns}
        emptyMessage="No participants found"
      />
    </Layout>
  )
}

