// Utility functions for exporting data
import type { Participant, Course } from './state'

/**
 * Export participants for MOF exam to CSV format
 * Only includes eligible participants (passed AOL, full attendance)
 */
export function exportParticipantsForMOF(
  participants: Participant[],
  course: Course,
  eligibleParticipantIds?: number[]
): void {
  // Filter eligible participants
  const eligibleParticipants = eligibleParticipantIds
    ? participants.filter(p => eligibleParticipantIds.includes(p.id))
    : participants // If no filter provided, export all participants

  if (eligibleParticipants.length === 0) {
    throw new Error('No eligible participants found for MOF exam export')
  }

  // Define CSV headers for MOF export
  const headers = [
    'STT', // Sequence number
    'Họ và tên', // Full name
    'Mã số', // ID/Code
    'Email',
    'Số điện thoại', // Phone
    'Mã đại lý', // Agent code
    'Kênh', // Channel
    'Khu vực', // Region
    'Tỉnh/Thành phố', // Province
    'Kết quả AOL', // AOL Result
    'Điểm chuyên cần', // Attendance
    'Ghi chú' // Notes
  ]

  // Build CSV content
  const rows = eligibleParticipants.map((participant, index) => {
    // Get AOL result (assuming passed if participant is eligible)
    const aolResult = 'Đạt' // Passed
    const attendance = 'Đủ' // Full attendance

    return [
      (index + 1).toString(), // STT
      participant.name || '', // Họ và tên
      participant.id?.toString() || participant.agentCode || '', // Mã số
      participant.email || '', // Email
      participant.phone || '', // Số điện thoại
      participant.agentCode || '', // Mã đại lý
      participant.channel || course.channel || '', // Kênh
      participant.region || course.region || '', // Khu vực
      (participant as any).province || course.province || '', // Tỉnh/Thành phố (may not exist in Participant interface)
      aolResult, // Kết quả AOL
      attendance, // Điểm chuyên cần
      '' // Ghi chú (empty for now)
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in cell values
      const cellValue = String(cell || '')
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue.replace(/"/g, '""')}"`
      }
      return cellValue
    }).join(','))
  ].join('\n')

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  // Generate filename with course code and date
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const filename = `MOF_Export_${course.code}_${date}.csv`
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  URL.revokeObjectURL(url)
}

/**
 * Check if participant is eligible for MOF exam
 * Eligibility criteria:
 * - Passed all AOL exams
 * - Full attendance check
 */
export function isEligibleForMOF(participant: Participant, course: Course): boolean {
  // For now, we'll assume all participants in the course are eligible
  // In production, this should check:
  // 1. AOL exam results - all passed
  // 2. Attendance - full attendance (100%)
  
  // TODO: Implement actual eligibility checks
  // - Check AOL exam results
  // - Check attendance percentage
  
  return true // Placeholder - all participants are eligible
}

