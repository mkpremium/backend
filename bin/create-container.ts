import { createDiContainer } from '../src/infrastructure/dependencies'

const DATABASE = process.env.DATABASE

export function getDatabase () {
  if (!['couchbase', 'postgres'].includes(DATABASE)) {
    throw new Error(`Wrong database configured: "${DATABASE}"`)
  }
  return DATABASE as 'couchbase' | 'postgres'
}

export async function createContainer () {
  return createDiContainer()
}
