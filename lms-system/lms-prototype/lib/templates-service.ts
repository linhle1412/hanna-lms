// Shared templates service for server-side and client-side access
import type { ChecklistTemplate } from './state'

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
        statusDefinitionLogic: 'Step is marked done when user clicks "Import MOF result" button and successfully imports MOF exam results',
        isActive: true
      },
      {
        id: 10,
        name: 'Confirm passed participants',
        order: 10,
        pic: 'Course Supporters',
        reminderTiming: { type: 'none' },
        actionType: 'confirm',
        statusDefinitionLogic: 'Step is marked done when user clicks "Confirm passed participants" button',
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
    ]
  },
  {
    id: 'product-default',
    name: 'Default Product Template',
    description: 'Standard checklist template for Product courses',
    courseType: 'Product',
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
        name: 'Approve course',
        order: 2,
        pic: 'Head Channel, Lead Region',
        reminderTiming: { type: 'daily', daysBefore: 7 },
        actionType: 'approve',
        statusDefinitionLogic: 'Step is marked done when course status changes to "Approved"',
        isActive: true
      },
      {
        id: 3,
        name: 'Add participants',
        order: 3,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Calculate percentage: (Number of added participants / Max participants allowed in program) × 100%',
        isActive: true
      },
      {
        id: 4,
        name: 'Update AOL exam result',
        order: 4,
        pic: 'Course Supporters',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Step is marked done when AOL exam results are received and updated for all participants',
        isActive: true
      },
      {
        id: 5,
        name: 'Update attendance result',
        order: 5,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Count and calculate percentage of participants who have attendance data recorded',
        isActive: true
      },
      {
        id: 6,
        name: 'Confirm passed participants',
        order: 6,
        pic: 'Course Supporters',
        reminderTiming: { type: 'none' },
        actionType: 'confirm',
        statusDefinitionLogic: 'Step is marked done when user clicks "Confirm passed participants" button',
        isActive: true
      },
      {
        id: 7,
        name: 'Export participant for granting license code',
        order: 7,
        pic: 'AA Admin',
        reminderTiming: { type: 'none' },
        actionType: 'export',
        statusDefinitionLogic: 'Step is marked done when user exports passed participants for code assignment',
        isActive: true
      },
      {
        id: 8,
        name: 'Grant license code',
        order: 8,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Step is marked done when API receives and updates license codes for participants',
        isActive: true
      },
      {
        id: 9,
        name: 'Finish course',
        order: 9,
        pic: 'System or Admin',
        reminderTiming: { type: 'none' },
        actionType: 'finish',
        statusDefinitionLogic: 'Step is marked done when course status is set to "Finished"',
        isActive: true
      }
    ]
  },
  {
    id: 'skill-default',
    name: 'Default Skill Template',
    description: 'Standard checklist template for Skill courses',
    courseType: 'Skill',
    isDefault: true,
    isActive: true,
    steps: [
      {
        id: 1,
        name: 'Approve course',
        order: 1,
        pic: 'Head Channel, Lead Region',
        reminderTiming: { type: 'daily', daysBefore: 7 },
        actionType: 'approve',
        statusDefinitionLogic: 'Step is marked done when course status changes to "Approved"',
        isActive: true
      },
      {
        id: 2,
        name: 'Add participants',
        order: 2,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Calculate percentage: (Number of added participants / Max participants allowed in program) × 100%',
        isActive: true
      },
      {
        id: 3,
        name: 'Update attendance result',
        order: 3,
        pic: 'External API',
        reminderTiming: { type: 'none' },
        actionType: 'none',
        statusDefinitionLogic: 'Count and calculate percentage of participants who have attendance data recorded',
        isActive: true
      },
      {
        id: 4,
        name: 'Finish course',
        order: 4,
        pic: 'System or Admin',
        reminderTiming: { type: 'none' },
        actionType: 'finish',
        statusDefinitionLogic: 'Step is marked done when course status is set to "Finished"',
        isActive: true
      }
    ]
  }
]

export function getTemplates(courseType?: string): ChecklistTemplate[] {
  if (courseType) {
    return templates.filter(t => t.courseType === courseType && t.isActive)
  }
  return templates.filter(t => t.isActive)
}

export function getTemplateById(id: string): ChecklistTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function getDefaultTemplate(courseType: string): ChecklistTemplate | undefined {
  // Case-insensitive matching for courseType
  const normalizedType = courseType?.toUpperCase()
  return templates.find(t => {
    const templateType = t.courseType.toUpperCase()
    return templateType === normalizedType && t.isDefault && t.isActive
  })
}

export function createTemplate(template: ChecklistTemplate): ChecklistTemplate {
  templates.push(template)
  return template
}

export function updateTemplate(id: string, updates: Partial<ChecklistTemplate>): ChecklistTemplate | null {
  const index = templates.findIndex(t => t.id === id)
  if (index === -1) return null
  templates[index] = { ...templates[index], ...updates }
  return templates[index]
}

export function deleteTemplate(id: string): boolean {
  const index = templates.findIndex(t => t.id === id)
  if (index === -1) return false
  templates.splice(index, 1)
  return true
}

