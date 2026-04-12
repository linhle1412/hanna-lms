// Authorization utilities for course editing
import type { Course } from './state'
import { DEFAULT_ROLE_PERMISSIONS, roleHasPermission } from './permissions'
import { hasSelfApproval } from './approval-workflow'

export type SystemRole = 'trainer' | 'lead_region' | 'head_channel' | 'admin' | 'root_admin' | 'dms_admin' | 'master_role'
export type UserRole = SystemRole | string  // Allows custom roles

export interface EditPermission {
  canEdit: boolean
  requiresApproval: boolean
  editableFields?: string[] // If specified, only these fields can be edited
  reason?: string // Why edit is not allowed
}

/**
 * Get current user role from session storage
 */
export function getCurrentUserRole(): UserRole {
  if (typeof window === 'undefined') return 'trainer'
  const role = sessionStorage.getItem('userRole') || 'trainer'
  return role as UserRole
}

/**
 * Get current user's channel from session storage
 */
export function getCurrentUserChannel(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('userChannel')
}

/**
 * Get current user's region from session storage
 */
export function getCurrentUserRegion(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('userRegion')
}

/**
 * Check if user can approve a course registration based on role, channel, and region
 */
export function canApproveRegistration(course: Course, userRole?: UserRole): { canApprove: boolean; reason?: string } {
  const role = userRole || getCurrentUserRole()
  const userChannel = getCurrentUserChannel()
  const userRegion = getCurrentUserRegion()
  const courseStatus = course.status.toUpperCase()

  // Only REGISTERED courses can be approved
  if (courseStatus !== 'REGISTERED') {
    return { canApprove: false, reason: 'Only REGISTERED courses can be approved.' }
  }

  // Master Role can approve any course
  if (role === 'master_role') {
    return { canApprove: true }
  }

  // Head Channel can approve courses in their channel (all regions)
  if (role === 'head_channel') {
    if (!userChannel) {
      return { canApprove: false, reason: 'User channel not set.' }
    }
    if (course.channel !== userChannel) {
      return { canApprove: false, reason: `You can only approve courses in ${userChannel} channel.` }
    }
    return { canApprove: true }
  }

  // Lead Region can approve Trainer registrations in their channel AND region
  if (role === 'lead_region') {
    if (!userChannel || !userRegion) {
      return { canApprove: false, reason: 'User channel or region not set.' }
    }
    if (course.channel !== userChannel) {
      return { canApprove: false, reason: `You can only approve courses in ${userChannel} channel.` }
    }
    if (course.region !== userRegion) {
      return { canApprove: false, reason: `You can only approve courses in ${userRegion} region.` }
    }
    // Lead can only approve Trainer registrations, not other Lead registrations
    // This would require checking who registered (stored in course history or primaryTrainer role)
    // For now, we'll allow it and add a note
    return { canApprove: true }
  }

  // Other roles cannot approve
  return { canApprove: false, reason: 'You do not have permission to approve course registrations.' }
}

/**
 * Check if user is course creator
 */
function isCourseCreator(course: Course, userId?: string): boolean {
  // In a real system, we'd check against actual user ID
  // For now, we'll use createdBy field comparison
  if (!userId) {
    const currentUser = typeof window !== 'undefined' ? sessionStorage.getItem('currentUserId') : null
    userId = currentUser || ''
  }
  return course.createdBy === userId || course.createdBy?.toLowerCase().includes('trainer')
}

/**
 * Check if user is primary trainer
 */
function isPrimaryTrainer(course: Course, userId?: string): boolean {
  // In a real system, we'd check against actual user ID
  // For now, we'll check if trainer matches
  const currentUser = typeof window !== 'undefined' ? sessionStorage.getItem('currentUserId') : null
  const trainerName = course.primaryTrainer || course.trainer || ''
  // Simplified check - in production, would check user ID match
  return trainerName.toLowerCase().includes('trainer') || trainerName.toLowerCase().includes(currentUser || '')
}

/**
 * Determine if course is SHINE type
 */
function isSHINECourse(course: Course): boolean {
  return course.program === 'SHINE Program' || course.courseType === 'Shine' || course.courseType === 'SHINE'
}

/**
 * Determine if course is AFTER-SHINE type
 * Note: AFTER-SHINE courses are courses that happen after SHINE completion
 * They may be identified by program name or course type
 */
