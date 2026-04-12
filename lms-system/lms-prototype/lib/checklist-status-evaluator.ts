// Checklist Status Evaluator Service
// Evaluates checklist steps to determine if they should be marked as done

import type { Course, CourseChecklistStepInstance, ChecklistStep, StatusDefinitionLogic } from './state'
import { getStatusDefinitionLogic } from './checklist-status-definitions'

export interface EvaluationResult {
  shouldMarkDone: boolean
  reason?: string
  percentage?: number
  details?: Record<string, any>
}

export class ChecklistStatusEvaluator {
  /**
   * Evaluate if a step should be marked as done based on its status definition logic
   */
  static async evaluateStep(
    step: CourseChecklistStepInstance,
    course: Course,
    templateStep?: ChecklistStep
  ): Promise<EvaluationResult> {
    // Skip if already done
    if (step.status === 'done') {
      return { shouldMarkDone: false, reason: 'Step already marked as done' }
    }
    
    // Skip if manually overridden (manual override takes precedence)
    if (step.manualMarkDoneBy) {
      return { shouldMarkDone: false, reason: 'Step was manually marked as done' }
    }
    
    // Get structured status definition logic
    const logic = this.getStructuredLogic(step, templateStep)
    
    if (!logic) {
      return { shouldMarkDone: false, reason: 'No status definition logic found' }
    }
    
    // Evaluate based on logic type
    switch (logic.type) {
      case 'manual_confirm':
        return this.evaluateManualConfirm(logic)
        
      case 'field_check':
        return this.evaluateFieldCheck(logic, course)
        
      case 'course_status_change':
        return this.evaluateStatusChange(logic, course)
        
      case 'percentage_calculation':
        return this.evaluatePercentage(logic, course)
        
      case 'action_tracked':
        // Action tracked steps are handled by action button clicks
        // This evaluation is for re-checking after data changes
        return { shouldMarkDone: false, reason: 'Action tracked steps require user action' }
        
      case 'api_integration':
        // API integration steps are handled by API callbacks
        return { shouldMarkDone: false, reason: 'API integration steps require API callback' }
        
      default:
        return { shouldMarkDone: false, reason: 'Unknown status definition type' }
    }
  }
  
  /**
   * Get structured status definition logic for a step
   */
  private static getStructuredLogic(
    step: CourseChecklistStepInstance,
    templateStep?: ChecklistStep
  ): StatusDefinitionLogic | null {
    // Try to get from template step's structured logic
    if (templateStep?.structuredStatusLogic) {
      return templateStep.structuredStatusLogic
    }
    
    // Try to get from mapping table using step name
    return getStatusDefinitionLogic(step.name, templateStep?.statusDefinitionLogic)
  }
  
  /**
   * Evaluate manual confirm type (always returns false - requires manual action)
   */
  private static evaluateManualConfirm(logic: StatusDefinitionLogic): EvaluationResult {
    return {
      shouldMarkDone: false,
      reason: 'Manual confirmation required'
    }
  }
  
  /**
   * Evaluate field check type
   */
  private static evaluateFieldCheck(
    logic: StatusDefinitionLogic,
    course: Course
  ): EvaluationResult {
    if (!logic.fieldCheck) {
      return { shouldMarkDone: false, reason: 'Field check configuration missing' }
    }
    
    const fieldValue = this.getNestedField(course, logic.fieldCheck.fieldPath)
    
    switch (logic.fieldCheck.condition) {
      case 'not_empty':
        const isNotEmpty = fieldValue !== null && 
                          fieldValue !== undefined && 
                          fieldValue !== '' &&
                          (Array.isArray(fieldValue) ? fieldValue.length > 0 : true)
        return {
          shouldMarkDone: isNotEmpty,
          reason: isNotEmpty 
            ? `Field "${logic.fieldCheck.fieldPath}" contains value: ${fieldValue}` 
            : `Field "${logic.fieldCheck.fieldPath}" is empty`,
          details: { fieldValue }
        }
        
      case 'equals':
        const isEqual = fieldValue === logic.fieldCheck.value
        return {
          shouldMarkDone: isEqual,
          reason: isEqual
            ? `Field "${logic.fieldCheck.fieldPath}" equals "${logic.fieldCheck.value}"`
            : `Field "${logic.fieldCheck.fieldPath}" (${fieldValue}) does not equal "${logic.fieldCheck.value}"`,
          details: { fieldValue, expectedValue: logic.fieldCheck.value }
        }
        
      case 'greater_than':
        const isGreater = Number(fieldValue) > Number(logic.fieldCheck.value)
        return {
          shouldMarkDone: isGreater,
          reason: isGreater
            ? `Field "${logic.fieldCheck.fieldPath}" (${fieldValue}) is greater than ${logic.fieldCheck.value}`
            : `Field "${logic.fieldCheck.fieldPath}" (${fieldValue}) is not greater than ${logic.fieldCheck.value}`,
          details: { fieldValue, threshold: logic.fieldCheck.value }
        }
        
      case 'less_than':
        const isLess = Number(fieldValue) < Number(logic.fieldCheck.value)
        return {
          shouldMarkDone: isLess,
          reason: isLess
            ? `Field "${logic.fieldCheck.fieldPath}" (${fieldValue}) is less than ${logic.fieldCheck.value}`
            : `Field "${logic.fieldCheck.fieldPath}" (${fieldValue}) is not less than ${logic.fieldCheck.value}`,
          details: { fieldValue, threshold: logic.fieldCheck.value }
        }
        
      default:
        return { shouldMarkDone: false, reason: 'Unknown field check condition' }
    }
  }
  
