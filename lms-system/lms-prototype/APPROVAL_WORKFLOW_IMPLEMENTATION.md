# Approval Workflow Implementation

## Overview

This document describes the implementation of the dynamic approval workflow system with permission-based auto-approval.

## Key Features

1. **Permission-Based Auto-Approval**: `self_approval` permission enables auto-approval for all course actions
2. **Unified Approval Workflow**: Single configuration for all actions (Registration, Edit, Cancel)
3. **Hierarchy-Based Approver Selection**: Based on organizational structure (Channel → Region → Trainer)
4. **Configurable**: Root Admin can configure approval workflow without code changes

## Files Created/Modified

### New Files

1. **`data/approval-workflow.json`**
   - Approval workflow configuration
   - Defines hierarchy and approver settings
   - Can be updated by Root Admin

2. **`lib/approval-workflow.ts`**
   - Approval workflow utility functions
   - Functions for checking auto-approval, finding approvers, scope validation

3. **`app/api/approval-workflow/route.ts`**
   - API endpoint for loading/updating approval workflow configuration
   - GET: Load configuration
   - PUT: Update configuration (Root Admin only)

### Modified Files

1. **`lib/permissions.ts`**
   - Added `self_approval` permission to AVAILABLE_PERMISSIONS
   - Added `self_approval` to HEAD_CHANNEL default permissions

2. **`data/roles.json`**
   - Added `self_approval` permission to HEAD_CHANNEL role

3. **`lib/auth-utils.ts`**
   - Added `checkSelfApproval()` function
   - Imported approval workflow utilities

4. **`documents/# RESTRUCTURED FUNCTIONAL REQUIREMENT SPECIFICATIONS.md`**
   - Updated with `self_approval` permission documentation
   - Updated authorization tables and business rules

## Permission: `self_approval`

### Description
Actions are auto-approved without requiring approval workflow.

### Default Assignment
- **HEAD_CHANNEL**: Has `self_approval` permission by default

### Usage
- Can be assigned to any role or individual user
- When user has `self_approval` permission:
  - Registration → Auto-approved
  - Edit → Auto-approved
  - Cancel → Auto-approved

### Management
- Managed through Role & Permission Management UI (`/roles`)
- Root Admin can assign/remove from any role
- Can be assigned at user level for specific users

## Approval Workflow Configuration

### Structure

```json
{
  "approvalWorkflow": {
    "enabled": true,
    "approver": {
      "level": "channel",
      "role": "head_channel",
      "canApproveFor": ["trainer", "lead_region"],
      "scope": {
        "channel": "same",
        "region": "all"
      }
    }
  }
}
```

### Configuration Options

- **level**: Hierarchy level of approver (channel, region, trainer)
- **role**: Approver role (head_channel, lead_region, trainer)
- **canApproveFor**: List of roles that this approver can approve
- **scope.channel**: "same" (only same channel) or "all" (all channels)
- **scope.region**: "same" (only same region) or "all" (all regions)

## Usage Examples

### Check Auto-Approval

```typescript
import { checkSelfApproval } from '@/lib/auth-utils'

const userRole = getCurrentUserRole()
const userPermissions = getUserPermissions() // Optional

if (checkSelfApproval(userRole, userPermissions)) {
  // Auto-approve action
  course.status = 'APPROVED'
  course.autoApproved = true
} else {
  // Route to approver
  const approver = await findApprover(...)
}
```

### Find Approver

```typescript
import { findApprover, loadApprovalWorkflow } from '@/lib/approval-workflow'

const config = await loadApprovalWorkflow()
const approver = await findApprover(
  requesterRole: 'trainer',
  requesterChannel: 'Agency',
  requesterRegion: 'North',
  courseChannel: 'Agency',
  courseRegion: 'North',
  config
)
```

### Check Scope

```typescript
import { isWithinApproverScope, loadApprovalWorkflow } from '@/lib/approval-workflow'

const config = await loadApprovalWorkflow()
const inScope = isWithinApproverScope(
  approverChannel: 'Agency',
  approverRegion: null,
  courseChannel: 'Agency',
  courseRegion: 'North',
  config
)
```

## Integration Points

### Registration Flow

1. User registers for course
2. Check `self_approval` permission
3. If yes → Auto-approve
4. If no → Find approver from config → Route to approver

### Edit Flow

1. User edits course
2. Check `self_approval` permission
3. If yes → Auto-approve changes
4. If no → Find approver from config → Route to approver

### Cancel Flow

1. User cancels course
2. Check `self_approval` permission
3. If yes → Auto-approve cancellation
4. If no → Find approver from config → Route to approver

## API Endpoints

### GET `/api/approval-workflow`
- Returns current approval workflow configuration
- Returns default config if file doesn't exist

### PUT `/api/approval-workflow`
- Updates approval workflow configuration
- Requires Root Admin authorization (TODO: implement)
- Validates configuration structure

## Future Enhancements

1. **UI for Configuration Management**
   - Screen for Root Admin to configure approval workflow
   - Visual preview of workflow
   - Edit approver settings

2. **Multi-Level Approval**
   - Support for sequential approval levels
   - Escalation logic
   - Optional vs required levels

3. **Action-Specific Workflows**
   - Different approval workflows per action type
   - Conditional approval rules

4. **Advanced Scope Rules**
   - Custom scope conditions
   - Channel-specific rules
   - Region-specific rules

## Testing

### Test Cases

1. **Auto-Approval Test**
   - User with `self_approval` permission registers
   - Verify: Status changes to APPROVED immediately
   - Verify: No approval request created

2. **Normal Approval Test**
   - User without `self_approval` permission registers
   - Verify: Status changes to REGISTERED
   - Verify: Approval request created
   - Verify: Routed to correct approver

3. **Scope Validation Test**
   - Approver from different channel tries to approve
   - Verify: Approval blocked if scope doesn't match

4. **Permission Check Test**
   - User without `approve_course` permission tries to approve
   - Verify: Approval blocked

## Notes

- Auto-approval is handled entirely by permission system
- No separate auto-approval configuration needed
- Configuration only defines approver settings
- All actions use the same approval workflow

