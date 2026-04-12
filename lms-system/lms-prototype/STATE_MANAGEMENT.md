# State Management System Guide

## Overview

The LMS prototype includes a complete state management system that allows you to:
- Load data from JSON files
- Create, Read, Update, and Delete (CRUD) operations
- Persist data in localStorage
- Get real-time updates across pages

## Architecture

### Core Files

1. **`js/state.js`** - Main state management module
   - Manages all data (courses, participants, trainers, users)
   - Handles localStorage persistence
   - Provides event system for reactivity

2. **`js/data-handler.js`** - CRUD operations handler
   - Wrapper functions for common operations
   - Form data helpers
   - Success/error message display

3. **`data/*.json`** - Mock data files
   - Initial data loaded on first run
   - Can be edited to change default data

## Usage Examples

### Loading Data

```javascript
// Load all courses
const courses = DataHandler.loadCourses();

// Load courses with filters
const filteredCourses = DataHandler.loadCourses({
    channel: 'IFA',
    region: 'IFA Central',
    status: 'Creating',
    search: 'SHINE'
});

// Load specific course
const course = LMSState.getCourse(courseId);

// Load course participants
const participants = LMSState.getCourseParticipants(courseId);
```

### Creating Data

```javascript
// Create a course
const newCourse = DataHandler.createCourse({
    name: 'New Course Name',
    program: 'SHINE Program',
    channel: 'IFA',
    region: 'IFA Central',
    trainer: 'Trainer1 cloudair',
    startDate: '2025-10-01',
    endDate: '2025-10-16',
    venue: 'Training Center'
});

// Create a participant
const newParticipant = DataHandler.createParticipant({
    name: 'John Doe',
    agentCode: 'AGT005',
    email: 'john@example.com',
    phone: '555-1234',
    region: 'IFA Central',
    channel: 'IFA'
});

// Add participants to course
DataHandler.addParticipantsToCourse(courseId, [1, 2, 3]);
```

### Updating Data

```javascript
// Update course
DataHandler.updateCourse(courseId, {
    status: 'Approved',
    trainer: 'New Trainer'
});

// Update participant
DataHandler.updateParticipant(participantId, {
    email: 'newemail@example.com',
    phone: '555-5678'
});
```

### Deleting Data

```javascript
// Delete course
DataHandler.deleteCourse(courseId);

// Delete participant
DataHandler.deleteParticipant(participantId);

// Remove participant from course
DataHandler.removeParticipantFromCourse(courseId, participantId);
```

## Event System

Listen for data changes:

```javascript
// Listen for course updates
LMSState.on('courses_updated', () => {
    console.log('Courses updated!');
    loadCourses(); // Refresh your UI
});

// Listen for participant updates
LMSState.on('participants_updated', () => {
    console.log('Participants updated!');
    loadParticipants();
});
```

## Form Integration

### Getting Form Data

```javascript
const form = document.querySelector('#myForm');
const formData = DataHandler.getFormData(form);

// formData is an object with form field values
// { courseName: '...', program: '...', channel: '...' }
```

### Form Submission Example

```javascript
function setupCreateForm() {
    const form = document.querySelector('#createCourseModal form');
    const submitBtn = form.querySelector('.btn-primary');
    
    submitBtn.addEventListener('click', () => {
        const formData = DataHandler.getFormData(form);
        
        // Validate required fields
        if (!formData.courseName || !formData.program) {
            DataHandler.showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Create course
        DataHandler.createCourse({
            name: formData.courseName,
            program: formData.program,
            channel: formData.channel,
            region: formData.region,
            // ... other fields
        });
        
        DataHandler.showMessage('Course created successfully!');
        Navigation.hideModal('createCourseModal');
        form.reset();
    });
}
```

## Message System

Show success/error messages:

```javascript
// Success message (default)
DataHandler.showMessage('Operation completed successfully!');

// Error message
DataHandler.showMessage('Something went wrong', 'error');
```

## Data Persistence

All data is automatically saved to localStorage:
- Data persists across page refreshes
- Data persists across browser sessions
- Each entity type has its own localStorage key:
  - `lms_courses`
  - `lms_participants`
  - `lms_trainers`
  - `lms_users`

### Reset Data

To reset all data to initial JSON values:

```javascript
LMSState.reset();
```

Or manually in browser console:
```javascript
localStorage.clear();
location.reload();
```

## Advanced Usage

### Filtering

```javascript
// Multiple filters
const courses = DataHandler.loadCourses({
    channel: 'IFA',
    region: 'IFA Central',
    status: 'Creating',
    search: 'SHINE'
});

// All filters are AND conditions (must match all)
```

### Relationships

```javascript
// Get all participants in a course
const participants = LMSState.getCourseParticipants(courseId);

// Add multiple participants at once
DataHandler.addParticipantsToCourse(courseId, [1, 2, 3, 4]);

// Remove participant
DataHandler.removeParticipantFromCourse(courseId, participantId);
```

## Integration with Pages

To integrate state management in a new page:

1. Include the scripts:
```html
<script src="../js/navigation.js"></script>
<script src="../js/state.js"></script>
<script src="../js/data-handler.js"></script>
```

2. Load data on page load:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    
    // Listen for updates
    LMSState.on('courses_updated', loadData);
});
```

3. Create global refresh function:
```javascript
window.refreshMyPage = function() {
    loadData();
};
```

## Example: Complete Page Integration

```javascript
// Load and display data
function loadData() {
    const items = DataHandler.loadItems();
    const container = document.querySelector('.data-container');
    
    container.innerHTML = items.map(item => `
        <div class="item">
            <h3>${item.name}</h3>
            <button onclick="editItem(${item.id})">Edit</button>
            <button onclick="deleteItem(${item.id})">Delete</button>
        </div>
    `).join('');
}

// Create item
function createItem(formData) {
    DataHandler.createItem(formData);
    DataHandler.showMessage('Item created!');
    loadData();
}

// Update item
function updateItem(id, updates) {
    DataHandler.updateItem(id, updates);
    DataHandler.showMessage('Item updated!');
    loadData();
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure?')) {
        DataHandler.deleteItem(id);
        DataHandler.showMessage('Item deleted!');
        loadData();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    LMSState.on('items_updated', loadData);
});

// Global refresh
window.refreshMyPage = loadData;
```

## Troubleshooting

### Data not loading
- Check browser console for errors
- Verify JSON files exist in `data/` directory
- Check localStorage in browser DevTools

### Changes not persisting
- Check if `LMSState.save()` is being called
- Verify localStorage is enabled in browser

### Events not firing
- Ensure listeners are registered before data changes
- Check event names match exactly

## Notes

- All data is stored in browser localStorage (not synced across devices)
- Data persists until localStorage is cleared or `reset()` is called
- JSON files are only loaded on first run or after reset
- State management uses vanilla JavaScript (no frameworks required)

