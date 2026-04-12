# Program Management Feature - Master Calendar Enhancement

## Overview

The Master Calendar has been enhanced to allow users to select and display **any active program** from the system, not just programs that currently have courses scheduled. This enables better planning and course creation for programs without existing courses.

## Key Changes

### 1. New Program Data Source

**File Created:** `lms-prototype/data/programs.json`
- Contains all active programs in the system
- Independent of course data
- Includes 8 default programs:
  - SHINE Program
  - SHINE Basic
  - SHINE Advanced
  - Product Program
  - Skill Program
  - Leadership Development
  - Sales Excellence
  - Digital Marketing

**Structure:**
```json
{
  "id": number,
  "name": string,
  "type": "SHINE" | "Product" | "Skill",
  "licenseType": string,
  "duration": number (days),
  "status": "ACTIVE" | "INACTIVE",
  "description": string (optional)
}
```

### 2. New API Endpoint

**File Created:** `lms-prototype/app/api/programs/route.ts`
- GET `/api/programs` - Returns all active programs
- Filters by status = "ACTIVE"
- Returns program list sorted alphabetically

### 3. Updated Type Definitions

**File Modified:** `lms-prototype/lib/state.ts`
- Added `Program` interface with all program fields
- Exported for use across the application

### 4. Updated API Library

**File Modified:** `lms-prototype/lib/api.ts`
- Added `programAPI` with methods:
  - `getAll()` - Fetch all active programs
  - `getById(id)` - Fetch specific program by ID
- Imported `Program` type from state

### 5. Master Calendar Component Updates

**File Modified:** `lms-prototype/app/master-calendar/page.tsx`

**Key Changes:**
1. **New State Variables:**
   - `systemPrograms` - Stores all active programs from API
   - Programs loaded independently of courses

2. **New Functions:**
   - `loadSystemPrograms()` - Fetches programs from API with fallback
   - `getCourseCountForProgram(program)` - Counts courses per program for display

3. **Updated Logic:**
   - `allPrograms` now populated from `systemPrograms` instead of `filteredCourses`
   - Program list independent of current month's courses
   - Programs without courses display as empty rows (clickable for course creation)

4. **Program Selector Modal Enhancements:**
   - Shows all active programs (not just those with courses)
   - Displays course count next to each program: "(X courses)"
   - Programs grouped by type (SHINE, Product, Skill)
   - Empty rows allow double-click to create courses

5. **Removed Functions:**
   - `getUniqueProgramsSorted()` - No longer needed (replaced by system programs)

### 6. Documentation Updates

**File Modified:** `# RESTRUCTURED FUNCTIONAL REQUIREMENT SPECIFICATIONS.md`

**Section 10.1.3 - Program Display Customization:**
- Added "Business Use Cases" explaining the feature benefits
- Added "Program Data Source" section explaining where programs come from
- Updated "Program List" to clarify all active programs are shown
- Added note about empty rows for programs without courses
- Updated "Calendar Update" acceptance criteria

## User Benefits

1. **Planning Flexibility:** Users can add programs to the calendar view even if no courses exist yet
2. **Course Creation:** Double-click on empty cells to create courses for any program
3. **Better Visibility:** See all available programs regardless of scheduling status
4. **Reduced Clutter:** Still able to hide programs not relevant to current work

## Technical Benefits

1. **Separation of Concerns:** Program data independent of course data
2. **Scalability:** Easy to add new programs without creating dummy courses
3. **Maintainability:** Single source of truth for program information
4. **Fallback Support:** Graceful degradation if API fails (extracts from courses)

## Usage Flow

1. User opens Master Calendar
2. System loads all active programs from Program Management
3. User clicks "⋮" icon in PROGRAM column header
4. Program selector modal opens showing all programs with course counts
5. User selects programs to display (including those with 0 courses)
6. User clicks "Apply"
7. Calendar refreshes to show selected programs
8. Programs without courses show as empty rows
9. User can double-click empty cells to create courses for any program

## Future Enhancements

1. **Program Management UI:** Admin interface to add/edit/deactivate programs
2. **Program Templates:** Pre-configured settings for each program type
3. **Program Analytics:** Track program utilization and course creation patterns
4. **Program Permissions:** Role-based access to specific programs
5. **Program Categories:** Additional grouping beyond SHINE/Product/Skill

## Testing Recommendations

1. **Test with empty programs:** Verify programs with 0 courses display correctly
2. **Test course creation:** Double-click on empty cells for programs without courses
3. **Test program selector:** Verify all active programs appear in modal
4. **Test course counts:** Verify accurate counts displayed next to program names
5. **Test persistence:** Verify program selection persists across page refreshes
6. **Test API failure:** Verify fallback to course-based program extraction
7. **Test filtering:** Verify program visibility with different filter combinations

## Migration Notes

- **No data migration required** - Existing courses continue to work
- **Backward compatible** - Falls back to course-based program list if API fails
- **Default state** - All programs selected by default (same as before)
- **Local storage** - Existing program selections remain valid

## Related Files

- `lms-prototype/data/programs.json` - Program data source
- `lms-prototype/app/api/programs/route.ts` - Programs API endpoint
- `lms-prototype/lib/state.ts` - Program interface definition
- `lms-prototype/lib/api.ts` - Program API client
- `lms-prototype/app/master-calendar/page.tsx` - Master Calendar component
- `# RESTRUCTURED FUNCTIONAL REQUIREMENT SPECIFICATIONS.md` - Requirements documentation

