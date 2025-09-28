// Dynamic import for pg to handle build-time issues
const PgClient = (() => {
  try {
    return require('pg').Client
  } catch {
    return class MockClient {
      constructor() {}
      async connect() {}
      async query() { return { rows: [] } }
      async end() {}
    }
  }
})()

export async function getAdminDbClient() {
  const connectionString = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Database URL not configured. Set SEARCH_DATABASE_URL or DATABASE_URL.')
  }

  const client = new PgClient({ connectionString })
  await client.connect()
  return client
}
