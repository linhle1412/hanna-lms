import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { User } from '@/lib/state'

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const users = await readJsonFile<User>('users.json')
    const user = users.find(u => u.id === parseInt(resolvedParams.id))

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await request.json()
    const resolvedParams = await Promise.resolve(params)
    const users = await readJsonFile<User>('users.json')
    const userId = parseInt(resolvedParams.id)
    const index = users.findIndex(u => u.id === userId)

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    users[index] = { ...users[index], ...body }
    await writeJsonFile('users.json', users)

    return NextResponse.json(users[index])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const users = await readJsonFile<User>('users.json')
    const userId = parseInt(resolvedParams.id)
    const filtered = users.filter(u => u.id !== userId)

    if (filtered.length === users.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await writeJsonFile('users.json', filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

