import { Client } from 'pg'

export async function getAdminDbClient() {
  const connectionString = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Database URL not configured. Set SEARCH_DATABASE_URL or DATABASE_URL.')
  }

  const client = new Client({ connectionString })
  await client.connect()
  return client
}
