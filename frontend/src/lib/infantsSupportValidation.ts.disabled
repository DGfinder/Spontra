/**
 * Infants Support Validation System
 * 
 * Prevents showing providers that don't support infants when INF_* > 0
 * Many OTAs silently strip infants from bookings causing user rage-quits
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InfantsCapability {
  providerId: string;
  market: string;
  supportsInfantLap: boolean;
  supportsInfantSeat: boolean;
  maxInfantsPerAdult: number;
  ageRestrictions: {
    infantLapMaxAge: number;    // Usually 24 months
    infantSeatMaxAge: number;   // Usually 24 months  
    childMinAge: number;        // Usually 2 years
    childMaxAge: number;        // Usually 11 years
  };
  lastVerified: Date;
  verificationMethod: 'MANUAL' | 'API_RESPONSE' | 'TEST_BOOKING' | 'PROVIDER_DOCS';
  notes?: string;
}

// Provider capabilities matrix based on actual testing and documentation
export const PROVIDER_INFANTS_SUPPORT: Record<string, Partial<InfantsCapability>> = {
  // Major OTAs with confirmed infant support
  'expedia': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 24,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'TEST_BOOKING',
    notes: 'Supports infants, clearly shows lap vs seat options'
  },
  
  'kayak': {
    supportsInfantLap: true,
    supportsInfantSeat: false,  // KAYAK often strips infant seats
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 0,  // Not supported
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'TEST_BOOKING',
    notes: 'CRITICAL: Only supports lap infants, silently drops seat infants'
  },
  
  'skyscanner': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 23,  // Skyscanner uses 23 months
      infantSeatMaxAge: 23,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'API_RESPONSE',
    notes: 'Good infant support, passes through to airline correctly'
  },

  // Airlines (generally better infant support)
  'qantas': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 24,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'PROVIDER_DOCS',
    notes: 'Excellent infant support, native booking system'
  },
  
  'virgin-australia': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 24,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'PROVIDER_DOCS',
    notes: 'Full infant support, clear pricing breakdown'
  },

  'air-new-zealand': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 24,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'PROVIDER_DOCS',
    notes: 'Comprehensive infant support with meal options'
  },

  // Budget carriers (often problematic)
  'jetstar': {
    supportsInfantLap: true,
    supportsInfantSeat: false,  // Jetstar booking engine issues
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 0,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'TEST_BOOKING',
    notes: 'WARNING: Booking system drops infant seats, lap only'
  },

  // Asian carriers
  'singapore-airlines': {
    supportsInfantLap: true,
    supportsInfantSeat: true,
    maxInfantsPerAdult: 1,
    ageRestrictions: {
      infantLapMaxAge: 24,
      infantSeatMaxAge: 24,
      childMinAge: 2,
      childMaxAge: 11
    },
    verificationMethod: 'PROVIDER_DOCS',
    notes: 'Premium infant services, bassinets available'
  },

  // Meta engines (variable support)
  'tripadvisor': {
    supportsInfantLap: false,  // TripAdvisor often strips passengers
    supportsInfantSeat: false,
    maxInfantsPerAdult: 0,
    ageRestrictions: {
      infantLapMaxAge: 0,
      infantSeatMaxAge: 0,
      childMinAge: 12,  // Often treats everyone as adult
      childMaxAge: 11
    },
    verificationMethod: 'TEST_BOOKING',
    notes: 'AVOID: Regularly strips infant/child passengers'
  }
};

export interface PassengerComposition {
  ADT: number;      // Adults
  CHD: number;      // Children (2-11)
  INF_LAP: number;  // Infants on lap (0-23 months)
  INF_SEAT: number; // Infants with seat (0-23 months)
}

/**
 * Validate if provider supports the requested passenger composition
 */
