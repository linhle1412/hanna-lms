import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Trainer } from '@/lib/state'

// GET /api/trainers/[id] - Get trainer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const trainers = await readJsonFile<Trainer>('trainers.json')
    const trainer = trainers.find(t => t.id === parseInt(resolvedParams.id))

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    return NextResponse.json(trainer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trainer' }, { status: 500 })
  }
}

// PUT /api/trainers/[id] - Update trainer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const trainers = await readJsonFile<Trainer>('trainers.json')
    const trainerId = parseInt(resolvedParams.id)
    const index = trainers.findIndex(t => t.id === trainerId)

    if (index === -1) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    trainers[index] = { ...trainers[index], ...body }
    await writeJsonFile('trainers.json', trainers)

    return NextResponse.json(trainers[index])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trainer' }, { status: 500 })
  }
}

// DELETE /api/trainers/[id] - Delete trainer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const trainers = await readJsonFile<Trainer>('trainers.json')
    const trainerId = parseInt(resolvedParams.id)
    const filtered = trainers.filter(t => t.id !== trainerId)

    if (filtered.length === trainers.length) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    await writeJsonFile('trainers.json', filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete trainer' }, { status: 500 })
  }
}

