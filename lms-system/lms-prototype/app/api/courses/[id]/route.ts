import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Course } from '@/lib/state'
import { ChecklistAutoUpdater } from '@/lib/checklist-auto-updater'

// GET /api/courses/[id] - Get course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15 async params
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const courses = await readJsonFile<Course>('courses.json')
    const course = courses.find(c => c.id === courseId)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch course'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const courses = await readJsonFile<Course>('courses.json')
    const courseId = parseInt(resolvedParams.id)
    const index = courses.findIndex(c => c.id === courseId)

    if (index === -1) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    let existingCourse = courses[index]
    const updates = body.updates || body // Support both formats
    const editReason = body.editReason || ''
    const userRole = body.userRole || 'trainer'
    const userName = body.userName || 'System'
    const requiresApproval = body.requiresApproval || false

    // Initialize status history if not exists
    if (!existingCourse.statusHistory) {
      existingCourse.statusHistory = []
    }

    // Track previous status before update
    const previousStatus = existingCourse.status

    // If edit requires approval and status is APPROVED, transition to WAITING_APPROVAL_EDIT
    if (requiresApproval && existingCourse.status.toUpperCase() === 'APPROVED') {
      // Store pending edits for approval workflow (keep original course data)
      const pendingEdits = {
        ...updates,
        editReason,
        requestedBy: userName,
        requestedAt: new Date().toISOString(),
        userRole
      }

      // Store pending edits in a separate field (for approval/rejection workflow)
      const courseWithPendingEdits = { ...existingCourse }
      ;(courseWithPendingEdits as any).pendingEdits = pendingEdits

      // Update status to WAITING_APPROVAL_EDIT but don't apply edits yet
      // Add status history entry
      if (!courseWithPendingEdits.statusHistory) {
        courseWithPendingEdits.statusHistory = []
      }
      courseWithPendingEdits.statusHistory.push({
        status: 'WAITING_APPROVAL_EDIT',
        timestamp: new Date().toISOString(),
        performedBy: `${userName} (${userRole})`,
        action: 'Edit Request Submitted',
        reason: editReason || 'Course edit pending approval',
        previousStatus: previousStatus,
        isAutomatic: false
      })

      // Don't apply other updates - they'll be applied when approved
      // Only update status
      courses[index] = { ...courseWithPendingEdits, status: 'WAITING_APPROVAL_EDIT' }
      existingCourse = courses[index] // Update reference for statusHistory assignment
    } else {
      // Direct update - no approval required
      // Add status history entry for edit
      if (editReason) {
        existingCourse.statusHistory.push({
          status: existingCourse.status,
          timestamp: new Date().toISOString(),
          performedBy: `${userName} (${userRole})`,
          action: 'Course Edited',
          reason: editReason,
          previousStatus: previousStatus,
          isAutomatic: false
        })
      }

      // Apply all updates directly
      courses[index] = { ...existingCourse, ...updates }
      existingCourse = courses[index] // Update reference after applying updates

      // Update status history if status changed (but not for approval workflow)
      if (updates.status && updates.status !== previousStatus) {
        // Determine the action based on status transition
        let action = 'Status Changed'
        if (previousStatus === 'NEW' && updates.status === 'REGISTERED') {
          action = 'Course Registered'
        } else if (updates.status === 'IN_PROGRESS' && previousStatus === 'APPROVED') {
          action = 'Course Started'
          // Mark as automatic if triggered by start date
        }
        
        if (!existingCourse.statusHistory) {
          existingCourse.statusHistory = []
        }
        existingCourse.statusHistory.push({
          status: updates.status,
          timestamp: new Date().toISOString(),
          performedBy: `${userName} (${userRole})`,
          action: action,
          reason: editReason || undefined,
          previousStatus: previousStatus,
          isAutomatic: updates.status === 'IN_PROGRESS' && previousStatus === 'APPROVED'
        })
      }
    }

    // Ensure statusHistory is saved
    courses[index].statusHistory = existingCourse.statusHistory

    await writeJsonFile('courses.json', courses)

    // Trigger checklist auto-update after course update
    // This will evaluate and update checklist steps based on status definition logic
    ChecklistAutoUpdater.checkAndUpdateSteps(courseId).catch(error => {
      console.error('Error auto-updating checklist after course update:', error)
      // Don't fail the course update if checklist update fails
    })

    return NextResponse.json(courses[index])
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}


// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courses = await readJsonFile<Course>('courses.json')
    const courseId = parseInt(resolvedParams.id)
    const filtered = courses.filter(c => c.id !== courseId)

    if (filtered.length === courses.length) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    await writeJsonFile('courses.json', filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}

