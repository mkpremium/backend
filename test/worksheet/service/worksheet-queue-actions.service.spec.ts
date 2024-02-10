import { AddOperatorService } from '../../../src/user/service/add-operator.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import {
  PostgresWorksheetQueueRepository
} from '../../../src/worksheet/repository/postgres-worksheet-queue.repository'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { WorksheetQueueActionsService } from '../../../src/worksheet/service/worksheet-queue-actions-service'
import { buildingFactory, worksheetFactory, worksheetQueueFactory } from '../../factories'
import { addCaller, createOwnerWithPhoneContact } from '../../helpers'
import { EntityManager } from 'typeorm'
import { Worksheet } from '../../../src/worksheet/worksheet.entity'
import { expect } from 'chai'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'

describe('WorksheetQueueActionsService', () => {
  it('stores the worksheet holder', async () => {
    const deps = await buildDependencies()
    const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await createOwnerWithPhoneContact(testBuilding, deps)
    const testWorksheet = await deps.worksheetRepository.save(
      worksheetFactory.build(null, { buildingId: testBuilding.id }))
    const testCallerUser = await addCaller(deps)

    await deps.worksheetQueueActionsService.takeWorksheetInQueue(testQueue.id, testWorksheet.id, testCallerUser.callerId)

    const refreshedWorksheet = await deps.entityManager.findOneOrFail(Worksheet, {
      where: { id: testWorksheet.id },
      relations: { heldBy: true }
    })
    expect(refreshedWorksheet.heldBy).to.include({ id: testCallerUser.callerId })
  })
})

interface Deps {
  addContactService: AddContactService
  addOperatorService: AddOperatorService
  addOwnerService: AddOwnerService
  buildingsRepository: BuildingsRepository
  entityManager: EntityManager
  postgresQueueRepository: PostgresWorksheetQueueRepository
  worksheetRepository: PostgresWorksheetRepository
  worksheetQueueActionsService: WorksheetQueueActionsService
}

async function buildDependencies (): Promise<Deps> {
  const container = await createTestContainer()

  return {
    addContactService: container.resolve('addContactService'),
    addOwnerService: container.resolve('addOwnerService'),
    addOperatorService: container.resolve('addOperatorService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    entityManager: container.resolve('entityManager'),
    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
    worksheetQueueActionsService: container.resolve('worksheetQueueActionsService')
  }
}
