# LMS Quick Start Guide

**FWD Learning Management System - Development Setup**

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** (for version control)
- **Code Editor** (VS Code recommended)

---

## Installation Steps

### 1. Clone or Navigate to Project

```bash
cd lms-prototype
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React 18
- TypeScript 5
- FontAwesome icons

### 3. Start Development Server

```bash
npm run dev
```

The application will start on: **http://localhost:3000**

---

## First Login

### Access the Application

1. Open your browser and navigate to: `http://localhost:3000`
2. You'll see the login page

### Test Credentials

Use any of these accounts to explore different roles:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Root Admin** | `root_admin` | `password123` | Full system access including role management |
| **Admin** | `admin_user` | `password123` | System administration, content management |
| **Master Role** | `master_user` | `password123` | Can break business rules, full course access |
| **Head Channel** | `Head_agency` | `password123` | Channel management, approvals |
| **Lead Region** | `LeadAgencyNorth` | `password123` | Regional management, approvals |
| **Trainer** | `TrainerAgencyNorth` | `password123` | Course creation and registration |

---

## Key Features to Explore

### 1. Dashboard (`/dashboard`)
- View system statistics
- Access quick actions
- See pending approvals (for Lead/Head roles)

### 2. Master Calendar (`/master-calendar`)
- View all courses in calendar format
- Filter by program, channel, region
- Create new courses by clicking on dates
- Program-based color coding

### 3. Course Management (`/courses`)
- Create courses (SHINE, Product, Skill types)
- View course details
- Add/remove participants
- Edit courses with approval workflow
- Register for courses (Trainer role)

### 4. Trainer Management (`/trainers`)
- View trainer list
- Create new trainers
- View trainer details with sections:
  - General Information
  - Address
  - Experience
  - Education
  - Rewards
  - Certifications
  - Performance metrics

### 5. Participant Management (`/participants`)
- View participant list
- Filter and search participants
- View participant details
- Import participants (CSV)

### 6. Content Management

#### Modules (`/modules`)
- Create reusable training modules
- Attach files to modules
- Clone existing modules
- Track module usage

#### Products (`/products`)
- Create products from modules
- Define sessions and sequence
- Attach supporting files
- Auto-calculate duration

#### Programs (`/content`)
- Manage training programs
- View program hierarchy

### 7. Role & Permission Management (`/roles`)
- **Root Admin only**
- Configure role permissions
- View permission matrix
- Edit role capabilities

### 8. User Management (`/users`)
- Create user accounts
- Assign multiple roles
- Link users to trainers

---

## Common Workflows

### A. Trainer Creates a Course

1. Login as Trainer (`TrainerAgencyNorth` / `password123`)
2. Go to Master Calendar
3. Click on a date
4. Select "Create Course"
5. Fill in course details:
   - Select Program (SHINE/Product/Skill)
   - Enter course name
   - Select primary trainer (yourself)
   - Add co-trainer (optional)
   - Select channel and region
   - Enter venue details
   - Set start and end dates
6. Click "Create Course"
7. Course status: "NEW" → Click "Register" to request approval
8. Status changes to "REGISTERED" (waiting for approval)

### B. Lead/Head Approves Course

1. Login as Lead Region (`LeadAgencyNorth` / `password123`)
2. Go to Dashboard → See "Pending Approvals" card
3. Click on pending approvals or go to PIC Calendar
4. Click "Approve Courses" button
5. Review pending registrations
6. Click "Approve" or "Reject" with reason
7. Course status changes to "APPROVED"

### C. Admin Adds Participants to Course

1. Login as Admin (`admin_user` / `password123`)
2. Go to Courses → Select a course
3. Navigate to "Participants" tab
4. Click "Add Participants" or "Import from File"
5. **Option A - Manual Add:**
   - Search and select participants
   - Click "Add Selected"
6. **Option B - Import CSV:**
   - Upload CSV file with participant data
   - Review import results
   - Confirm addition

### D. Root Admin Manages Permissions

1. Login as Root Admin (`root_admin` / `password123`)
2. Go to "Role & Permissions" menu
3. Click "Edit Permissions" on any role
4. Check/uncheck permissions
5. Click "Save Changes"
6. Changes apply immediately to all users with that role

---

## Project Structure

