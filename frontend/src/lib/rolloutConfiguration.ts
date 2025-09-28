/**
 * Wave 1 EU/Asia Rollout Configuration
 * 
 * Manages gradual geographic rollout with risk mitigation
 * Wave 1: EU/Asia → Wave 2: AU/NZ → Wave 3: LCCs globally
 */

export interface RolloutWave {
  id: string;
  name: string;
  description: string;
  markets: string[];
  providers: string[];
  startDate: Date;
  endDate?: Date;
  status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ROLLBACK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  constraints: {
    maxDailyClicks?: number;
    maxDailyRevenue?: number;
    maxProviderFailureRate?: number;
    minConversionRate?: number;
    allowedHours?: { start: number; end: number }; // 24h format, local market time
  };
  monitoring: {
    alertThresholds: {
      epcDrop: number;        // % drop that triggers alert
      failureRate: number;    // % failure rate that triggers pause
      conversionDrop: number; // % conversion drop that triggers alert
    };
    autoRollback: boolean;
    rollbackTriggers: string[];
  };
}

/**
 * Wave 1: EU/Asia Markets - Conservative Launch
 * Focus on high-value, stable markets with strong affiliate relationships
 */
export const WAVE_1_EU_ASIA: RolloutWave = {
  id: 'wave-1-eu-asia',
  name: 'Wave 1: EU/Asia Launch',
  description: 'Conservative launch in mature markets with established affiliate relationships',
  markets: ['GB', 'SG', 'JP'],
  providers: [
    'british-airways',     // Strong UK market position
    'singapore-airlines',  // Premium SG market
    'kayak-jp',           // Established JP presence
    'skyscanner-gb'       // Reliable EU performance
  ],
  startDate: new Date('2025-01-15T09:00:00Z'), // Start in EU morning
  status: 'PLANNED',
  riskLevel: 'MEDIUM',
  constraints: {
    maxDailyClicks: 1000,       // Conservative start
    maxDailyRevenue: 500,       // USD, manageable exposure
    maxProviderFailureRate: 5,  // 5% max failure rate
    minConversionRate: 1.5,     // 1.5% minimum conversion rate
    allowedHours: { start: 6, end: 22 } // Avoid overnight issues
  },
  monitoring: {
    alertThresholds: {
      epcDrop: 25,        // 25% EPC drop = immediate alert
      failureRate: 10,    // 10% failure rate = pause rollout
      conversionDrop: 30  // 30% conversion drop = investigate
    },
    autoRollback: true,
    rollbackTriggers: [
      'CRITICAL_FAILURE_RATE_EXCEEDED',
      'EPC_COLLAPSE',
      'PROVIDER_BLACKLIST',
      'SECURITY_BREACH',
      'MANUAL_OVERRIDE'
    ]
  }
};

/**
 * Wave 2: AU/NZ Expansion - Higher Volume
 * Build on Wave 1 success with higher traffic markets
 */
export const WAVE_2_AU_NZ: RolloutWave = {
  id: 'wave-2-au-nz',
  name: 'Wave 2: AU/NZ Expansion',
  description: 'Scale to high-volume AU/NZ markets with proven providers',
  markets: ['AU', 'NZ'],
  providers: [
    'qantas',
    'virgin-australia',
    'air-new-zealand',
    'kayak-au',
    'skyscanner-nz',
    'expedia-au'
  ],
  startDate: new Date('2025-01-22T09:00:00Z'), // 1 week after Wave 1
  status: 'PLANNED',
  riskLevel: 'MEDIUM',
  constraints: {
    maxDailyClicks: 5000,       // Higher volume markets
    maxDailyRevenue: 2500,      // USD
    maxProviderFailureRate: 8,  // Slightly higher tolerance
    minConversionRate: 1.2,     // AU/NZ typically lower conversion
    allowedHours: { start: 5, end: 23 } // AEDT business hours
  },
  monitoring: {
    alertThresholds: {
      epcDrop: 20,        // Slightly higher tolerance
      failureRate: 12,    // 12% failure rate = pause
      conversionDrop: 25  // 25% conversion drop
    },
    autoRollback: true,
    rollbackTriggers: [
      'CRITICAL_FAILURE_RATE_EXCEEDED',
      'EPC_COLLAPSE',
      'PROVIDER_BLACKLIST',
      'MANUAL_OVERRIDE'
    ]
  }
};

/**
 * Wave 3: LCC Global - High Risk/Reward
 * Low-cost carriers globally for maximum coverage
 */
