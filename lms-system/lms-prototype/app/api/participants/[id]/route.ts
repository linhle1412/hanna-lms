import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Participant } from '@/lib/state'

// GET /api/participants/[id] - Get participant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const participants = await readJsonFile<Participant>('participants.json')
    const participant = participants.find(p => p.id === parseInt(resolvedParams.id))

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json(participant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch participant' }, { status: 500 })
  }
}

// PUT /api/participants/[id] - Update participant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const participants = await readJsonFile<Participant>('participants.json')
    const participantId = parseInt(resolvedParams.id)
    const index = participants.findIndex(p => p.id === participantId)

    if (index === -1) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    participants[index] = { ...participants[index], ...body }
    await writeJsonFile('participants.json', participants)

    return NextResponse.json(participants[index])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}

// DELETE /api/participants/[id] - Delete participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const participants = await readJsonFile<Participant>('participants.json')
    const participantId = parseInt(resolvedParams.id)
    const filtered = participants.filter(p => p.id !== participantId)

    if (filtered.length === participants.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    await writeJsonFile('participants.json', filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}

