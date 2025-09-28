/**
 * Pact Contract Testing Configuration
 * Ensures API compatibility between frontend and backend services
 */

import { PactOptions } from '@pact-foundation/pact'

export const pactOptions: PactOptions = {
  consumer: 'spontra-frontend',
  provider: 'spontra-backend-api',
  port: 1234,
  host: 'localhost',
  ssl: false,
  log: 'logs/pact.log',
  dir: 'tests/contract/pacts',
  spec: 2,
  logLevel: 'info',
  cors: true,
  pactfileWriteMode: 'update'
}

export const searchServicePactOptions: PactOptions = {
  consumer: 'spontra-frontend',
  provider: 'spontra-search-service',
  port: 1235,
  host: 'localhost',
  ssl: false,
  log: 'logs/search-service-pact.log',
  dir: 'tests/contract/pacts',
  spec: 2,
  logLevel: 'info',
  cors: true,
  pactfileWriteMode: 'update'
}

export const adminServicePactOptions: PactOptions = {
  consumer: 'spontra-frontend',
  provider: 'spontra-admin-service',
  port: 1236,
  host: 'localhost',
  ssl: false,
  log: 'logs/admin-service-pact.log',
  dir: 'tests/contract/pacts',
  spec: 2,
  logLevel: 'info',
  cors: true,
  pactfileWriteMode: 'update'
}