export const WAVE_3_LCC_GLOBAL: RolloutWave = {
  id: 'wave-3-lcc-global',
  name: 'Wave 3: LCC Global Rollout',
  description: 'High-volume LCC rollout across all markets for maximum coverage',
  markets: ['AU', 'NZ', 'GB', 'SG', 'JP', 'DE', 'FR', 'IT', 'ES'],
  providers: [
    'jetstar',
    'ryanair',
    'easyjet',
    'scoot',
    'cebu-pacific',
    'air-asia',
    'vueling',
    'norwegian'
  ],
  startDate: new Date('2025-02-01T09:00:00Z'), // 2 weeks after Wave 2
  status: 'PLANNED',
  riskLevel: 'HIGH',
  constraints: {
    maxDailyClicks: 20000,      // High volume
    maxDailyRevenue: 8000,      // USD
    maxProviderFailureRate: 15, // LCCs are less reliable
    minConversionRate: 0.8,     // LCCs have lower conversion
    allowedHours: { start: 0, end: 24 } // 24/7 operation
  },
  monitoring: {
    alertThresholds: {
      epcDrop: 30,        // Higher tolerance for LCCs
      failureRate: 20,    // 20% failure rate = pause
      conversionDrop: 40  // 40% conversion drop
    },
    autoRollback: false, // Manual rollback for LCCs
    rollbackTriggers: [
      'SECURITY_BREACH',
      'MANUAL_OVERRIDE'
    ]
  }
};

export const ROLLOUT_WAVES = [WAVE_1_EU_ASIA, WAVE_2_AU_NZ, WAVE_3_LCC_GLOBAL];

/**
 * Geographic market configuration for rollout targeting
 */
export interface MarketConfig {
  code: string;
  name: string;
  timezone: string;
  currency: string;
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedEPC: number;       // Expected earnings per click in USD
  expectedConversion: number; // Expected conversion rate %
  businessHours: { start: number; end: number };
  languages: string[];
  primaryAffiliateNetworks: string[];
  notes?: string;
}

export const MARKET_CONFIGURATIONS: Record<string, MarketConfig> = {
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    timezone: 'Europe/London',
    currency: 'GBP',
    riskProfile: 'LOW',
    expectedEPC: 0.52,
    expectedConversion: 2.1,
    businessHours: { start: 8, end: 18 },
    languages: ['en-GB'],
    primaryAffiliateNetworks: ['Impact', 'CJ'],
    notes: 'Stable market, strong BA performance'
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    riskProfile: 'LOW',
    expectedEPC: 0.48,
    expectedConversion: 1.9,
    businessHours: { start: 9, end: 18 },
    languages: ['en-SG'],
    primaryAffiliateNetworks: ['Impact', 'CJ'],
    notes: 'Premium market, SIA strong performer'
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    riskProfile: 'MEDIUM',
    expectedEPC: 0.36,
    expectedConversion: 1.4,
    businessHours: { start: 9, end: 17 },
    languages: ['ja-JP', 'en-JP'],
    primaryAffiliateNetworks: ['Impact'],
    notes: 'Language barrier, KAYAK performs well'
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    riskProfile: 'MEDIUM',
    expectedEPC: 0.45,
    expectedConversion: 1.6,
    businessHours: { start: 9, end: 17 },
    languages: ['en-AU'],
    primaryAffiliateNetworks: ['Impact', 'CJ'],
    notes: 'High volume, Qantas/Virgin strong'
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    timezone: 'Pacific/Auckland',
    currency: 'NZD',
    riskProfile: 'LOW',
    expectedEPC: 0.55,
    expectedConversion: 2.3,
    businessHours: { start: 9, end: 17 },
    languages: ['en-NZ'],
    primaryAffiliateNetworks: ['CJ'],
    notes: 'Small but high-value market'
  }
};

/**
 * Check if market is currently in allowed hours for rollout
 */
export function isMarketInBusinessHours(marketCode: string): boolean {
  const market = MARKET_CONFIGURATIONS[marketCode];
  if (!market) return false;

  const now = new Date();
  const marketTime = new Intl.DateTimeFormat('en', {
    timeZone: market.timezone,
    hour: 'numeric',
    hour12: false
  }).format(now);
  
  const currentHour = parseInt(marketTime);
  return currentHour >= market.businessHours.start && currentHour <= market.businessHours.end;
}

/**
 * Get active rollout wave for current date
 */
export function getActiveRolloutWave(): RolloutWave | null {
  const now = new Date();
  
  for (const wave of ROLLOUT_WAVES) {
    if (wave.status === 'ACTIVE') {
      return wave;
    }
    
    // Auto-activate if start date reached and not yet active
    if (wave.status === 'PLANNED' && now >= wave.startDate) {
      return wave;
    }
  }
  
  return null;
}

/**
 * Check if provider/market combination is allowed in current rollout wave
 */
