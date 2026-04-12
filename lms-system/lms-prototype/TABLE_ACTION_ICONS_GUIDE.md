# 📋 Table Action Icons - Usage Guide

## Overview

Common CSS classes for consistent action icon styling across all tables in the LMS application.

---

## 🎨 Available Action Icon Classes

### Base Classes

**`.table-actions`** - Container for action icons
- Flex layout with 12px gap
- Centers icons horizontally and vertically

**`.action-icon`** - Base class for all action icons
- Removes default button styling
- 18px font size
- 4px padding
- Smooth color transition on hover
- Scale effect on hover (1.1x)

### Action-Specific Classes

| Class | Icon | Color | Hover Color | Use Case |
|-------|------|-------|-------------|----------|
| `.view` | 👁️ `fa-eye` | #0097A9 (Teal) | #006d7a (Dark Teal) | View details |
| `.edit` | ✏️ `fa-edit` | #0097A9 (Teal) | #006d7a (Dark Teal) | Edit record |
| `.clone` | 📋 `fa-copy` | #666 (Gray) | #333 (Dark Gray) | Clone/Duplicate |
| `.delete` | 🗑️ `fa-trash` | #d32f2f (Red) | #a02020 (Dark Red) | Delete record |
| `.approve` | ✅ `fa-check` | #28a745 (Green) | #1e7e34 (Dark Green) | Approve action |
| `.reject` | ❌ `fa-times` | #dc3545 (Red) | #c82333 (Dark Red) | Reject action |
| `.download` | 📥 `fa-download` | #17a2b8 (Blue) | #117a8b (Dark Blue) | Download file |
| `.info` | ℹ️ `fa-info-circle` | #6c757d (Gray) | #495057 (Dark Gray) | View info |

---

## 📝 Usage Examples

### Basic Usage

```tsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <div className="table-actions">
    <button
      onClick={() => handleEdit(item)}
      className="action-icon edit"
      title="Edit Item"
    >
      <i className="fas fa-edit"></i>
    </button>
    <button
      onClick={() => handleDelete(item)}
      className="action-icon delete"
      title="Delete Item"
    >
      <i className="fas fa-trash"></i>
    </button>
  </div>
</td>
```

### Multiple Actions

```tsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <div className="table-actions">
    <button
      onClick={() => handleView(item)}
      className="action-icon view"
      title="View Details"
    >
      <i className="fas fa-eye"></i>
    </button>
    <button
      onClick={() => handleEdit(item)}
      className="action-icon edit"
      title="Edit"
    >
      <i className="fas fa-edit"></i>
    </button>
    <button
      onClick={() => handleClone(item)}
      className="action-icon clone"
      title="Clone"
    >
      <i className="fas fa-copy"></i>
    </button>
    <button
      onClick={() => handleDelete(item)}
      className="action-icon delete"
      title="Delete"
    >
      <i className="fas fa-trash"></i>
    </button>
  </div>
</td>
```

### Approval Actions

```tsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <div className="table-actions">
    <button
      onClick={() => handleApprove(item)}
      className="action-icon approve"
      title="Approve"
    >
      <i className="fas fa-check"></i>
    </button>
    <button
      onClick={() => handleReject(item)}
      className="action-icon reject"
      title="Reject"
    >
      <i className="fas fa-times"></i>
    </button>
  </div>
</td>
```

### File Actions

```tsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <div className="table-actions">
    <button
      onClick={() => handleDownload(file)}
      className="action-icon download"
      title="Download"
    >
      <i className="fas fa-download"></i>
    </button>
    <button
      onClick={() => handleDelete(file)}
      className="action-icon delete"
      title="Delete"
    >
      <i className="fas fa-trash"></i>
    </button>
  </div>
</td>
```

### Conditional Actions

```tsx
<td style={{ padding: '12px', textAlign: 'center' }}>
  <div className="table-actions">
    {canEdit && (
      <button
        onClick={() => handleEdit(item)}
        className="action-icon edit"
        title="Edit"
      >
        <i className="fas fa-edit"></i>
      </button>
    )}
    {canDelete && (
      <button
        onClick={() => handleDelete(item)}
        className="action-icon delete"
        title="Delete"
      >
        <i className="fas fa-trash"></i>
      </button>
    )}
  </div>
</td>
```

