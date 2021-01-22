import { spy } from 'sinon'
import { expect } from 'chai'
import {
  BuildingNegotiationStatusChanged,
  InvalidBuildingNegotiationStatus,
  UpdateBuildingNegotiationStatusService
} from '../../../src/building/service/update-building-negotiation-status.service'

describe('UpdateBuildingNegotiationStatusService', () => {
  let buildingsRepository, service, eventBus

  beforeEach(() => {
    buildingsRepository = {
      setBuildingNegotiationStatus: spy()
    }
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
    it(`accepts "${status}" as a valid negotiation status`, async () => {
      await service.updateBuildingStatus('building-id', status, 'operator-id')

      expect(buildingsRepository.setBuildingNegotiationStatus).to.have.been.calledWith('building-id', status)
    })
  })

  it('rejects invalid negotiation statuses', async () => {
    try {
      await service.updateBuildingStatus('building-id', 'UNKNOWN STATUS', 'operator-id')
      expect.fail()
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidBuildingNegotiationStatus)
    }
  })

  it('publishes negotiation status changed event', async () => {
    await service.updateBuildingStatus('building-id', 'COMPRADO', 'operator-id')

    expect(eventBus.publish).to.have.been.deep.calledWith(new BuildingNegotiationStatusChanged(
      'building-id',
      'operator-id',
      'COMPRADO'
    ))
  })
})
