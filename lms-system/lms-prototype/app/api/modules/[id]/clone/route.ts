import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { newName, copyFiles, copyTags, setDraft, clonedBy } = await request.json()
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const modules = JSON.parse(fileContents)
    
    const sourceModule = modules.find((m: any) => m.id === id)
    
    if (!sourceModule) {
      return NextResponse.json({ error: 'Source module not found' }, { status: 404 })
    }
    
    // Check for duplicate name
    const existingModule = modules.find((m: any) => 
      m.name.toLowerCase() === newName.toLowerCase()
    )
    if (existingModule) {
      return NextResponse.json(
        { error: 'A module with this name already exists' },
        { status: 400 }
      )
    }
    
    // Create cloned module
    const clonedModule = {
      id: Date.now(),
      name: newName,
      duration: sourceModule.duration,
      outcome: sourceModule.outcome,
      tags: copyTags ? [...(sourceModule.tags || [])] : [],
      status: setDraft ? 'DRAFT' : sourceModule.status,
      createdBy: clonedBy || 'System',
      createdDate: new Date().toISOString().split('T')[0],
      files: copyFiles ? [...(sourceModule.files || [])] : [],
      usageCount: 0
    }
    
    modules.push(clonedModule)
    fs.writeFileSync(filePath, JSON.stringify(modules, null, 2))
    
    return NextResponse.json(clonedModule, { status: 201 })
  } catch (error) {
    console.error('Error cloning module:', error)
    return NextResponse.json({ error: 'Failed to clone module' }, { status: 500 })
  }
}


