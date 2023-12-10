import { createDiContainer } from '../src/infrastructure/dependencies'

export async function createContainer () {
  return createDiContainer('couchbase')
}