  /**
   * Evaluate course status change type
   */
  private static evaluateStatusChange(
    logic: StatusDefinitionLogic,
    course: Course
  ): EvaluationResult {
    if (!logic.statusChange) {
      return { shouldMarkDone: false, reason: 'Status change configuration missing' }
    }
    
    const currentStatus = course.status
    const targetStatus = logic.statusChange.targetStatus
    const isMatch = currentStatus === targetStatus || 
                   currentStatus.toLowerCase() === targetStatus.toLowerCase()
    
    return {
      shouldMarkDone: isMatch,
      reason: isMatch
        ? `Course status changed to "${targetStatus}"`
        : `Course status is "${currentStatus}", target is "${targetStatus}"`,
      details: { currentStatus, targetStatus }
    }
  }
  
  /**
   * Evaluate percentage calculation type
   */
  private static evaluatePercentage(
    logic: StatusDefinitionLogic,
    course: Course
  ): EvaluationResult {
    if (!logic.percentageCalculation) {
      return { shouldMarkDone: false, reason: 'Percentage calculation configuration missing' }
    }
    
    // Evaluate numerator and denominator expressions
    const numerator = this.evaluateExpression(logic.percentageCalculation.numerator, course)
    const denominator = this.evaluateExpression(logic.percentageCalculation.denominator, course) || 50
    
    if (denominator === 0) {
      return {
        shouldMarkDone: false,
        reason: 'Denominator is zero, cannot calculate percentage',
        details: { numerator, denominator }
      }
    }
    
    const percentage = (numerator / denominator) * 100
    const threshold = logic.percentageCalculation.threshold ?? 0
    const shouldMarkDone = percentage >= threshold
    
    return {
      shouldMarkDone,
      percentage,
      reason: shouldMarkDone
        ? `Percentage calculated: ${percentage.toFixed(1)}% (${numerator}/${denominator})`
        : `Percentage calculated: ${percentage.toFixed(1)}% (${numerator}/${denominator}), threshold: ${threshold}%`,
      details: { numerator, denominator, percentage, threshold }
    }
  }
  
  /**
   * Get nested field value from object using dot notation path
   */
  private static getNestedField(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      if (current === null || current === undefined) return undefined
      return current[prop]
    }, obj)
  }
  
  /**
   * Evaluate expression string against course data
   * Supports simple expressions like 'participantIds.length'
   */
  private static evaluateExpression(expr: string, course: Course): number {
    // Remove whitespace
    expr = expr.trim()
    
    // Handle participantIds.length
    if (expr === 'participantIds.length' || expr === 'participantIds?.length') {
      return course.participantIds?.length || 0
    }
    
    // Handle participantsWithAttendance.length (placeholder - would need actual attendance data)
    if (expr === 'participantsWithAttendance.length' || expr === 'participantsWithAttendance?.length') {
      // For now, return participantIds.length as placeholder
      // In production, this would query actual attendance data
      return course.participantIds?.length || 0
    }
    
    // Handle numeric literals
    const numericMatch = expr.match(/^(\d+)$/)
    if (numericMatch) {
      return parseInt(numericMatch[1], 10)
    }
    
    // Handle expressions with || operator (e.g., 'program.maxParticipants || 50')
    if (expr.includes('||')) {
      const parts = expr.split('||').map(p => p.trim())
      for (const part of parts) {
        const value = this.evaluateExpression(part, course)
        if (value !== 0 && value !== null && value !== undefined) {
          return value
        }
      }
      return 0
    }
    
    // Default: try to get as field path
    const fieldValue = this.getNestedField(course, expr)
    if (typeof fieldValue === 'number') {
      return fieldValue
    }
    
    // If array, return length
    if (Array.isArray(fieldValue)) {
      return fieldValue.length
    }
    
    return 0
  }
}

