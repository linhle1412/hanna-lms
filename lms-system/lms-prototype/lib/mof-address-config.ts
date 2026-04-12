/**
 * MOF Address Configuration
 * 
 * PLACEHOLDER: This is a temporary hard-coded configuration.
 * 
 * UPDATED: July 2025 - Reflects Vietnam's administrative reform
 * Vietnam moved from 3-tier (Province → District → Ward) to 2-tier (Province → Ward) system.
 * District level has been abolished effective July 1, 2025.
 * 
 * FUTURE IMPLEMENTATION:
 * - Create MOF Address Management screen in admin panel
 * - Store configurations in database
 * - Create API endpoint: GET /api/mof-addresses
 * - Allow admin users to add/edit/delete MOF addresses
 * - Add validation for address completeness (city, ward required)
 */

export interface MOFAddressConfig {
  id?: string
  address: string
  city: string  // Province/City level
  ward: string  // Ward/Commune level (includes former district info for reference)
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Hard-coded MOF address configurations for MVP
 * Updated to reflect Vietnam's 2-tier administrative structure (July 2025)
 * Former district names included in ward field for reference
 * 
 * TODO: Replace with API call to fetch from database
 */
export const MOF_ADDRESS_CONFIGS: MOFAddressConfig[] = [
  {
    address: 'FWD Tower, Ho Chi Minh City',
    city: 'Ho Chi Minh',
    ward: 'Ward 1, Former District 1'
  },
  {
    address: 'Hanoi Office, Hanoi',
    city: 'Hanoi',
    ward: 'Ward 1, Former Ba Dinh'
  },
  {
    address: 'Da Nang Branch, Da Nang',
    city: 'Da Nang',
    ward: 'Ward 1, Former Hai Chau'
  },
  {
    address: 'Can Tho Regional Office, Can Tho',
    city: 'Can Tho',
    ward: 'Ward 1, Former Ninh Kieu'
  },
  {
    address: 'Hai Phong Branch, Hai Phong',
    city: 'Hai Phong',
    ward: 'Ward 1, Former Le Chan'
  }
]

/**
 * Fetch MOF address configurations
 * 
 * CURRENT: Returns hard-coded data
 * FUTURE: Fetch from API endpoint
 * 
 * @returns Promise<MOFAddressConfig[]>
 */
export async function getMOFAddressConfigs(): Promise<MOFAddressConfig[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/mof-addresses')
  // return response.json()
  
  return Promise.resolve(MOF_ADDRESS_CONFIGS)
}

/**
 * Find MOF address configuration by address string
 * 
 * @param address - The MOF address to find
 * @returns MOFAddressConfig | undefined
 */
export function findMOFAddressConfig(address: string): MOFAddressConfig | undefined {
  return MOF_ADDRESS_CONFIGS.find(config => config.address === address)
}

