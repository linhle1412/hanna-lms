# 📄 Detail Page Styles - Usage Guide

## Overview

Common CSS classes for consistent styling across all detail pages (modules, trainers, participants, courses, users, etc.) in the LMS application.

---

## 🎨 Available CSS Classes

### Page Structure Classes

| Class | Purpose | Usage |
|-------|---------|-------|
| `.detail-page-header` | Container for page header | Wraps back button and title row |
| `.detail-back-button` | Back navigation button | "← Back to [List]" button |
| `.detail-title-row` | Title and action buttons row | Flex container for title + edit button |
| `.detail-title` | Page title | Main heading (24px, bold) |
| `.detail-section` | Content section card | White card with padding and border |
| `.detail-section-title` | Section heading | 18px, semi-bold heading |

### Grid Layout Classes

| Class | Purpose | Usage |
|-------|---------|-------|
| `.detail-grid` | 2-column grid layout | For form fields in 2 columns |
| `.detail-grid-full` | Full-width grid item | Spans both columns |

### Field Classes

| Class | Purpose | Usage |
|-------|---------|-------|
| `.detail-field` | Field container | Wraps label + value/input |
| `.detail-field-label` | Field label | Gray, medium weight label |
| `.detail-field-value` | Read-only field value | Display mode value |
| `.detail-field-input` | Text input | Edit mode input field |
| `.detail-field-input.error` | Error state input | Red border for validation errors |
| `.detail-field-error` | Error message | Red text below input |
| `.detail-field-textarea` | Multi-line input | Textarea with resize |
| `.detail-field-select` | Dropdown select | Select input field |

### Component Classes

| Class | Purpose | Usage |
|-------|---------|-------|
| `.detail-metadata` | Created/Updated info | 2-column grid at bottom of section |
| `.detail-actions` | Action buttons row | Flex row for Save/Cancel buttons |
| `.detail-tags` | Tag container | Flex wrap for tag badges |
| `.detail-tag` | Individual tag | Blue rounded badge |
| `.detail-status-badge` | Status indicator | Colored pill badge |
| `.detail-status-badge.active` | Active status | Green badge |
| `.detail-status-badge.inactive` | Inactive status | Red badge |
| `.detail-status-badge.draft` | Draft status | Yellow badge |
| `.detail-empty-state` | No data message | Centered dashed box |

### Button Classes

| Class | Purpose | Usage |
|-------|---------|-------|
| `.detail-button-primary` | Primary action button | Teal button (Save, Edit, etc.) |
| `.detail-button-secondary` | Secondary action button | Gray button (Cancel, Back, etc.) |

---

## 📝 Usage Examples

### Basic Detail Page Structure

```tsx
<Layout breadcrumbs={[{ label: 'Items', href: '/items' }, { label: item.name }]}>
  {/* Header */}
  <div className="detail-page-header">
    <button
      onClick={() => router.push('/items')}
      className="detail-back-button"
    >
      ← Back to Items
    </button>
    <div className="detail-title-row">
      <h1 className="detail-title">📦 {item.name}</h1>
      {!editMode && (
        <button
          onClick={() => setEditMode(true)}
          className="detail-button-primary"
        >
          Edit Item
        </button>
      )}
    </div>
  </div>

  {/* Content Section */}
  <div className="detail-section">
    <h2 className="detail-section-title">General Information</h2>
    
    <div className="detail-grid">
      {/* Fields go here */}
    </div>
  </div>
</Layout>
```

### Display Mode Fields

```tsx
<div className="detail-grid">
  <div className="detail-field">
    <label className="detail-field-label">Item Name</label>
    <div className="detail-field-value">{item.name}</div>
  </div>
  
  <div className="detail-field">
    <label className="detail-field-label">Status</label>
    <div className="detail-field-value">
      <span className={`detail-status-badge ${item.status.toLowerCase()}`}>
        {item.status}
      </span>
    </div>
  </div>
</div>
```

