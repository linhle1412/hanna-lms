import { NextRequest, NextResponse } from 'next/server'
import type { ChecklistTemplate, ChecklistStep } from '@/lib/state'

// In-memory storage (replace with database in production)
let templates: ChecklistTemplate[] = [
  {
    id: 'shine-default',
    name: 'Default SHINE Template',
    description: 'Standard checklist template for SHINE courses',
    courseType: 'SHINE',
    isDefault: true,
    isActive: true,
    steps: [
      {
        id: 1,
        name: 'Verify AOL information',
        order: 1,
        pic: 'Course Supporters',
        reminderTiming: { type: 'daily', start: 'course_creation' },
        actionType: 'confirm',
        statusDefinitionLogic: 'Step is marked done when PIC confirms the step is completed',
        isActive: true
      },
      {
        id: 2,
        name: 'Verify MOF information',
        order: 2,
        pic: 'Course Supporters',
        reminderTiming: { type: 'daily', start: 'course_creation' },
        actionType: 'confirm',
        statusDefinitionLogic: 'Step is marked done when PIC confirms the step is completed',
        isActive: true
      },
      {
        id: 3,
        name: 'Enter MOF exam code',
        order: 3,
        pic: 'Course Supporters',
        reminderTiming: { type: 'daily', start: 'course_creation' },
        actionType: 'enter_data',
        statusDefinitionLogic: 'Step is marked done when MOF exam code field is entered with information',
        isActive: true
      },
      {
        id: 4,
        name: 'Approve course',
        order: 4,
        pic: 'Head Channel, Lead Region',
        reminderTiming: { type: 'daily', daysBefore: 7 },
        actionType: 'approve',
        statusDefinitionLogic: 'Step is marked done when course status changes to "Approved"',
        isActive: true
      },
      {
        id: 5,
        name: 'Add participants',
        order: 5,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Calculate percentage: (Number of added participants / Max participants allowed in program) × 100%',
        isActive: true
      },
      {
        id: 6,
        name: 'Export Participants for MOF exam',
        order: 6,
        pic: 'Course Supporters',
        reminderTiming: { type: 'date_based', daysAfter: 3, start: 'course_end' },
        actionType: 'export',
        statusDefinitionLogic: 'Step is marked done when user clicks "Export participant for MOF exam" button',
        isActive: true
      },
      {
        id: 7,
        name: 'Update AOL exam result',
        order: 7,
        pic: 'Course Supporters',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Step is marked done when AOL exam results are received and updated for all participants in the course',
        isActive: true
      },
      {
        id: 8,
        name: 'Update attendance result',
        order: 8,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Count and calculate percentage of participants who have attendance data recorded',
        isActive: true
      },
      {
        id: 9,
        name: 'Import MOF result',
        order: 9,
        pic: 'Course Supporters',
        reminderTiming: { type: 'none' },
        actionType: 'import',
        statusDefinitionLogic: 'Step is marked done when user successfully imports MOF exam results',
        isActive: true
      },
      {
        id: 10,
        name: 'Confirm passed participants',
        order: 10,
        pic: 'AA Admin',
        reminderTiming: { type: 'date_based', daysAfter: 1, start: 'course_end' },
        additionalEmails: ['example@randomemail.com'],
        actionType: 'confirm',
        statusDefinitionLogic: 'Step is marked done when user successfully confirms passed participants',
        isActive: true
      },
      {
        id: 11,
        name: 'Export participant for granting agent/license code',
        order: 11,
        pic: 'AA Admin',
        reminderTiming: { type: 'none' },
        actionType: 'export',
        statusDefinitionLogic: 'Step is marked done when user exports passed participants for code assignment',
        isActive: true
      },
      {
        id: 12,
        name: 'Grant agent code',
        order: 12,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Step is marked done when agent codes are received and assigned to all passed participants',
        isActive: true
      },
      {
        id: 13,
        name: 'Grant license code',
        order: 13,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Step is marked done when API receives and updates license codes for participants',
        isActive: true
      },
      {
        id: 14,
        name: 'Finish course',
        order: 14,
        pic: 'System or Admin',
        reminderTiming: { type: 'none' },
        actionType: 'finish',
        statusDefinitionLogic: 'Step is marked done when course status is set to "Finished"',
        isActive: true
      }
    ],
    createdBy: 'System',
    createdDate: new Date().toISOString()
  }
]

