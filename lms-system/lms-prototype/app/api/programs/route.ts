import { NextResponse } from 'next/server'

// Mock program data - will be replaced with database later
const mockPrograms = [
  { 
    id: 1, 
    name: 'SHINE Basic', 
    type: 'Shine', 
    status: 'Active',
    duration: 5,
    description: 'Basic SHINE certification program for new agents',
    createdAt: '2025-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'SHINE Advanced', 
    type: 'Shine', 
    status: 'Active',
    duration: 7,
    description: 'Advanced SHINE certification for experienced agents',
    createdAt: '2025-01-01T00:00:00Z'
  },
  { 
    id: 3, 
    name: 'Product Training A', 
    type: 'Product', 
    status: 'Active',
    duration: 3,
    description: 'Product knowledge training for life insurance',
    createdAt: '2025-01-01T00:00:00Z'
  },
  { 
    id: 4, 
    name: 'Product Training B', 
    type: 'Product', 
    status: 'Active',
    duration: 3,
    description: 'Product knowledge training for investment products',
    createdAt: '2025-01-01T00:00:00Z'
  },
  { 
    id: 5, 
    name: 'Skill Development', 
    type: 'Skill', 
    status: 'Active',
    duration: 2,
    description: 'Core skill development for agents',
    createdAt: '2025-01-01T00:00:00Z'
  },
  { 
    id: 6, 
    name: 'Skill Enhancement', 
    type: 'Skill', 
    status: 'Active',
    duration: 2,
    description: 'Advanced skill enhancement program',
    createdAt: '2025-01-01T00:00:00Z'
  }
]

// GET /api/programs - Get all programs with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    let filteredPrograms = [...mockPrograms]

    // Filter by type (Shine, Product, Skill)
    if (type) {
      filteredPrograms = filteredPrograms.filter(p => 
        p.type.toLowerCase() === type.toLowerCase()
      )
    }

    // Filter by status (Active, Inactive)
    if (status) {
      filteredPrograms = filteredPrograms.filter(p => 
        p.status.toLowerCase() === status.toLowerCase()
      )
    }

    return NextResponse.json(filteredPrograms)
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

// POST /api/programs - Create a new program (mock)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const newProgram = {
      id: mockPrograms.length + 1,
      name: body.name,
      type: body.type,
      status: body.status || 'Active',
      duration: body.duration || 5,
      description: body.description || '',
      createdAt: new Date().toISOString()
    }

    mockPrograms.push(newProgram)

    return NextResponse.json(newProgram, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}
