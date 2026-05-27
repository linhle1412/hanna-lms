import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, approverNote } = body
    const courseId = parseInt(params.id)

    const dataPath = path.join(process.cwd(), 'data', 'courses.json')
    const fileContent = await fs.readFile(dataPath, 'utf-8')
    const courses = JSON.parse(fileContent)

    const courseIndex = courses.findIndex((c: any) => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    const course = courses[courseIndex]

    // Verify course is in WAITING_APPROVAL_CANCEL status
    if (course.status !== 'WAITING_APPROVAL_CANCEL') {
      return NextResponse.json({
        success: false,
        error: 'Course is not waiting for cancellation approval'
      }, { status: 400 })
    }

    // Get previous status from history
    const lastNonCancelStatus = course.statusHistory?.find((h: any) => 
      h.status === 'WAITING_APPROVAL_CANCEL'
    )?.previousStatus || 'APPROVED'

    if (action === 'approve') {
      // Approve cancellation - change status to CANCEL
      course.status = 'CANCEL'
      course.cancelledDate = new Date().toISOString()
      course.cancellationApproverNote = approverNote

      // Add status history entry
      if (!course.statusHistory) {
        course.statusHistory = []
      }

      course.statusHistory.push({
        status: 'CANCEL',
        timestamp: new Date().toISOString(),
        note: approverNote ? `Cancellation approved: ${approverNote}` : 'Cancellation approved',
        approvedBy: 'Current User'
      })
    } else if (action === 'reject') {
      // Reject cancellation - revert to previous status
      course.status = lastNonCancelStatus
      course.cancellationRejectionNote = approverNote

      // Add status history entry
      if (!course.statusHistory) {
        course.statusHistory = []
      }

      course.statusHistory.push({
        status: lastNonCancelStatus,
        timestamp: new Date().toISOString(),
        note: approverNote ? `Cancellation rejected: ${approverNote}` : 'Cancellation rejected',
        rejectedBy: 'Current User'
      })

      // Clear cancellation data
      delete course.cancellationReason
      delete course.cancellationRequestDate
    }

    // Save updated courses
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2))

    // Also update public data for consistency
    try {
      const publicPath = path.join(process.cwd(), 'public', 'data', 'courses.json')
      await fs.writeFile(publicPath, JSON.stringify(courses, null, 2))
    } catch (error) {
      console.error('Error updating public courses:', error)
    }

    return NextResponse.json({
      success: true,
      course
    })
  } catch (error) {
    console.error('Error processing cancellation approval:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process cancellation approval'
    }, { status: 500 })
  }
}
