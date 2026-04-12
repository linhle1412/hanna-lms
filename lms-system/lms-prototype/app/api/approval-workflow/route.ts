import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { ApprovalWorkflowConfig, getDefaultApprovalWorkflow } from '@/lib/approval-workflow'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'approval-workflow.json')

// GET - Load approval workflow configuration
export async function GET() {
  try {
    const fileContents = await fs.readFile(CONFIG_PATH, 'utf8')
    const config: ApprovalWorkflowConfig = JSON.parse(fileContents)
    return NextResponse.json(config)
  } catch (error) {
    // Return default if file doesn't exist
    console.warn('Approval workflow config file not found, returning default:', error)
    return NextResponse.json(getDefaultApprovalWorkflow())
  }
}

// PUT - Update approval workflow configuration (Root Admin only)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add Root Admin authorization check
    const config: ApprovalWorkflowConfig = await request.json()
    
    // Validate configuration structure
    if (!config.approvalWorkflow || !config.approvalWorkflow.approver) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      )
    }

    // Update timestamp
    config.lastUpdated = new Date().toISOString()
    
    // Save to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error updating approval workflow config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

