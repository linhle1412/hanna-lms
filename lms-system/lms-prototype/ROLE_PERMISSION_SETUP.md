# Role & Permission Management System - Setup Guide

## ✅ Implementation Complete

The Role & Permission Management system has been successfully implemented for Root Admin users.

## 📁 Files Created/Modified

### **New Files:**
1. `lib/permissions.ts` - Permission data model and default configurations
2. `app/api/roles/route.ts` - GET/POST endpoints for roles
3. `app/api/roles/[id]/route.ts` - GET/PUT/DELETE endpoints for individual roles
4. `app/roles/page.tsx` - Role & Permission Management UI
5. `data/roles.json` - Default role configurations
6. `ROLE_PERMISSION_SETUP.md` - This setup guide

### **Modified Files:**
1. `lib/auth-utils.ts` - Added permission check helpers
2. `components/Sidebar.tsx` - Added "Role & Permissions" menu item
3. `styles/globals.css` - Added role management styling

---

## 🚀 How to Use

### **1. Access the Role & Permission Management Page**

**Requirements:**
- You must be logged in as **Root Admin**
- Navigate to: **http://localhost:3000/roles**
- Or click "Role & Permissions" in the sidebar

### **2. View All Roles**

The page displays all 7 system roles:
- 🔒 TRAINER
- 🔒 LEAD_REGION
- 🔒 HEAD_CHANNEL
- 🔒 DMS_ADMIN
- 🔒 MASTER_ROLE
- 🔒 ADMIN
- 🔒 ROOT_ADMIN

Each role card shows:
- Role name
- Description
- Number of permissions assigned
- System role indicator (🔒)

### **3. Edit Role Permissions**

1. Click **"Edit Permissions"** on any role card
2. A modal opens showing:
   - Current role information
   - All available permissions grouped by category:
     - 📅 Calendar Permissions
     - 📚 Course Management Permissions
     - 👥 Participant Management Permissions
     - 📖 Content Management Permissions
     - 📊 Report Permissions
     - ⚙️ Admin Permissions
3. Check/uncheck permissions as needed
4. Click **"Save Changes"** to update
5. Changes are saved to `data/roles.json`

### **4. Permission Categories**

| Category | Example Permissions |
|----------|-------------------|
| **Calendar** | View PIC Calendar, View Master Calendar |
| **Course Management** | Create course, Edit course, Register course, Approve course |
| **Participant Management** | Import participants, Add participant, Confirm passed participant |
| **Content Management** | Manage program/products/modules, View program details |
| **Report** | View and generate reports |
| **Admin** | Manage channel, Manage templates, Manage users, Role & Permission |

---

## 🔐 Authorization Matrix (Default)

### **TRAINER**
- View calendars
- Create, view, register, edit, cancel, delete courses

### **LEAD_REGION**
- All Trainer permissions
- Import courses
- Approve course actions
- Manage participants, trainers, admins
- View reports

### **HEAD_CHANNEL**
- Same as Lead Region
- Approve courses across all regions in their channel

### **DMS_ADMIN**
- View calendars and courses
- Export participant lists

### **MASTER_ROLE**
- Can break business rules
- Edit courses in any status
- Import MOF results
- Manage participants
- Full content and admin management

### **ADMIN**
- Course and participant management
- Content management
- Admin functions
- Cannot approve courses

### **ROOT_ADMIN**
- **ALL PERMISSIONS** (27 total)
- Full system access
- Role & Permission management

---

## 🧪 Testing the Feature

### **Test Scenario 1: View Roles**
1. Login as Root Admin
2. Navigate to `/roles`
3. Verify all 7 roles are displayed
4. Verify each role shows correct permission count

### **Test Scenario 2: Edit Permissions**
1. Click "Edit Permissions" on TRAINER role
2. Uncheck "create_course" permission
3. Click "Save Changes"
4. Verify success toast appears
5. Verify permission count decreased by 1
6. Re-open edit modal and verify checkbox is unchecked

