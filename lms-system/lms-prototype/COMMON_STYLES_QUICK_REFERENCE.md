# 🎨 Common Styles - Quick Reference Card

## Table Action Icons

```tsx
<div className="table-actions">
  <button className="action-icon view" title="View">
    <i className="fas fa-eye"></i>
  </button>
  <button className="action-icon edit" title="Edit">
    <i className="fas fa-edit"></i>
  </button>
  <button className="action-icon clone" title="Clone">
    <i className="fas fa-copy"></i>
  </button>
  <button className="action-icon delete" title="Delete">
    <i className="fas fa-trash"></i>
  </button>
  <button className="action-icon approve" title="Approve">
    <i className="fas fa-check"></i>
  </button>
  <button className="action-icon reject" title="Reject">
    <i className="fas fa-times"></i>
  </button>
  <button className="action-icon download" title="Download">
    <i className="fas fa-download"></i>
  </button>
</div>
```

## Status Badges

```tsx
{/* Trainer/Participant Status */}
<span style={{
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: status === 'Active' ? '#e8f5e9' : '#ffebee',
  color: status === 'Active' ? '#2e7d32' : '#c62828'
}}>
  {status}
</span>

{/* Detail Page Status */}
<span className={`detail-status-badge ${status.toLowerCase()}`}>
  {status}
</span>
```

## Detail Page Structure

```tsx
<Layout breadcrumbs={[{ label: 'List', href: '/list' }, { label: item.name }]}>
  {/* Header */}
  <div className="detail-page-header">
    <button onClick={() => router.push('/list')} className="detail-back-button">
      ← Back to List
    </button>
    <div className="detail-title-row">
      <h1 className="detail-title">📦 {item.name}</h1>
      <button onClick={() => setEditMode(true)} className="detail-button-primary">
        Edit
      </button>
    </div>
  </div>

  {/* Section */}
  <div className="detail-section">
    <h2 className="detail-section-title">Section Title</h2>
    
    <div className="detail-grid">
      {/* 2-column grid fields */}
      <div className="detail-field">
        <label className="detail-field-label">Label</label>
        <div className="detail-field-value">{value}</div>
      </div>
      
      {/* Full-width field */}
      <div className="detail-field detail-grid-full">
        <label className="detail-field-label">Description</label>
        <div className="detail-field-value">{description}</div>
      </div>
    </div>

    {/* Metadata */}
    <div className="detail-metadata">
      <div><strong>Created By:</strong> {createdBy}</div>
      <div><strong>Updated By:</strong> {updatedBy}</div>
    </div>

    {/* Actions */}
    <div className="detail-actions">
      <button className="detail-button-secondary">Cancel</button>
      <button className="detail-button-primary">Save</button>
    </div>
  </div>
</Layout>
```

## Form Fields

```tsx
{/* Text Input */}
<input
  type="text"
  value={value}
  onChange={handleChange}
  className={`detail-field-input ${error ? 'error' : ''}`}
/>
{error && <div className="detail-field-error">{error}</div>}

{/* Textarea */}
<textarea
  value={value}
  onChange={handleChange}
  rows={3}
  className="detail-field-textarea"
/>

{/* Select */}
<select
  value={value}
  onChange={handleChange}
  className="detail-field-select"
>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

## Tags

```tsx
<div className="detail-tags">
  {tags.map((tag, idx) => (
    <span key={idx} className="detail-tag">{tag}</span>
  ))}
</div>
```

## Empty State

```tsx
<div className="detail-empty-state">
  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
  <p>No items found</p>
  <button className="detail-button-primary">Add Item</button>
</div>
```

## Color Reference

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Teal | #0097A9 |
| Success/Active | Green | #2e7d32 |
| Error/Inactive | Red | #c62828 |
| Warning/Draft | Yellow | #f57f17 |
| Info | Blue | #1976d2 |
| Gray | Gray | #666 |

---

**See Full Documentation:**
- [Table Action Icons Guide](./TABLE_ACTION_ICONS_GUIDE.md)
- [Detail Page Styles Guide](./DETAIL_PAGE_STYLES_GUIDE.md)