```
lms-prototype/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication
│   │   ├── courses/              # Course APIs
│   │   ├── trainers/             # Trainer APIs
│   │   ├── participants/         # Participant APIs
│   │   ├── modules/              # Module APIs
│   │   ├── products/             # Product APIs
│   │   ├── programs/             # Program APIs
│   │   ├── roles/                # Role APIs
│   │   └── users/                # User APIs
│   ├── courses/                  # Course pages
│   ├── trainers/                 # Trainer pages
│   ├── participants/             # Participant pages
│   ├── modules/                  # Module pages
│   ├── products/                 # Product pages
│   ├── master-calendar/          # Master calendar
│   ├── pic-calendar/             # PIC calendar
│   ├── roles/                    # Role management
│   ├── users/                    # User management
│   ├── dashboard/                # Dashboard
│   ├── reports/                  # Reports
│   ├── page.tsx                  # Login page
│   └── layout.tsx                # Root layout
├── components/                   # React Components
│   ├── Layout.tsx                # Main layout with sidebar
│   ├── Header.tsx                # Header with role selector
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── DataTable.tsx             # Reusable data table
│   ├── CourseCreationModal.tsx   # Course creation
│   ├── CreateTrainerModal.tsx    # Trainer creation
│   ├── EditPermissionsModal.tsx  # Permission editing
│   ├── StatusTimeline.tsx        # Course status timeline
│   └── ...                       # Other modals and components
├── lib/                          # Utility Libraries
│   ├── api.ts                    # API client functions
│   ├── auth-utils.ts             # Auth utilities
│   ├── permissions.ts            # Permission definitions
│   ├── state.ts                  # TypeScript types
│   ├── json-handler.ts           # JSON file operations
│   ├── course-code-generator.ts  # Course code generation
│   └── ...                       # Other utilities
├── data/                         # JSON Data Storage
│   ├── users.json                # User accounts
│   ├── roles.json                # Role configurations
│   ├── trainers.json             # Trainer data
│   ├── participants.json         # Participant data
│   ├── courses.json              # Course data
│   ├── modules.json              # Module data
│   └── programs.json             # Program data
├── styles/                       # Stylesheets
│   └── globals.css               # Global styles
├── contexts/                     # React Contexts
│   └── ToastContext.tsx          # Toast notifications
├── public/                       # Static assets
│   └── data/                     # Public data files
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
└── README.md                     # Main documentation
```

---

## Development Tips

### 1. Hot Reload
The development server supports hot reload. Save any file and see changes immediately in the browser.

### 2. Check Console
Open browser DevTools (F12) to see:
- API calls and responses
- Error messages
- Debug logs

### 3. Session Storage
User session data is stored in `sessionStorage`:
- `userId`
- `userName`
- `userEmail`
- `userRoles` (array)
- `userChannel`
- `userRegion`

### 4. Data Persistence
All data is stored in JSON files in `/data/` directory. Changes persist across page reloads but **will be reset if you restart the dev server** (unless using the API to save).

### 5. Role Switching
Users with multiple roles can switch between them using the dropdown in the header (top-right).

---

## Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or use a different port
npm run dev -- -p 3001
```

### Issue: Module not found errors
```bash
# Clear Next.js cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: Changes not reflecting
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# Or restart dev server
Ctrl + C (stop server)
npm run dev (restart)
```

### Issue: Can't login
- Verify you're using correct credentials (see Test Credentials above)
- Check browser console for errors
- Ensure `/data/users.json` exists and contains user data

### Issue: 404 errors for API routes
- Ensure you're running `npm run dev` (not `npm start`)
- Check that API route files exist in `/app/api/`
- Verify route naming matches URL pattern

---

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

### 2. Start Production Server

```bash
npm start
```

Application runs on: **http://localhost:3000**

### 3. Production Considerations

**Before deploying to production:**

1. **Migrate from JSON to Database**
   - Replace file-based storage with PostgreSQL/MongoDB/SQL Server
   - Update API routes to use database queries
   - Implement proper data persistence

2. **Add Environment Variables**
   ```bash
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_secret_key
   SMTP_HOST=your_smtp_host
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   API_SECRET_KEY=your_api_key
   ```

3. **Implement Security**
   - Use JWT tokens for authentication
   - Add API rate limiting
   - Implement CORS policies
   - Use HTTPS/SSL certificates
   - Hash passwords with bcrypt

4. **Add Monitoring**
   - Application logging
   - Error tracking (Sentry, etc.)
   - Performance monitoring
   - API analytics

5. **File Storage**
   - Move file uploads to cloud storage (Azure Blob, AWS S3)
   - Implement CDN for static assets

---

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: Azure App Service
1. Create Azure App Service (Node.js runtime)
2. Configure deployment credentials
3. Deploy via Git or GitHub Actions
4. Set environment variables in Azure Portal

### Option 3: Docker
```bash
# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Build and run
docker build -t lms-app .
docker run -p 3000:3000 lms-app
```

---

## Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Project Documentation
- `README.md` - Main project overview
- `IMPLEMENTATION_STATUS.md` - Feature completion status
- `AUTHENTICATION_TESTING_GUIDE.md` - Auth testing guide
- `DEPLOYMENT.md` - Deployment instructions

### Support
For issues or questions:
1. Check console logs for error messages
2. Review API responses in Network tab
3. Verify user permissions match requirements
4. Check session storage for user data

---

## Next Steps

Once you have the application running:

1. ✅ Explore all roles and their capabilities
2. ✅ Test course creation workflow
3. ✅ Try approval workflows
4. ✅ Test content management (modules, products)
5. ✅ Review calendar views
6. 📋 Check implementation status document
7. 🚀 Plan production deployment

---

**Happy Learning Management! 📚**

For technical questions or issues, please refer to the implementation status document or contact the development team.

**Document Version:** 1.0  
**Last Updated:** November 23, 2025









