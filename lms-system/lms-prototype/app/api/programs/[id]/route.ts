import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/json-handler'
import type { Program } from '@/lib/state'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programs = await readJsonFile('programs.json') as Program[]
    const program = programs.find(p => p.id === parseInt(params.id))

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Failed to read program:', error)
    return NextResponse.json({ error: 'Failed to load program' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programs = await readJsonFile('programs.json') as Program[]
    const programIndex = programs.findIndex(p => p.id === parseInt(params.id))

    if (programIndex === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const updates = await request.json()
    programs[programIndex] = {
      ...programs[programIndex],
      ...updates,
      updatedDate: new Date().toISOString()
    }

    await writeJsonFile('programs.json', programs)

    return NextResponse.json(programs[programIndex])
  } catch (error) {
    console.error('Failed to update program:', error)
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programs = await readJsonFile('programs.json') as Program[]
    const programIndex = programs.findIndex(p => p.id === parseInt(params.id))

    if (programIndex === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Soft delete - just update status
    programs[programIndex].status = 'INACTIVE'
    programs[programIndex].updatedDate = new Date().toISOString()

    await writeJsonFile('programs.json', programs)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete program:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}




