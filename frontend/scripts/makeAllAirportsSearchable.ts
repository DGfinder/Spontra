/**
 * Make all active airports searchable
 * Run with: npx tsx scripts/makeAllAirportsSearchable.ts
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const db = new PrismaClient()

async function makeAllAirportsSearchable() {
  try {
    console.log('🔍 Updating all active airports to be searchable...')

    const result = await db.airport.updateMany({
      where: {
        isActive: true
      },
      data: {
        isSearchable: true
      }
    })

    console.log(`✅ Updated ${result.count} airports to be searchable`)

    await db.$disconnect()
  } catch (error) {
    console.error('❌ Error updating airports:', error)
    await db.$disconnect()
    process.exit(1)
  }
}

makeAllAirportsSearchable()
