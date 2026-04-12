// POST /api/courses/[id]/checklist/evaluate - Evaluate checklist steps
import { NextRequest, NextResponse } from 'next/server'
import { ChecklistAutoUpdater } from '@/lib/checklist-auto-updater'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const courseId = parseInt(resolvedParams.id)
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const stepIdParam = searchParams.get('stepId')
    
    if (stepIdParam) {
      // Evaluate single step
      const stepId = parseInt(stepIdParam)
      if (isNaN(stepId)) {
        return NextResponse.json({ error: 'Invalid stepId' }, { status: 400 })
      }
      
      const result = await ChecklistAutoUpdater.evaluateStep(courseId, stepId)
      return NextResponse.json(result)
    } else {
      // Evaluate all steps and trigger auto-update
      const results = await ChecklistAutoUpdater.evaluateAllSteps(courseId)
      await ChecklistAutoUpdater.checkAndUpdateSteps(courseId)
      return NextResponse.json(results)
    }
  } catch (error) {
    console.error('Error evaluating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate checklist' },
      { status: 500 }
    )
  }
}

