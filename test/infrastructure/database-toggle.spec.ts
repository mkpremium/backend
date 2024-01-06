import { createTestApp } from '../integration/create-test-app'
import { expect } from 'chai'
import { PostgresBuildingsRepository } from '../../src/building/repository/postgres-buildings.repository'
import { CouchbaseBuildingsRepository } from '../../src/building/repository/couchbase-building.repository'
import { CouchbaseBuildingsReadRepository } from '../../src/building/repository/couchbase-buildings-read.repository'
import { PostgresProposalsRepository } from '../../src/building/repository/postgres-proposals.repository'
import { CouchbaseProposalsRepository } from '../../src/building/repository/couchbase-proposals.repository'
import { PostgresOwnersRepository } from '../../src/owner/repository/postgres-owners.repository'
import { CouchbaseOwnersRepository } from '../../src/owner/repository/couchbase-owners.repository'

async function getAppDependencies (database: 'couchbase' | 'postgres') {
  const app = await createTestApp(database)
  const { diContainer } = app.locals

  return diContainer
}

describe('Database toggle', () => {
  it('uses Couchbase repositories', async () => {
    const container = await getAppDependencies('couchbase')

    expect(container.resolve('buildingsRepository')).to.be.instanceof(CouchbaseBuildingsRepository)
    expect(container.resolve('buildingsReadRepository')).to.be.instanceof(CouchbaseBuildingsReadRepository)
    expect(container.resolve('proposalsRepository')).to.be.instanceof(CouchbaseProposalsRepository)
    expect(container.resolve('ownersRepository')).to.be.instanceof(CouchbaseOwnersRepository)
  })

  it('uses Postgres repositories', async () => {
    const container = await getAppDependencies('postgres')

    expect(container.resolve('buildingsRepository')).to.be.instanceof(PostgresBuildingsRepository)
    expect(container.resolve('buildingsReadRepository')).to.be.instanceof(PostgresBuildingsRepository)
    expect(container.resolve('proposalsRepository')).to.be.instanceof(PostgresProposalsRepository)
    expect(container.resolve('ownersRepository')).to.be.instanceof(PostgresOwnersRepository)
  })
})
