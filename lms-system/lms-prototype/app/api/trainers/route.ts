import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { Trainer } from '@/lib/state'

// GET /api/trainers - Get all trainers with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trainers = await readJsonFile<Trainer>('trainers.json')

    let filtered = [...trainers]

    const region = searchParams.get('region')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    if (region) {
      filtered = filtered.filter(t => t.region === region)
    }
    if (type) {
      filtered = filtered.filter(t => t.trainerType === type)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.fullName.toLowerCase().includes(searchLower) ||
        t.email.toLowerCase().includes(searchLower) ||
        t.trainerType.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 })
  }
}

// POST /api/trainers - Create a new trainer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const trainers = await readJsonFile<Trainer>('trainers.json')

    const newTrainer: Trainer = {
      id: Date.now(),
      fullName: body.fullName || '',
      trainerTitle: body.trainerTitle || '',
      gender: body.gender || '',
      idNumber: body.idNumber || '',
      issueDate: body.issueDate || '',
      issuePlace: body.issuePlace || '',
      email: body.email || '',
      phone: body.phone || '',
      trainerRate: body.trainerRate || 0,
      highestDegree: body.highestDegree || '',
      degree: body.degree || '',
      trainerType: body.trainerType || '',
      location: body.location || '',
      region: body.region || '',
      status: body.status || 'Active',
      createdBy: body.createdBy || 'System',
      createdDate: new Date().toISOString().split('T')[0],
      address: body.address || [],
      experiences: body.experiences || [],
      education: body.education || [],
      rewards: body.rewards || [],
      certifications: body.certifications || [],
      activeRatio: body.activeRatio,
      trainingHistory: body.trainingHistory || []
    }

    trainers.push(newTrainer)
    await writeJsonFile('trainers.json', trainers)

    return NextResponse.json(newTrainer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trainer' }, { status: 500 })
  }
}

