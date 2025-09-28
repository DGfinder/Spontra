/**
 * Feature Flags for Safe Rollback and Gradual Rollout
 * 
 * This module provides feature flags to enable/disable metasearch functionality
 * for safe production rollouts and quick rollbacks if needed.
 */

export interface FeatureFlags {
  // Core metasearch functionality
  METASEARCH_ENABLED: boolean;
  METASEARCH_PROVIDERS_ENABLED: boolean;
  
  // Click tracking and attribution
  CLICK_TRACKING_ENABLED: boolean;
  CLICK_DEDUPLICATION_ENABLED: boolean;
  
  // Price validation and repricing
  REPRICE_ON_SELECT_ENABLED: boolean;
  REPRICE_VALIDATION_STRICT: boolean;
  
  // Affiliate postback handling
  POSTBACK_IMPACT_ENABLED: boolean;
  POSTBACK_CJ_ENABLED: boolean;
  POSTBACK_SIGNATURE_ENFORCEMENT: boolean;
  
  // Monitoring and synthetic testing
  SYNTHETIC_MONITOR_ENABLED: boolean;
  PERFORMANCE_MONITORING_ENABLED: boolean;
  
  // Security features
  RATE_LIMITING_ENABLED: boolean;
  IP_ALLOWLIST_ENFORCEMENT: boolean;
  
  // UI and UX features
  AFFILIATE_DISCLOSURE_ENABLED: boolean;
  PRICE_CHANGE_WARNINGS_ENABLED: boolean;
  
  // Provider-specific toggles
  PROVIDER_KAYAK_ENABLED: boolean;
  PROVIDER_SKYSCANNER_ENABLED: boolean;
  PROVIDER_JETSTAR_ENABLED: boolean;
  PROVIDER_VIRGIN_ENABLED: boolean;
  
  // Market-specific toggles
  MARKET_AU_ENABLED: boolean;
  MARKET_NZ_ENABLED: boolean;
}

/**
 * Default feature flag values (safe defaults for production)
 */
const DEFAULT_FLAGS: FeatureFlags = {
  // Core metasearch - start disabled for safe rollout
  METASEARCH_ENABLED: false,
  METASEARCH_PROVIDERS_ENABLED: false,
  
  // Click tracking - can be enabled independently
  CLICK_TRACKING_ENABLED: true,
  CLICK_DEDUPLICATION_ENABLED: true,
  
  // Price validation - start conservative
  REPRICE_ON_SELECT_ENABLED: false,
  REPRICE_VALIDATION_STRICT: true,
  
  // Postbacks - enable but with strict security
  POSTBACK_IMPACT_ENABLED: true,
  POSTBACK_CJ_ENABLED: true,
  POSTBACK_SIGNATURE_ENFORCEMENT: true,
  
  // Monitoring - always enabled
  SYNTHETIC_MONITOR_ENABLED: true,
  PERFORMANCE_MONITORING_ENABLED: true,
  
  // Security - always enabled
  RATE_LIMITING_ENABLED: true,
  IP_ALLOWLIST_ENFORCEMENT: true,
  
  // UI features - safe to enable
  AFFILIATE_DISCLOSURE_ENABLED: true,
  PRICE_CHANGE_WARNINGS_ENABLED: true,
  
  // Providers - gradual rollout
  PROVIDER_KAYAK_ENABLED: false,
  PROVIDER_SKYSCANNER_ENABLED: false,
  PROVIDER_JETSTAR_ENABLED: false,
  PROVIDER_VIRGIN_ENABLED: false,
  
  // Markets - start with AU only
  MARKET_AU_ENABLED: true,
  MARKET_NZ_ENABLED: false
};

/**
 * Environment variable mappings for feature flags
 */
const ENV_MAPPINGS: Record<keyof FeatureFlags, string> = {
  METASEARCH_ENABLED: 'FEATURE_METASEARCH_ENABLED',
  METASEARCH_PROVIDERS_ENABLED: 'FEATURE_METASEARCH_PROVIDERS_ENABLED',
  CLICK_TRACKING_ENABLED: 'FEATURE_CLICK_TRACKING_ENABLED',
  CLICK_DEDUPLICATION_ENABLED: 'FEATURE_CLICK_DEDUPLICATION_ENABLED',
  REPRICE_ON_SELECT_ENABLED: 'FEATURE_REPRICE_ON_SELECT_ENABLED',
  REPRICE_VALIDATION_STRICT: 'FEATURE_REPRICE_VALIDATION_STRICT',
  POSTBACK_IMPACT_ENABLED: 'FEATURE_POSTBACK_IMPACT_ENABLED',
  POSTBACK_CJ_ENABLED: 'FEATURE_POSTBACK_CJ_ENABLED',
  POSTBACK_SIGNATURE_ENFORCEMENT: 'FEATURE_POSTBACK_ENFORCE_SIGNATURE',
  SYNTHETIC_MONITOR_ENABLED: 'FEATURE_SYNTHETIC_MONITOR_ENABLED',
  PERFORMANCE_MONITORING_ENABLED: 'FEATURE_PERFORMANCE_MONITORING_ENABLED',
  RATE_LIMITING_ENABLED: 'FEATURE_RATE_LIMITING_ENABLED',
  IP_ALLOWLIST_ENFORCEMENT: 'FEATURE_IP_ALLOWLIST_ENFORCEMENT',
  AFFILIATE_DISCLOSURE_ENABLED: 'FEATURE_AFFILIATE_DISCLOSURE_ENABLED',
  PRICE_CHANGE_WARNINGS_ENABLED: 'FEATURE_PRICE_CHANGE_WARNINGS_ENABLED',
  PROVIDER_KAYAK_ENABLED: 'FEATURE_PROVIDER_KAYAK_ENABLED',
  PROVIDER_SKYSCANNER_ENABLED: 'FEATURE_PROVIDER_SKYSCANNER_ENABLED',
  PROVIDER_JETSTAR_ENABLED: 'FEATURE_PROVIDER_JETSTAR_ENABLED',
  PROVIDER_VIRGIN_ENABLED: 'FEATURE_PROVIDER_VIRGIN_ENABLED',
  MARKET_AU_ENABLED: 'FEATURE_MARKET_AU_ENABLED',
  MARKET_NZ_ENABLED: 'FEATURE_MARKET_NZ_ENABLED'
};

