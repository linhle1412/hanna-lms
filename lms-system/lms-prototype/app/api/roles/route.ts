import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/json-handler'
import { RolePermissions } from '@/lib/permissions'

// GET /api/roles - Get all roles
export async function GET() {
  try {
    const roles = await readJsonFile<RolePermissions>('roles.json')
    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

// POST /api/roles - Create new custom role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const roles = await readJsonFile<RolePermissions>('roles.json')

    // Validation
    if (!body.roleName || !body.roleName.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    if (!body.description || !body.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Check for duplicate role name (case-insensitive)
    const roleNameUpper = body.roleName.trim().toUpperCase()
    const duplicate = roles.find(
      r => r.roleName.toUpperCase() === roleNameUpper
    )
    if (duplicate) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 400 }
      )
    }

    // Generate roleId from roleName (sanitized)
    const roleId = body.roleName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    if (!roleId) {
      return NextResponse.json(
        { error: 'Invalid role name. Role name must contain at least one letter or number.' },
        { status: 400 }
      )
    }

    // Check if roleId already exists
    if (roles.find(r => r.roleId === roleId)) {
      return NextResponse.json(
        { error: 'A role with similar name already exists' },
        { status: 400 }
      )
    }

    const newRole: RolePermissions = {
      roleId: roleId as any, // Custom role ID
      roleName: body.roleName.trim().toUpperCase(),
      description: body.description.trim(),
      permissions: body.permissions || [],
      isSystemRole: false,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    }

    roles.push(newRole)
    await writeJsonFile('roles.json', roles)

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

