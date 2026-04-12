import { UserRole } from './auth-utils'

export interface Permission {
  id: string;
  feature: string;
  description: string;
  category: 'course' | 'calendar' | 'participant' | 'content' | 'report' | 'admin';
}

export interface RolePermissions {
  roleId: UserRole;
  roleName: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  isSystemRole: boolean; // Cannot be deleted
  createdDate: string;
  updatedDate: string;
}

// Master list of all available permissions (from Section 4.1 of requirements)
export const AVAILABLE_PERMISSIONS: Permission[] = [
  // Calendar
  { id: 'view_pic_calendar', feature: 'View PIC Calendar', description: 'View courses per trainer', category: 'calendar' },
  { id: 'view_master_calendar', feature: 'View Master Calendar', description: 'View all courses in calendar', category: 'calendar' },
  
  // Course Management
  { id: 'create_course', feature: 'Create course', description: 'Create new courses', category: 'course' },
  { id: 'import_course', feature: 'Import course and view history import', description: 'Bulk import courses', category: 'course' },
  { id: 'view_course', feature: 'View/export course list/details course', description: 'View course information', category: 'course' },
  { id: 'register_course', feature: 'Register course', description: 'Register as primary trainer', category: 'course' },
  { id: 'edit_course', feature: 'Edit course', description: 'Edit course details', category: 'course' },
  { id: 'cancel_course', feature: 'Cancel course', description: 'Cancel courses', category: 'course' },
  { id: 'delete_course', feature: 'Delete course', description: 'Delete courses', category: 'course' },
  { id: 'approve_course', feature: 'Approve register/edit/cancel request', description: 'Approve course actions', category: 'course' },
  { id: 'self_approval', feature: 'Self Approval', description: 'Actions are auto-approved without requiring approval workflow', category: 'course' },
  { id: 'finish_course', feature: 'Finish course', description: 'Mark course as finished', category: 'course' },
  
  // Participant Management
  { id: 'import_mof_result', feature: 'Import MOF exam result', description: 'Import MOF exam results', category: 'participant' },
  { id: 'import_participant', feature: 'Import participant', description: 'Bulk import participants', category: 'participant' },
  { id: 'add_participant', feature: 'Add participant', description: 'Add individual participants', category: 'participant' },
  { id: 'confirm_passed', feature: 'Confirm passed participant', description: 'Confirm passed participants', category: 'participant' },
  { id: 'export_participant', feature: 'Export participant', description: 'Export participant lists', category: 'participant' },
  
  // Content Management
  { id: 'manage_program', feature: 'Create/clone program/products/modules', description: 'Manage course content', category: 'content' },
  { id: 'view_program', feature: 'View program/product/module list/details', description: 'View course content', category: 'content' },
  
  // Admin Functions
  { id: 'manage_channel', feature: 'View/edit Channel setting', description: 'Manage channel settings', category: 'admin' },
  { id: 'manage_template', feature: 'View/edit/delete course template', description: 'Manage course templates', category: 'admin' },
  { id: 'manage_participant', feature: 'Participant management', description: 'Full participant management', category: 'admin' },
  { id: 'manage_trainer', feature: 'Trainer management', description: 'Manage trainer profiles', category: 'admin' },
  { id: 'manage_admin', feature: 'Admin management', description: 'Manage admin users', category: 'admin' },
  { id: 'manage_list', feature: 'List manage', description: 'Manage master data lists', category: 'admin' },
  { id: 'view_reports', feature: 'Report management', description: 'View and generate reports', category: 'report' },
  { id: 'manage_roles', feature: 'Role and Permission', description: 'Manage roles and permissions', category: 'admin' },
  { id: 'general_settings', feature: 'General setting', description: 'Configure system settings', category: 'admin' },
];

// Default role configurations (from Section 4.1 Authorization Matrix)
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  trainer: [
    'view_pic_calendar',
    'view_master_calendar',
    'create_course',
    'view_course',
    'register_course',
    'edit_course',
    'cancel_course',
    'delete_course',
  ],
  lead_region: [
    'view_pic_calendar',
    'view_master_calendar',
    'create_course',
    'import_course',
    'view_course',
    'edit_course',
    'cancel_course',
    'delete_course',
    'approve_course',
    'manage_participant',
    'manage_trainer',
    'manage_admin',
    'view_reports',
  ],
  head_channel: [
    'view_pic_calendar',
    'view_master_calendar',
    'create_course',
    'import_course',
    'view_course',
    'edit_course',
    'cancel_course',
    'delete_course',
    'approve_course',
    'self_approval',
    'manage_participant',
    'manage_trainer',
    'manage_admin',
    'view_reports',
  ],
  dms_admin: [
    'view_pic_calendar',
    'view_master_calendar',
    'view_course',
    'export_participant',
  ],
  master_role: [
    'view_pic_calendar',
    'view_master_calendar',
    'view_course',
    'edit_course',
    'import_mof_result',
    'import_participant',
    'add_participant',
    'finish_course',
    'approve_course',
    'manage_program',
    'view_program',
    'manage_channel',
    'manage_template',
    'manage_participant',
    'manage_trainer',
    'manage_admin',
    'manage_list',
    'view_reports',
    'general_settings',
  ],
  admin: [
    'view_pic_calendar',
    'view_master_calendar',
    'view_course',
    'edit_course',
    'import_mof_result',
    'import_participant',
    'add_participant',
    'confirm_passed',
    'finish_course',
    'manage_program',
    'view_program',
    'manage_channel',
    'manage_template',
    'manage_participant',
    'manage_trainer',
    'manage_admin',
    'manage_list',
    'view_reports',
    'general_settings',
  ],
  root_admin: [
    // Root Admin per original specification (Feature #3, #6, #7 NOT included)
    'view_pic_calendar',
    'view_master_calendar',
    'view_course',
    'manage_program',
    'view_program',
    'manage_channel',
    'manage_template',
    'manage_participant',
    'manage_trainer',
    'manage_admin',
    'manage_list',
    'view_reports',
    'manage_roles',
    'general_settings',
  ],
};

// Helper function to get role permissions
export function getRolePermissions(role: UserRole): string[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

// Helper function to check if a role has a specific permission
export function roleHasPermission(role: UserRole, permissionId: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permissionId);
}