### Edit Mode Fields

```tsx
<div className="detail-grid">
  <div className="detail-field">
    <label className="detail-field-label">
      Item Name <span style={{ color: 'red' }}>*</span>
    </label>
    <input
      type="text"
      value={formData.name || ''}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      className={`detail-field-input ${errors.name ? 'error' : ''}`}
    />
    {errors.name && (
      <div className="detail-field-error">{errors.name}</div>
    )}
  </div>
  
  <div className="detail-field">
    <label className="detail-field-label">
      Status <span style={{ color: 'red' }}>*</span>
    </label>
    <select
      value={formData.status || ''}
      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
      className="detail-field-select"
    >
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
      <option value="DRAFT">Draft</option>
    </select>
  </div>
</div>
```

### Full-Width Field

```tsx
<div className="detail-grid">
  <div className="detail-field detail-grid-full">
    <label className="detail-field-label">Description</label>
    <textarea
      value={formData.description || ''}
      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      rows={3}
      className="detail-field-textarea"
    />
  </div>
</div>
```

### Tags Display

```tsx
<div className="detail-field">
  <label className="detail-field-label">Tags</label>
  <div className="detail-tags">
    {item.tags && item.tags.length > 0 ? (
      item.tags.map((tag, idx) => (
        <span key={idx} className="detail-tag">{tag}</span>
      ))
    ) : (
      <span style={{ color: '#999' }}>No tags</span>
    )}
  </div>
</div>
```

### Metadata Section

```tsx
<div className="detail-metadata">
  <div>
    <strong>Created By:</strong> {item.createdBy} on {item.createdDate}
  </div>
  {item.updatedBy && (
    <div>
      <strong>Updated By:</strong> {item.updatedBy} on {item.updatedDate}
    </div>
  )}
</div>
```

### Action Buttons

```tsx
{editMode && (
  <div className="detail-actions">
    <button
      onClick={handleCancel}
      className="detail-button-secondary"
    >
      Cancel
    </button>
    <button
      onClick={handleSave}
      className="detail-button-primary"
    >
      Save Changes
    </button>
  </div>
)}
```

### Empty State

```tsx
{files.length === 0 ? (
  <div className="detail-empty-state">
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📎</div>
    <p>No files attached</p>
    <button className="detail-button-primary">
      + Add First File
    </button>
  </div>
) : (
  // File list
)}
```

---

## 🎯 Complete Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'

