import { NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeus-simple'

export const runtime = 'nodejs'

export async function GET() {
  const apiStatus = {
    amadeus: {
      clientId: Boolean(process.env.AMADEUS_CLIENT_ID),
      clientSecret: Boolean(process.env.AMADEUS_CLIENT_SECRET),
      environment: process.env.AMADEUS_ENVIRONMENT || 'test',
      connectionTest: false,
    },
    youtube: {
      apiKey: Boolean(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY),
    }
  }

  // Test Amadeus API connection
  try {
    await amadeusClient.searchAirports('NYC');
    apiStatus.amadeus.connectionTest = true;
  } catch (error) {
    apiStatus.amadeus.connectionTest = false;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apis: apiStatus,
    summary: {
      amadeus_ready: apiStatus.amadeus.clientId && apiStatus.amadeus.clientSecret && apiStatus.amadeus.connectionTest,
      youtube_ready: apiStatus.youtube.apiKey,
      all_systems_ready: apiStatus.amadeus.clientId && apiStatus.amadeus.clientSecret && apiStatus.amadeus.connectionTest && apiStatus.youtube.apiKey
    }
  })
}