### **Test Scenario 3: Permission Check in Code**
```typescript
import { hasPermission } from '@/lib/auth-utils'

// Check if current user can create courses
if (hasPermission('create_course')) {
  // Show create course button
}

// Check if current user can approve courses
if (hasPermission('approve_course')) {
  // Show approval actions
}
```

### **Test Scenario 4: Role Check in Code**
```typescript
import { hasRole, hasAnyRole } from '@/lib/auth-utils'

// Check if user is Root Admin
if (hasRole('root_admin')) {
  // Show admin-only features
}

// Check if user has any admin role
if (hasAnyRole(['admin', 'root_admin', 'master_role'])) {
  // Show admin features
}
```

---

## 🔧 API Endpoints

### **GET /api/roles**
Get all roles
```bash
curl http://localhost:3000/api/roles
```

### **GET /api/roles/[id]**
Get specific role
```bash
curl http://localhost:3000/api/roles/trainer
```

### **PUT /api/roles/[id]**
Update role permissions
```bash
curl -X PUT http://localhost:3000/api/roles/trainer \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["view_pic_calendar", "view_master_calendar"]}'
```

### **DELETE /api/roles/[id]**
Delete custom role (system roles cannot be deleted)
```bash
curl -X DELETE http://localhost:3000/api/roles/custom_123
```

---

## 📝 Data Structure

### **Permission Object**
```typescript
{
  id: string;              // e.g., 'create_course'
  feature: string;         // e.g., 'Create course'
  description: string;     // e.g., 'Create new courses'
  category: 'course' | 'calendar' | 'participant' | 'content' | 'report' | 'admin';
}
```

### **Role Object**
```typescript
{
  roleId: UserRole;        // e.g., 'trainer'
  roleName: string;        // e.g., 'TRAINER'
  description: string;     // Role description
  permissions: string[];   // Array of permission IDs
  isSystemRole: boolean;   // Cannot be deleted if true
  createdDate: string;     // ISO date
  updatedDate: string;     // ISO date
}
```

---

## 🎯 Next Steps

### **Phase 2: User Management Integration**
- [ ] Link users to roles during user creation
- [ ] Allow users to have multiple roles
- [ ] Display user's effective permissions

### **Phase 3: Dynamic Permission Checks**
- [ ] Replace hard-coded role checks with `hasPermission()`
- [ ] Update all feature buttons to check permissions
- [ ] Add permission-based route guards

### **Phase 4: Custom Roles**
- [ ] Enable Root Admin to create custom roles
- [ ] Allow custom role deletion
- [ ] Role cloning feature

### **Phase 5: Audit Trail**
- [ ] Log permission changes
- [ ] Track who modified which role
- [ ] Permission change history

---

## 🐛 Troubleshooting

### **Issue: "Role & Permissions" menu not visible**
**Solution:** Make sure you're logged in as Root Admin
```javascript
// In browser console:
sessionStorage.setItem('userRole', 'root_admin')
sessionStorage.setItem('userName', 'Root Admin')
location.reload()
```

### **Issue: Changes not saving**
**Solution:** Check `data/roles.json` file exists and is writable

### **Issue: Permission checks not working**
**Solution:** Ensure role permissions are loaded in `data/roles.json`

---

## 📚 Related Documentation

- User Management: `# FUNCTIONAL REQUIREMENT SPECIFICATIONS.md` Section 4.3
- Authorization Matrix: `# FUNCTIONAL REQUIREMENT SPECIFICATIONS.md` Section 4.1
- Permission Helpers: `lms-prototype/lib/auth-utils.ts`

---

## ✨ Features Implemented

✅ View all system roles  
✅ Edit role permissions via modal  
✅ Permission grouping by category  
✅ Real-time permission count  
✅ System role protection (cannot be deleted)  
✅ Permission check helpers (`hasPermission`, `hasRole`, `hasAnyRole`)  
✅ API endpoints for CRUD operations  
✅ Responsive UI with toast notifications  
✅ Root Admin only access control  

---

**Implementation Date:** November 9, 2025  
**Status:** ✅ Complete and Ready for Testing