export default function ItemDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  // ... load data logic ...

  return (
    <Layout breadcrumbs={[{ label: 'Items', href: '/items' }, { label: item.name }]}>
      {/* Header */}
      <div className="detail-page-header">
        <button
          onClick={() => router.push('/items')}
          className="detail-back-button"
        >
          ← Back to Items
        </button>
        <div className="detail-title-row">
          <h1 className="detail-title">📦 {item.name}</h1>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="detail-button-primary"
            >
              Edit Item
            </button>
          )}
        </div>
      </div>

      {/* General Information Section */}
      <div className="detail-section">
        <h2 className="detail-section-title">General Information</h2>
        
        <div className="detail-grid">
          {/* Name Field */}
          <div className="detail-field">
            <label className="detail-field-label">
              Item Name {editMode && <span style={{ color: 'red' }}>*</span>}
            </label>
            {editMode ? (
              <>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`detail-field-input ${errors.name ? 'error' : ''}`}
                />
                {errors.name && (
                  <div className="detail-field-error">{errors.name}</div>
                )}
              </>
            ) : (
              <div className="detail-field-value">{item.name}</div>
            )}
          </div>

          {/* Status Field */}
          <div className="detail-field">
            <label className="detail-field-label">Status</label>
            {editMode ? (
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="detail-field-select"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DRAFT">Draft</option>
              </select>
            ) : (
              <div className="detail-field-value">
                <span className={`detail-status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
            )}
          </div>

          {/* Description Field - Full Width */}
          <div className="detail-field detail-grid-full">
            <label className="detail-field-label">Description</label>
            {editMode ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="detail-field-textarea"
              />
            ) : (
              <div className="detail-field-value">{item.description}</div>
            )}
          </div>

          {/* Tags Field */}
          <div className="detail-field detail-grid-full">
            <label className="detail-field-label">Tags</label>
            <div className="detail-tags">
              {item.tags?.map((tag, idx) => (
                <span key={idx} className="detail-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="detail-metadata">
          <div>
            <strong>Created By:</strong> {item.createdBy} on {item.createdDate}
          </div>
          {item.updatedBy && (
            <div>
              <strong>Updated By:</strong> {item.updatedBy} on {item.updatedDate}
            </div>
          )}
        </div>

        {/* Edit Mode Actions */}
        {editMode && (
          <div className="detail-actions">
            <button
              onClick={() => setEditMode(false)}
              className="detail-button-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="detail-button-primary"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

---

## 🎨 Color Palette

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary Button | Teal | #0097A9 |
| Primary Button Hover | Dark Teal | #006d7a |
| Secondary Button | Light Gray | #f5f5f5 |
| Secondary Button Hover | Gray | #e8e8e8 |
| Active Status BG | Light Green | #e8f5e9 |
| Active Status Text | Dark Green | #2e7d32 |
| Inactive Status BG | Light Red | #ffebee |
| Inactive Status Text | Dark Red | #c62828 |
| Draft Status BG | Light Yellow | #fff9c4 |
| Draft Status Text | Dark Yellow | #f57f17 |
| Tag BG | Light Blue | #e3f2fd |
| Tag Text | Blue | #1976d2 |
| Label Text | Gray | #666 |
| Border | Light Gray | #e0e0e0 |
| Input Border | Light Gray | #ddd |
| Error | Red | #dc3545 |

---

## 📋 Implementation Checklist

When creating a new detail page:

- [ ] Use `Layout` component with breadcrumbs
- [ ] Add `.detail-page-header` container
- [ ] Include `.detail-back-button` for navigation
- [ ] Use `.detail-title-row` for title and actions
- [ ] Wrap content in `.detail-section` cards
- [ ] Use `.detail-grid` for 2-column layout
- [ ] Apply `.detail-field` for each field
- [ ] Use appropriate input classes (`.detail-field-input`, etc.)
- [ ] Add `.detail-metadata` for created/updated info
- [ ] Use `.detail-actions` for edit mode buttons
- [ ] Apply status badge classes consistently
- [ ] Include empty states where applicable
- [ ] Test responsive behavior
- [ ] Verify accessibility (labels, focus states)

---

## 🚀 Benefits

✅ **Consistency** - Same look and feel across all detail pages
✅ **Maintainability** - Single source of truth for styling
✅ **Responsive** - Built-in responsive grid layout
✅ **Accessibility** - Proper label associations and focus states
✅ **Flexibility** - Easy to customize per page if needed
✅ **Performance** - CSS classes are more efficient than inline styles
✅ **Scalability** - Easy to add new detail pages

---

## 📝 Migration Guide

### Before (Inline Styles)

```tsx
<div style={{
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '20px',
  border: '1px solid #e0e0e0'
}}>
  <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
    General Information
  </h2>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
    {/* fields */}
  </div>
</div>
```

### After (CSS Classes)

```tsx
<div className="detail-section">
  <h2 className="detail-section-title">General Information</h2>
  <div className="detail-grid">
    {/* fields */}
  </div>
</div>
```

---

## 📦 Pages to Update

Consider updating these pages to use the common detail styles:

- [x] Module Details (`/modules/[id]`)
- [ ] Trainer Details (`/trainers/[id]`)
- [ ] Participant Details (`/participants/[id]`)
- [ ] Course Details (`/courses/[id]`)
- [ ] User Details (`/users/[id]`)

---

**Last Updated:** November 22, 2025
**Version:** 1.0.0


