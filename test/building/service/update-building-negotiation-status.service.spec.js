import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { UpdateBuildingNegotiationStatusService } from '../../../src/building/service/update-building-negotiation-status.service'
import { BuildingV2 } from '../../../src/building/domain/building'

describe('UpdateBuildingNegotiationStatusService', () => {
  let buildingsRepository, service, eventBus
  const testBuilding = BuildingV2({ id: 'test-building-id', negotiationStatus: 'PENDIENTE', files: [] })

  beforeEach(() => {
    buildingsRepository = {
      get: stub(),
      save: spy()
    }
    buildingsRepository.get.withArgs('test-building-id').resolves(testBuilding)
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
    it(`[${status}] saves building with new negotiation status`, async () => {
      await service.updateBuildingStatus('test-building-id', { status, userId: 'operator-id' })

      expect(buildingsRepository.save).to.have.been
        .calledWithMatch(b => BuildingV2.is(b) && b.id === 'test-building-id' && b.negotiationStatus === status)
    })
  })

  it('rejects invalid negotiation statuses', () => {
    return expect(service.updateBuildingStatus('test-building-id', { status: 'UNKNOWN STATUS', userId: 'operator-id' }))
      .to.be.rejected
  })

  it('publishes negotiation status changed event', async () => {
    await service.updateBuildingStatus('test-building-id', { status: 'COMPRADO', userId: 'operator-id' })

    expect(eventBus.publish).to.have.been.deep.calledWith({
      name: 'building.negotiation-status-changed',
      buildingId: 'test-building-id',
      userId: 'operator-id',
      status: 'COMPRADO'
    })
  })
})
