# DataTable Component

A reusable, scrollable data table component with fixed header, sorting, and customizable columns.

## Features

✅ **Horizontal & Vertical Scrolling** - Scrollable table wrapper with max height  
✅ **Fixed Header** - Sticky header that stays visible while scrolling  
✅ **Sortable Columns** - Click column headers to sort (ascending/descending)  
✅ **Custom Column Rendering** - Render function for custom cell content  
✅ **Clickable Rows** - Optional row click handler  
✅ **Empty State** - Customizable empty message  
✅ **Loading State** - Loading indicator support  
✅ **TypeScript** - Fully typed with generics  

## Usage

### Basic Example

```tsx
import DataTable, { type Column } from '@/components/DataTable'
import type { Course } from '@/lib/state'

const columns: Column<Course>[] = [
  {
    key: 'code',
    label: 'Course Code',
    sortable: true,
    render: (course) => <Link href={`/courses/${course.id}`}>{course.code}</Link>
  },
  {
    key: 'name',
    label: 'Course Name',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    render: (course) => (
      <span className={`status-badge ${getStatusClass(course.status)}`}>
        {course.status}
      </span>
    )
  }
]

<DataTable
  data={courses}
  columns={columns}
  emptyMessage="No courses found"
  onRowClick={(course) => router.push(`/courses/${course.id}`)}
/>
```

## Props

### `DataTableProps<T>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | Yes | Array of data items to display |
| `columns` | `Column<T>[]` | Yes | Column configuration array |
| `onRowClick` | `(item: T, index: number) => void` | No | Callback when row is clicked |
| `emptyMessage` | `string` | No | Message to show when no data (default: "No data found") |
| `isLoading` | `boolean` | No | Show loading state (default: false) |
| `className` | `string` | No | Additional CSS classes |
| `keyExtractor` | `(item: T, index: number) => string \| number` | No | Custom key extractor (default: uses `id` or index) |

### `Column<T>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | Unique key for the column |
| `label` | `string` | Yes | Column header label |
| `render` | `(item: T, index: number) => React.ReactNode` | No | Custom render function for cell content |
| `sortable` | `boolean` | No | Enable sorting for this column (default: false) |
| `width` | `string` | No | Fixed width (e.g., "200px", "20%") |
| `align` | `'left' \| 'center' \| 'right'` | No | Text alignment (default: 'left') |

## Column Configuration Examples

### Simple Column
```tsx
{
  key: 'name',
  label: 'Name',
  sortable: true
}
```

### Column with Custom Render
```tsx
{
  key: 'status',
  label: 'Status',
  render: (item) => (
    <span className={`status-badge status-${item.status.toLowerCase()}`}>
      {item.status}
    </span>
  )
}
```

### Column with Link
```tsx
{
  key: 'code',
  label: 'Course Code',
  sortable: true,
  render: (course) => (
    <Link href={`/courses/${course.id}`}>{course.code}</Link>
  )
}
```

### Column with Complex Content
```tsx
{
  key: 'dates',
  label: 'Start-End Date',
  render: (course) => (
    <>
      F: {formatDate(course.startDate)}<br />
      T: {formatDate(course.endDate)}
    </>
  )
}
```

### Fixed Width Column
```tsx
{
  key: 'actions',
  label: 'Actions',
  width: '150px',
  align: 'center',
  render: (item) => (
    <button onClick={() => handleAction(item)}>Action</button>
  )
}
```

## Styling

The component uses CSS classes from `globals.css`:
- `.table-container` - Outer container
- `.data-table-wrapper` - Scrollable wrapper (max-height: 70vh)
- `.data-table` - Table element
- `.data-table th.sticky-header` - Fixed header styling
- `.data-table th.sortable` - Sortable column styling
- `.data-table tbody tr.clickable-row` - Clickable row styling

## Scrolling Behavior

- **Vertical Scrolling**: Table wrapper has `max-height: 70vh` and `overflow-y: auto`
- **Horizontal Scrolling**: Table wrapper has `overflow-x: auto` for wide tables
- **Fixed Header**: Header stays visible with `position: sticky` and `top: 0`
- **Header Background**: Header has `z-index: 10` and background color to stay above content

## Notes

- Table is fully responsive and scrollable
- Header remains fixed while scrolling vertically
- Horizontal scrolling works when table width exceeds container
- Sorting is client-side (sorts the data array)
- Empty state is shown when `data.length === 0`
- Loading state can be shown while fetching data

