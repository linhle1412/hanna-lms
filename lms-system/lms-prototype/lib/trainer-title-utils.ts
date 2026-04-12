/**
 * Trainer Title Auto-Determination Utility
 * 
 * Automatically determines trainer title based on user's role, channel, and region.
 */

import { User } from './state'

export type TrainerTitleOption = 
  | 'Head Academy'
  | 'Head Agency'
  | 'Head Banca'
  | 'Head IFA'
  | string // For dynamic Lead and Trainer titles

/**
 * Auto-determines trainer title based on user's role, channel, and region
 * 
 * @param user - The user object with role, channel, and region
 * @returns The auto-determined trainer title, or null if cannot be determined
 */
export function autoDetermineTrainerTitle(user: User | null): string | null {
  if (!user) return null

  // Get the highest priority role
  const role = getHighestPriorityRole(user.roles)
  if (!role) return null

  const channel = user.channel
  const region = user.region

  // HEAD_CHANNEL: Channel only (region not required)
  if (role === 'HEAD_CHANNEL') {
    if (!channel) return null
    
    switch (channel.toLowerCase()) {
      case 'agency':
        return 'Head Agency'
      case 'banca':
        return 'Head Banca'
      case 'ifa':
        return 'Head IFA'
      case 'banker':
        return 'Head Academy'
      default:
        return null
    }
  }

  // LEAD_REGION: Channel + Region required
  if (role === 'LEAD_REGION') {
    if (!channel || !region) return null
    
    const channelName = capitalizeChannel(channel)
    const regionName = capitalizeRegion(region)
    
    return `Lead ${channelName} - ${regionName}`
  }

  // TRAINER: Channel + Region required
  if (role === 'TRAINER') {
    if (!channel || !region) return null
    
    const channelName = capitalizeChannel(channel)
    const regionName = capitalizeRegion(region)
    
    return `Trainer - ${channelName} - ${regionName}`
  }

  return null
}

/**
 * Gets the highest priority role from a list of roles
 * Priority: HEAD_CHANNEL > LEAD_REGION > TRAINER > others
 */
function getHighestPriorityRole(roles: string[]): string | null {
  const normalizedRoles = roles.map(r => r.toUpperCase())
  
  if (normalizedRoles.includes('HEAD_CHANNEL')) return 'HEAD_CHANNEL'
  if (normalizedRoles.includes('LEAD_REGION')) return 'LEAD_REGION'
  if (normalizedRoles.includes('TRAINER')) return 'TRAINER'
  
  return null
}

/**
 * Capitalizes channel name for display
 */
function capitalizeChannel(channel: string): string {
  const channelMap: Record<string, string> = {
    'agency': 'Agency',
    'banca': 'Banca',
    'ifa': 'IFA',
    'banker': 'Banker',
  }
  
  return channelMap[channel.toLowerCase()] || channel
}

/**
 * Capitalizes region name for display
 */
function capitalizeRegion(region: string): string {
  const regionMap: Record<string, string> = {
    'south': 'South',
    'middle': 'Middle',
    'north': 'North',
    'central': 'Central',
  }
  
  return regionMap[region.toLowerCase()] || region
}

/**
 * Gets validation message if trainer title cannot be auto-determined
 */
export function getTrainerTitleValidationMessage(user: User | null): string | null {
  if (!user) return null

  const role = getHighestPriorityRole(user.roles)
  if (!role) return null

  // Check for HEAD_CHANNEL
  if (role === 'HEAD_CHANNEL') {
    if (!user.channel) {
      return 'User account is missing channel information. Please update the user profile first.'
    }
  }

  // Check for LEAD_REGION
  if (role === 'LEAD_REGION') {
    if (!user.channel) {
      return 'User account is missing channel information. Please update the user profile first.'
    }
    if (!user.region) {
      return 'User account is missing region information. Please update the user profile first.'
    }
  }

  // Check for TRAINER
  if (role === 'TRAINER') {
    if (!user.channel) {
      return 'User account is missing channel information. Please update the user profile first.'
    }
    if (!user.region) {
      return 'User account is missing region information. Please update the user profile first.'
    }
  }

  return null
}

/**
 * Default trainer title options for manual selection (External Contractors)
 */
export const DEFAULT_TRAINER_TITLE_OPTIONS: TrainerTitleOption[] = [
  'Trainer',
  'Head Academy',
  'Head Agency',
  'Head Banca',
  'Head IFA',
]

/**
 * Checks if trainer title should be auto-determined (read-only) or manual (editable)
 * 
 * @param trainerType - Internal Trainer or External Contractor
 * @param user - The linked user (if any)
 * @returns true if field should be read-only (auto-determined)
 */
export function isTrainerTitleReadOnly(trainerType: string, user: User | null): boolean {
  // External Contractors: Always editable (manual selection)
  if (trainerType === 'External Contractor') {
    return false
  }

  // Internal Trainers: Read-only if user is linked and title can be determined
  if (trainerType === 'Internal Trainer' && user) {
    const autoTitle = autoDetermineTrainerTitle(user)
    return autoTitle !== null
  }

  return false
}

