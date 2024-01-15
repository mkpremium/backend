import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'

import { BuildingProposalsImporterService } from '../../../src/infrastructure/service/building-proposals-importer.service'
import { CouchbaseDocument, CouchbaseDocumentType } from '../../../src/infrastructure/postgres/couchbase-document.entity'
import { buildingBuilder } from '../../building/building.builder'
import { Building } from '../../../src/building/building.entity'
import { Proposal } from '../../../src/building/proposal.entity'

import { v4 as uuid } from 'uuid'
import { EntityManager } from 'typeorm'

// export class CouchbaseProposalsRepository extends CouchbaseRepository<ProposalProps> implements ProposalsRepository {

describe('BuildingProposalsImporterService', () => {
  it('persists proposals', async () => {
    const start = new Date()

    const testContainer = await createTestContainer({ postgres: true, couchbase: false })

    const service = testContainer.resolve('buildingProposalsImporterService') as BuildingProposalsImporterService
    const em = testContainer.resolve('entityManager') as EntityManager

    const buildingId = uuid()
    const proposalId = uuid()

    // Create the parent building.
    await em.save(Building, {
      ...buildingBuilder({id: buildingId }).build(),
    })

    // Create a test proposal document that relates to the parent building.
    await em.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.BUILDING_PROPOSAL,
      document: {
        id: proposalId,
        buildingId: buildingId,
        state: 'pendiente',
        proposal: 1000,
        notificationEmail: 'test@test.com',
        notificationStatus: 'SENT',
        message: 'test',
        createdAt: new Date(),

        // When updatedAt is null, the importer should set it to the createdAt or
        // fallback to the current date.
        updatedAt: null,
      },
    })

    // Execute the import.
    await service.importBuildingProposal(buildingId)

    // Retrieve the proposal from the database.
    const found = await em.findOneByOrFail(Proposal, {id: proposalId})

    // Make sure the updateAt has been set after the start time.
    expect(found.updatedAt).to.be.greaterThan(start)
  })
})
