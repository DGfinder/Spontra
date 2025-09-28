/**
 * Infants Support Badge Component
 * 
 * Shows users which providers properly support infant bookings
 * Prevents user frustration from providers that silently strip infants
 */

import React from 'react';
import { validateInfantsSupport, PassengerComposition } from '@/lib/infantsSupportValidation';

interface InfantsSupportBadgeProps {
  providerId: string;
  passengers: PassengerComposition;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function InfantsSupportBadge({ 
  providerId, 
  passengers, 
  className = '',
  size = 'md'
}: InfantsSupportBadgeProps) {
  const { INF_LAP, INF_SEAT } = passengers;
  const hasInfants = INF_LAP > 0 || INF_SEAT > 0;

  // Only show badge if user has infants
  if (!hasInfants) {
    return null;
  }

  const validation = validateInfantsSupport(providerId, passengers);
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm', 
    lg: 'px-3 py-1.5 text-base'
  };

  const baseClasses = `inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${className}`;

  if (validation.recommendation === 'ALLOW') {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800 border border-green-200`}>
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Infants supported
      </span>
    );
  }

  if (validation.recommendation === 'WARN') {
    return (
      <span 
        className={`${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200 cursor-help`}
        title={validation.warnings.join('; ')}
      >
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Infants (limited)
      </span>
    );
  }

  // BLOCK - don't show this provider or show why it's hidden
  return (
    <span 
      className={`${baseClasses} bg-red-100 text-red-800 border border-red-200 cursor-help`}
      title={validation.blockedReasons.join('; ')}
    >
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      No infant support
    </span>
  );
}

/**
 * Infants Support Summary Component
 * Shows overall infant booking information
 */
interface InfantsSupportSummaryProps {
  passengers: PassengerComposition;
  totalProviders: number;
  supportedProviders: number;
  className?: string;
}

export function InfantsSupportSummary({
  passengers,
  totalProviders, 
  supportedProviders,
  className = ''
}: InfantsSupportSummaryProps) {
  const { INF_LAP, INF_SEAT } = passengers;
  const hasInfants = INF_LAP > 0 || INF_SEAT > 0;

  if (!hasInfants) return null;

  const hiddenProviders = totalProviders - supportedProviders;
  const supportPercentage = totalProviders > 0 ? Math.round((supportedProviders / totalProviders) * 100) : 0;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Traveling with infants
          </h3>
          <div className="mt-1 text-sm text-blue-700">
            <p>
              {INF_LAP > 0 && `${INF_LAP} lap infant${INF_LAP > 1 ? 's' : ''}`}
              {INF_LAP > 0 && INF_SEAT > 0 && ', '}
              {INF_SEAT > 0 && `${INF_SEAT} infant seat${INF_SEAT > 1 ? 's' : ''}`}
            </p>
            <p className="mt-1">
              <span className="font-medium">{supportedProviders} of {totalProviders} providers</span> support your booking.
              {hiddenProviders > 0 && (
                <span className="text-blue-600"> We've hidden {hiddenProviders} provider{hiddenProviders > 1 ? 's' : ''} that don't support infants to prevent booking issues.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Provider Filter Info Component
 * Explains why certain providers are hidden
 */
interface ProviderFilterInfoProps {
  blockedProviders: string[];
  reasons: Record<string, string[]>;
  className?: string;
}

export function ProviderFilterInfo({
  blockedProviders,
  reasons,
  className = ''
}: ProviderFilterInfoProps) {
  if (blockedProviders.length === 0) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Some providers hidden
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>We've hidden providers that don't support your infant passengers:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {blockedProviders.map(provider => (
                <li key={provider}>
                  <span className="font-medium">{provider}</span>
                  {reasons[provider] && (
                    <span className="text-yellow-600">: {reasons[provider][0]}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}