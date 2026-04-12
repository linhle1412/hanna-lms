# FWD LMS - Interactive Prototype

A complete interactive HTML prototype for the FWD Learning Management System (LMS), showcasing all major features and user flows across different roles.

## 📁 File Structure

```
lms-prototype/
├── index.html              # Login page
├── dashboard.html          # Role-based dashboard
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── navigation.js      # Navigation and role management
│   ├── state.js           # State management system
│   └── data-handler.js   # CRUD operations handler
├── data/
│   ├── courses.json       # Course mock data
│   ├── participants.json  # Participant mock data
│   ├── trainers.json      # Trainer mock data
│   └── users.json         # User mock data
├── pages/
│   ├── course-list.html   # Course listing page
│   ├── course-details.html # Course details with tabs
│   ├── master-calendar.html # Master calendar view
│   ├── pic-calendar.html  # PIC calendar view
│   ├── participant-list.html # Participant management
│   ├── trainer-list.html  # Trainer management
│   ├── user-management.html # User management (Root Admin)
│   ├── content-management.html # Content management
│   └── reports.html       # Reports dashboard
├── STYLING_GUIDE.md       # Color palette and styling reference
└── README.md              # This file
```

## 🚀 Getting Started

1. **Open the prototype:**
   - Simply open `index.html` in your web browser
   - No server or build process required

2. **Login:**
   - Enter your username and password
   - Click "Sign In"
   - The system will authenticate and load your assigned roles
   - See [AUTHENTICATION_TESTING_GUIDE.md](./AUTHENTICATION_TESTING_GUIDE.md) for test credentials

3. **Navigate:**
   - Use the left sidebar to navigate between pages
   - The active page is highlighted in orange
   - Breadcrumbs show your current location

4. **Switch Roles (Multi-Role Users Only):**
   - If you have multiple roles assigned, use the role selector in the top header to switch between them
   - If you have a single role, your role will be displayed as static text (no dropdown)
   - Navigation menu will update based on role permissions
   - **Security Note:** You can only switch between roles that are assigned to your user account

## 👥 User Roles

### Trainer
- View PIC Calendar
- View Master Calendar
- View Courses
- Create/Edit courses (with approval)
- Register for courses

### Lead Region
- All Trainer permissions
- Approve course requests
- Import courses
- Manage participants (same region)
- View reports

### Head Channel
- All Lead Region permissions
- Manage participants (same channel)
- Admin management
- Content management

### Admin Channel
- View calendars and courses
- Import/Export participants
- MOF exam management
- Confirm passed participants
- Import MOF exam results

### Root Admin
- Full system access
- User management
- Role and permission management
- General settings

### DMS Admin
- View courses
- Export passed participant list

### Master Role
- Can break predefined business rules
- Advanced permissions

## 📋 Features Demonstrated

### Course Management
- **Course List:** View all courses with filters (Channel, Region, Status)
- **Course Details:** Multi-tab interface (General, Planning, Participants, Checklist, History)
- **Create Course:** Modal form matching your screenshot design
- **Course Actions:** Edit, Delete, View details

### Calendar Views
- **Master Calendar:** Monthly view of all courses
- **PIC Calendar:** Trainer-specific calendar view
- **Course Events:** Clickable events showing course details

### Participant Management
- **Participant List:** Search and filter participants
- **Add Participants:** Modal with searchable participant list
- **Import Participants:** Excel import functionality
- **Participant Details:** View participant information

### Trainer Management
- **Trainer List:** Search and filter trainers
- **Create Trainer:** Modal form for new trainer
- **Trainer Details:** View trainer information and history

### Content Management
- **Modules:** Create and manage course modules
- **Products:** Create and manage products
- **Programs:** Create and manage programs with stages

### User Management (Root Admin only)
- **User List:** View all users
- **Create User:** Multi-role assignment
- **User Actions:** Edit and delete users

### Reports
- **Report Dashboard:** Access to all report types
- **Filtering:** Date range and filter options
- **Export:** Excel export functionality

## 🎨 Design System

