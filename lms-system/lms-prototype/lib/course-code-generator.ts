/**
 * Course Code Generation Logic
 * 
 * Based on Functional Requirements Specification (Updated):
 * Format: [SequenceNumber]-[ProvinceCode][ChannelCode]-[CourseTypeCode]
 * 
 * Examples:
 * - 001-HCMBC-SH (Sequence 001, Ho Chi Minh + Banca, SHINE)
 * - 022-HCMAG-PR (Sequence 022, Ho Chi Minh + Agency, Product)
 * - 045-HNAG-SH (Sequence 045, Hanoi + Agency, SHINE)
 * - 011-DNBC-SK (Sequence 011, Da Nang + Banca, Skill)
 */

import type { Course } from './state'

interface CourseCodeParams {
  province: string
  channel: string
  courseType: string
  program?: string // Used for SHINE detection (SHINE Program can use full "SHINE" or "SH")
  sequenceNumber?: number
}

/**
 * Map channel names to abbreviations
 */
function getChannelCode(channel: string): string {
  const channelMap: Record<string, string> = {
    'Banca': 'BC',
    'Banca FSC': 'BC',
    'Agency': 'AG',
    'IFA': 'IFA',
    'Banker': 'BK',
    'Agent': 'AG'
  }
  
  // Find match (case insensitive)
  const normalized = channel.trim()
  for (const [key, code] of Object.entries(channelMap)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return code
    }
  }
  
  // Return first 2-3 uppercase letters if no match
  return normalized.substring(0, 2).toUpperCase()
}

/**
 * Get province abbreviation (2 characters)
 * Examples: Ho Chi Minh -> HCM -> HC, Hanoi -> HN, Da Nang -> DN
 */
function getProvinceCode(province: string): string {
  const provinceMap: Record<string, string> = {
    'Ho Chi Minh': 'HC',
    'Ho Chi Minh City': 'HC',
    'HCM': 'HC',
    'Hanoi': 'HN',
    'Ha Noi': 'HN',
    'Da Nang': 'DN',
    'Da Nang City': 'DN',
    'Can Tho': 'CT',
    'Hai Phong': 'HP',
    'Vung Tau': 'VT',
    'Bien Hoa': 'BH',
    'Nha Trang': 'NT',
    'Hue': 'HU',
    'Vinh': 'VH',
    'Buon Ma Thuot': 'BM',
    // Add more province mappings as needed
  }
  
  const normalized = province.trim()
  const mapped = provinceMap[normalized]
  if (mapped) return mapped
  
  // Extract first letters of each word if no mapping exists
  // Example: "Binh Duong" -> "BD"
  const words = normalized.split(/\s+/)
  if (words.length > 1) {
    return words.map(w => w.charAt(0).toUpperCase()).join('').substring(0, 2)
  }
  
  // Single word: take first 2 uppercase letters
  return normalized.substring(0, 2).toUpperCase()
}


/**
 * Map course type/program to abbreviation
 */
function getCourseTypeCode(courseType: string, program?: string): string {
  // Check course type first
  const courseTypeMap: Record<string, string> = {
    'Shine': 'SH',
    'SHINE': 'SH',
    'Product': 'PR',
    'Skill': 'SK'
  }
  
  // Check program if course type not found
  const programMap: Record<string, string> = {
    'SHINE Program': 'SHINE',
    'Product Program': 'PR',
    'Skill Program': 'SK'
  }
  
  const normalized = courseType.trim()
  
  // Try course type map
  if (courseTypeMap[normalized]) {
    return courseTypeMap[normalized]
  }
  
  // Try program map if program provided (SHINE can use full name)
  if (program) {
    const normalizedProgram = program.trim()
    if (programMap[normalizedProgram]) {
      return programMap[normalizedProgram]
    }
  }
  
  // Default: return first 2 uppercase letters
  return normalized.substring(0, 2).toUpperCase()
}

