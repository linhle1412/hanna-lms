import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/json-handler'
import type { Program } from '@/lib/state'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programs = await readJsonFile('programs.json') as Program[]
    const sourceProgram = programs.find(p => p.id === parseInt(params.id))

    if (!sourceProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const { newName, copyStages, copyFiles, copyTags, setInactive } = await request.json()

    // Generate new ID
    const maxId = programs.length > 0 ? Math.max(...programs.map(p => p.id)) : 0

    // Clone program
    const clonedProgram: Program = {
      ...sourceProgram,
      id: maxId + 1,
      name: newName || `${sourceProgram.name} - Copy`,
      status: setInactive ? 'INACTIVE' : 'ACTIVE',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    }

    programs.push(clonedProgram)
    await writeJsonFile('programs.json', programs)

    return NextResponse.json(clonedProgram, { status: 201 })
  } catch (error) {
    console.error('Failed to clone program:', error)
    return NextResponse.json({ error: 'Failed to clone program' }, { status: 500 })
  }
}




