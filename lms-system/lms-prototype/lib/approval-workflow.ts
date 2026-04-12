import { UserRole } from './auth-utils'
import { roleHasPermission } from './permissions'

export interface ApprovalWorkflowConfig {
  version: string
  lastUpdated: string
  updatedBy: string
  hierarchy: {
    levels: Array<{
      id: string
      name: string
      role: UserRole
      order: number
      parent: string | null
      description: string
    }>
  }
  approvalWorkflow: {
    enabled: boolean
    description: string
    approver: {
      level: string
      role: UserRole
      canApproveFor: UserRole[]
      scope: {
        channel: 'same' | 'all'
        region: 'same' | 'all'
      }
    }
  }
}

/**
 * Check if user has self_approval permission
 * Checks both role-level and user-level permissions
 */
export function hasSelfApproval(userRole: UserRole, userPermissions?: string[]): boolean {
  // Check user-level permissions first (if provided)
  if (userPermissions && userPermissions.includes('self_approval')) {
    return true
  }
  
  // Check role-level permissions
  return roleHasPermission(userRole, 'self_approval')
}

/**
 * Load approval workflow configuration
 */
export async function loadApprovalWorkflow(): Promise<ApprovalWorkflowConfig> {
  try {
    const response = await fetch('/api/approval-workflow')
    if (response.ok) {
      return await response.json()
    }
    // Fallback to default if API fails
    return getDefaultApprovalWorkflow()
  } catch (error) {
    console.error('Error loading approval workflow config:', error)
    return getDefaultApprovalWorkflow()
  }
}

/**
 * Get default approval workflow configuration
 */
export function getDefaultApprovalWorkflow(): ApprovalWorkflowConfig {
  return {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
    hierarchy: {
      levels: [
        {
          id: "channel",
          name: "Channel",
          role: "head_channel",
          order: 1,
          parent: null,
          description: "Highest level - Channel head"
        },
        {
          id: "region",
          name: "Region",
          role: "lead_region",
          order: 2,
          parent: "channel",
          description: "Middle level - Regional lead"
        },
        {
          id: "trainer",
          name: "Trainer",
          role: "trainer",
          order: 3,
          parent: "region",
          description: "Lowest level - Individual trainer"
        }
      ]
    },
    approvalWorkflow: {
      enabled: true,
      description: "Unified approval workflow for all actions (Registration, Edit, Cancel)",
      approver: {
        level: "channel",
        role: "head_channel",
        canApproveFor: ["trainer", "lead_region"],
        scope: {
          channel: "same",
          region: "all"
        }
      }
    }
  }
}

/**
 * Determine if action should be auto-approved
 */
export function shouldAutoApprove(
  requesterRole: UserRole,
  requesterPermissions?: string[]
): boolean {
  return hasSelfApproval(requesterRole, requesterPermissions)
}

/**
 * Check if approver can approve for requester role
 */
export function canApproveFor(
  approverRole: UserRole,
  requesterRole: UserRole,
  config: ApprovalWorkflowConfig
): boolean {
  const approverConfig = config.approvalWorkflow.approver
  
  // Check if approver role matches configured approver role
  if (approverRole !== approverConfig.role) {
    return false
  }
  
  // Check if approver can approve for requester role
  return approverConfig.canApproveFor.includes(requesterRole)
}

/**
 * Check if course is within approver's scope
 */
export function isWithinApproverScope(
  approverChannel: string | null,
  approverRegion: string | null,
  courseChannel: string,
  courseRegion: string,
  config: ApprovalWorkflowConfig
): boolean {
  const scope = config.approvalWorkflow.approver.scope
  
  // Check channel scope
  if (scope.channel === 'same') {
    if (!approverChannel || approverChannel !== courseChannel) {
      return false
    }
  }
  // If scope.channel === 'all', no channel check needed
  
  // Check region scope
  if (scope.region === 'same') {
    if (!approverRegion || approverRegion !== courseRegion) {
      return false
    }
  }
  // If scope.region === 'all', no region check needed
  
  return true
}

/**
 * Find approver for a course action
 * Returns approver information or null if not found
 */
export async function findApprover(
  requesterRole: UserRole,
  requesterChannel: string | null,
  requesterRegion: string | null,
  courseChannel: string,
  courseRegion: string,
  config?: ApprovalWorkflowConfig
): Promise<{
  role: UserRole
  level: string
  scope: { channel: string; region: string }
} | null> {
  const workflowConfig = config || await loadApprovalWorkflow()
  
  if (!workflowConfig.approvalWorkflow.enabled) {
    return null
  }
  
  const approverConfig = workflowConfig.approvalWorkflow.approver
  
  // Check if requester role can be approved by this approver
  if (!canApproveFor(approverConfig.role, requesterRole, workflowConfig)) {
    return null
  }
  
  // Check scope
  // Note: In a real implementation, you would fetch approver's channel/region from user data
  // For now, we return the approver configuration
  return {
    role: approverConfig.role,
    level: approverConfig.level,
    scope: {
      channel: approverConfig.scope.channel === 'same' ? courseChannel : 'all',
      region: approverConfig.scope.region === 'same' ? courseRegion : 'all'
    }
  }
}

