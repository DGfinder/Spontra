/**
 * Infants Support Badge Component - DISABLED (Non-MVP)
 *
 * This feature has been temporarily disabled as it's not part of MVP.
 * All components now return null.
 */

import React from 'react';

export interface PassengerComposition {
  ADT: number;
  CHD: number;
  INF_LAP: number;
  INF_SEAT: number;
}

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
  // Feature disabled for MVP
  return null;
}

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
  // Feature disabled for MVP
  return null;
}

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
  // Feature disabled for MVP
  return null;
}