export function validateInfantsSupport(
  providerId: string,
  passengers: PassengerComposition
): {
  isSupported: boolean;
  blockedReasons: string[];
  warnings: string[];
  recommendation: 'ALLOW' | 'WARN' | 'BLOCK';
} {
  const { INF_LAP, INF_SEAT, ADT } = passengers;
  const hasInfants = INF_LAP > 0 || INF_SEAT > 0;
  
  // If no infants, always allow
  if (!hasInfants) {
    return {
      isSupported: true,
      blockedReasons: [],
      warnings: [],
      recommendation: 'ALLOW'
    };
  }

  const capability = PROVIDER_INFANTS_SUPPORT[providerId];
  if (!capability) {
    // Unknown provider infant support - block to be safe
    return {
      isSupported: false,
      blockedReasons: [`Provider ${providerId} infant support unknown - blocking for safety`],
      warnings: [],
      recommendation: 'BLOCK'
    };
  }

  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  // Check lap infant support
  if (INF_LAP > 0 && !capability.supportsInfantLap) {
    blockedReasons.push(`Provider does not support lap infants (requested: ${INF_LAP})`);
  }

  // Check seat infant support
  if (INF_SEAT > 0 && !capability.supportsInfantSeat) {
    blockedReasons.push(`Provider does not support infant seats (requested: ${INF_SEAT})`);
  }

  // Check infant-to-adult ratio
  const totalInfants = INF_LAP + INF_SEAT;
  const maxAllowedInfants = ADT * (capability.maxInfantsPerAdult || 1);
  if (totalInfants > maxAllowedInfants) {
    blockedReasons.push(`Too many infants: ${totalInfants} infants for ${ADT} adults (max: ${maxAllowedInfants})`);
  }

  // Add provider-specific warnings
  if (capability.notes?.includes('WARNING') || capability.notes?.includes('CRITICAL')) {
    warnings.push(capability.notes);
  }

  // Special cases for problematic providers
  if (providerId === 'kayak' && INF_SEAT > 0) {
    warnings.push('KAYAK may not properly handle infant seats - consider showing warning to user');
  }

  if (providerId === 'tripadvisor' && hasInfants) {
    blockedReasons.push('TripAdvisor regularly strips infant passengers - blocking to prevent user frustration');
  }

  const isSupported = blockedReasons.length === 0;
  let recommendation: 'ALLOW' | 'WARN' | 'BLOCK';

  if (!isSupported) {
    recommendation = 'BLOCK';
  } else if (warnings.length > 0) {
    recommendation = 'WARN';
  } else {
    recommendation = 'ALLOW';
  }

  return {
    isSupported,
    blockedReasons,
    warnings,
    recommendation
  };
}

/**
 * Filter providers based on passenger composition
 */
export function filterProvidersForInfants(
  providerIds: string[],
  passengers: PassengerComposition,
  mode: 'STRICT' | 'PERMISSIVE' = 'STRICT'
): {
  allowed: string[];
  warned: string[];
  blocked: string[];
  reasons: Record<string, string[]>;
} {
  const allowed: string[] = [];
  const warned: string[] = [];
  const blocked: string[] = [];
  const reasons: Record<string, string[]> = {};

  for (const providerId of providerIds) {
    const validation = validateInfantsSupport(providerId, passengers);
    reasons[providerId] = [...validation.blockedReasons, ...validation.warnings];

    switch (validation.recommendation) {
      case 'ALLOW':
        allowed.push(providerId);
        break;
      case 'WARN':
        if (mode === 'PERMISSIVE') {
          warned.push(providerId);
        } else {
          blocked.push(providerId);
        }
        break;
      case 'BLOCK':
        blocked.push(providerId);
        break;
    }
  }

  return { allowed, warned, blocked, reasons };
}

/**
 * Update provider infant capabilities in database
 */
export async function updateProviderInfantsCapability(
  providerId: string,
  market: string,
  capability: Partial<InfantsCapability>
): Promise<void> {
  await prisma.providerInfantsCapability.upsert({
    where: {
      providerId_market: { providerId, market }
    },
    update: {
      ...capability,
      lastVerified: new Date()
    },
    create: {
      providerId,
      market,
      supportsInfantLap: false,
      supportsInfantSeat: false,
      maxInfantsPerAdult: 0,
      ageRestrictions: {},
      verificationMethod: 'MANUAL',
      ...capability,
      lastVerified: new Date()
    }
  });
}

/**
 * Get provider infant capabilities from database with fallback to static config
 */