/**
 * Generate course code
 * 
 * @param params Course code generation parameters
 * @returns Generated course code string
 * 
 * Format: [SequenceNumber]-[ProvinceCode][ChannelCode]-[CourseTypeCode]
 * 
 * Examples:
 * - 001-HCBC-SH (Sequence 001, Ho Chi Minh + Banca, SHINE)
 * - 022-HCAG-PR (Sequence 022, Ho Chi Minh + Agency, Product)
 * - 045-HNAG-SH (Sequence 045, Hanoi + Agency, SHINE)
 */
export function generateCourseCode(params: CourseCodeParams): string {
  const {
    province,
    channel,
    courseType,
    sequenceNumber
  } = params

  // Step 1: Get province code (2 chars) and channel code (2 chars), combine them
  const provinceCode = getProvinceCode(province)
  const channelCode = getChannelCode(channel)
  const locationCode = `${provinceCode}${channelCode}`

  // Step 2: Get course type code (2 chars)
  const typeCode = getCourseTypeCode(courseType, params.program as string)

  // Step 3: Generate sequence number if not provided
  let sequence = sequenceNumber
  if (sequence === undefined || sequence === null) {
    sequence = 1
  }

  // Step 4: Format sequence number with leading zeros (3 digits)
  const formattedSequence = String(sequence).padStart(3, '0')

  // Step 5: Combine all parts: [Sequence]-[Province+Channel]-[Type]
  const courseCode = `${formattedSequence}-${locationCode}-${typeCode}`

  return courseCode
}

/**
 * Generate unique course code (checks for duplicates and finds next sequence)
 * 
 * @param params Course code generation parameters
 * @param existingCourses Existing courses to check for duplicates
 * @returns Generated unique course code
 */
export function generateUniqueCourseCode(
  params: CourseCodeParams,
  existingCourses: Course[]
): string {
  // Find the highest sequence number for courses with same province, channel, and course type
  const { province, channel, courseType } = params
  const provinceCode = getProvinceCode(province)
  const channelCode = getChannelCode(channel)
  const typeCode = getCourseTypeCode(courseType, params.program as string)
  const locationCode = `${provinceCode}${channelCode}`

  // Extract sequence numbers from existing courses with matching pattern
  // Pattern: [SequenceNumber]-[ProvinceCode+ChannelCode]-[CourseTypeCode]
  const pattern = new RegExp(`^(\\d{3})-${locationCode}-${typeCode}$`)
  let maxSequence = 0

  for (const course of existingCourses) {
    const match = course.code.match(pattern)
    if (match) {
      const seq = parseInt(match[1], 10)
      if (seq > maxSequence) {
        maxSequence = seq
      }
    }
  }

  // Generate code with next sequence number
  const nextSequence = maxSequence + 1
  return generateCourseCode({ ...params, sequenceNumber: nextSequence })
}

/**
 * Parse course code to extract components
 * 
 * @param courseCode Course code string (e.g., "001-HCBC-SH")
 * @returns Parsed components or null if invalid format
 */
export function parseCourseCode(courseCode: string): {
  sequenceNumber: number
  provinceCode: string
  channelCode: string
  courseTypeCode: string
} | null {
  const parts = courseCode.split('-')
  
  if (parts.length !== 3) {
    return null
  }

  const [sequenceStr, locationCode, typeCode] = parts

  // Extract province (2 chars) and channel (2 chars) from location code
  // Examples: HCBC -> HC + BC, HCAG -> HC + AG, HNAG -> HN + AG
  let provinceCode = ''
  let channelCode = ''
  
  if (locationCode.length >= 4) {
    // Split: first 2 as province, rest as channel
    provinceCode = locationCode.substring(0, 2)
    channelCode = locationCode.substring(2)
  } else {
    // Fallback: split in half
    const mid = Math.floor(locationCode.length / 2)
    provinceCode = locationCode.substring(0, mid)
    channelCode = locationCode.substring(mid)
  }

  const sequenceNumber = parseInt(sequenceStr, 10)

  return {
    sequenceNumber: isNaN(sequenceNumber) ? 0 : sequenceNumber,
    provinceCode,
    channelCode,
    courseTypeCode: typeCode
  }
}