export function isProviderMarketAllowed(
  providerId: string, 
  marketCode: string
): { 
  allowed: boolean; 
  reason?: string; 
  wave?: string 
} {
  const activeWave = getActiveRolloutWave();
  
  if (!activeWave) {
    return { 
      allowed: false, 
      reason: 'No active rollout wave' 
    };
  }

  if (activeWave.status === 'PAUSED' || activeWave.status === 'ROLLBACK') {
    return { 
      allowed: false, 
      reason: `Rollout ${activeWave.status.toLowerCase()}`, 
      wave: activeWave.name 
    };
  }

  if (!activeWave.markets.includes(marketCode)) {
    return { 
      allowed: false, 
      reason: `Market ${marketCode} not in current wave`, 
      wave: activeWave.name 
    };
  }

  if (!activeWave.providers.includes(providerId)) {
    return { 
      allowed: false, 
      reason: `Provider ${providerId} not in current wave`, 
      wave: activeWave.name 
    };
  }

  // Check business hours constraint
  if (activeWave.constraints.allowedHours && !isMarketInBusinessHours(marketCode)) {
    return { 
      allowed: false, 
      reason: `Outside business hours for ${marketCode}`, 
      wave: activeWave.name 
    };
  }

  return { 
    allowed: true, 
    wave: activeWave.name 
  };
}

/**
 * Get rollout constraints for current wave
 */
export function getCurrentRolloutConstraints(): RolloutWave['constraints'] | null {
  const activeWave = getActiveRolloutWave();
  return activeWave?.constraints || null;
}

/**
 * Update rollout wave status
 */
export function updateRolloutWaveStatus(
  waveId: string, 
  status: RolloutWave['status'],
  reason?: string
): void {
  const wave = ROLLOUT_WAVES.find(w => w.id === waveId);
  if (wave) {
    wave.status = status;
    console.log(`🌊 Rollout wave ${wave.name} status changed to ${status}${reason ? ` (${reason})` : ''}`);
  }
}

/**
 * Environment variable overrides for rollout configuration
 */
export function getRolloutConfig(): {
  wave1Enabled: boolean;
  wave2Enabled: boolean;
  wave3Enabled: boolean;
  maxDailyClicks: number;
  autoRollbackEnabled: boolean;
} {
  return {
    wave1Enabled: process.env.FEATURE_ROLLOUT_WAVE_1_ENABLED === 'true',
    wave2Enabled: process.env.FEATURE_ROLLOUT_WAVE_2_ENABLED === 'true',
    wave3Enabled: process.env.FEATURE_ROLLOUT_WAVE_3_ENABLED === 'true',
    maxDailyClicks: parseInt(process.env.ROLLOUT_MAX_DAILY_CLICKS || '1000'),
    autoRollbackEnabled: process.env.FEATURE_AUTO_ROLLBACK_ENABLED !== 'false'
  };
}

/**
 * Generate rollout status dashboard data
 */
export function getRolloutDashboard(): {
  currentWave: RolloutWave | null;
  nextWave: RolloutWave | null;
  allowedMarkets: string[];
  allowedProviders: string[];
  constraints: RolloutWave['constraints'] | null;
  riskLevel: string;
} {
  const currentWave = getActiveRolloutWave();
  const currentIndex = currentWave ? ROLLOUT_WAVES.findIndex(w => w.id === currentWave.id) : -1;
  const nextWave = currentIndex >= 0 && currentIndex < ROLLOUT_WAVES.length - 1 
    ? ROLLOUT_WAVES[currentIndex + 1] 
    : null;

  return {
    currentWave,
    nextWave,
    allowedMarkets: currentWave?.markets || [],
    allowedProviders: currentWave?.providers || [],
    constraints: currentWave?.constraints || null,
    riskLevel: currentWave?.riskLevel || 'UNKNOWN'
  };
}

/**
 * Rollout safety commands for emergency situations
 */
export const ROLLOUT_SAFETY_COMMANDS = {
  // Immediate rollback - all waves
  EMERGENCY_STOP: () => {
    ROLLOUT_WAVES.forEach(wave => {
      wave.status = 'ROLLBACK';
    });
    console.log('🚨 EMERGENCY STOP: All rollout waves paused');
  },

  // Pause current wave only
  PAUSE_CURRENT: () => {
    const currentWave = getActiveRolloutWave();
    if (currentWave) {
      currentWave.status = 'PAUSED';
      console.log(`⏸️ Paused current wave: ${currentWave.name}`);
    }
  },

  // Resume paused wave
  RESUME_CURRENT: () => {
    const pausedWave = ROLLOUT_WAVES.find(w => w.status === 'PAUSED');
    if (pausedWave) {
      pausedWave.status = 'ACTIVE';
      console.log(`▶️ Resumed wave: ${pausedWave.name}`);
    }
  }
};