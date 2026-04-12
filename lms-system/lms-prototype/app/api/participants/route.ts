import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Participant } from '@/lib/state'

// GET /api/participants - Get all participants with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const participants = await readJsonFile<Participant>('participants.json')

    let filtered = [...participants]

    const region = searchParams.get('region')
    const channel = searchParams.get('channel')
    const search = searchParams.get('search')

    if (region) {
      filtered = filtered.filter(p => p.region === region)
    }
    if (channel) {
      filtered = filtered.filter(p => p.channel === channel)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.agentCode.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.phone.includes(search)
      )
    }

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

// POST /api/participants - Create a new participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const participants = await readJsonFile<Participant>('participants.json')

    const newParticipant: Participant = {
      id: Date.now(),
      name: body.name || '',
      agentCode: body.agentCode || '',
      email: body.email || '',
      phone: body.phone || '',
      region: body.region || '',
      channel: body.channel || '',
      status: body.status || 'Active'
    }

    participants.push(newParticipant)
    await writeJsonFile('participants.json', participants)

    return NextResponse.json(newParticipant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}

