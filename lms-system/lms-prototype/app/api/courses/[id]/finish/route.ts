import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { note } = body
    const courseId = parseInt(params.id)

    const dataPath = path.join(process.cwd(), 'data', 'courses.json')
    const fileContent = await fs.readFile(dataPath, 'utf-8')
    const courses = JSON.parse(fileContent)

    const courseIndex = courses.findIndex((c: any) => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    const course = courses[courseIndex]

    // Check if course can be finished
    if (course.status !== 'IN_PROGRESS' && course.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: `Cannot finish course with status ${course.status}. Course must be IN_PROGRESS or APPROVED.`
      }, { status: 400 })
    }

    const previousStatus = course.status

    // Update course status to FINISHED
    course.status = 'FINISHED'
    course.finishedDate = new Date().toISOString()
    course.finishNote = note

    // Add status history entry
    if (!course.statusHistory) {
      course.statusHistory = []
    }

    course.statusHistory.push({
      status: 'FINISHED',
      timestamp: new Date().toISOString(),
      note: note || 'Course marked as finished',
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
    console.error('Error finishing course:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to finish course'
    }, { status: 500 })
  }
}
