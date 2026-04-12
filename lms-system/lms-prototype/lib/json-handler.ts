import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

/**
 * Read JSON file from data directory
 */
export async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(DATA_DIR, filename)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

/**
 * Write JSON file to data directory
 */
export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true })
    
    const filePath = path.join(DATA_DIR, filename)
    const fileContent = JSON.stringify(data, null, 2)
    await fs.writeFile(filePath, fileContent, 'utf-8')
  } catch (error) {
    console.error('Error writing JSON file:', error)
    throw error
  }
}

/**
 * Check if JSON file exists
 */
export async function fileExists(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, filename)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

