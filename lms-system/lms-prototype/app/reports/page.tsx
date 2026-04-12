'use client'

import Layout from '@/components/Layout'

export default function ReportsPage() {
  return (
    <Layout breadcrumbs={[{ label: 'Reports' }]}>
      <h1 className="page-title">Reports</h1>
      
      <div className="search-section">
        <select className="filter-select">
          <option>All Report Types</option>
          <option>Course Reports</option>
          <option>Participant Reports</option>
          <option>Trainer Reports</option>
        </select>
        <select className="filter-select">
          <option>All Channels</option>
        </select>
        <input type="date" className="filter-select" />
        <input type="date" className="filter-select" />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Generated Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>No reports found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

