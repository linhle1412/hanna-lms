import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Course } from '@/lib/state'
import { generateUniqueCourseCode } from '@/lib/course-code-generator'

// GET /api/courses - Get all courses with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courses = await readJsonFile<Course>('courses.json')

    // Apply filters
    let filtered = [...courses]

    const channel = searchParams.get('channel')
    const region = searchParams.get('region')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (channel) {
      filtered = filtered.filter(c => c.channel === channel)
    }
    if (region) {
      filtered = filtered.filter(c => c.region === region)
    }
    if (status) {
      filtered = filtered.filter(c => c.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const courses = await readJsonFile<Course>('courses.json')

    // Generate course code if not provided
    let courseCode = body.code
    if (!courseCode && body.province && body.channel && (body.courseType || body.program)) {
      courseCode = generateUniqueCourseCode(
        {
          province: body.province,
          channel: body.channel,
          courseType: body.courseType || body.program || '',
          program: body.program // Pass program for SHINE detection
        },
        courses
      )
    } else if (!courseCode) {
      // Fallback if required fields are missing
      courseCode = `COURSE-${Date.now()}`
    }

    // Get user information from request body (passed from client)
    const userName = body.userName || body.createdBy || 'System'
    const userRole = body.userRole || 'trainer'
    const createdBy = body.createdBy || userName
    
    // Fetch checklist template for the course type
    let checklistTemplateId = undefined
    if (body.courseType) {
      try {
        const templateResponse = await fetch(`${request.nextUrl.origin}/api/templates?courseType=${body.courseType}`)
        if (templateResponse.ok) {
          const template = await templateResponse.json()
          checklistTemplateId = template.templateId
        }
      } catch (error) {
        console.error('Failed to fetch checklist template:', error)
        // Continue without template - not a critical error
      }
    }
    
    // Initialize status history for course creation
    const now = new Date().toISOString()
    const statusHistory = [{
      status: 'NEW',
      timestamp: now,
      performedBy: `${userName} (${userRole})`,
      action: 'Course Created',
      reason: 'Course was created in the system',
      isAutomatic: false
    }]

    const newCourse: Course = {
      id: Date.now(),
      code: courseCode,
      name: body.name || '',
      program: body.program || '',
      trainer: body.trainer || '',
      channel: body.channel || '',
      region: body.region || '',
      status: 'NEW', // Always set to NEW when course is created
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      venue: body.venue || body.location || 'NA',
      section: body.section || 1,
      createdBy: createdBy,
      createdAt: now,
      participantIds: body.participantIds || [],
      statusHistory: statusHistory,
      // Extended fields
      courseType: body.courseType,
      licenseType: body.licenseType,
      partner: body.partner,
      branch: body.branch,
      primaryTrainer: body.primaryTrainer,
      coTrainer: body.coTrainer,
      venueAddress: body.venueAddress,
      area: body.area,
      province: body.province,
      startTimePeriod: body.startTimePeriod,
      endTimePeriod: body.endTimePeriod,
      description: body.description,
      aolStartTime: body.aolStartTime,
      aolEndTime: body.aolEndTime,
      aolExamId: body.aolExamId,
      mofCourseName: body.mofCourseName,
      examType: body.examType,
      mofExamTime: body.mofExamTime,
      isProctorTrainer: body.isProctorTrainer,
      proctorTrainer: body.proctorTrainer,
      proctorName: body.proctorName,
      proctorPhone: body.proctorPhone,
      mofAddress: body.mofAddress,
      mofProvince: body.mofProvince,
      ward: body.ward,
      examCategory: body.examCategory,
      supporter: body.supporter,
      checklistTemplateId: checklistTemplateId,
    }

    courses.push(newCourse)
    await writeJsonFile('courses.json', courses)

    return NextResponse.json(newCourse, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

