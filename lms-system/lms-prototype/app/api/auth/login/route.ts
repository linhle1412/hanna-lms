import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile } from '@/lib/json-handler'
import type { User } from '@/lib/state'

interface LoginRequest {
  username: string
  password: string
}

interface UserWithPassword extends User {
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginRequest = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Read users from JSON file
    const users = await readJsonFile('users.json') as UserWithPassword[]

    // Find user by username (case-insensitive)
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    )

    // Validate user exists and password matches
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}

