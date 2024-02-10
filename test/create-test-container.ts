import { setupContainer } from '../src/infrastructure/dependencies'
import { createContainer } from 'awilix'
import { AppDataSource } from '../src/data-source'

export async function setupPostgres () {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  await AppDataSource.synchronize(true)

  return AppDataSource
}

export async function createTestContainer () {
  const dataSource = await setupPostgres()
  const container = createContainer()
  await setupContainer(container, null, dataSource, true)

  return container
}
