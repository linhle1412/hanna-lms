// Status Definition Logic Mapping Table
// Maps step names to structured status definition logic

import type { StatusDefinitionLogic } from './state'

export const STATUS_DEFINITION_MAP: Record<string, StatusDefinitionLogic> = {
  'Verify AOL information': {
    type: 'manual_confirm',
    description: 'PIC confirms the step is completed'
  },
  'Verify MOF information': {
    type: 'manual_confirm',
    description: 'PIC confirms the step is completed'
  },
  'Enter MOF exam code': {
    type: 'field_check',
    description: 'MOF exam code field contains valid information',
    fieldCheck: {
      fieldPath: 'mofExamCode',
      condition: 'not_empty'
    }
  },
  'Approve course': {
    type: 'course_status_change',
    description: 'Course status changes to "Approved"',
    statusChange: {
      targetStatus: 'Approved'
    }
  },
  'Add participants': {
    type: 'percentage_calculation',
    description: 'Calculate percentage: (Number added / Max allowed) × 100%',
    percentageCalculation: {
      numerator: 'participantIds.length',
      denominator: '50', // Default max participants if not specified in program
      threshold: 0 // Mark done when any participants are added
    }
  },
  'Export Participants for MOF exam': {
    type: 'action_tracked',
    description: 'User clicks "Export participant for MOF exam" button',
    actionTracked: {
      actionType: 'export',
      requiresSuccess: true
    }
  },
  'Update AOL exam result': {
    type: 'percentage_calculation',
    description: 'Count and calculate percentage of participants who have AOL exam results updated',
    percentageCalculation: {
      numerator: 'participantsWithAOLResults.length',
      denominator: 'participantIds.length',
      threshold: 0 // Mark done when any AOL results are updated
    }
  },
  'Update attendance result': {
    type: 'percentage_calculation',
    description: 'Count and calculate percentage of participants who have attendance data recorded',
    percentageCalculation: {
      numerator: 'participantsWithAttendance.length',
      denominator: 'participantIds.length',
      threshold: 0 // Mark done when any attendance data is recorded
    }
  },
  'Import MOF result': {
    type: 'action_tracked',
    description: 'User successfully imports MOF exam results',
    actionTracked: {
      actionType: 'import',
      requiresSuccess: true
    }
  },
  'Confirm passed participants': {
    type: 'action_tracked',
    description: 'User clicks "Confirm passed participant" button successfully',
    actionTracked: {
      actionType: 'confirm',
      requiresSuccess: true
    }
  },
  'Export participant for granting agent/license code': {
    type: 'action_tracked',
    description: 'User exports passed participants for code assignment',
    actionTracked: {
      actionType: 'export',
      requiresSuccess: true
    }
  },
  'Grant agent code': {
    type: 'api_integration',
    description: 'Agent codes are received and assigned to all passed participants',
    apiIntegration: {
      endpoint: '/api/courses/[id]/agent-codes',
      eventType: 'agent_codes_assigned',
      condition: 'all_passed_participants_have_codes'
    }
  },
  'Grant license code': {
    type: 'api_integration',
    description: 'API receives and updates license codes for participants',
    apiIntegration: {
      endpoint: '/api/courses/[id]/license-codes',
      eventType: 'license_codes_assigned',
      condition: 'all_passed_participants_have_codes'
    }
  },
  'Finish course': {
    type: 'course_status_change',
    description: 'Course status is set to "Finished"',
    statusChange: {
      targetStatus: 'Finished'
    }
  }
}

/**
 * Get structured status definition logic for a step
 * Falls back to parsing text-based logic if structured logic not found
 */
export function getStatusDefinitionLogic(
  stepName: string,
  textLogic?: string
): StatusDefinitionLogic | null {
  // First, try to get from mapping table
  if (STATUS_DEFINITION_MAP[stepName]) {
    return STATUS_DEFINITION_MAP[stepName]
  }
  
  // If not found, try to parse from text-based logic
  if (textLogic) {
    return parseTextBasedLogic(textLogic)
  }
  
  return null
}

/**
 * Parse text-based status definition logic into structured format
 * This provides backward compatibility during migration
 */
function parseTextBasedLogic(textLogic: string): StatusDefinitionLogic {
  const lowerText = textLogic.toLowerCase()
  
  // Pattern: "MOF exam code field is entered"
  if (lowerText.includes('mof exam code field is entered') || 
      lowerText.includes('mof exam code field contains')) {
    return {
      type: 'field_check',
      description: textLogic,
      fieldCheck: {
        fieldPath: 'mofExamCode',
        condition: 'not_empty'
      }
    }
  }
  
  // Pattern: "course status changes to"
  if (lowerText.includes('course status changes to')) {
    const match = textLogic.match(/changes to ["']?(\w+)["']?/i)
    const targetStatus = match ? match[1] : 'Approved'
    return {
      type: 'course_status_change',
      description: textLogic,
      statusChange: {
        targetStatus
      }
    }
  }
  
  // Pattern: "Calculate percentage" or "Count and calculate percentage"
  if (lowerText.includes('calculate percentage') || lowerText.includes('count and calculate')) {
    return {
      type: 'percentage_calculation',
      description: textLogic,
      percentageCalculation: {
        numerator: 'participantIds.length',
        denominator: '50',
        threshold: 0
      }
    }
  }
  
  // Pattern: "user clicks" or "user successfully"
  if (lowerText.includes('user clicks') || lowerText.includes('user successfully')) {
    let actionType = 'confirm'
    if (lowerText.includes('export')) actionType = 'export'
    else if (lowerText.includes('import')) actionType = 'import'
    else if (lowerText.includes('confirm')) actionType = 'confirm'
    
    return {
      type: 'action_tracked',
      description: textLogic,
      actionTracked: {
        actionType,
        requiresSuccess: lowerText.includes('successfully')
      }
    }
  }
  
  // Pattern: "API receives" or "via API"
  if (lowerText.includes('api receives') || lowerText.includes('via api')) {
    return {
      type: 'api_integration',
      description: textLogic,
      apiIntegration: {
        endpoint: '/api/courses/[id]',
        eventType: 'data_received'
      }
    }
  }
  
  // Default: manual confirm
  return {
    type: 'manual_confirm',
    description: textLogic
  }
}

