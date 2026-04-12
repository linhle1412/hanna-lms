import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Course } from '@/lib/state'

// PATCH /api/courses/[id]/approve-edit - Approve or reject edit request
export async function PATCH(
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

    const course = courses[index]
    const { action, reason, userName = 'System', userRole = 'head_channel' } = body // action: 'approve' | 'reject'

    if (!(course as any).pendingEdits) {
      return NextResponse.json({ error: 'No pending edit request found' }, { status: 400 })
    }

    // Initialize status history if not exists
    if (!course.statusHistory) {
      course.statusHistory = []
    }

    if (action === 'approve') {
      // Apply pending edits
      const pendingEdits = (course as any).pendingEdits
      const updates = { ...pendingEdits }
      delete updates.editReason
      delete updates.requestedBy
      delete updates.requestedAt
      delete updates.userRole

      // Apply all updates except metadata
      Object.keys(updates).forEach(key => {
        if (!['status', 'editReason', 'requestedBy', 'requestedAt', 'userRole'].includes(key)) {
          ;(course as any)[key] = (updates as any)[key]
        }
      })

      // Restore status to APPROVED
      course.status = 'APPROVED'

      // Add status history entry
      course.statusHistory.push({
        status: 'APPROVED',
        timestamp: new Date().toISOString(),
        performedBy: `${userName} (${userRole})`,
        action: 'Edit Approved',
        reason: reason || pendingEdits.editReason || undefined,
        previousStatus: 'WAITING_APPROVAL_EDIT',
        isAutomatic: false
      })

      // Clear pending edits
      delete (course as any).pendingEdits
    } else if (action === 'reject') {
      // Reject edits - reset to original state
      // Restore status to APPROVED
      course.status = 'APPROVED'

      // Add status history entry
      course.statusHistory.push({
        status: 'APPROVED',
        timestamp: new Date().toISOString(),
        performedBy: `${userName} (${userRole})`,
        action: 'Edit Rejected',
        reason: reason || 'Edit request rejected',
        previousStatus: 'WAITING_APPROVAL_EDIT',
        isAutomatic: false
      })

      // Clear pending edits
      delete (course as any).pendingEdits
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }

    courses[index] = course
    await writeJsonFile('courses.json', courses)

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error processing edit approval:', error)
    return NextResponse.json({ error: 'Failed to process edit approval' }, { status: 500 })
  }
}

