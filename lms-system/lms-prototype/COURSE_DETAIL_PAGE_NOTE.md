# 📋 Course Detail Page - Styling Note

## Current Status

The Course Detail Page (`/courses/[id]`) uses a **different design pattern** compared to other detail pages (Modules, Trainers, Participants).

## Why It's Different

### 1. **Complex Tabbed Interface**
The course detail page has multiple tabs:
- General Information
- Participants (with add/remove/import functionality)
- Status Timeline
- Edit History

### 2. **Multi-Column Layout**
The general information is displayed in a **3-column grid** with many fields, which differs from the standard 2-column grid used in other detail pages.

### 3. **Inline Styles**
Currently uses extensive inline styles for:
- Field containers with bottom borders
- Multi-column grid layout
- Status badges
- Partner/Branch tags

### 4. **Unique Features**
- Status Timeline component (always visible)
- Participant management (add, remove, import, re-exam)
- Edit permission checks with restricted fields
- Course registration functionality
- Complex status workflow

## Recommendation

**Option 1: Keep As-Is (Recommended)**
- The course detail page is significantly more complex than other detail pages
- It has unique requirements that don't fit the standard detail page pattern
- Forcing it to use common styles might reduce functionality or clarity
- Document it as a special case

**Option 2: Partial Update**
Update only the **header section** to use common styles:
```tsx
{/* Header */}
<div className="detail-page-header">
  <div className="detail-title-row">
    <h1 className="detail-title">📚 Course: {course.code}</h1>
    <div style={{ display: 'flex', gap: '10px' }}>
      {canRegister() && (
        <button className="detail-button-primary" onClick={handleRegisterClick}>
          Register
        </button>
      )}
      <button 
        className="detail-button-primary"
        onClick={handleEditClick}
        disabled={!editPermission?.canEdit}
      >
        Edit
      </button>
    </div>
  </div>
</div>
```

**Option 3: Full Redesign (Not Recommended)**
- Would require significant refactoring
- Risk of breaking existing functionality
- Time-consuming with minimal benefit
- Current design works well for its complex requirements

## Current Structure

```
Course Detail Page
├── Header (Title + Action Buttons)
├── Status Timeline (Always Visible)
├── Tabs Navigation
│   ├── General Tab
│   │   └── 3-Column Grid with Fields
│   ├── Participants Tab
│   │   ├── Participant List Table
│   │   ├── Add Participants Modal
│   │   ├── Import Participants Modal
│   │   └── Re-Exam Registration Modal
│   └── [Other Tabs]
└── Modals (Edit, Register, etc.)
```

## Comparison with Standard Detail Pages

| Feature | Standard Detail | Course Detail |
|---------|----------------|---------------|
| Layout | 2-column grid | 3-column grid + tabs |
| Sections | Single page | Tabbed interface |
| Fields | Simple display/edit | Complex with restrictions |
| Actions | Edit/Save/Cancel | Edit/Register/Add Participants |
| Styling | CSS classes | Inline styles |
| Complexity | Low-Medium | High |

## Decision

✅ **Keep the course detail page as-is** with its current unique design.

**Rationale:**
1. The complexity justifies a custom design
2. Current design is functional and user-friendly
3. Refactoring would be time-consuming with minimal benefit
4. Other detail pages (modules, trainers, participants) can use common styles
5. Consistency is important, but so is appropriateness for the use case

## Future Considerations

If the course detail page needs updates in the future:
1. Consider extracting common components (e.g., field display)
2. Create reusable tab component if other pages need tabs
3. Move inline styles to CSS classes for better maintainability
4. Keep the unique layout but improve code organization

---

**Conclusion:** The course detail page is intentionally different due to its complexity. This is acceptable and documented. Other simpler detail pages should use the common detail page styles for consistency.

**Last Updated:** November 22, 2025


