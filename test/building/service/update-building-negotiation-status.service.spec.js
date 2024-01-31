import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { UpdateBuildingNegotiationStatusService } from '../../../src/building/service/update-building-negotiation-status.service'
import { Building } from '../../../src/building/building'
import { buildingBuilder } from '../building.builder'

describe('UpdateBuildingNegotiationStatusService', function () {
  let buildingsRepository, service, eventBus
  const testBuilding = buildingBuilder().build()

  beforeEach(function () {
    buildingsRepository = {
      get: stub(),
      save: spy()
    }
    buildingsRepository.get.withArgs(testBuilding.id).resolves(testBuilding)
    eventBus = {
      publish: spy()
    }
    service = new UpdateBuildingNegotiationStatusService(buildingsRepository, eventBus)
  })

  const validNegotiationStatuses = [
    'PENDIENTE',
    'PROPUESTA ENVIADA',
    'COMPRADO',
    'VENDIDO',
    'NO VENDE',

    'DESCARTADO'
  ]
  validNegotiationStatuses.forEach((status) => {
    it(`[${status}] saves building with new negotiation status`, async function () {
      await service.updateBuildingStatus(testBuilding.id, { status, userId: 'operator-id' })

      expect(buildingsRepository.save).to.have.been
        .calledWithMatch(b => Building.is(b) && b.id === testBuilding.id && b.negotiationStatus === status)
    })
  })

  it('rejects invalid negotiation statuses', function () {
    return expect(service.updateBuildingStatus(testBuilding.id, { status: 'UNKNOWN STATUS', userId: 'operator-id' }))
      .to.be.rejected
  })

  it('publishes negotiation status changed event', async function () {
    await service.updateBuildingStatus(testBuilding.id, { status: 'COMPRADO', userId: 'operator-id' })

    expect(eventBus.publish).to.have.been.deep.calledWith({
      name: 'building.negotiation_status_changed',
      buildingId: testBuilding.id,
      userId: 'operator-id',
      negotiationStatus: 'COMPRADO'
    })
  })

  it('saves source owner as featured owner', async function () {
    await service.updateBuildingStatus(testBuilding.id, {
      status: 'COMPRADO',
      userId: 'operator-id',
      sourceOwnerId: 'test-source-owner-id'
    })

    expect(buildingsRepository.save).to.have.been.calledWithMatch(b => b.ownerId === 'test-source-owner-id')
  })
})
