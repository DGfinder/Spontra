import { Reel, Destination, ThemeSlug, FlightOffer, FlightSearchParams, ContentItem } from '../types';

// Configure this to your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://spontra.com/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.ok === false) {
      throw new Error(json.error || 'Unknown API error');
    }

    return json.data ?? json;
  }

  // Get curated reels for a destination and theme
  async getReels(iata: string, theme: ThemeSlug): Promise<Reel[]> {
    return this.fetch<Reel[]>(`/destinations/${iata}/themes/${theme}/reels`);
  }

  // Get destinations within flight time range
  async getDestinations(params: {
    origin: string;
    theme: ThemeSlug;
    maxFlightMinutes?: number;
    minFlightMinutes?: number;
  }): Promise<Destination[]> {
    const searchParams = new URLSearchParams({
      origin: params.origin,
      theme: params.theme,
      ...(params.maxFlightMinutes && { maxFlightMinutes: params.maxFlightMinutes.toString() }),
      ...(params.minFlightMinutes && { minFlightMinutes: params.minFlightMinutes.toString() }),
    });
    
    return this.fetch<Destination[]>(`/destinations/explore?${searchParams}`);
  }

  // Get curated feed content (destinations + reels combined)
  async getFeedContent(params: {
    origin: string;
    theme: ThemeSlug;
    maxFlightMinutes?: number;
    minFlightMinutes?: number;
    limit?: number;
  }): Promise<ContentItem[]> {
    const searchParams = new URLSearchParams({
      origin: params.origin,
      theme: params.theme,
      ...(params.maxFlightMinutes && { maxFlightMinutes: params.maxFlightMinutes.toString() }),
      ...(params.minFlightMinutes && { minFlightMinutes: params.minFlightMinutes.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });
    
    const result = await this.fetch<{ data: ContentItem[]; meta: any }>(
      `/feed?${searchParams}`
    );
    
    return result.data || result;
  }

  // Get reels for a specific destination
  async getDestinationReels(iata: string, theme?: ThemeSlug): Promise<{ destination: Destination; reels: Reel[] }> {
    const searchParams = new URLSearchParams();
    if (theme) {
      searchParams.set('theme', theme);
    }
    
    const result = await this.fetch<{ data: { destination: Destination; reels: Reel[] } }>(
      `/destinations/${iata}/reels?${searchParams}`
    );
    
    return result.data || result;
  }

  // Search flights
  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    return this.fetch<FlightOffer[]>('/amadeus/flights', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Get booking URL for a flight
  async getBookingUrl(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass: string;
    carrierCode?: string;
  }): Promise<{ url: string; provider: string }> {
    return this.fetch<{ url: string; provider: string }>('/redirect/flight', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Search airports
  async searchAirports(query: string): Promise<{ iata: string; name: string; city: string; country: string }[]> {
    return this.fetch<{ iata: string; name: string; city: string; country: string }[]>(
      `/airports/search?q=${encodeURIComponent(query)}`
    );
  }
}

export const api = new ApiClient(API_BASE_URL);
