import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Course } from '@/lib/state'

// POST /api/courses/[id]/participants/[participantId] - Add participant to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> | { id: string; participantId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courses = await readJsonFile<Course>('courses.json')
    const courseId = parseInt(resolvedParams.id)
    const participantId = parseInt(resolvedParams.participantId)
    const course = courses.find(c => c.id === courseId)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.participantIds.includes(participantId)) {
      course.participantIds.push(participantId)
      await writeJsonFile('courses.json', courses)
    }

    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/participants/[participantId] - Remove participant from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> | { id: string; participantId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courses = await readJsonFile<Course>('courses.json')
    const courseId = parseInt(resolvedParams.id)
    const participantId = parseInt(resolvedParams.participantId)
    const course = courses.find(c => c.id === courseId)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    course.participantIds = course.participantIds.filter(id => id !== participantId)
    await writeJsonFile('courses.json', courses)

    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
  }
}

