import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/file-utils'
import type { User } from '@/lib/state'

// GET /api/users - Get all users with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const users = await readJsonFile<User>('users.json')

    let filtered = [...users]

    const search = searchParams.get('search')

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const users = await readJsonFile<User>('users.json')

    const newUser: User = {
      id: Date.now(),
      username: body.username || '',
      email: body.email || '',
      roles: body.roles || [],
      team: body.team || '',
      createdDate: new Date().toISOString().split('T')[0]
    }

    users.push(newUser)
    await writeJsonFile('users.json', users)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