/**
 * Parse boolean from environment variable
 */
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get feature flags from environment variables with fallbacks
 */
export function getFeatureFlags(): FeatureFlags {
  const flags: FeatureFlags = {} as FeatureFlags;
  
  // Load each flag from environment or use default
  for (const [flagKey, envKey] of Object.entries(ENV_MAPPINGS)) {
    const key = flagKey as keyof FeatureFlags;
    flags[key] = parseBooleanEnv(
      process.env[envKey], 
      DEFAULT_FLAGS[key]
    );
  }
  
  return flags;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Check if metasearch functionality should be active
 */
export function isMetasearchEnabled(): boolean {
  return isFeatureEnabled('METASEARCH_ENABLED') && 
         isFeatureEnabled('METASEARCH_PROVIDERS_ENABLED');
}

/**
 * Check if a specific provider is enabled
 */
export function isProviderEnabled(providerId: string): boolean {
  const providerKey = `PROVIDER_${providerId.toUpperCase()}_ENABLED` as keyof FeatureFlags;
  return isFeatureEnabled(providerKey);
}

/**
 * Check if a specific market is enabled
 */
export function isMarketEnabled(market: string): boolean {
  const marketKey = `MARKET_${market.toUpperCase()}_ENABLED` as keyof FeatureFlags;
  return isFeatureEnabled(marketKey);
}

/**
 * Get enabled providers list
 */
export function getEnabledProviders(): string[] {
  const flags = getFeatureFlags();
  const providers: string[] = [];
  
  if (flags.PROVIDER_KAYAK_ENABLED) providers.push('kayak');
  if (flags.PROVIDER_SKYSCANNER_ENABLED) providers.push('skyscanner');
  if (flags.PROVIDER_JETSTAR_ENABLED) providers.push('jetstar');
  if (flags.PROVIDER_VIRGIN_ENABLED) providers.push('virgin');
  
  return providers;
}

/**
 * Get enabled markets list
 */
export function getEnabledMarkets(): string[] {
  const flags = getFeatureFlags();
  const markets: string[] = [];
  
  if (flags.MARKET_AU_ENABLED) markets.push('AU');
  if (flags.MARKET_NZ_ENABLED) markets.push('NZ');
  
  return markets;
}

/**
 * Feature flag preset configurations for different deployment scenarios
 */
export const FEATURE_PRESETS = {
  // Complete rollback - disable everything except essential functions
  ROLLBACK: {
    METASEARCH_ENABLED: false,
    METASEARCH_PROVIDERS_ENABLED: false,
    REPRICE_ON_SELECT_ENABLED: false,
    PROVIDER_KAYAK_ENABLED: false,
    PROVIDER_SKYSCANNER_ENABLED: false,
    PROVIDER_JETSTAR_ENABLED: false,
    PROVIDER_VIRGIN_ENABLED: false
  },
  
  // Conservative launch - minimal features enabled
  CONSERVATIVE: {
    METASEARCH_ENABLED: true,
    METASEARCH_PROVIDERS_ENABLED: true,
    PROVIDER_KAYAK_ENABLED: true,  // Start with one reliable provider
    PROVIDER_SKYSCANNER_ENABLED: false,
    PROVIDER_JETSTAR_ENABLED: false,
    PROVIDER_VIRGIN_ENABLED: false,
    MARKET_AU_ENABLED: true,
    MARKET_NZ_ENABLED: false
  },
  
  // Progressive rollout - add more providers
  PROGRESSIVE: {
    METASEARCH_ENABLED: true,
    METASEARCH_PROVIDERS_ENABLED: true,
    PROVIDER_KAYAK_ENABLED: true,
    PROVIDER_SKYSCANNER_ENABLED: true,  // Add second provider
    PROVIDER_JETSTAR_ENABLED: false,
    PROVIDER_VIRGIN_ENABLED: false,
    REPRICE_ON_SELECT_ENABLED: true,    // Enable price validation
    MARKET_AU_ENABLED: true,
    MARKET_NZ_ENABLED: false
  },
  
  // Full production - all features enabled
  FULL_PRODUCTION: {
    METASEARCH_ENABLED: true,
    METASEARCH_PROVIDERS_ENABLED: true,
    PROVIDER_KAYAK_ENABLED: true,
    PROVIDER_SKYSCANNER_ENABLED: true,
    PROVIDER_JETSTAR_ENABLED: true,
    PROVIDER_VIRGIN_ENABLED: true,
    REPRICE_ON_SELECT_ENABLED: true,
    MARKET_AU_ENABLED: true,
    MARKET_NZ_ENABLED: true
  }
};

/**
 * Utility to log current feature flag status (for debugging)
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV === 'development') {
    const flags = getFeatureFlags();
    console.log('🚩 Feature Flags Status:');
    console.table(flags);
  }
}