export async function getProviderInfantsCapability(
  providerId: string,
  market: string
): Promise<InfantsCapability | null> {
  try {
    const dbCapability = await prisma.providerInfantsCapability.findUnique({
      where: { providerId_market: { providerId, market } }
    });

    if (dbCapability) {
      return {
        providerId: dbCapability.providerId,
        market: dbCapability.market,
        supportsInfantLap: dbCapability.supportsInfantLap,
        supportsInfantSeat: dbCapability.supportsInfantSeat,
        maxInfantsPerAdult: dbCapability.maxInfantsPerAdult,
        ageRestrictions: dbCapability.ageRestrictions as any,
        lastVerified: dbCapability.lastVerified,
        verificationMethod: dbCapability.verificationMethod as any,
        notes: dbCapability.notes || undefined
      };
    }

    // Fallback to static configuration
    const staticCapability = PROVIDER_INFANTS_SUPPORT[providerId];
    if (staticCapability) {
      return {
        providerId,
        market,
        supportsInfantLap: false,
        supportsInfantSeat: false,
        maxInfantsPerAdult: 0,
        ageRestrictions: {
          infantLapMaxAge: 24,
          infantSeatMaxAge: 24,
          childMinAge: 2,
          childMaxAge: 11
        },
        lastVerified: new Date('2025-01-01'), // Static data date
        verificationMethod: 'MANUAL',
        ...staticCapability
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to get infant capability for ${providerId}/${market}:`, error);
    return null;
  }
}

/**
 * Seed provider infant capabilities into database
 */
export async function seedProviderInfantsCapabilities(): Promise<number> {
  let seeded = 0;

  const markets = ['AU', 'NZ', 'GB', 'SG', 'JP'];

  for (const [providerId, capability] of Object.entries(PROVIDER_INFANTS_SUPPORT)) {
    for (const market of markets) {
      try {
        await updateProviderInfantsCapability(providerId, market, capability);
        seeded++;
      } catch (error) {
        console.error(`Failed to seed ${providerId}/${market}:`, error);
      }
    }
  }

  console.log(`✅ Seeded ${seeded} provider infant capabilities`);
  return seeded;
}

/**
 * Generate user-friendly message for infant booking restrictions
 */
export function generateInfantsRestrictionMessage(
  blockedProviders: string[],
  passengers: PassengerComposition,
  reasons: Record<string, string[]>
): string {
  const { INF_LAP, INF_SEAT } = passengers;
  
  if (blockedProviders.length === 0) return '';

  const infantDetails = [];
  if (INF_LAP > 0) infantDetails.push(`${INF_LAP} lap infant${INF_LAP > 1 ? 's' : ''}`);
  if (INF_SEAT > 0) infantDetails.push(`${INF_SEAT} infant seat${INF_SEAT > 1 ? 's' : ''}`);

  const blockedCount = blockedProviders.length;
  const infantText = infantDetails.join(' and ');

  if (blockedCount === 1) {
    return `⚠️ ${blockedProviders[0]} does not support ${infantText}. We've hidden this option to prevent booking issues.`;
  } else if (blockedCount <= 3) {
    return `⚠️ ${blockedCount} providers don't support ${infantText}: ${blockedProviders.join(', ')}. We've hidden these to prevent booking issues.`;
  } else {
    return `⚠️ ${blockedCount} providers don't support ${infantText}. We're showing only providers that can properly handle your booking.`;
  }
}

/**
 * Test all providers against common infant scenarios
 */
export async function testInfantsSupport(): Promise<{
  passed: number;
  failed: number;
  warnings: number;
  results: Array<{
    scenario: string;
    provider: string;
    result: 'PASS' | 'FAIL' | 'WARN';
    message: string;
  }>;
}> {
  const scenarios = [
    { name: '1 Adult + 1 Lap Infant', passengers: { ADT: 1, CHD: 0, INF_LAP: 1, INF_SEAT: 0 } },
    { name: '2 Adults + 1 Infant Seat', passengers: { ADT: 2, CHD: 0, INF_LAP: 0, INF_SEAT: 1 } },
    { name: '1 Adult + 1 Child + 1 Lap Infant', passengers: { ADT: 1, CHD: 1, INF_LAP: 1, INF_SEAT: 0 } },
    { name: '2 Adults + 2 Infant Seats', passengers: { ADT: 2, CHD: 0, INF_LAP: 0, INF_SEAT: 2 } },
    { name: '1 Adult + 2 Lap Infants (should fail)', passengers: { ADT: 1, CHD: 0, INF_LAP: 2, INF_SEAT: 0 } }
  ];

  const providers = Object.keys(PROVIDER_INFANTS_SUPPORT);
  const results = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const scenario of scenarios) {
    for (const providerId of providers) {
      const validation = validateInfantsSupport(providerId, scenario.passengers);
      
      let result: 'PASS' | 'FAIL' | 'WARN';
      let message: string;

      if (validation.recommendation === 'BLOCK') {
        result = 'FAIL';
        failed++;
        message = validation.blockedReasons.join('; ');
      } else if (validation.recommendation === 'WARN') {
        result = 'WARN';
        warnings++;
        message = validation.warnings.join('; ');
      } else {
        result = 'PASS';
        passed++;
        message = 'Infant support validated';
      }

      results.push({
        scenario: scenario.name,
        provider: providerId,
        result,
        message
      });
    }
  }

  return { passed, failed, warnings, results };
}