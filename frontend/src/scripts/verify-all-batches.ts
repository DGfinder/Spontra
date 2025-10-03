#!/usr/bin/env tsx
/**
 * Run All Verification Batches Sequentially
 *
 * Automatically runs all batches to verify all 467 origins.
 * Processes in chunks of 50 for better progress tracking.
 *
 * Usage:
 *   npx tsx src/scripts/verify-all-batches.ts
 */

import { spawn } from 'child_process'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

async function runBatch(batchNumber: number, batchSize: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const separator = '='.repeat(60)
    log(`\n${separator}`)
    log(`Starting Batch ${batchNumber}...`)
    log(`${separator}\n`)

    const child = spawn(
      'npx',
      ['tsx', 'src/scripts/verify-direct-routes-batch.ts', batchNumber.toString(), batchSize.toString()],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true
      }
    )

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ Batch ${batchNumber} completed successfully\n`)
        resolve(true)
      } else {
        log(`❌ Batch ${batchNumber} failed with code ${code}\n`)
        resolve(false)
      }
    })

    child.on('error', (error) => {
      log(`❌ Error running batch ${batchNumber}: ${error.message}`)
      reject(error)
    })
  })
}

async function main() {
  log('🚀 Starting automated batch verification of all routes...')

  try {
    // Get total number of origins
    const allOrigins = await db.flightRoute.findMany({
      distinct: ['originAirportCode'],
      select: { originAirportCode: true }
    })

    const totalOrigins = allOrigins.length
    const batchSize = 50
    const totalBatches = Math.ceil(totalOrigins / batchSize)

    log(`📊 Total origins: ${totalOrigins}`)
    log(`📦 Batch size: ${batchSize} origins per batch`)
    log(`🔢 Total batches: ${totalBatches}`)
    log(`⏱️  Estimated time: ~${Math.ceil(totalOrigins / 2 / 60)} minutes`)

    await db.$disconnect()

    // Run all batches sequentially
    let successfulBatches = 0
    let failedBatches = 0

    for (let i = 0; i < totalBatches; i++) {
      const success = await runBatch(i, batchSize)

      if (success) {
        successfulBatches++
      } else {
        failedBatches++
        log(`⚠️  Batch ${i} failed, but continuing with next batch...`)
      }

      // Short pause between batches
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const separator = '='.repeat(60)
    log(`\n${separator}`)
    log('🎉 All batches completed!')
    log(separator)
    log(`✅ Successful: ${successfulBatches}/${totalBatches}`)
    log(`❌ Failed: ${failedBatches}/${totalBatches}`)

    if (failedBatches > 0) {
      log(`\n⚠️  Some batches failed. You may want to re-run those batches manually.`)
    } else {
      log(`\n🎉 All ${totalOrigins} origins verified successfully!`)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