---

## 🎯 Best Practices

### 1. Always Use Title Attribute
Provide descriptive tooltips for accessibility:
```tsx
<button className="action-icon edit" title="Edit Module">
  <i className="fas fa-edit"></i>
</button>
```

### 2. Consistent Icon Order
Maintain a logical order across tables:
1. View (if needed)
2. Edit
3. Clone/Duplicate
4. Download
5. Delete

### 3. Action Limit
Keep 2-4 actions per row for better UX:
- ✅ Good: Edit, Clone, Delete
- ❌ Too many: View, Edit, Clone, Download, Share, Archive, Delete

### 4. Use Semantic Icons
Choose icons that clearly represent the action:
- ✅ `fa-trash` for delete
- ✅ `fa-edit` for edit
- ❌ `fa-pencil-alt` for delete (confusing)

### 5. Conditional Rendering
Show only relevant actions based on permissions:
```tsx
{hasEditPermission && (
  <button className="action-icon edit" title="Edit">
    <i className="fas fa-edit"></i>
  </button>
)}
```

---

## 🔧 Customization

### Adding New Action Types

To add a new action type, update `styles/globals.css`:

```css
.action-icon.your-action {
    color: #your-color;
}

.action-icon.your-action:hover {
    color: #your-hover-color;
}
```

### Adjusting Icon Size

Override the font size for specific tables:

```css
.your-table .action-icon {
    font-size: 16px; /* Smaller icons */
}
```

### Changing Gap Between Icons

Override the gap for specific tables:

```css
.your-table .table-actions {
    gap: 8px; /* Tighter spacing */
}
```

---

## 📦 Implementation Checklist

When adding action icons to a new table:

- [ ] Wrap actions in `<div className="table-actions">`
- [ ] Use `<button className="action-icon [type]">` for each action
- [ ] Add appropriate FontAwesome icon inside button
- [ ] Include `title` attribute for tooltip
- [ ] Add `onClick` handler for action
- [ ] Test hover effects
- [ ] Verify color contrast for accessibility
- [ ] Test on mobile/tablet viewports

---

## 🌈 Color Palette Reference

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Teal | #0097A9 | Primary actions (View, Edit) |
| Dark Teal | #006d7a | Hover state for primary |
| Gray | #666 | Secondary actions (Clone, Info) |
| Dark Gray | #333 | Hover state for secondary |
| Red | #d32f2f | Destructive actions (Delete) |
| Dark Red | #a02020 | Hover state for destructive |
| Green | #28a745 | Positive actions (Approve) |
| Dark Green | #1e7e34 | Hover state for positive |
| Blue | #17a2b8 | Informational (Download) |
| Dark Blue | #117a8b | Hover state for informational |

---

## 📋 Current Implementation

### Pages Using Action Icons

1. **Module Management** (`/modules`)
   - Clone (📋)
   - Delete (🗑️)

### Pages to Update

Consider updating these pages to use the common action styles:
- [ ] Course List
- [ ] Trainer List
- [ ] Participant List
- [ ] User Management
- [ ] Pending Approvals
- [ ] File Management

---

## 🚀 Benefits

✅ **Consistency** - Same look and feel across all tables
✅ **Maintainability** - Single source of truth for styling
✅ **Accessibility** - Built-in hover effects and tooltips
✅ **Performance** - CSS classes are more efficient than inline styles
✅ **Scalability** - Easy to add new action types
✅ **Responsive** - Works on all screen sizes

---

## 📝 Notes

- Icons use FontAwesome 5 (already included in the project)
- All colors follow the application's design system
- Hover effects include both color change and scale animation
- Classes are mobile-friendly and touch-optimized
- No JavaScript required for styling (pure CSS)

---

**Last Updated:** November 22, 2025
**Version:** 1.0.0


