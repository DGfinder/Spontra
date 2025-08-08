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

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data: AmadeusTokenResponse = await response.json();
    this.accessToken = data.access_token;
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

  async exploreDestinations(params: {
    origin: string;
    maxFlightTime?: number;
    theme?: string;
    departureDate?: string;
  }): Promise<any[]> {
    const token = await this.getAccessToken();
    
    const searchParams = new URLSearchParams({
      origin: params.origin,
    });

    if (params.maxFlightTime) {
      searchParams.append('maxFlightTime', params.maxFlightTime.toString());
    }
    if (params.departureDate) {
      searchParams.append('departureDate', params.departureDate);
    }

    const response = await fetch(
      `${this.baseUrl}/v1/shopping/flight-destinations?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Destination exploration failed: ${response.status}`);
    }

    const data = await response.json();
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
}

export const amadeusClient = new SimpleAmadeusClient();