function isAfterSHINECourse(course: Course): boolean {
  // Check if program name indicates AFTER-SHINE
  const programName = course.program?.toLowerCase() || ''
  // Check if course type indicates AFTER-SHINE
  const courseType = course.courseType?.toLowerCase() || ''
  
  return programName.includes('after-shine') || 
         programName.includes('after shine') ||
         courseType.includes('after-shine') ||
         courseType.includes('after shine') ||
         // If it's not SHINE but is related, might be AFTER-SHINE
         (course.program?.toLowerCase().includes('product') && course.channel !== 'Banca')
}

/**
 * Check if user can register for a course
 * Only Trainer, Lead Region, and Head Channel can register
 * Master Role CANNOT register (system admin only)
 */
export function canRegisterForCourse(course: Course, userRole?: UserRole): { canRegister: boolean; reason?: string } {
  const role = userRole || getCurrentUserRole()
  const status = course.status.toUpperCase()

  // Only NEW courses can be registered
  if (status !== 'NEW') {
    return { canRegister: false, reason: 'This course cannot be registered. Only NEW courses can be registered.' }
  }

  // Only Trainer, Lead Region, and Head Channel can register
  if (!['trainer', 'lead_region', 'head_channel'].includes(role)) {
    return { canRegister: false, reason: 'You do not have permission to register for courses.' }
  }

  return { canRegister: true }
}

/**
 * Check if user has self_approval permission
 * Checks both role-level and user-level permissions
 */
export function checkSelfApproval(userRole?: UserRole, userPermissions?: string[]): boolean {
  const role = userRole || getCurrentUserRole()
  return hasSelfApproval(role, userPermissions)
}

/**
 * Check if a role is a system role
 */
export function isSystemRole(role: UserRole): boolean {
  const systemRoles: SystemRole[] = [
    'trainer', 'lead_region', 'head_channel', 'admin', 
    'root_admin', 'dms_admin', 'master_role'
  ]
  return systemRoles.includes(role as SystemRole)
}

/**
 * Check edit permission based on role, course type, and status
 */
