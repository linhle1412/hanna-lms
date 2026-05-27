import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { reason } = body
    const courseId = parseInt(params.id)

    const dataPath = path.join(process.cwd(), 'data', 'courses.json')
    const fileContent = await fs.readFile(dataPath, 'utf-8')
    const courses = JSON.parse(fileContent)

    const courseIndex = courses.findIndex((c: any) => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    const course = courses[courseIndex]

    // Check if course can be cancelled
    const allowedStatuses = ['REGISTERED', 'APPROVED', 'IN_PROGRESS']
    if (!allowedStatuses.includes(course.status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel course with status ${course.status}`
      }, { status: 400 })
    }

    // Store original status for cancellation history
    const previousStatus = course.status

    // Update course status to WAITING_APPROVAL_CANCEL
    course.status = 'WAITING_APPROVAL_CANCEL'
    course.cancellationReason = reason
    course.cancellationRequestDate = new Date().toISOString()

    // Add status history entry
    if (!course.statusHistory) {
      course.statusHistory = []
    }

    course.statusHistory.push({
      status: 'WAITING_APPROVAL_CANCEL',
      timestamp: new Date().toISOString(),
      note: `Cancellation requested: ${reason}`,
      previousStatus: previousStatus
    })

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
    console.error('Error requesting cancellation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to request cancellation'
    }, { status: 500 })
  }
}
