// Shared types matching the Next.js backend

export type ThemeSlug = 'adventure' | 'nature' | 'vibe' | 'indulge' | 'discover';

export interface Theme {
  id: ThemeSlug;
  name: string;
  emoji: string;
  description: string;
  gradient: [string, string];
}

export interface ReelMedia {
  id: string;
  reelId: string;
  kind: 'video' | 'image';
  sourceUrl: string;
  providerId?: string;
  aspect?: string;
  durationMs?: number;
  width?: number;
  height?: number;
  altText?: string;
  credit?: string;
  license?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Reel {
  id: string;
  iata: string;
  themeSlug: ThemeSlug;
  title?: string;
  caption?: string;
  language: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  media: ReelMedia[];
}

export interface Destination {
  iata: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  description?: string;
  imageUrl?: string;
  flightDurationMinutes?: number;
  estimatedPrice?: number;
  currency?: string;
}

export interface ContentItem {
  id: string;
  reel: Reel;
  destination: Destination;
  theme: ThemeSlug;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass: string;
  nonStop?: boolean;
}

export interface FlightOffer {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  carrierCode: string;
  flightNumber: string;
  aircraftType: string;
}