export function checkEditPermission(course: Course, userRole?: UserRole): EditPermission {
  const role = userRole || getCurrentUserRole()
  const status = course.status.toUpperCase()
  const isSHINE = isSHINECourse(course)
  const isAfterSHINE = isAfterSHINECourse(course)

  // Master Role can always edit
  if (role === 'master_role') {
    return { canEdit: true, requiresApproval: false }
  }

  // DMS_ADMIN cannot edit
  if (role === 'dms_admin') {
    return { canEdit: false, requiresApproval: false, reason: 'DMS Admin does not have edit permission' }
  }

  // Handle SHINE courses
  if (isSHINE) {
    switch (status) {
      case 'NEW':
        if (role === 'trainer') {
          // Only creator can edit
          if (isCourseCreator(course)) {
            return { canEdit: true, requiresApproval: false }
          }
          return { canEdit: false, requiresApproval: false, reason: 'Only course creator can edit NEW courses' }
        }
        if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit NEW courses' }

      case 'REGISTERED':
        if (role === 'trainer') {
          // Only primary trainer can edit
          if (isPrimaryTrainer(course)) {
            return { canEdit: true, requiresApproval: false }
          }
          return { canEdit: false, requiresApproval: false, reason: 'Only primary trainer can edit REGISTERED courses' }
        }
        if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit REGISTERED courses' }

      case 'APPROVED':
        if (role === 'trainer') {
          return { canEdit: false, requiresApproval: false, reason: 'Trainer cannot edit APPROVED SHINE courses' }
        }
        if (role === 'lead_region') {
          // Lead can edit but requires Head approval
          return { canEdit: true, requiresApproval: true }
        }
        if (role === 'head_channel') {
          return { canEdit: true, requiresApproval: false }
        }
        if (role === 'admin') {
          // Admin can only edit MOF class code
          return { 
            canEdit: true, 
            requiresApproval: false,
            editableFields: ['mofCourseName'] // MOF class code field
          }
        }
        if (role === 'root_admin') {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit APPROVED courses' }

      case 'IN_PROGRESS':
      case 'FINISHED':
      case 'CANCEL':
      case 'FINISH':
      case 'DELETED':
      case 'DELETE':
        return { canEdit: false, requiresApproval: false, reason: 'Cannot edit courses in this status (only Master Role can)' }

      default:
        return { canEdit: false, requiresApproval: false, reason: 'Unknown course status' }
    }
  }

  // Handle AFTER-SHINE courses
  if (isAfterSHINE) {
    switch (status) {
      case 'NEW':
        if (role === 'trainer') {
          if (isCourseCreator(course)) {
            return { canEdit: true, requiresApproval: false }
          }
          return { canEdit: false, requiresApproval: false, reason: 'Only course creator can edit NEW courses' }
        }
        if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit NEW courses' }

      case 'REGISTERED':
        if (role === 'trainer') {
          if (isPrimaryTrainer(course)) {
            return { canEdit: true, requiresApproval: false }
          }
          return { canEdit: false, requiresApproval: false, reason: 'Only primary trainer can edit REGISTERED courses' }
        }
        if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit REGISTERED courses' }

      case 'APPROVED':
        if (role === 'trainer') {
          // Trainer can edit but requires approval
          return { canEdit: true, requiresApproval: true }
        }
        if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit APPROVED courses' }

      case 'IN_PROGRESS':
      case 'FINISHED':
      case 'CANCEL':
      case 'FINISH':
      case 'DELETED':
      case 'DELETE':
        return { canEdit: false, requiresApproval: false, reason: 'Cannot edit courses in this status (only Master Role can)' }

      default:
        return { canEdit: false, requiresApproval: false, reason: 'Unknown course status' }
    }
  }

  // Handle other course types (Product, Skill)
  switch (status) {
    case 'NEW':
      if (role === 'trainer') {
        if (isCourseCreator(course)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'Only course creator can edit NEW courses' }
      }
      if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
        return { canEdit: true, requiresApproval: false }
      }
      return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit NEW courses' }

    case 'REGISTERED':
      if (role === 'trainer') {
        if (isPrimaryTrainer(course)) {
          return { canEdit: true, requiresApproval: false }
        }
        return { canEdit: false, requiresApproval: false, reason: 'Only primary trainer can edit REGISTERED courses' }
      }
      if (['lead_region', 'head_channel', 'root_admin'].includes(role)) {
        return { canEdit: true, requiresApproval: false }
      }
      return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit REGISTERED courses' }

    case 'APPROVED':
      if (role === 'trainer') {
        return { canEdit: false, requiresApproval: false, reason: 'Trainer cannot edit APPROVED courses' }
      }
      if (['lead_region', 'head_channel', 'admin', 'root_admin'].includes(role)) {
        return { canEdit: true, requiresApproval: false }
      }
      return { canEdit: false, requiresApproval: false, reason: 'You do not have permission to edit APPROVED courses' }

    case 'IN_PROGRESS':
    case 'FINISHED':
    case 'CANCEL':
    case 'FINISH':
    case 'DELETED':
    case 'DELETE':
      return { canEdit: false, requiresApproval: false, reason: 'Cannot edit courses in this status (only Master Role can)' }

    default:
      return { canEdit: false, requiresApproval: false, reason: 'Unknown course status' }
  }
}

/**
 * Get all roles for current user from session storage
 */
export function getUserRoles(): UserRole[] {
  if (typeof window === 'undefined') return []
  const rolesJson = sessionStorage.getItem('userRoles')
  if (!rolesJson) return []
  
  try {
    const roles = JSON.parse(rolesJson)
    // Convert to lowercase for consistency (roles stored as uppercase in users.json)
    return roles.map((role: string) => role.toLowerCase() as UserRole)
  } catch (e) {
    console.error('Error parsing user roles:', e)
    return []
  }
}

/**
 * Check if current user has a specific permission
 * @param permissionId - The permission ID to check (e.g., 'create_course')
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(permissionId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const userRoles = getUserRoles()
  
  // If no roles, check single role
  if (userRoles.length === 0) {
    const singleRole = getCurrentUserRole()
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[singleRole] || []
    return rolePermissions.includes(permissionId)
  }
  
  // Check if any of the user's roles has this permission
  for (const role of userRoles) {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || []
    if (rolePermissions.includes(permissionId)) {
      return true
    }
  }
  
  return false
}

/**
 * Check if current user has a specific role
 * @param role - The role to check
 * @returns true if user has this role, false otherwise
 */
export function hasRole(role: UserRole): boolean {
  const userRoles = getUserRoles()
  if (userRoles.length === 0) {
    return getCurrentUserRole() === role
  }
  return userRoles.includes(role)
}

/**
 * Check if current user has any of the specified roles
 * @param roles - Array of roles to check
 * @returns true if user has at least one of these roles, false otherwise
 */
export function hasAnyRole(roles: UserRole[]): boolean {
  const userRoles = getUserRoles()
  if (userRoles.length === 0) {
    return roles.includes(getCurrentUserRole())
  }
  return roles.some(role => userRoles.includes(role))
}

