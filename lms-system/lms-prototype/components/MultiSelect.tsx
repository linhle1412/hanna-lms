'use client'

import { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  id?: string
  label?: string
  options: string[]
  selectedValues: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  required?: boolean
  size?: number
  disabled?: boolean
  style?: React.CSSProperties
}

export default function MultiSelect({
  id,
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  required = false,
  size = 3,
  disabled = false,
  style
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (value: string) => {
    if (disabled) return
    
    if (selectedValues.includes(value)) {
      // Remove if already selected
      onChange(selectedValues.filter(v => v !== value))
    } else {
      // Add if not selected
      onChange([...selectedValues, value])
    }
  }

  const handleRemoveTag = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      onChange(selectedValues.filter(v => v !== value))
    }
  }

  const handleRemoveAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      onChange([])
    }
  }

  return (
    <div className="form-group" style={style}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required-field">*</span>}
        </label>
      )}
      
      <div 
        ref={containerRef}
        className="multi-select-container"
        style={{ position: 'relative', width: '100%' }}
      >
        {/* Selected Tags Display */}
        {selectedValues.length > 0 && (
          <div 
            className="multi-select-tags"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '8px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
              minHeight: '40px'
            }}
          >
            {selectedValues.map(value => (
              <span
                key={value}
                className="multi-select-tag"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: disabled ? 'default' : 'pointer'
                }}
              >
                {value}
                {!disabled && (
                  <span
                    onClick={(e) => handleRemoveTag(value, e)}
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    ×
                  </span>
                )}
              </span>
            ))}
            {!disabled && selectedValues.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px 8px',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#333'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666'
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Dropdown Trigger */}
        <div
          className="multi-select-trigger"
          onClick={handleToggle}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: selectedValues.length === 0 ? '#999' : '#333',
            minHeight: '40px'
          }}
        >
          <span>
            {selectedValues.length === 0 
              ? placeholder 
              : `${selectedValues.length} selected`}
          </span>
          <i 
            className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
            style={{ 
              color: '#666',
              fontSize: '12px',
              transition: 'transform 0.2s'
            }}
          ></i>
        </div>

        {/* Dropdown Options */}
        {isOpen && !disabled && (
          <div
            className="multi-select-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              maxHeight: `${size * 40}px`,
              overflowY: 'auto'
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
                No options available
              </div>
            ) : (
              options.map(option => {
                const isSelected = selectedValues.includes(option)
                return (
                  <div
                    key={option}
                    onClick={() => handleSelect(option)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(0, 175, 245, 0.1)' : 'white',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div onClick
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        margin: 0
                      }}
                      readOnly
                    />
                    <span>{option}</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

