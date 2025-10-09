import { CreatorTier } from '@prisma/client'

/**
 * Get creator tier commission rates
 * Pure utility function - no database access needed
 */
export function getTierRate(tier: CreatorTier): number {
  const rates = {
    new: 0.05,    // 5%
    active: 0.08, // 8%
    top: 0.12,    // 12%
    elite: 0.15   // 15%
  }
  return rates[tier]
}

/**
 * Get all tier rates (useful for UI displays)
 */
export const TIER_RATES = {
  new: 0.05,
  active: 0.08,
  top: 0.12,
  elite: 0.15
} as const
