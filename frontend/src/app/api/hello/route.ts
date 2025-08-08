import { NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeus-simple'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const airports = await amadeusClient.searchAirports('NYC');
    
    return NextResponse.json({
      message: "Hello, World! Here are some airports:",
      timestamp: new Date().toISOString(),
      status: "success",
      amadeus_data: {
        airports: airports.slice(0, 3),
        total_found: airports.length
      }
    })
  } catch (error) {
    return NextResponse.json({
      message: "Hello, World!",
      timestamp: new Date().toISOString(),
      status: "success",
      amadeus_error: error instanceof Error ? error.message : 'Unknown error',
      note: "Amadeus API failed, but endpoint still works"
    })
  }
}