### Colors
- **Primary Orange:** `#f17c23` (Buttons, active states, highlights)
- **Dark Grey Sidebar:** `#2c3e50` (Navigation background)
- **White:** Main content areas
- **Status Colors:** Yellow (Creating), Green (Approved), Blue (Completed), Grey (Pending)

### Typography
- **Font Family:** System fonts (-apple-system, Segoe UI, Roboto)
- **Headings:** 20px-28px, Bold (600)
- **Body Text:** 14px, Regular (400)
- **Small Text:** 12px-13px (Status badges, labels)

### Components
- **Modals:** White background, rounded corners, overlay
- **Tables:** Clean design with hover effects
- **Buttons:** Primary (orange), Secondary (white with orange border)
- **Status Badges:** Rectangular boxes with color coding

## 🔗 Navigation Flow

### Typical User Journeys

1. **Trainer Creates Course:**
   - Dashboard → Master Calendar → Create Course → Course Details → Add Participants

2. **Lead Approves Course:**
   - Dashboard → PIC Calendar → Approvals Tab → Approve/Reject

3. **Admin Manages Participants:**
   - Dashboard → Participants → Import/Add → View Details

4. **Root Admin Manages Users:**
   - Dashboard → Users → Create User → Assign Roles

## 🛠️ Customization

### Changing Colors
Edit `css/styles.css` and update the color values:
- Primary orange: `#f17c23`
- Sidebar: `#2c3e50`
- Status colors in `.status-badge` classes

### Adding New Pages
1. Create new HTML file in `pages/` directory
2. Copy sidebar navigation from existing page
3. Update active nav item class
4. Add link to sidebar in all pages

### Modifying Role Permissions
Edit `js/navigation.js` in the `updateNavigation()` function to show/hide menu items based on role.

## 📱 Responsive Design

The prototype includes basic responsive styles for mobile devices:
- Sidebar collapses to icons only
- Tables become scrollable
- Modal forms stack vertically
- Search sections stack vertically

## 🎯 Next Steps

1. **Review the prototype** and provide feedback on:
   - Colors and styling
   - Navigation flow
   - Missing features
   - UI/UX improvements

2. **I can update:**
   - Color palette to match exact brand colors
   - Font sizes and spacing
   - Add more pages/features
   - Enhance interactions

3. **For production:**
   - Connect to backend APIs
   - Implement real data loading
   - Add form validation
   - Add error handling
   - Implement authentication

## 📊 State Management

The prototype includes a complete state management system:

### Features
- **Data Loading:** Loads initial data from JSON files in `data/` directory
- **Data Persistence:** Saves all changes to localStorage
- **CRUD Operations:** Full Create, Read, Update, Delete functionality
- **Real-time Updates:** Pages automatically refresh when data changes
- **Event System:** Reactive updates across pages

### Data Files
- `data/courses.json` - Course data
- `data/participants.json` - Participant data
- `data/trainers.json` - Trainer data
- `data/users.json` - User data

### Usage

```javascript
// Get courses
const courses = DataHandler.loadCourses({ channel: 'IFA' });

// Create a course
DataHandler.createCourse({
    name: 'New Course',
    program: 'SHINE Program',
    channel: 'IFA',
    region: 'IFA Central'
});

// Update a course
DataHandler.updateCourse(courseId, { status: 'Approved' });

// Delete a course
DataHandler.deleteCourse(courseId);

// Add participants to course
DataHandler.addParticipantsToCourse(courseId, [1, 2, 3]);

// Remove participant from course
DataHandler.removeParticipantFromCourse(courseId, participantId);
```

### Reset Data
To reset all data to default values:
```javascript
LMSState.reset();
```

## 📝 Notes

- This is a **prototype**, not production code
- All data is stored in **localStorage** (browser storage)
- Data persists across page refreshes
- JSON files in `data/` directory provide initial mock data
- State management uses vanilla JavaScript, no framework required
- Role switching is simulated via session storage
- Form validation is implemented for required fields

## 🤝 Support

If you need adjustments to:
- Colors and styling
- Navigation structure
- Page layouts
- Additional features

Just let me know and I'll update the prototype accordingly!

