import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Course } from '@/lib/state'

// PATCH /api/courses/[id]/approve-registration - Approve or reject course registration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { action, reason, userRole, userName } = body

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Validate rejection reason
    if (action === 'reject') {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { error: 'Rejection reason is required and must be at least 10 characters' },
          { status: 400 }
        )
      }
      if (reason.length > 500) {
        return NextResponse.json(
          { error: 'Rejection reason must not exceed 500 characters' },
          { status: 400 }
        )
      }
    }

    const courses = await readJsonFile<Course>('courses.json')
    const courseIndex = courses.findIndex(c => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const course = courses[courseIndex]

    // Validate course status
    if (course.status !== 'REGISTERED') {
      return NextResponse.json(
        { error: `Cannot ${action} registration. Course status must be REGISTERED (current: ${course.status})` },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()
    const performedBy = `${userName || 'System'} (${userRole || 'Unknown'})`

    if (action === 'approve') {
      // Approve registration: REGISTERED → APPROVED
      course.status = 'APPROVED'

      // Add to status history
      if (!course.statusHistory) {
        course.statusHistory = []
      }
      course.statusHistory.push({
        status: 'APPROVED',
        timestamp,
        performedBy,
        action: 'Registration Approved',
        reason: 'Course registration approved',
        previousStatus: 'REGISTERED',
        isAutomatic: false,
      })

    } else if (action === 'reject') {
      // Reject registration: REGISTERED → NEW
      course.status = 'NEW'

      // Clear trainer assignments
      course.trainer = ''
      course.primaryTrainer = ''

      // Add to status history
      if (!course.statusHistory) {
        course.statusHistory = []
      }
      course.statusHistory.push({
        status: 'NEW',
        timestamp,
        performedBy,
        action: 'Registration Rejected',
        reason: reason || 'Registration rejected',
        previousStatus: 'REGISTERED',
        isAutomatic: false,
      })
    }

    // Update the course
    courses[courseIndex] = course
    await writeJsonFile('courses.json', courses)

    return NextResponse.json({
      success: true,
      course,
      message: action === 'approve' 
        ? 'Course registration approved successfully' 
        : 'Course registration rejected successfully'
    })

  } catch (error) {
    console.error('Error processing registration approval:', error)
    return NextResponse.json(
      { error: 'Failed to process registration approval' },
      { status: 500 }
    )
  }
}

