'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { trainerAPI } from '@/lib/api'
import type { Trainer } from '@/lib/state'
import DataTable, { type Column } from '@/components/DataTable'
import { useToast } from '@/contexts/ToastContext'
import CreateTrainerModal from '@/components/CreateTrainerModal'
import { useRouter } from 'next/navigation'

export default function TrainerManagementPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [filters, setFilters] = useState({ 
    search: '',
    region: '',
    type: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrainers()
  }, [filters])

  const loadTrainers = async () => {
    try {
      setLoading(true)
      const data = await trainerAPI.getAll(filters)
      setTrainers(data)
    } catch (error) {
      console.error('Failed to load trainers:', error)
      showToast('Failed to load trainers', 'error')
      setTrainers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrainer = async (trainerData: Partial<Trainer>) => {
    try {
      await trainerAPI.create(trainerData)
      showToast('Trainer created successfully', 'success')
      setShowCreateModal(false)
      loadTrainers()
    } catch (error) {
      console.error('Failed to create trainer:', error)
      showToast('Failed to create trainer. Please try again.', 'error')
    }
  }

  const handleViewTrainer = (trainerId: number) => {
    router.push(`/trainers/${trainerId}`)
  }

  const handleExport = () => {
    // Export to CSV
    const headers = ['Full Name', 'Email', 'Phone', 'Type', 'Region', 'Rate', 'Status']
    const csvData = trainers.map(t => [
      t.fullName,
      t.email,
      t.phone,
      t.trainerType,
      t.region,
      t.trainerRate,
      t.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trainers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showToast('Trainer list exported successfully', 'success')
  }

  const columns: Column<Trainer>[] = [
    {
      key: 'fullName',
      label: 'Full Name',
      sortable: true,
      render: (trainer) => (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault()
            handleViewTrainer(trainer.id)
          }}
          style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {trainer.fullName}
        </a>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false
    },
    {
      key: 'trainerType',
      label: 'Type',
      sortable: true
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true
    },
    {
      key: 'trainerRate',
      label: 'Rate ($/hr)',
      sortable: true,
      render: (trainer) => `$${trainer.trainerRate}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (trainer) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: trainer.status === 'Active' ? '#e8f5e9' : '#ffebee',
          color: trainer.status === 'Active' ? '#2e7d32' : '#c62828'
        }}>
          {trainer.status}
        </span>
      )
    }
  ]

  return (
    <Layout breadcrumbs={[{ label: 'Trainer Management' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Trainer Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={handleExport}
          >
            Export List
          </button>
          <button 
            className="btn-primary" 
            style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }} 
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Trainer
          </button>
        </div>
      </div>

      <div className="search-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, type..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          className="filter-select"
          value={filters.region}
          onChange={(e) => setFilters({ ...filters, region: e.target.value })}
        >
          <option value="">All Regions</option>
          <option value="South">South</option>
          <option value="Middle">Middle</option>
          <option value="North">North</option>
        </select>
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="FWD">FWD</option>
          <option value="FWT">FWT</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading trainers...</div>
      ) : (
        <DataTable
          data={trainers}
          columns={columns}
          emptyMessage="No trainers found"
        />
      )}

      {/* Create Trainer Modal */}
      {showCreateModal && (
        <CreateTrainerModal
          onSave={handleCreateTrainer}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </Layout>
  )
}
