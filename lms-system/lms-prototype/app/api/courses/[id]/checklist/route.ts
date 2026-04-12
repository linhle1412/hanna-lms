import { NextRequest, NextResponse } from 'next/server'
import type { CourseChecklistInstance, CourseChecklistStepInstance, Course } from '@/lib/state'
import { getDefaultTemplate } from '@/lib/templates-service'
import { readJsonFile } from '@/lib/file-utils'
import { ChecklistAutoUpdater } from '@/lib/checklist-auto-updater'

// In-memory storage (replace with database in production)
const courseChecklists: Map<number, CourseChecklistInstance> = new Map()

// GET: Get checklist for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Check if checklist exists
    let checklist = courseChecklists.get(courseId)

    // If not exists, create from template
    if (!checklist) {
      // Get course to determine course type
      const courses = await readJsonFile<Course>('courses.json')
      const course = courses.find(c => c.id === courseId)
      
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      // Get template
      const templateId = course.checklistTemplateId || course.courseType
      const template = getDefaultTemplate(templateId || course.courseType || 'SHINE')

      if (!template) {
        return NextResponse.json({ error: 'No template found for course type' }, { status: 404 })
      }

      // Create checklist instance from template
      const steps: CourseChecklistStepInstance[] = template.steps
        .filter(step => step.isActive)
        .map(step => ({
          stepId: step.id,
          name: step.name,
          description: step.description,
          order: step.order,
          pic: step.pic,
          actionType: step.actionType,
          status: 'not_started' as const,
          reminderTiming: step.reminderTiming,
          additionalEmails: step.additionalEmails,
          reminderRecipients: step.reminderRecipients
        }))
        .sort((a, b) => a.order - b.order)

      checklist = {
        id: `checklist-${courseId}-${Date.now()}`,
        courseId,
        templateId: template.id,
        templateName: template.name,
        steps,
        customActions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      courseChecklists.set(courseId, checklist)
    }

    // Include custom actions in response
    const response = {
      ...checklist,
      steps: [...checklist.steps, ...(checklist.customActions || [])].sort((a, b) => a.order - b.order)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching course checklist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update checklist step status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const body = await request.json()
    const { 
      stepId, 
      status, 
      notes, 
      completedBy,
      manualMarkDoneReason,
      autoDetectedAt,
      autoDetectionReason,
      lastEvaluatedAt
    } = body

    if (!stepId || !status) {
      return NextResponse.json({ error: 'stepId and status are required' }, { status: 400 })
    }

    // Get or create checklist
    let checklist = courseChecklists.get(courseId)
    if (!checklist) {
      // Initialize checklist if it doesn't exist
      // Get course to determine course type
      const courses = await readJsonFile<Course>('courses.json')
      const course = courses.find(c => c.id === courseId)
      
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      // Get template
      const templateId = course.checklistTemplateId || course.courseType
      const template = getDefaultTemplate(templateId || course.courseType || 'SHINE')

      if (!template) {
        return NextResponse.json({ error: 'No template found for course type' }, { status: 404 })
      }

      // Create checklist instance from template
      const steps: CourseChecklistStepInstance[] = template.steps
        .filter(step => step.isActive)
        .map(step => ({
          stepId: step.id,
          name: step.name,
          description: step.description,
          order: step.order,
          pic: step.pic,
          actionType: step.actionType,
          status: 'not_started' as const,
          reminderTiming: step.reminderTiming,
          additionalEmails: step.additionalEmails,
          reminderRecipients: step.reminderRecipients
        }))
        .sort((a, b) => a.order - b.order)

      checklist = {
        id: `checklist-${courseId}-${Date.now()}`,
        courseId,
        templateId: template.id,
        templateName: template.name,
        steps,
        customActions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      courseChecklists.set(courseId, checklist)
    }

    // Check if this is a custom action (stepId > 10000) or regular step
    let step: CourseChecklistStepInstance | undefined
    if (stepId > 10000) {
      // Custom action
      step = checklist.customActions?.find(s => s.stepId === stepId)
    } else {
      // Regular step
      step = checklist.steps.find(s => s.stepId === stepId)
    }

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    step.status = status
    if (status === 'done') {
      step.completedAt = new Date().toISOString()
      step.completedBy = completedBy || 'System'
      // Store manual mark done reason if provided
      if (manualMarkDoneReason) {
        step.manualMarkDoneReason = manualMarkDoneReason
        step.manualMarkDoneBy = completedBy || 'System'
      }
      // Store auto-detection information if provided
      if (autoDetectedAt) {
        step.autoDetectedAt = autoDetectedAt
      }
      if (autoDetectionReason) {
        step.autoDetectionReason = autoDetectionReason
      }
    }
    if (notes !== undefined) {
      step.notes = notes
    }
    // Update last evaluated timestamp
    if (lastEvaluatedAt !== undefined) {
      step.lastEvaluatedAt = lastEvaluatedAt
    }

    checklist.updatedAt = new Date().toISOString()
    checklist.updatedBy = completedBy

    courseChecklists.set(courseId, checklist)

    // Include custom actions in response
    const response = {
      ...checklist,
      steps: [...checklist.steps, ...(checklist.customActions || [])].sort((a, b) => a.order - b.order)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating course checklist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Add custom action to checklist OR evaluate checklist steps
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Handle custom action addition
    const body = await request.json()
    const { name, description, pic, reminderTiming, reminderRecipients } = body

    if (!name || !pic) {
      return NextResponse.json({ error: 'name and pic are required' }, { status: 400 })
    }

    // Get or create checklist
    let checklist = courseChecklists.get(courseId)
    if (!checklist) {
      // Initialize checklist if it doesn't exist
      const courses = await readJsonFile<Course>('courses.json')
      const course = courses.find(c => c.id === courseId)
      
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      const templateId = course.checklistTemplateId || course.courseType
      const template = getDefaultTemplate(templateId || course.courseType || 'SHINE')

      if (!template) {
        return NextResponse.json({ error: 'No template found for course type' }, { status: 404 })
      }

      const steps: CourseChecklistStepInstance[] = template.steps
        .filter(step => step.isActive)
        .map(step => ({
          stepId: step.id,
          name: step.name,
          description: step.description,
          order: step.order,
          pic: step.pic,
          actionType: step.actionType,
          status: 'not_started' as const,
          reminderTiming: step.reminderTiming,
          additionalEmails: step.additionalEmails
        }))
        .sort((a, b) => a.order - b.order)

      checklist = {
        id: `checklist-${courseId}-${Date.now()}`,
        courseId,
        templateId: template.id,
        templateName: template.name,
        steps,
        customActions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      courseChecklists.set(courseId, checklist)
    }

    // Initialize customActions if not exists
    if (!checklist.customActions) {
      checklist.customActions = []
    }

    // Generate unique stepId for custom action (use timestamp-based ID > 10000)
    const customStepId = 10000 + Date.now()
    const maxOrder = Math.max(
      ...checklist.steps.map(s => s.order),
      ...(checklist.customActions || []).map(s => s.order),
      0
    )

    const customAction: CourseChecklistStepInstance = {
      stepId: customStepId,
      name,
      description,
      order: maxOrder + 1,
      pic,
      actionType: 'none',
      status: 'not_started',
      reminderTiming,
      reminderRecipients,
      isCustom: true
    }

    checklist.customActions.push(customAction)
    checklist.updatedAt = new Date().toISOString()

    courseChecklists.set(courseId, checklist)

    // Return updated checklist with custom actions merged
    const response = {
      ...checklist,
      steps: [...checklist.steps, ...checklist.customActions].sort((a, b) => a.order - b.order)
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error adding custom action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove custom action from checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const stepId = parseInt(searchParams.get('stepId') || '0')

    if (!stepId || stepId <= 10000) {
      return NextResponse.json({ error: 'Invalid stepId. Only custom actions (stepId > 10000) can be deleted.' }, { status: 400 })
    }

    const checklist = courseChecklists.get(courseId)
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    if (!checklist.customActions) {
      return NextResponse.json({ error: 'Custom action not found' }, { status: 404 })
    }

    const actionIndex = checklist.customActions.findIndex(a => a.stepId === stepId)
    if (actionIndex === -1) {
      return NextResponse.json({ error: 'Custom action not found' }, { status: 404 })
    }

    checklist.customActions.splice(actionIndex, 1)
    checklist.updatedAt = new Date().toISOString()

    courseChecklists.set(courseId, checklist)

    // Return updated checklist
    const response = {
      ...checklist,
      steps: [...checklist.steps, ...checklist.customActions].sort((a, b) => a.order - b.order)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting custom action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

