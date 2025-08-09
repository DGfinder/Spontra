interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AmadeusDestination {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  id?: string;
  address?: {
    cityName?: string;
    countryName?: string;
    countryCode?: string;
  };
  geoCode: {
    latitude: number;
    longitude: number;
  };
}

// Airport code mapping for closed/renamed airports
const AIRPORT_CODE_MAPPING: Record<string, string> = {
  'TXL': 'BER', // Berlin Tegel closed 2020, replaced by Brandenburg
  'THF': 'BER', // Berlin Tempelhof closed 2008, use Brandenburg
  'SXF': 'BER', // Berlin Schönefeld replaced by Brandenburg
};

class SimpleAmadeusClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID || '';
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || '';
    this.baseUrl = process.env.AMADEUS_ENVIRONMENT === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    console.log('🔐 Requesting Amadeus access token...')
    console.log('📡 Base URL:', this.baseUrl)
    console.log('🆔 Client ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT_SET')
    console.log('🔑 Client Secret:', this.clientSecret ? `${this.clientSecret.substring(0, 4)}...` : 'NOT_SET')

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Amadeus credentials not configured. Missing CLIENT_ID or CLIENT_SECRET');
    }

    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    console.log('🌐 Token response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Token request failed:', errorText)
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }

    const data: AmadeusTokenResponse = await response.json();
    this.accessToken = data.access_token;
    console.log('✅ Access token acquired successfully')
    return this.accessToken;
  }

  async searchAirports(keyword: string = 'NYC'): Promise<AmadeusDestination[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/v1/reference-data/locations?subType=AIRPORT&keyword=${keyword}&page[limit]=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airport search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async searchFlights(params: {
    origin: string;
    destination: string;
    departureDate: string;
    adults?: number;
    travelClass?: string;
    max?: number;
  }): Promise<any[]> {
    const token = await this.getAccessToken();
    
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: (params.adults || 1).toString(),
      travelClass: params.travelClass || 'ECONOMY',
      max: (params.max || 20).toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Flight search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  private mapAirportCode(code: string): string {
    const upperCode = code.toUpperCase();
    const mappedCode = AIRPORT_CODE_MAPPING[upperCode] || upperCode;
    
    if (mappedCode !== upperCode) {
      console.log(`🔄 Airport code mapped: ${upperCode} → ${mappedCode}`);
    }
    
    return mappedCode;
  }

  async exploreDestinations(params: {
    origin: string;
    maxFlightTime?: number;
    theme?: string;
    departureDate?: string;
    viewBy?: 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK' | 'COUNTRY' | 'PRICE';
  }): Promise<any[]> {
    console.log('🌍 Starting destination exploration with params:', params)
    
    const token = await this.getAccessToken();
    
    // Map airport codes for closed/renamed airports
    const mappedOrigin = this.mapAirportCode(params.origin);
    
    const searchParams = new URLSearchParams({
      origin: mappedOrigin,
    });

    // Amadeus requires a departure date for flight-destinations endpoint
    const departureDate = params.departureDate || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })();
    
    searchParams.append('departureDate', departureDate);
    console.log('📅 Using departure date:', departureDate);

    if (params.maxFlightTime) {
      searchParams.append('maxFlightTime', params.maxFlightTime.toString());
    }

    // Add viewBy parameter - PRICE gives best results sorted by cost
    const viewBy = params.viewBy || 'PRICE';
    searchParams.append('viewBy', viewBy);
    console.log(`📊 Using viewBy: ${viewBy}`);

    const url = `${this.baseUrl}/v1/shopping/flight-destinations?${searchParams}`
    console.log('🌐 Calling Amadeus API:', url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 Amadeus API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Amadeus API error response:', errorText)
      
      // Parse error details
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors && errorData.errors.length > 0) {
          const error = errorData.errors[0];
          throw new Error(`Amadeus API Error ${error.code}: ${error.title} - ${error.detail}`);
        }
      } catch (parseError) {
        // Fall back to original error format
      }
      
      throw new Error(`Destination exploration failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Amadeus API success, data count:', data.data?.length || 0)
    return data.data || [];
  }

  async searchLocations(keyword: string, subType: string = 'AIRPORT'): Promise<AmadeusDestination[]> {
    const token = await this.getAccessToken();
    
    const searchParams = new URLSearchParams({
      keyword,
      subType,
      'page[limit]': '10',
    });

    const response = await fetch(
      `${this.baseUrl}/v1/reference-data/locations?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get location details by IATA code
  async getLocationByIataCode(iataCode: string): Promise<AmadeusDestination | null> {
    const token = await this.getAccessToken();
    
    const searchParams = new URLSearchParams({
      keyword: iataCode,
      subType: 'AIRPORT,CITY',
      'page[limit]': '1',
    });

    const response = await fetch(
      `${this.baseUrl}/v1/reference-data/locations?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Location lookup failed for ${iataCode}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }
}

export const amadeusClient = new SimpleAmadeusClient();