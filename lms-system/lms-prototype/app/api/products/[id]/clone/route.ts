import { NextRequest, NextResponse } from 'next/server'

// POST /api/products/[id]/clone - Clone a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()

    // Validation
    if (!body.newName) {
      return NextResponse.json(
        { error: 'New product name is required' },
        { status: 400 }
      )
    }

    const options = {
      copySessions: body.copySessions !== false, // default true
      copyTags: body.copyTags !== false, // default true
      copyFiles: body.copyFiles === true, // default false
      setDraft: body.setDraft !== false // default true
    }

    // In a real app, this would:
    // 1. Fetch source product from database
    // 2. Create new product with copied data
    // 3. Return the new product
    
    return NextResponse.json({
      success: true,
      sourceProductId: id,
      newName: body.newName,
      options,
      message: 'Product cloned successfully (client-side handling)'
    }, { status: 201 })
  } catch (error) {
    console.error('Error cloning product:', error)
    return NextResponse.json(
      { error: 'Failed to clone product' },
      { status: 500 }
    )
  }
}


