'use client'

import Layout from '@/components/Layout'
import { useToast } from '@/contexts/ToastContext'

export default function ContentManagementPage() {
  const { showToast } = useToast()
  return (
    <Layout breadcrumbs={[{ label: 'Content Management' }]}>
      <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>Content Management</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => showToast('Create content feature coming soon', 'info')}>Create New Content</button>
      </div>

      <div className="search-section">
        <input type="text" className="search-input" placeholder="Search content..." />
        <select className="filter-select">
          <option>All Types</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No content found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

