// Checklist Auto-Updater Service
// Monitors course changes and automatically updates checklist step status

import { ChecklistStatusEvaluator, type EvaluationResult } from './checklist-status-evaluator'
import { courseChecklistAPI, courseAPI, templateAPI } from './api'
import type { Course, CourseChecklistInstance, ChecklistTemplate } from './state'

export class ChecklistAutoUpdater {
  /**
   * Check and update checklist steps when course data changes
   * This should be called after any course update operation
   */
  static async checkAndUpdateSteps(courseId: number): Promise<void> {
    try {
      // Load course and checklist data
      const course = await courseAPI.getById(courseId)
      const checklist = await courseChecklistAPI.getByCourseId(courseId)
      
      // Get template to access status definition logic
      let template: ChecklistTemplate | null = null
      try {
        template = await templateAPI.getById(checklist.templateId)
      } catch (error) {
        console.warn(`Template ${checklist.templateId} not found, using step names for evaluation`)
      }
      
      // Evaluate each step
      const updatePromises: Promise<void>[] = []
      
      for (const step of checklist.steps) {
        // Skip if already done (unless we want to re-validate)
        if (step.status === 'done' && !step.manualMarkDoneBy) {
          // Re-evaluate to ensure condition still met (but don't undo if manually marked)
          continue
        }
        
        // Skip if not applicable
        if (step.status === 'not_applicable') {
          continue
        }
        
        // Find corresponding template step
        const templateStep = template?.steps.find(s => s.id === step.stepId)
        
        // Evaluate status
        const evaluation = await ChecklistStatusEvaluator.evaluateStep(
          step,
          course,
          templateStep
        )
        
        if (evaluation.shouldMarkDone) {
          // Auto-mark as done
          updatePromises.push(
            courseChecklistAPI.updateStep(courseId, step.stepId, {
              status: 'done',
              completedBy: 'System',
              notes: evaluation.reason,
              // Store evaluation details
              autoDetectedAt: new Date().toISOString(),
              autoDetectionReason: evaluation.reason,
              lastEvaluatedAt: new Date().toISOString()
            }).catch(error => {
              console.error(`Failed to auto-update step ${step.stepId}:`, error)
            })
          )
        } else {
          // Update last evaluated timestamp even if not marking as done
          updatePromises.push(
            courseChecklistAPI.updateStep(courseId, step.stepId, {
              lastEvaluatedAt: new Date().toISOString()
            }).catch(error => {
              console.error(`Failed to update evaluation timestamp for step ${step.stepId}:`, error)
            })
          )
        }
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises)
      
    } catch (error) {
      console.error('Error auto-updating checklist:', error)
      // Don't throw - this is a background operation
    }
  }
  
  /**
   * Evaluate a specific step (for manual trigger or testing)
   */
  static async evaluateStep(
    courseId: number,
    stepId: number
  ): Promise<EvaluationResult> {
    try {
      const course = await courseAPI.getById(courseId)
      const checklist = await courseChecklistAPI.getByCourseId(courseId)
      
      const step = checklist.steps.find(s => s.stepId === stepId)
      if (!step) {
        throw new Error(`Step ${stepId} not found in checklist`)
      }
      
      // Get template
      let template: ChecklistTemplate | null = null
      try {
        template = await templateAPI.getById(checklist.templateId)
      } catch (error) {
        console.warn(`Template ${checklist.templateId} not found`)
      }
      
      const templateStep = template?.steps.find(s => s.id === stepId)
      
      return await ChecklistStatusEvaluator.evaluateStep(step, course, templateStep)
    } catch (error) {
      console.error('Error evaluating step:', error)
      throw error
    }
  }
  
  /**
   * Evaluate all steps in a checklist (for manual refresh)
   */
  static async evaluateAllSteps(courseId: number): Promise<Record<number, EvaluationResult>> {
    try {
      const course = await courseAPI.getById(courseId)
      const checklist = await courseChecklistAPI.getByCourseId(courseId)
      
      // Get template
      let template: ChecklistTemplate | null = null
      try {
        template = await templateAPI.getById(checklist.templateId)
      } catch (error) {
        console.warn(`Template ${checklist.templateId} not found`)
      }
      
      const results: Record<number, EvaluationResult> = {}
      
      for (const step of checklist.steps) {
        const templateStep = template?.steps.find(s => s.id === step.stepId)
        results[step.stepId] = await ChecklistStatusEvaluator.evaluateStep(
          step,
          course,
          templateStep
        )
      }
      
      return results
    } catch (error) {
      console.error('Error evaluating all steps:', error)
      throw error
    }
  }
}

