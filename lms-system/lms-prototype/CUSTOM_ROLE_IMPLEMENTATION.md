# Custom Role Creation Feature - Implementation Summary

## Overview

This document describes the implementation of the custom role creation feature, allowing Root Admin to create, edit, and delete custom roles beyond the 7 system roles.

## Implementation Date
2025-01-15

## Features Implemented

### 1. Custom Role Creation
- Root Admin can create new custom roles with any name and permission combination
- Role name validation (unique, case-insensitive)
- Automatic roleId generation from role name (sanitized)

### 2. Custom Role Management
- Edit custom role name and description (system roles cannot be renamed)
- Edit custom role permissions
- Delete custom roles (with user assignment validation)

### 3. User Assignment Validation
- System checks if users are assigned to role before deletion
- Prevents deletion if users exist with the role
- Clear error message with user count

## Files Created/Modified

### New Files
1. **`components/CreateRoleModal.tsx`**
   - Modal component for creating new custom roles
   - Form with role name, description, and permission selection
   - Validation and error handling

### Modified Files

1. **`lib/auth-utils.ts`**
   - Updated `UserRole` type to support custom roles: `SystemRole | string`
   - Added `SystemRole` type for system roles only
   - Added `isSystemRole()` helper function
   - Added `checkSelfApproval()` function

2. **`app/roles/page.tsx`**
   - Added "➕ Add New Role" button
   - Added `CreateRoleModal` integration
   - Added delete functionality for custom roles
   - Updated info banner to mention custom roles
   - Added `handleCreateRole()` function
   - Added `handleDeleteRole()` function

3. **`components/EditPermissionsModal.tsx`**
   - Updated to allow editing name/description for custom roles
   - Added editable fields for custom roles
   - System roles show read-only name/description

4. **`app/api/roles/route.ts`**
   - Improved POST endpoint with validation:
     - Role name required
     - Description required
     - Duplicate name check (case-insensitive)
     - RoleId generation from role name
     - Sanitization of role name

5. **`app/api/roles/[id]/route.ts`**
   - Updated PUT endpoint to allow editing custom role name/description
   - System roles: only permissions can be updated
   - Custom roles: name, description, and permissions can be updated
   - Updated DELETE endpoint to check user assignments before deletion

## UserRole Type Changes

### Before:
```typescript
export type UserRole = 'trainer' | 'lead_region' | 'head_channel' | 'admin' | 'root_admin' | 'dms_admin' | 'master_role'
```

### After:
```typescript
export type SystemRole = 'trainer' | 'lead_region' | 'head_channel' | 'admin' | 'root_admin' | 'dms_admin' | 'master_role'
export type UserRole = SystemRole | string  // Allows custom roles
```

## API Endpoints

### POST `/api/roles`
**Purpose:** Create new custom role

**Request Body:**
```json
{
  "roleName": "SENIOR_TRAINER",
  "description": "Senior trainers with additional permissions",
  "permissions": ["view_course", "edit_course", "approve_course"]
}
```

**Response:**
```json
{
  "roleId": "senior_trainer",
  "roleName": "SENIOR_TRAINER",
  "description": "Senior trainers with additional permissions",
  "permissions": ["view_course", "edit_course", "approve_course"],
  "isSystemRole": false,
  "createdDate": "2025-01-15T10:30:00.000Z",
  "updatedDate": "2025-01-15T10:30:00.000Z"
}
```

**Validation:**
- Role name required
- Description required
- Role name must be unique (case-insensitive)
- RoleId auto-generated from role name

### PUT `/api/roles/[id]`
**Purpose:** Update role (permissions for all, name/description for custom only)

**Request Body (System Role):**
```json
{
  "permissions": ["view_course", "edit_course"]
}
```

**Request Body (Custom Role):**
```json
{
  "roleName": "UPDATED_NAME",
  "description": "Updated description",
  "permissions": ["view_course", "edit_course"]
}
```

### DELETE `/api/roles/[id]`
**Purpose:** Delete custom role

**Validation:**
- System roles cannot be deleted (403 error)
- Custom roles can only be deleted if no users assigned (400 error if users exist)

**Response (Success):**
```json
{
  "message": "Role deleted successfully"
}
```

**Response (Error - Users Assigned):**
```json
{
  "error": "Cannot delete role. 5 user(s) are assigned to this role. Please reassign users before deleting.",
  "userCount": 5
}
```

## UI Components

### CreateRoleModal
- Role name input (required, max 50 chars)
- Description textarea (required, max 255 chars)
- Permission selection (all 28 permissions grouped by category)
- Real-time permission count summary
- Validation and error handling

### Updated Roles Page
- "➕ Add New Role" button in section header
- Delete button for custom roles (not shown for system roles)
- Visual distinction: System roles show 🔒 icon
- Custom roles can be fully managed

### Updated EditPermissionsModal
- For custom roles: Editable name and description fields
- For system roles: Read-only name and description
- Permission editing works for both types

## Business Rules

1. **System Role Protection:**
   - 7 system roles cannot be deleted
   - System role names and descriptions cannot be changed
   - System roles can have permissions modified

2. **Custom Role Management:**
   - Custom roles can be created with any name
   - Custom role names must be unique (case-insensitive)
   - Custom roles can be renamed, have description changed, and permissions modified
   - Custom roles can be deleted if no users assigned

3. **Role Name Validation:**
   - Must be unique (case-insensitive)
   - Cannot match existing system role names
   - Cannot match existing custom role names
   - Maximum 50 characters
   - Auto-generates roleId (sanitized, lowercase, underscores)

4. **User Assignment Check:**
   - Before deleting custom role, system checks if any users have the role
   - If users exist, deletion is blocked with error message
   - Error message includes count of affected users

## Usage Examples

### Create Custom Role
1. Navigate to Role & Permission Management (`/roles`)
2. Click "➕ Add New Role" button
3. Enter role name: "SENIOR_TRAINER"
4. Enter description: "Senior trainers with advanced permissions"
5. Select permissions (e.g., view_course, edit_course, approve_course)
6. Click "Create Role"
7. Role appears in role list

### Edit Custom Role
1. Click "Edit Permissions" on custom role
2. Modal opens with editable name and description
3. Modify name, description, or permissions as needed
4. Click "Save Changes"
5. Role updated in system

### Delete Custom Role
1. Click "Delete" button on custom role
2. Confirmation dialog appears
3. If confirmed and no users assigned → Role deleted
4. If users assigned → Error message displayed

## Testing Checklist

- [ ] Create custom role with valid name and permissions
- [ ] Attempt to create duplicate role name (should fail)
- [ ] Edit custom role name and description
- [ ] Edit custom role permissions
- [ ] Attempt to delete system role (should fail)
- [ ] Delete custom role with no users (should succeed)
- [ ] Attempt to delete custom role with users assigned (should fail)
- [ ] Verify custom role appears in user role selection
- [ ] Verify custom role permissions work correctly

## Notes

- Custom roles function identically to system roles for permission checks
- Custom roles can be assigned to users through User Management
- Custom roles follow same data filtering rules as system roles
- Custom roles can be used in approval workflows if they have appropriate permissions
- RoleId is auto-generated and cannot be manually set

## Future Enhancements

1. **Role Templates:**
   - Pre-defined role templates for common use cases
   - Clone existing role as template

2. **Role Usage Analytics:**
   - Show how many users have each role
   - Show role usage statistics

3. **Bulk Role Operations:**
   - Bulk assign permissions
   - Bulk role creation from template

4. **Role Hierarchy:**
   - Define role hierarchies
   - Inherit permissions from parent roles

