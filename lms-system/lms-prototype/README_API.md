# JSON File-Based Database API

This project uses JSON files as a database, where all CRUD operations update the JSON files directly in the `data/` directory.

## Architecture

### File Structure
```
lms-prototype/
├── data/                    # JSON database files
│   ├── courses.json
│   ├── participants.json
│   ├── trainers.json
│   └── users.json
├── app/api/                 # Next.js API Routes
│   ├── courses/
│   ├── participants/
│   ├── trainers/
│   └── users/
└── lib/
    ├── api.ts              # Client-side API client
    └── file-utils.ts       # Server-side file operations
```

## How It Works

### 1. **Client-Side (React Components)**
- Components call functions from `lib/api.ts` (e.g., `courseAPI.getAll()`, `courseAPI.create()`)
- These functions make HTTP requests to Next.js API routes

### 2. **Server-Side (API Routes)**
- API routes in `app/api/` handle HTTP requests
- They use `lib/file-utils.ts` to read/write JSON files
- All changes are persisted to the JSON files in `data/` directory

### 3. **Data Persistence**
- **Read**: Files are read from `data/*.json` on each API request
- **Write**: Files are written to `data/*.json` immediately after updates
- Changes persist across server restarts

## API Endpoints

### Courses
- `GET /api/courses` - Get all courses (with filters: channel, region, status, search)
- `GET /api/courses/[id]` - Get course by ID
- `POST /api/courses` - Create new course
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course
- `POST /api/courses/[id]/participants/[participantId]` - Add participant to course
- `DELETE /api/courses/[id]/participants/[participantId]` - Remove participant from course

### Participants
- `GET /api/participants` - Get all participants (with filters: region, channel, search)
- `GET /api/participants/[id]` - Get participant by ID
- `POST /api/participants` - Create new participant
- `PUT /api/participants/[id]` - Update participant
- `DELETE /api/participants/[id]` - Delete participant

### Trainers
- `GET /api/trainers` - Get all trainers (with filters: region, search)
- `GET /api/trainers/[id]` - Get trainer by ID
- `POST /api/trainers` - Create new trainer
- `PUT /api/trainers/[id]` - Update trainer
- `DELETE /api/trainers/[id]` - Delete trainer

### Users
- `GET /api/users` - Get all users (with filters: search)
- `GET /api/users/[id]` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

## Usage Example

### Creating a Course (Client-Side)
```typescript
import { courseAPI } from '@/lib/api'

const newCourse = await courseAPI.create({
  name: "New Course",
  program: "SHINE Program",
  channel: "IFA",
  region: "IFA Central",
  startDate: "2025-10-01",
  endDate: "2025-10-16",
  venue: "Training Center"
})

// Course is automatically saved to data/courses.json
```

### Reading Courses (Client-Side)
```typescript
import { courseAPI } from '@/lib/api'

// Get all courses
const courses = await courseAPI.getAll()

// Get filtered courses
const filtered = await courseAPI.getAll({
  channel: "IFA",
  status: "Approved",
  search: "Shine"
})
```

## Important Notes

1. **File Location**: JSON files must be in the `data/` directory (NOT in `public/`)
   - `public/` is for static assets (read-only)
   - `data/` is for server-side database files (read/write)

2. **Data Format**: All JSON files contain arrays of objects
   - Each object must have an `id` field (number)
   - IDs are generated using `Date.now()` for new records

3. **Concurrent Access**: 
   - Multiple requests may try to write simultaneously
   - Next.js API routes handle this sequentially per request
   - For production use, consider adding file locking or a real database

4. **Error Handling**:
   - API routes return appropriate HTTP status codes
   - Client-side API client throws errors that can be caught with try/catch

## Development

### Testing the API
```bash
# Start the dev server
npm run dev

# Test creating a course
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Course","program":"SHINE Program","channel":"IFA","region":"IFA Central"}'

# Test reading courses
curl http://localhost:3000/api/courses
```

### Viewing Data
You can directly view/edit JSON files in `data/` directory:
- Changes to JSON files will be reflected on next API call
- Be careful not to corrupt JSON syntax

## Migration from localStorage

Previously, the app used `localStorage` for client-side storage. Now:
- ✅ Data persists in JSON files (server-side)
- ✅ Data shared across all users/sessions
- ✅ Data survives browser cache clear
- ✅ Can be version controlled with Git

