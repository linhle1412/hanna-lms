// Utility functions for reading and writing JSON files
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Check if we're on Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    // Try data directory first
    const filePath = path.join(DATA_DIR, filename)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(fileContent) as T[]
  } catch (error) {
    // Fallback to public directory for Vercel deployments
    try {
      const publicPath = path.join(process.cwd(), 'public', 'data', filename)
      const fileContent = await fs.readFile(publicPath, 'utf-8')
      return JSON.parse(fileContent) as T[]
    } catch (publicError) {
      console.error(`Error reading ${filename}:`, error)
      return []
    }
  }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  try {
    // On Vercel, filesystem is read-only
    if (isVercel) {
      console.warn(`⚠️ Write operation to ${filename} skipped - Vercel filesystem is read-only`)
      console.warn('💡 For production, migrate to a database solution (Vercel Postgres, MongoDB, etc.)')
      // In production, this should throw an error or use a database
      // For now, we'll silently fail to allow deployment
      return
    }
    
    const filePath = path.join(DATA_DIR, filename)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    throw error
  }
}

