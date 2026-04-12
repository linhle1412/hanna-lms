import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const modules = JSON.parse(fileContents)
    
    const module = modules.find((m: any) => m.id === id)
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    return NextResponse.json(module)
  } catch (error) {
    console.error('Error reading module:', error)
    return NextResponse.json({ error: 'Failed to load module' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const updates = await request.json()
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const modules = JSON.parse(fileContents)
    
    const index = modules.findIndex((m: any) => m.id === id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    // Check for duplicate name (excluding current module)
    if (updates.name) {
      const existingModule = modules.find((m: any) => 
        m.id !== id && m.name.toLowerCase() === updates.name.toLowerCase()
      )
      if (existingModule) {
        return NextResponse.json(
          { error: 'A module with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update module
    modules[index] = {
      ...modules[index],
      ...updates,
      updatedBy: updates.updatedBy || 'System',
      updatedDate: new Date().toISOString().split('T')[0]
    }
    
    fs.writeFileSync(filePath, JSON.stringify(modules, null, 2))
    
    return NextResponse.json(modules[index])
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    const filePath = path.join(process.cwd(), 'data', 'modules.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const modules = JSON.parse(fileContents)
    
    const index = modules.findIndex((m: any) => m.id === id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    // Check if module is used in products (mock check - would need product data in real system)
    if (modules[index].usageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete module. It is currently used in ${modules[index].usageCount} product(s). Please remove it from all products first.` },
        { status: 400 }
      )
    }
    
    modules.splice(index, 1)
    fs.writeFileSync(filePath, JSON.stringify(modules, null, 2))
    
    return NextResponse.json({ message: 'Module deleted successfully' })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}


