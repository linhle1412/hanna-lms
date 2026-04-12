import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/json-handler'
import { RolePermissions } from '@/lib/permissions'

// GET /api/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roles = await readJsonFile<RolePermissions>('roles.json')
    const role = roles.find(r => r.roleId === params.id)
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    return NextResponse.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Update role permissions and details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const roles = await readJsonFile<RolePermissions>('roles.json')

    const index = roles.findIndex(r => r.roleId === params.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const role = roles[index]

    // For custom roles, allow updating name and description
    // For system roles, only permissions can be updated
    if (role.isSystemRole) {
      // System role: only update permissions
      roles[index] = {
        ...role,
        permissions: body.permissions || role.permissions,
        updatedDate: new Date().toISOString(),
      }
    } else {
      // Custom role: can update name, description, and permissions
      // Validate role name if being changed
      if (body.roleName && body.roleName.trim() !== role.roleName) {
        const roleNameUpper = body.roleName.trim().toUpperCase()
        const duplicate = roles.find(
          (r, i) => i !== index && r.roleName.toUpperCase() === roleNameUpper
        )
        if (duplicate) {
          return NextResponse.json(
            { error: 'Role name already exists' },
            { status: 400 }
          )
        }
      }

      roles[index] = {
        ...role,
        roleName: body.roleName ? body.roleName.trim().toUpperCase() : role.roleName,
        description: body.description ? body.description.trim() : role.description,
        permissions: body.permissions !== undefined ? body.permissions : role.permissions,
        updatedDate: new Date().toISOString(),
      }
    }

    await writeJsonFile('roles.json', roles)
    return NextResponse.json(roles[index])
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Delete custom role (system roles cannot be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roles = await readJsonFile<RolePermissions>('roles.json')
    const role = roles.find(r => r.roleId === params.id)
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    if (role.isSystemRole) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if any users are assigned to this role
    try {
      const users = await readJsonFile<any>('users.json')
      const roleNameUpper = role.roleName.toUpperCase()
      const usersWithRole = users.filter((user: any) => 
        user.roles && Array.isArray(user.roles) && 
        user.roles.some((userRole: string) => userRole.toUpperCase() === roleNameUpper)
      )

      if (usersWithRole.length > 0) {
        return NextResponse.json(
          { 
            error: `Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role. Please reassign users before deleting.`,
            userCount: usersWithRole.length
          },
          { status: 400 }
        )
      }
    } catch (userError) {
      // If users.json doesn't exist or can't be read, log but continue
      console.warn('Could not check user assignments:', userError)
    }

    const updatedRoles = roles.filter(r => r.roleId !== params.id)
    await writeJsonFile('roles.json', updatedRoles)
    
    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}