// GET /api/templates - Get all templates or filter by courseType
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courseType = searchParams.get('courseType')
    const id = searchParams.get('id')

    if (id) {
      const template = templates.find(t => t.id === id)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json(template)
    }

    let filteredTemplates = [...templates]

    if (courseType) {
      const normalizedType = courseType.charAt(0).toUpperCase() + courseType.slice(1).toLowerCase()
      filteredTemplates = filteredTemplates.filter(t => t.courseType === normalizedType)
    }

    return NextResponse.json(filteredTemplates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, courseType, steps, isDefault = false, isActive = true } = body

    if (!name || !courseType || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, courseType, steps' },
        { status: 400 }
      )
    }

    // Check for duplicate name within same course type
    const duplicate = templates.find(
      t => t.name.toLowerCase() === name.toLowerCase() && t.courseType === courseType
    )
    if (duplicate) {
      return NextResponse.json(
        { error: 'Template name must be unique within course type' },
        { status: 400 }
      )
    }

    const newTemplate: ChecklistTemplate = {
      id: `${courseType.toLowerCase()}-${Date.now()}`,
      name,
      description,
      courseType,
      steps: steps.map((step: any, index: number) => ({
        ...step,
        id: step.id || index + 1,
        order: step.order || index + 1,
        isActive: step.isActive !== undefined ? step.isActive : true
      })),
      isDefault: isDefault && !templates.some(t => t.courseType === courseType && t.isDefault),
      isActive,
      createdBy: 'Current User', // Replace with actual user from session
      createdDate: new Date().toISOString()
    }

    templates.push(newTemplate)
    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

// PUT /api/templates - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const templateIndex = templates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templates[templateIndex]

    // For system templates (isDefault), only allow updating configurable fields
    if (template.isDefault) {
      // Only allow updating: PIC, reminderTiming, reminderRecipients, additionalEmails
      // Prevent changes to: name, description, courseType, steps (name, order, actionType, statusDefinitionLogic), isDefault, isActive
      
      // Check if trying to modify non-configurable fields
      const nonConfigurableFields = ['name', 'description', 'courseType', 'isDefault', 'isActive']
      for (const field of nonConfigurableFields) {
        if (updates[field] !== undefined && updates[field] !== template[field as keyof ChecklistTemplate]) {
          return NextResponse.json(
            { error: `Cannot modify ${field} for system templates. Only PIC, Reminder Timing, and Reminder Recipients can be configured.` },
            { status: 403 }
          )
        }
      }

      // If steps are being updated, only allow updating configurable fields within steps
      if (updates.steps && Array.isArray(updates.steps)) {
        // Validate that step structure matches (same IDs, names, orders, actionTypes, statusDefinitionLogic)
        if (updates.steps.length !== template.steps.length) {
          return NextResponse.json(
            { error: 'Cannot add or remove steps from system templates' },
            { status: 403 }
          )
        }

        // Check each step - only allow updating PIC, reminderTiming, reminderRecipients, additionalEmails
        for (let i = 0; i < updates.steps.length; i++) {
          const updatedStep = updates.steps[i]
          const originalStep = template.steps.find(s => s.id === updatedStep.id)
          
          if (!originalStep) {
            return NextResponse.json(
              { error: `Step with ID ${updatedStep.id} not found in system template` },
              { status: 400 }
            )
          }

          // Check if non-configurable fields are being changed
          if (updatedStep.name !== originalStep.name ||
              updatedStep.order !== originalStep.order ||
              updatedStep.actionType !== originalStep.actionType ||
              updatedStep.statusDefinitionLogic !== originalStep.statusDefinitionLogic ||
              updatedStep.isActive !== originalStep.isActive) {
            return NextResponse.json(
              { error: `Cannot modify step name, order, action type, status definition logic, or active status for system templates. Only PIC, Reminder Timing, and Reminder Recipients can be configured.` },
              { status: 403 }
            )
          }
        }
      }
    } else {
      // For non-system templates, check for duplicate name if name is being changed
      if (updates.name && updates.name !== template.name) {
        const duplicate = templates.find(
          t => t.id !== id && t.name.toLowerCase() === updates.name.toLowerCase() && t.courseType === (updates.courseType || template.courseType)
        )
        if (duplicate) {
          return NextResponse.json(
            { error: 'Template name must be unique within course type' },
            { status: 400 }
          )
        }
      }
    }

    // Prevent editing default template status
    if (template.isDefault && updates.isDefault === false) {
      return NextResponse.json(
        { error: 'Cannot modify default template status' },
        { status: 403 }
      )
    }

    const updatedTemplate: ChecklistTemplate = {
      ...template,
      ...updates,
      id: template.id, // Prevent ID changes
      isDefault: template.isDefault, // Prevent default status changes
      updatedBy: 'Current User', // Replace with actual user from session
      updatedDate: new Date().toISOString()
    }

    templates[templateIndex] = updatedTemplate
    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/templates?id=xxx - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const templateIndex = templates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templates[templateIndex]

    // Prevent deleting default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default template' },
        { status: 403 }
      )
    }

    templates.splice(templateIndex, 1)
    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
