'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

export interface Column<T> {
  key: string
  label: string | React.ReactNode
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  wrap?: boolean // Allow text wrapping for this column
  freeze?: boolean // Freeze this column (for last column, use sticky right)
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T, index: number) => void
  emptyMessage?: string
  isLoading?: boolean
  className?: string
  keyExtractor?: (item: T, index: number) => string | number
  freezeFirstColumn?: boolean // Freeze the first column when scrolling horizontally
  defaultSortColumn?: string // Default column to sort by
  defaultSortDirection?: 'asc' | 'desc' // Default sort direction
}

export default function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data found',
  isLoading = false,
  className = '',
  keyExtractor,
  freezeFirstColumn = true, // Default to true
  defaultSortColumn,
  defaultSortDirection = 'asc',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection)

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortColumn]
      const bVal = (b as any)[sortColumn]

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Handle date strings (ISO format)
      if (sortColumn === 'createdAt' || sortColumn.includes('Date') || sortColumn.includes('date')) {
        const aDate = new Date(aVal).getTime()
        const bDate = new Date(bVal).getTime()
        const comparison = aDate < bDate ? -1 : aDate > bDate ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      }

      // Handle string/number comparisons
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  const getKey = (item: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(item, index)
    return item.id !== undefined ? item.id : index
  }

  return (
    <div className={`table-container ${className}`} style={{ overflow: 'hidden' }}>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => {
                const isLastColumn = index === columns.length - 1
                const shouldFreeze = column.freeze || (isLastColumn && column.key === 'actions')
                return (
                  <th
                    key={column.key}
                    style={{
                      width: column.width,
                      textAlign: column.align || 'left',
                    }}
                    className={`${column.sortable ? 'sortable' : ''} sticky-header ${freezeFirstColumn && index === 0 ? 'sticky-first-column' : ''} ${shouldFreeze ? 'sticky-last-column' : ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <span style={{ fontSize: '12px' }}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--color-primary)' }}></i>
                    <span style={{ color: '#666' }}>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={getKey(item, index)}
                  onClick={() => onRowClick && onRowClick(item, index)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((column, colIndex) => {
                    const isLastColumn = colIndex === columns.length - 1
                    const shouldFreeze = column.freeze || (isLastColumn && column.key === 'actions')
                    return (
                      <td
                        key={column.key}
                        style={{ textAlign: column.align || 'left' }}
                        className={`${column.wrap ? 'wrap-text' : ''} ${freezeFirstColumn && colIndex === 0 ? 'sticky-first-column' : ''} ${shouldFreeze ? 'sticky-last-column' : ''}`}
                      >
                        {column.render ? column.render(item, index) : (item as any)[column.key]}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

