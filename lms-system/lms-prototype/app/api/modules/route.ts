import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const duration = searchParams.get('duration')
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    let modules = JSON.parse(fileContents)
    
    // Apply filters
    if (status && status !== 'All') {
      modules = modules.filter((m: any) => m.status === status)
    }
    
    if (duration && duration !== 'All') {
      if (duration === '<2') {
        modules = modules.filter((m: any) => m.duration < 2)
      } else if (duration === '2-4') {
        modules = modules.filter((m: any) => m.duration >= 2 && m.duration <= 4)
      } else if (duration === '>4') {
        modules = modules.filter((m: any) => m.duration > 4)
      }
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      modules = modules.filter((m: any) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.outcome.toLowerCase().includes(searchLower) ||
        (m.tags && m.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
      )
    }
    
    return NextResponse.json(modules)
  } catch (error) {
    console.error('Error reading modules:', error)
    return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const moduleData = await request.json()
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const modules = JSON.parse(fileContents)
    
    // Check for duplicate name
    const existingModule = modules.find((m: any) => 
      m.name.toLowerCase() === moduleData.name.toLowerCase()
    )
    if (existingModule) {
      return NextResponse.json(
        { error: 'A module with this name already exists' },
        { status: 400 }
      )
    }
    
    // Create new module
    const newModule = {
      id: Date.now(),
      name: moduleData.name,
      duration: moduleData.duration,
      outcome: moduleData.outcome,
      tags: moduleData.tags || [],
      status: moduleData.status || 'DRAFT',
      createdBy: moduleData.createdBy || 'System',
      createdDate: new Date().toISOString().split('T')[0],
      files: [],
      usageCount: 0
    }
    
    modules.push(newModule)
    fs.writeFileSync(filePath, JSON.stringify(modules, null, 2))
    
    return NextResponse.json(newModule, { status: 201 })
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}
